// global i18n object

var i18n = new(function() {
  var default_lng = "en";
  var supported_lngs = [
    // translations found in locale/*.json
    default_lng,
    "ca",
    "da",
    "de",
    "es",
    "et",
    "fr",
    "hr",
    "it",
    "ja",
    "nl",
    "no",
    "pt-BR",
    "ru",
    "sl",
    "uk",
    "vi",
    "zh-TW"
  ];
  this.getSupportedLanguages = function() {
    return [].concat(supported_lngs);
  }
  this.getLanguage = function(lng) {
    lng = lng || settings.ui_language;
    if (lng == "auto") {
      // get user agent's language
      try {
        lng = navigator.language;
        if (!$.inArray(lng,supported_lngs)) // fall back to generic language file if no country-specific i18n is found
          lng = lng.replace(/-.*/,"").toLowerCase();
      } catch(e) {}
    }
    return lng;
  }
  this.translate = function(lng) {
    lng = i18n.getLanguage(lng);

    if ($.inArray(lng,supported_lngs) == -1) {
      console.log("unsupported language: "+lng+" switching back to: "+default_lng);
      lng = default_lng;
    }

    // load language pack
    var lng_file = "locales/"+lng+".json";
    try {
      $.ajax(lng_file,{async:false,dataType:"json"}).success(function(data){
        td = data;
        i18n.translate_ui();
        // todo: nicer implementation
      }).error(function(){
        console.log("failed to load language file: "+lng_file);
      });
    } catch(e) {
      console.log("failed to load language file: "+lng_file);
    }
  }
  this.translate_ui = function(element) {
    // if a DOM object is provided, only translate that one, otherwise
    // look for all object with the class "t"
    $(element || ".t").each(function(nr,element) {
      // get translation term(s)
      var terms = $(element).attr("data-t");
      terms = terms.split(";");
      for (var i=0; i<terms.length; i++) {
        var term = terms[i];
        var tmp = term.match(/^(\[(.*)\])?(.*)$/);
        var what = tmp[2];
        var key  = tmp[3];
        var val = i18n.t(key);
        if (what === "html") {
          $(element).html(val);
        } else if (what !== undefined) {
          $(element).attr(what,val);
        } else {
          $(element).text(val);
        }
      }
    });
  }
  this.t = function(key) {
    return td[key] || "/missing translation/";
  }

  // translated texts
  var td;
})(); // end create i18n object

