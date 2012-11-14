// Settings class
var Settings = function(namespace,version) {
  // == private members ==
  var prefix = namespace+"_";
  var settings_version = version;
  var version = +localStorage.getItem(prefix+"version");
  var settings = {};
  var upgrade_callbacks = [];
  
  // == public methods ==
  this.define_setting = function(name,type,preset,version) {
    settings[name] = {"type":type,"preset":preset,"version":version};
  };
  this.define_upgrade_callback = function(version,fun) {
    upgrade_callbacks[version] = fun;
  };

  this.set = function(name,value) {
    if (value === undefined) // use preset if no value is given
      value = settings[name].preset;
    if(settings[name].type != "String") // stringify all non-string values.
      value = JSON.stringify(value);
    localStorage.setItem(prefix+name, value);
  };
  this.get = function(name) {
    // initialize new settings
    if (settings[name].version > version)
      this.set(name,undefined);
    // load the setting
    var value = localStorage.getItem(prefix+name);
    if (settings[name].type != "String") // parse all non-string values.
      value = JSON.parse(value);
    return value;
  };

  this.load = function() {
    // load all settings into the objects namespace
    for (var name in settings) {
      this[name] = this.get(name);
    }
    // version upgrade
    if (version == 0)
      this.first_time_visit = true;
    if (version < settings_version) {
      for (var v = version+1; v<=settings_version; v++) {
        if (typeof upgrade_callbacks[v] == "function")
          upgrade_callbacks[v](this);
      }
      version = settings_version;
      localStorage.setItem(prefix+"version",version);
    }
  };
  this.save = function() {
    // save all settings from the objects namespace
    for (var name in settings) {
      this.set(name,this[name]);
    }
  };
};
// examples
examples = {
  "Drinking Water":{"overpass":"<!--\nThis is an example Overpass query.\nTry it out by pressing the Run button above!\nYou can find more examples with the Load tool.\n-->\n<query type=\"node\">\n  <has-kv k=\"amenity\" v=\"drinking_water\"/>\n  <bbox-query/><!--this is auto-completed with the\n                   current map view coordinates.-->\n</query>\n<print/>"},
  "Drinking Water (Overpass QL)":{"overpass":"/*\nThis is the drinking water example in OverpassQL.\n*/\n(\n  node\n    [\"amenity\"=\"drinking_water\"]\n    (bbox) /* this is auto-completed with the\n              current map view coordinates. */\n);\nout;"},
  "Cycle Network":{"overpass":"<!--\nThis shows the whole cycleway and cycleroute network.\n-->\n<osm-script output=\"json\">\n  <!-- get cycle route relations -->\n  <query type=\"relation\" into=\"cr\">\n    <bbox-query/>\n    <has-kv k=\"route\" v=\"bicycle\"/>\n  </query>\n  <!-- get cycleways (tagging scheme 1) -->\n  <query type=\"way\" into=\"cw1\">\n    <bbox-query/>\n    <has-kv k=\"highway\" v=\"cycleway\"/>\n  </query>\n  <!-- get cycleways (tagging scheme 2) -->\n  <query type=\"way\" into=\"cw2\">\n    <bbox-query/>\n    <has-kv k=\"highway\" v=\"path\"/>\n    <has-kv k=\"bicycle\" v=\"designated\"/>\n  </query>\n  <!-- combine all found cycleways -->\n  <union into=\"cw\">\n    <item set=\"cw1\"/>\n    <item set=\"cw2\"/>\n  </union>\n  <!-- combine with the cycle routes and use recurse to get to underlying geometry (ways and nodes): -->\n  <union>\n    <item set=\"cr\"/>\n    <recurse from=\"cr\" type=\"down\"/>\n    <item set=\"cw\"/>\n    <recurse from=\"cw\" type=\"down\"/>\n  </union>\n  <!-- show the result -->\n  <print mode=\"body\" order=\"quadtile\"/>\n</osm-script>"},
  "List Areas":{"overpass":"<!--\nThis lists all areas which include the map center point.\n-->\n<osm-script output=\"json\">\n  <coord-query/><!--this this is auto-completed with the\n                    current map center coordinates.-->\n  <print/>\n</osm-script>"},
  "Mountains in Area":{"overpass":"<!--\nThis shows all mountains (peaks) in the Dolomites.\nYou may want to use the \"zoom onto data\" button. =>\n-->\n<osm-script output=\"json\">\n  <!-- search the area of the Dolmites -->\n  <query type=\"area\">\n    <has-kv k=\"place\" v=\"region\"/>\n    <has-kv k=\"region:type\" v=\"mountain_area\"/>\n    <has-kv k=\"name:en\" v=\"Dolomites\"/>\n  </query>\n  <print mode=\"body\" order=\"quadtile\"/>\n  <!-- get all peaks in the area -->\n  <query type=\"node\">\n    <area-query/>\n    <has-kv k=\"natural\" v=\"peak\"/>\n  </query>\n  <print mode=\"body\" order=\"quadtile\"/>\n  <!-- additionally, show the outline of the area -->\n  <union>\n    <query type=\"relation\">\n      <has-kv k=\"place\" v=\"region\"/>\n      <has-kv k=\"region:type\" v=\"mountain_area\"/>\n      <has-kv k=\"name:en\" v=\"Dolomites\"/>\n    </query>\n    <recurse type=\"relation-way\"/>\n  </union>\n  <print mode=\"body\" order=\"quadtile\"/>\n  <recurse type=\"way-node\"/><!--small trick to not print tags of outline nodes-->\n  <print mode=\"skeleton\" order=\"quadtile\"/>\n</osm-script>"},
  "Map Call":{"overpass":"<!--\nThis is a simple map call.\nIt returns all data in the bounding box.\n-->\n<osm-script output=\"xml\">\n  <union into=\"_\">\n    <bbox-query/>\n    <recurse type=\"up\"/>\n  </union>\n  <print mode=\"meta\" order=\"quadtile\"/>\n</osm-script>"},
};
examples_initial_example = "Drinking Water";

// global settings object
var settings = new Settings("overpass-ide",12);

// map coordinates
settings.define_setting("use_html5_coords","Boolean",true,1);
settings.define_setting("coords_lat","Float",41.890,1);
settings.define_setting("coords_lon","Float",12.492,1);
settings.define_setting("coords_zoom","Integer",16,1);
// saves
settings.define_setting("code","Object",examples[examples_initial_example],1);
settings.define_setting("saves","Object",examples,1);
// api server
settings.define_setting("server","String","http://overpass-api.de/api/",1);
// sharing options
settings.define_setting("share_compression","String","auto",1);
settings.define_setting("share_include_pos","Boolean",false,1);
// code editor
settings.define_setting("use_rich_editor","Boolean",true,1);
settings.define_setting("tile_server","String","http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",1);
settings.define_setting("enable_crosshairs","Boolean",false,1);
// export settings
settings.define_setting("export_image_scale","Boolean",true,1);
settings.define_setting("export_image_attribution","Boolean",true,1);
// CORS/ajax/etc. settings
settings.define_setting("force_simple_cors_request","Boolean",false,11);

//settings.define_setting(,,,);

// upgrade callbacks
settings.define_upgrade_callback(12, function(s) {
  // migrate code and saved examples to new mustache style syntax
  var migrate = function(code) {
    code.overpass = code.overpass.replace(/\(bbox\)/g,"({{bbox}})");
    code.overpass = code.overpass.replace(/<bbox-query\/>/g,"<bbox-query {{bbox}}/>");
    code.overpass = code.overpass.replace(/<coord-query\/>/g,"<coord-query {{center}}/>");
    return code;
  }
  s.code = migrate(s.code);
  for (var ex in s.saves) {
    s.saves[ex] = migrate(s.saves[ex]);
  }
  s.save();
});

