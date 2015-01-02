// ffs/wizard module
if (typeof turbo === "undefined") turbo={};

turbo.ffs.free = function() {

  var freeFormQuery = {};
  var presets;

  // load presets
  (function loadPresets() {
    var presets_file = "data/iD_presets.json";
    try {
      $.ajax(presets_file,{async:false,dataType:"json"}).success(function(data){
        presets = data;
        _.each(presets, function(preset) {
          preset.nameCased = preset.name;
          preset.name = preset.name.toLowerCase();
          preset.terms = !preset.terms ? [] : preset.terms.map(function(term) {return term.toLowerCase();});
        });
      }).error(function(){
        throw new Error();
      });
    } catch(e) {
      console.log("failed to load presets file: "+presets_file);
    }
  })();
  // load preset translations
  (function loadPresetTranslations() {
    var language = i18n.getLanguage();
    if (language == "en") return; 
    var translation_file = "data/iD_presets_"+language+".json";
    try {
      $.ajax(translation_file,{async:false,dataType:"json"}).success(function(data){
        // load translated names and terms into presets object
        _.each(data, function(translation, preset) {
          preset = presets[preset];
          preset.translated = true;
          // save original preset name under alternative terms
          preset.terms.unshift(preset.name);
          // save translated preset name
          preset.nameCased = translation.name;
          preset.name = translation.name.toLowerCase();
          // add new terms
          if (translation.terms)
            preset.terms = translation.terms.split(",")
              .map(function(term) { return term.trim().toLowerCase(); })
              .concat(preset.terms);
        });
      }).error(function(){
        throw new Error();
      });
    } catch(e) {
      console.log("failed to load preset translations file: "+translation_file);
    }
  })();

  freeFormQuery.get_query_clause = function(condition) {
    // search presets for ffs term
    var search = condition.free.toLowerCase();
    var candidates = _.filter(presets, function(preset) {
      if (preset.searchable===false) return false;
      if (preset.name === search) return true;
      return preset.terms.indexOf(search) != -1;
    });
    if (candidates.length === 0)
      return false;
    // sort candidates
    candidates.sort(function(a,b) {
      // prefer exact name matches
      if (a.name === search) return -1;
      if (b.name === search) return  1;
      return 0;
    });
    var preset = candidates[0];
    var types = [];
    preset.geometry.forEach(function(g) {
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
          console.log("unknown geometry type "+g+" of preset "+preset.name);
      }
    });
    return {
      types: _.uniq(types),
      conditions: _.map(preset.tags, function(v,k) {
        return {
          query: v==="*" ? "key" : "eq",
          key: k,
          val: v
        };
      })
    };
  }

  freeFormQuery.fuzzy_search = function(condition) {
    // search presets for ffs term
    var search = condition.free.toLowerCase();
    // fuzzyness: max lev.dist allowed to still match
    var fuzzyness = 2+Math.floor(search.length/7);
    function fuzzyMatch(term) {
      return levenshteinDistance(term, search) <= fuzzyness;
    }
    var candidates = _.filter(presets, function(preset) {
      if (preset.searchable===false) return false;
      if (fuzzyMatch(preset.name)) return true;
      return preset.terms.some(fuzzyMatch);
    });
    if (candidates.length === 0)
      return false;
    // sort candidates
    function preset_weight(preset) {
      return _.min([preset.name].concat(preset.terms).map(function(term) {
        return levenshteinDistance(term,search);
      }));
    };
    candidates.sort(function(a,b) {
      return preset_weight(a) - preset_weight(b);
    });
    var preset = candidates[0];
    return preset.nameCased;
  }


  return freeFormQuery;
};