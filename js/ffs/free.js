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
      }).error(function(){
        throw new Error();
      });
    } catch(e) {
      console.log("failed to load presets file: "+presets_file);
    }
  })();

  freeFormQuery.get_query_clause = function(condition) {
    // search presets for ffs term
    var search = condition.free;
    var candidates = _.values(presets).filter(function(preset) {
      // todo: other languages?
      if (preset.searchable===false) return false;
      return preset.name === search || // todo: case-insensitive, little fuzzyness
             (preset.terms && preset.terms.indexOf(search) >= 0);
    });
    if (candidates.length === 0)
      return false;
    candidates.sort(function(a,b) {
      return a.name===search - b.name===search;
    });
    // todo: what if multiple candidates match?
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
          types.push("relation")
          break;
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


  return freeFormQuery;
};