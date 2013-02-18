// Settings class
var Settings = function(namespace,version) {
  this.appname = "overpass-turbo";
  // == private members ==
  var prefix = namespace+"_";
  var ls = {setItem:function(n,v){this[n]=v;}, getItem:function(n){return this[n]!==undefined?this[n]:null;}}; try { localStorage.setItem(prefix+"test",123); localStorage.removeItem(prefix+"test"); ls = localStorage; } catch(e) {};
  var settings_version = version;
  var version = +ls.getItem(prefix+"version");
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
    ls.setItem(prefix+name, value);
  };
  this.get = function(name) {
    // initialize new settings
    if (settings[name].version > version)
      this.set(name,undefined);
    // load the setting
    var value = ls.getItem(prefix+name);
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
      ls.setItem(prefix+"version",version);
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
  "Mountains in Area":{"overpass":"<!--\nThis shows all mountains (peaks) in the Dolomites.\nYou may want to use the \"zoom onto data\" button. =>\n-->\n<osm-script output=\"json\">\n  <!-- search the area of the Dolmites -->\n  <query type=\"area\">\n    <has-kv k=\"place\" v=\"region\"/>\n    <has-kv k=\"region:type\" v=\"mountain_area\"/>\n    <has-kv k=\"name:en\" v=\"Dolomites\"/>\n  </query>\n  <print mode=\"body\" order=\"quadtile\"/>\n  <!-- get all peaks in the area -->\n  <query type=\"node\">\n    <area-query/>\n    <has-kv k=\"natural\" v=\"peak\"/>\n  </query>\n  <print mode=\"body\" order=\"quadtile\"/>\n  <!-- additionally, show the outline of the area -->\n  <query type=\"relation\">\n    <has-kv k=\"place\" v=\"region\"/>\n    <has-kv k=\"region:type\" v=\"mountain_area\"/>\n    <has-kv k=\"name:en\" v=\"Dolomites\"/>\n  </query>\n  <print mode=\"body\" order=\"quadtile\"/>\n  <recurse type=\"down\"/>\n  <print mode=\"skeleton\" order=\"quadtile\"/>\n</osm-script>"},
  "Map Call":{"overpass":"<!--\nThis is a simple map call.\nIt returns all data in the bounding box.\n-->\n<osm-script output=\"xml\">\n  <union into=\"_\">\n    <bbox-query/>\n    <recurse type=\"up\"/>\n  </union>\n  <print mode=\"meta\" order=\"quadtile\"/>\n</osm-script>"},
};
examples_initial_example = "Drinking Water";

// global settings object
var settings = new Settings("overpass-ide",24);

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
// code editor & map view
settings.define_setting("use_rich_editor","Boolean",true,1);
settings.define_setting("tile_server","String","http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",1);
settings.define_setting("enable_crosshairs","Boolean",false,1);
// export settings
settings.define_setting("export_image_scale","Boolean",true,1);
settings.define_setting("export_image_attribution","Boolean",true,1);
// CORS/ajax/etc. settings
settings.define_setting("force_simple_cors_request","Boolean",false,11);
// background opacity
settings.define_setting("background_opacity","Float",1.0,13);
// autorepair message on "no visible data"
settings.define_setting("no_autorepair","Boolean",false,16);
// resizable panels
settings.define_setting("editor_width","String","",17);
// UI language
settings.define_setting("ui_language","String","auto",19);
// disable poi-o-matic
settings.define_setting("disable_poiomatic","boolean",false,21);
// show data stats
settings.define_setting("show_data_stats","boolean",true,21);

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
settings.define_upgrade_callback(14, function(s) {
  // disable "start at current location" by default
  s.use_html5_coords = false;
  s.save();
});
settings.define_upgrade_callback(18, function(s) {
  // enable "Include current map state in shared links" by default
  s.share_include_pos = true;
  s.save();
});
settings.define_upgrade_callback(20, function(s) {
  // update "Mountains in Area" example
  s.saves["Mountains in Area"]=examples["Mountains in Area"];
  s.save();
});
settings.define_upgrade_callback(22, function(s) {
  // categorize saved queries
  for (var q in s.saves) {
    if (examples[q])
      s.saves[q].type = "example";
    else
      s.saves[q].type = "saved_query";
  }
  // define some templates
  s.saves["key"] = {
    type: "template",
    parameters: ["key"],
    overpass: "<!--\nthis query looks for nodes, ways and relations \nwith the given key.\n-->\n{{key=???}}\n<osm-script output=\"json\">\n  <union>\n    <query type=\"node\">\n      <has-kv k=\"{{key}}\"/>\n      <bbox-query {{bbox}}/>\n    </query>\n    <query type=\"way\">\n      <has-kv k=\"{{key}}\"/>\n      <bbox-query {{bbox}}/>\n    </query>\n    <query type=\"relation\">\n      <has-kv k=\"{{key}}\"/>\n      <bbox-query {{bbox}}/>\n    </query>\n  </union>\n  <print mode=\"body\"/>\n  <recurse type=\"down\"/>\n  <print mode=\"skeleton\"/>\n</osm-script>"
  };
  s.saves["key-type"] = {
    type: "template",
    parameters: ["key", "type"],
    overpass: "<!--\nthis query looks for nodes, ways or relations \nwith the given key.\n-->\n{{key=???}}\n{{type=???}}\n<osm-script output=\"json\">\n  <query type=\"{{type}}\">\n    <has-kv k=\"{{key}}\"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode=\"body\"/>\n  <recurse type=\"down\"/>\n  <print mode=\"skeleton\"/>\n</osm-script>"
  };
  s.saves["key-value"] = {
    type: "template",
    parameters: ["key", "value"],
    overpass: "<!--\nthis query looks for nodes, ways and relations \nwith the given key/value combination.\n-->\n{{key=???}}\n{{value=???}}\n<osm-script output=\"json\">\n  <union>\n    <query type=\"node\">\n      <has-kv k=\"{{key}}\" v=\"{{value}}\"/>\n      <bbox-query {{bbox}}/>\n    </query>\n    <query type=\"way\">\n      <has-kv k=\"{{key}}\" v=\"{{value}}\"/>\n      <bbox-query {{bbox}}/>\n    </query>\n    <query type=\"relation\">\n      <has-kv k=\"{{key}}\" v=\"{{value}}\"/>\n      <bbox-query {{bbox}}/>\n    </query>\n  </union>\n  <print mode=\"body\"/>\n  <recurse type=\"down\"/>\n  <print mode=\"skeleton\"/>\n</osm-script>"
  };
  s.saves["key-value-type"] = {
    type: "template",
    parameters: ["key", "value", "type"],
    overpass: "<!--\nthis query looks for nodes, ways or relations \nwith the given key/value combination.\n-->\n{{key=???}}\n{{value=???}}\n{{type=???}}\n<osm-script output=\"json\">\n  <query type=\"{{type}}\">\n    <has-kv k=\"{{key}}\" v=\"{{value}}\"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode=\"body\"/>\n  <recurse type=\"down\"/>\n  <print mode=\"skeleton\"/>\n</osm-script>"
  };
  s.save();
});
settings.define_upgrade_callback(23, function(s) {
  s.saves["type-id"] = {
    type: "template",
    parameters: ["type", "id"],
    overpass: "<!--\nthis query looks for a node, way or relation \nwith the given id.\n-->\n{{type=???}}\n{{id=???}}\n<osm-script output=\"json\">\n  <id-query type=\"{{type}}\" ref=\"{{id}}\"/>\n  <print mode=\"body\"/>\n  <recurse type=\"down\"/>\n  <print mode=\"skeleton\"/>\n</osm-script>"
  };
  s.save();
});
settings.define_upgrade_callback(24, function(s) {
  // categorize saved queries
  for (var q in s.saves) {
    if (!s.saves[q].type)
      s.saves[q].type = "saved_query";
  }
  s.save();
});
