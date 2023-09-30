// global i18n object
import $ from "jquery";
import _ from "lodash";

import settings from "./settings";

function browser_locale() {
  /* taken from https://github.com/maxogden/browser-locale by Max Ogden, BSD licensed */
  let lang;

  if (navigator.languages) {
    // chrome does not currently set navigator.language correctly https://code.google.com/p/chromium/issues/detail?id=101138
    // but it does set the first element of navigator.languages correctly
    lang = navigator.languages[0];
  } else if (navigator.userLanguage) {
    // IE only
    lang = navigator.userLanguage;
  } else {
    // as of this writing the latest version of firefox + safari set this correctly
    lang = navigator.language;
  }

  return lang;
}

const default_lng = "en";
const languages = {
  // translations found in locale/*.json
  ast: "Asturian",
  en: "English",
  "en-GB": "English (GB)",
  "en-US": "English (US)",
  ca: "Catalan",
  cs: "Czech",
  cy: "Welsh",
  da: "Danish",
  eo: "Esperanto",
  de: "German",
  el: "Greek",
  es: "Spanish",
  et: "Estonian",
  fr: "French",
  gl: "Galician",
  hr: "Croatian",
  hu: "Hungarian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  lv: "Latvian",
  mr: "Marathi",
  nl: "Dutch",
  no: "Norwegian",
  pl: "Polish",
  pt: "Portuguese",
  "pt-BR": "Portuguese (Brazil)",
  ru: "Russian",
  sl: "Slovenian",
  tr: "Turkish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Taiwan)"
};
27;

type Language = keyof typeof languages;
const supported_lngs: Language[] = _.keys(languages);

export default class i18n {
  // translated texts
  static td: Record<string, string> = {};

  static t(key: string) {
    return this.td[key] || "/missing translation/";
  }

  static getSupportedLanguages() {
    return supported_lngs;
  }
  static getSupportedLanguagesDescriptions() {
    return languages;
  }
  static getLanguage(lng: Language | string): Language {
    lng = lng || settings.ui_language;
    if (lng == "auto") {
      // get user agent's language
      try {
        lng = browser_locale().toLowerCase();
      } catch (e) {}
      // hardcode some language fallbacks
      if (lng === "nb") lng = "no"; // Norwegian Bokmål
      // sanitize inconsistent use of lower and upper case spelling
      let parts;
      if ((parts = lng.match(/(.*)-(.*)/)))
        lng = `${parts[1]}-${parts[2].toUpperCase()}`;
      // fall back to generic language file if no country-specific i18n is found
      if ($.inArray(lng, supported_lngs) == -1) lng = lng.replace(/-.*/, "");
    }
    return lng;
  }
  /**
   * Determines the language, fetches the language pack and translates the UI
   * @return <Promise>
   */
  static translate(lng: Language) {
    lng = this.getLanguage(lng);

    if ($.inArray(lng, supported_lngs) == -1) {
      console.log(
        `unsupported language: ${lng} switching back to: ${default_lng}`
      );
      lng = default_lng;
    }

    // load language pack
    try {
      return import(`../locales/${lng}.json`).then(
        (data) => {
          Object.assign(this.td, data.default);
          this.translate_ui();
          // todo: nicer implementation
          return data.default;
        },
        (e) => console.log(`failed to load language file ${lng}`, e)
      );
    } catch (e) {
      console.log(`failed to load language file ${lng}`, e);
    }
  }
  static translate_ui(element?: string) {
    // if a DOM object is provided, only translate that one, otherwise
    // look for all object with the class "t"
    $(element || ".t").each((nr, element) => {
      $(element || ".t").each((nr, element) => {
        // get translation term(s)
        const terms = $(element).attr("data-t")?.split(";") || [];
        for (const term of terms) {
          const [, , what, key] = term.match(/^(\[(.*)\])?(.*)$/);
          let val = this.t(key);
          const shortcut = $(element).attr("data-shortcut");
          if (shortcut) val += ` [${shortcut}]`;
          if (what === "html") {
            $(element).html(val);
          } else if (what !== undefined) {
            $(element).attr(what, val);
          } else {
            $(element).text(val);
          }
        }
      });
    });
  }
}
