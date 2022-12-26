// ffs/wizard module

import i18n from "../i18n";
import {levenshteinDistance} from "../misc";

const freeFormQuery = {};
let presets = {};

export function setPresets(newPresets) {
  presets = newPresets;
  Object.values(presets).forEach((preset) => {
    preset.nameCased = preset.name;
    if (preset.name) preset.name = preset.name.toLowerCase();
    preset.terms = !preset.terms
      ? []
      : preset.terms.map((term) => term.toLowerCase());
  });
}

export default function ffs_free(callback) {
  if (Object.keys(presets).length > 0) {
    callback(freeFormQuery);
  } else {
    loadPresets()
      .then(loadPresetTranslations)
      .then(() => callback(freeFormQuery));
  }

  // load presets
  async function loadPresets() {
    try {
      const {default: data} = await import(
        "../../node_modules/@openstreetmap/id-tagging-schema/dist/presets.json"
      );
      setPresets(data);
    } catch (err) {
      console.warn("failed to load presets file", err);
      throw new Error("failed to load presets file");
    }
  }
  // load preset translations
  async function loadPresetTranslations() {
    const language = i18n.getLanguage();
    if (!language) return;
    try {
      let {default: data} = await import(
        `../../node_modules/@openstreetmap/id-tagging-schema/dist/translations/${language}.json`
      );
      data = data[language].presets.presets;
      // load translated names and terms into presets object
      Object.entries(data).forEach(([preset, translation]) => {
        preset = presets[preset];
        preset.translated = true;
        // save original preset name under alternative terms
        const oriPresetName = preset.name;
        // save translated preset name
        preset.nameCased = translation.name;
        preset.name = translation.name.toLowerCase();
        // add new terms
        if (translation.terms)
          preset.terms = translation.terms
            .split(",")
            .map((term) => term.trim().toLowerCase())
            .concat(preset.terms);
        // add this to the front to allow exact (english) preset names to match before terms
        if (oriPresetName) preset.terms.unshift(oriPresetName);
      });
    } catch (err) {
      console.warn(`failed to load preset translations file: ${language}`, err);
      throw new Error(`failed to load preset translations file: ${language}`);
    }
  }
}

freeFormQuery.get_query_clause = (condition) => {
  // search presets for ffs term
  const search = condition.free.toLowerCase();
  const candidates = Object.values(presets).filter((preset) => {
    if (preset.searchable === false) return false;
    if (preset.name === search) return true;
    preset._termsIndex = preset.terms.indexOf(search);
    return preset._termsIndex != -1;
  });
  if (candidates.length === 0) return false;
  // sort candidates
  candidates.sort((a, b) => {
    // prefer exact name matches
    if (a.name === search) return -1;
    if (b.name === search) return 1;
    return a._termsIndex - b._termsIndex;
  });
  const preset = candidates[0];
  const types = [];
  preset.geometry.forEach((g) => {
    switch (g) {
      case "point":
      case "vertex":
        types.push("node");
        break;
      case "line":
        types.push("way");
        break;
      case "area":
        types.push("way");
        types.push("relation"); // todo: additionally add type=multipolygon?
        break;
      case "relation":
        types.push("relation");
        break;
      default:
        console.log(`unknown geometry type ${g} of preset ${preset.name}`);
    }
  });
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }
  return {
    types: types.filter(onlyUnique),
    conditions: Object.entries(preset.tags).map(([k, v]) => ({
      query: v === "*" ? "key" : "eq",
      key: k,
      val: v
    }))
  };
};

freeFormQuery.fuzzy_search = (condition) => {
  // search presets for ffs term
  const search = condition.free.toLowerCase();
  // fuzzyness: max lev.dist allowed to still match
  const fuzzyness = 2 + Math.floor(search.length / 7);
  function fuzzyMatch(term) {
    return levenshteinDistance(term, search) <= fuzzyness;
  }
  const candidates = Object.values(presets).filter((preset) => {
    if (preset.searchable === false) return false;
    if (fuzzyMatch(preset.name)) return true;
    return preset.terms.some(fuzzyMatch);
  });
  if (candidates.length === 0) return false;
  // sort candidates
  function preset_weight(preset) {
    return [preset.name]
      .concat(preset.terms)
      .map((term) => levenshteinDistance(term, search))
      .reduce((a, b) => (a <= b ? a : b));
  }
  candidates.sort((a, b) => preset_weight(a) - preset_weight(b));
  const preset = candidates[0];
  return preset.nameCased;
};
