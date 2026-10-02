// ffs/wizard module

import i18n from "../i18n";
import {levenshteinDistance} from "../misc";

type Presets = Record<string, Preset>;

type Preset = {
  // overpass-turbo
  name?: string;
  nameCased?: string;
  terms?: string[];
  translated?: boolean;
  /** where the search term was found in `terms`, used to rank the candidates */
  _termsIndex?: number;
  // upstream
  fields?: string[];
  moreFields?: string[];
  geometry: string[];
  tags: {[key: string]: string};
  searchable?: boolean;
  icon?: string;
  matchScore?: number;
  addTags?: {[key: string]: string};
  removeTags?: Record<string, string>;
  reference?: {key: string; value?: string};
  replacement?: string;
  locationSet?: {exclude?: string[]; include?: string[]};
};

/** one condition of a "free form" search term, resolved against the presets */
type FreeFormClause = {
  types: string[];
  conditions: {query: "key" | "eq"; key: string; val: string}[];
};

/** the "free form" part of a search term, to resolve against the presets */
type FreeFormCondition = {free?: string};

/** a preset name as it is translated upstream */
type PresetTranslation = {name?: string; terms?: string[]};

let presets: Presets = {};

export function setPresets(newPresets: Presets) {
  presets = newPresets;
  Object.values(presets).forEach((preset) => {
    preset.nameCased = preset.name;
    if (preset.name) preset.name = preset.name.toLowerCase();
    preset.terms = !preset.terms
      ? []
      : preset.terms.map((term) => term.toLowerCase());
  });
}

export default async function ffs_free() {
  if (Object.keys(presets).length === 0) {
    await loadPresets();
    await loadPresetTranslations();
  }
  return {get_query_clause, fuzzy_search};

  // load presets
  async function loadPresets() {
    try {
      const {default: data} =
        await import("../../node_modules/@openstreetmap/id-tagging-schema/dist/presets.json");
      setPresets(data);
    } catch (err) {
      console.warn("failed to load presets file", err);
      throw new Error("failed to load presets file");
    }
  }
  // load preset translations
  async function loadPresetTranslations() {
    const language: string = i18n.getLanguage();
    if (!language) return;
    // the presets carry no names: start with the English ones, then add the
    // language and its regional variant, which only covers its differences
    const languages = new Set(["en", language.replace(/-.*/, ""), language]);
    for (const lng of languages) {
      let data;
      try {
        ({default: data} = await import(
          `../../node_modules/@openstreetmap/id-tagging-schema/dist/translations/${lng}.json`
        ));
      } catch (err) {
        console.warn(`failed to load preset translations file: ${lng}`, err);
        // not every language comes with preset translations (e.g. zh-Hans)
        if (lng !== "en") continue;
        throw new Error(`failed to load preset translations file: ${lng}`);
      }
      // load translated names and terms into presets object
      Object.entries(
        (data[lng]?.presets?.presets ?? {}) as Record<string, PresetTranslation>
      ).forEach(([presetName, translation]) => {
        const preset = presets[presetName];
        preset.translated = true;
        // save original preset name under alternative terms
        const oriPresetName = preset.name;
        // save translated preset name (some translations only provide terms)
        if (translation.name) {
          preset.nameCased = translation.name;
          preset.name = translation.name.toLowerCase();
        }
        // add new terms
        if (translation.terms)
          preset.terms = translation.terms
            .map((term) => term.trim().toLowerCase())
            .concat(preset.terms);
        // add this to the front to allow exact (english) preset names to match before terms
        if (oriPresetName) preset.terms.unshift(oriPresetName);
      });
    }
  }
}

/** the clause matching `condition`, or `false` if no preset matches */
function get_query_clause(
  condition: FreeFormCondition
): FreeFormClause | false {
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
  function onlyUnique(value: string, index: number, self: string[]): boolean {
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
}

/** the name of the preset closest to `condition`, or `false` if none is close */
function fuzzy_search(condition: FreeFormCondition): string | false {
  // search presets for ffs term
  const search = condition.free.toLowerCase();
  // fuzzyness: max lev.dist allowed to still match
  const fuzzyness = 2 + Math.floor(search.length / 7);
  function fuzzyMatch(term: string): boolean {
    return levenshteinDistance(term, search) <= fuzzyness;
  }
  const candidates = Object.values(presets).filter((preset) => {
    if (preset.searchable === false) return false;
    if (preset.name && fuzzyMatch(preset.name)) return true;
    return Array.isArray(preset.terms) && preset.terms.some(fuzzyMatch);
  });
  if (candidates.length === 0) return false;
  // sort candidates
  function preset_weight(preset: Preset): number {
    return [preset.name]
      .concat(preset.terms)
      .map((term) => levenshteinDistance(term, search))
      .reduce((a, b) => (a <= b ? a : b));
  }
  candidates.sort((a, b) => preset_weight(a) - preset_weight(b));
  const preset = candidates[0];
  return preset.nameCased;
}
