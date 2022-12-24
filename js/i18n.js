// global i18n object
import $ from "jquery";
import _ from "lodash";

import settings from "./settings";

const i18n = new (function () {
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
    en: "English",
    ca: "Catalan",
    cs: "Czech",
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
    lv: "Latvian",
    nl: "Dutch",
    no: "Norwegian",
    pl: "Polish",
    pt: "Portuguese",
    "pt-BR": "Portuguese (Brazil)",
    ru: "Russian",
    sl: "Slovenian",
    uk: "Ukrainian",
    vi: "Vietnamese",
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Taiwan)"
  };
  const supported_lngs = _.keys(languages);
  this.getSupportedLanguages = function () {
    return supported_lngs;
  };
  this.getSupportedLanguagesDescriptions = function () {
    return languages;
  };
  this.getLanguage = function (lng) {
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
        lng = parts[1] + "-" + parts[2].toUpperCase();
      // fall back to generic language file if no country-specific i18n is found
      if ($.inArray(lng, supported_lngs) == -1) lng = lng.replace(/-.*/, "");
    }
    return lng;
  };

  /**
   * Determines the language, fetches the language pack and translates the UI
   * @return <Promise>
   */
  this.translate = function (lng) {
    lng = i18n.getLanguage(lng);

    if ($.inArray(lng, supported_lngs) == -1) {
      console.log(
        "unsupported language: " + lng + " switching back to: " + default_lng
      );
      lng = default_lng;
    }

    // load language pack
    try {
      return import(`../locales/${lng}.json`).then(
        (data) => {
          Object.assign(td, data.default);
          i18n.translate_ui();
          // todo: nicer implementation
          return data.default;
        },
        (e) => {
          console.log("failed to load language file " + lng, e);
        }
      );
    } catch (e) {
      console.log("failed to load language file " + lng, e);
    }
  };
  this.translate_ui = function (element) {
    // if a DOM object is provided, only translate that one, otherwise
    // look for all object with the class "t"
    $(element || ".t").each((nr, element) => {
      // get translation term(s)
      let terms = $(element).attr("data-t");
      terms = terms.split(";");
      for (let i = 0; i < terms.length; i++) {
        const term = terms[i];
        const tmp = term.match(/^(\[(.*)\])?(.*)$/);
        const what = tmp[2];
        const key = tmp[3];
        let val = i18n.t(key);
        const shortcut = $(element).attr("data-shortcut");
        if (shortcut) val += " [" + shortcut + "]";
        if (what === "html") {
          $(element).html(val);
        } else if (what !== undefined) {
          $(element).attr(what, val);
        } else {
          $(element).text(val);
        }
      }
    });
  };
  this.t = function (key) {
    return td[key] || "/missing translation/";
  };

  // translated texts
  const td = {};
})(); // end create i18n object

export default i18n;
