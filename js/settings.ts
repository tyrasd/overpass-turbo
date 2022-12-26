// Settings class
import _ from "lodash";

import configs from "./configs";

class Settings {
  // settings.define_setting
  coords_lat: number;
  coords_lon: number;
  coords_zoom: number;
  code: object;
  saves: object;
  server: string;
  customServers: string[];
  share_compression: string;
  share_include_pos: boolean;
  use_rich_editor: boolean;
  tile_server: string;
  customTiles: string[];
  enable_crosshairs: boolean;
  export_image_scale: boolean;
  export_image_attribution: boolean;
  background_opacity: number;
  no_autorepair: boolean;
  editor_width: string;
  ui_language: string;
  disable_poiomatic: boolean;
  show_data_stats: boolean;

  // meta settings
  first_time_visit: boolean;
  prefix: string;
  settings_version: number;
  settings: Record<
    string,
    {
      type: string;
      preset: string | number | boolean | string[];
      version: number;
    }
  >;
  upgrade_callbacks: ((s: Settings) => void)[];
  version: number;

  constructor(namespace: string, version: number) {
    this.prefix = `${namespace}_`;
    this.settings_version = version;
    this.version = +localStorage.getItem(`${this.prefix}version`);
    this.settings = {};
    this.upgrade_callbacks = [];
  }

  // == public methods ==
  define_setting(
    name: string,
    type: string,
    preset: string | number | boolean | string[],
    version: number
  ) {
    this.settings[name] = {type: type, preset: preset, version: version};
  }
  define_upgrade_callback(version: number, fun: (s: Settings) => void) {
    this.upgrade_callbacks[version] = fun;
  }

  set(name: string, value: string) {
    if (
      value === undefined // use preset if no value is given
    )
      value = this.settings[name].preset;
    if (this.settings[name].type != "String") {
      // stringify all non-string values.
      value = JSON.stringify(value);
    }
    localStorage.setItem(this.prefix + name, value);
  }
  get(name: string) {
    // initialize new settings
    if (this.settings[name].version > this.version) this.set(name, undefined);
    // load the setting
    let value = localStorage.getItem(this.prefix + name);
    if (this.settings[name].type != "String") {
      // parse all non-string values.
      value = JSON.parse(value);
    }
    return value;
  }

  load() {
    // load all settings into the objects namespace
    for (const name in this.settings) {
      this[name] = this.get(name);
    }
    // version upgrade
    if (this.version == 0) this.first_time_visit = true;
    if (this.version < this.settings_version) {
      for (let v = this.version + 1; v <= this.settings_version; v++) {
        if (typeof this.upgrade_callbacks[v] == "function")
          this.upgrade_callbacks[v](this);
      }
      this.version = this.settings_version;
      localStorage.setItem(`${this.prefix}version`, this.version);
    }
  }
  save() {
    // save all settings from the objects namespace
    for (const name in this.settings) {
      this.set(name, this[name]);
    }
  }
  reset() {
    for (const name in this.settings) {
      localStorage.removeItem(this.prefix + name);
      delete this.settings[name];
    }
    localStorage.removeItem(`${this.prefix}version`);
  }
}

// examples
const examples = {
  "Drinking Water": {
    overpass:
      "/*\nThis is an example Overpass query.\nTry it out by pressing the Run button above!\nYou can find more examples with the Load tool.\n*/\nnode\n  [amenity=drinking_water]\n  ({{bbox}});\nout;"
  },
  "Cycle Network": {
    overpass:
      "/*\nThis shows the cycleway and cycleroute network.\n*/\n\n[out:json];\n\n(\n  // get cycle route relations\n  relation[route=bicycle]({{bbox}})->.cr;\n  // get cycleways\n  way[highway=cycleway]({{bbox}});\n  way[highway=path][bicycle=designated]({{bbox}});\n);\n\nout body;\n>;\nout skel qt;"
  },
  "Where am I?": {
    overpass:
      "/*\nThis lists all areas which include the map center point.\n*/\n[out:json];\nis_in({{center}});\nout;"
  },
  "Mountains in Area": {
    overpass:
      '/*\nThis shows all mountains (peaks) in the Dolomites.\nYou may want to use the "zoom onto data" button. =>\n*/\n\n[out:json];\n\n// search the area of the Dolmites\narea\n  [place=region]\n  ["region:type"="mountain_area"]\n  ["name:en"="Dolomites"];\nout body;\n\n// get all peaks in the area\nnode\n  [natural=peak]\n  (area);\nout body qt;\n\n// additionally, show the outline of the area\nrelation\n  [place=region]\n  ["region:type"="mountain_area"]\n  ["name:en"="Dolomites"];\nout body;\n>;\nout skel qt;'
  },
  "Map Call": {
    overpass:
      "/*\nThis is a simple map call.\nIt returns all data in the bounding box.\n*/\n[out:xml];\n(\n  node({{bbox}});\n  <;\n);\nout meta;"
  },
  "MapCSS styling": {
    overpass:
      "/*\nThis example shows how the data can be styled.\nHere, some common amenities are displayed in \ndifferent colors.\n\nRead more: http://wiki.openstreetmap.org/wiki/Overpass_turbo/MapCSS\n*/\n[out:json];\n\n(\n  node[amenity]({{bbox}});\n  way[amenity]({{bbox}});\n  relation[amenity]({{bbox}});\n);\nout body;\n>;\nout skel qt;\n\n{{style: /* this is the MapCSS stylesheet */\nnode, area\n{ color:gray; fill-color:gray; }\n\nnode[amenity=drinking_water],\nnode[amenity=fountain]\n{ color:blue; fill-color:blue; }\n\nnode[amenity=place_of_worship],\narea[amenity=place_of_worship]\n{ color:grey; fill-color:grey; }\n\nnode[amenity=~/(restaurant|hotel|cafe)/],\narea[amenity=~/(restaurant|hotel|cafe)/]\n{ color:red; fill-color:red; }\n\nnode[amenity=parking],\narea[amenity=parking]\n{ color:yellow; fill-color:yellow; }\n\nnode[amenity=bench]\n{ color:brown; fill-color:brown; }\n\nnode[amenity=~/(kindergarten|school|university)/],\narea[amenity=~/(kindergarten|school|university)/]\n{ color:green; fill-color:green; }\n}}"
  }
};
const examples_initial_example = "Drinking Water";

// global settings object
const settings = new Settings(
  configs.settingNamespace || configs.appname,
  38 // settings version number
);

export default settings;

// map coordinates
settings.define_setting("coords_lat", "Float", configs.defaultMapView.lat, 1);
settings.define_setting("coords_lon", "Float", configs.defaultMapView.lon, 1);
settings.define_setting(
  "coords_zoom",
  "Integer",
  configs.defaultMapView.zoom,
  1
);
// saves
settings.define_setting(
  "code",
  "Object",
  examples[examples_initial_example],
  1
);
settings.define_setting("saves", "Object", examples, 1);
// api server
settings.define_setting("server", "String", configs.defaultServer, 1);
settings.define_setting("customServers", "Array", [], 35);
// sharing options
settings.define_setting("share_compression", "String", "auto", 1);
settings.define_setting("share_include_pos", "Boolean", false, 1);
// code editor & map view
settings.define_setting("use_rich_editor", "Boolean", true, 1);
settings.define_setting("tile_server", "String", configs.defaultTiles, 1);
settings.define_setting("customTiles", "Array", [], 35);
settings.define_setting("enable_crosshairs", "Boolean", false, 1);
// export settings
settings.define_setting("export_image_scale", "Boolean", true, 1);
settings.define_setting("export_image_attribution", "Boolean", true, 1);
// background opacity
settings.define_setting("background_opacity", "Float", 1.0, 13);
// autorepair message on "no visible data"
settings.define_setting("no_autorepair", "Boolean", false, 16);
// resizable panels
settings.define_setting("editor_width", "String", "", 17);
// UI language
settings.define_setting("ui_language", "String", "auto", 19);
// disable poi-o-matic
settings.define_setting("disable_poiomatic", "boolean", false, 21);
// show data stats
settings.define_setting("show_data_stats", "boolean", true, 21);

//settings.define_setting(,,,);

// upgrade callbacks
settings.define_upgrade_callback(12, (s) => {
  // migrate code and saved examples to new mustache style syntax
  function migrate(code) {
    code.overpass = code.overpass.replace(/\(bbox\)/g, "({{bbox}})");
    code.overpass = code.overpass.replace(
      /<bbox-query\/>/g,
      "<bbox-query {{bbox}}/>"
    );
    code.overpass = code.overpass.replace(
      /<coord-query\/>/g,
      "<coord-query {{center}}/>"
    );
    return code;
  }
  s.code = migrate(s.code);
  for (const ex in s.saves) {
    s.saves[ex] = migrate(s.saves[ex]);
  }
  s.save();
});
settings.define_upgrade_callback(18, (s) => {
  // enable "Include current map state in shared links" by default
  s.share_include_pos = true;
  s.save();
});
settings.define_upgrade_callback(20, (s) => {
  // update "Mountains in Area" example
  s.saves["Mountains in Area"] = examples["Mountains in Area"];
  s.save();
});
settings.define_upgrade_callback(22, (s) => {
  // categorize saved queries
  for (const q in s.saves) {
    if (examples[q]) s.saves[q].type = "example";
    else s.saves[q].type = "saved_query";
  }
  // define some templates
  s.saves["key"] = {
    type: "template",
    parameters: ["key"],
    overpass:
      '<!--\nthis query looks for nodes, ways and relations \nwith the given key.\n-->\n{{key=???}}\n<osm-script output="json">\n  <union>\n    <query type="node">\n      <has-kv k="{{key}}"/>\n      <bbox-query {{bbox}}/>\n    </query>\n    <query type="way">\n      <has-kv k="{{key}}"/>\n      <bbox-query {{bbox}}/>\n    </query>\n    <query type="relation">\n      <has-kv k="{{key}}"/>\n      <bbox-query {{bbox}}/>\n    </query>\n  </union>\n  <print mode="body"/>\n  <recurse type="down"/>\n  <print mode="skeleton"/>\n</osm-script>'
  };
  s.saves["key-type"] = {
    type: "template",
    parameters: ["key", "type"],
    overpass:
      '<!--\nthis query looks for nodes, ways or relations \nwith the given key.\n-->\n{{key=???}}\n{{type=???}}\n<osm-script output="json">\n  <query type="{{type}}">\n    <has-kv k="{{key}}"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="body"/>\n  <recurse type="down"/>\n  <print mode="skeleton"/>\n</osm-script>'
  };
  s.saves["key-value"] = {
    type: "template",
    parameters: ["key", "value"],
    overpass:
      '<!--\nthis query looks for nodes, ways and relations \nwith the given key/value combination.\n-->\n{{key=???}}\n{{value=???}}\n<osm-script output="json">\n  <union>\n    <query type="node">\n      <has-kv k="{{key}}" v="{{value}}"/>\n      <bbox-query {{bbox}}/>\n    </query>\n    <query type="way">\n      <has-kv k="{{key}}" v="{{value}}"/>\n      <bbox-query {{bbox}}/>\n    </query>\n    <query type="relation">\n      <has-kv k="{{key}}" v="{{value}}"/>\n      <bbox-query {{bbox}}/>\n    </query>\n  </union>\n  <print mode="body"/>\n  <recurse type="down"/>\n  <print mode="skeleton"/>\n</osm-script>'
  };
  s.saves["key-value-type"] = {
    type: "template",
    parameters: ["key", "value", "type"],
    overpass:
      '<!--\nthis query looks for nodes, ways or relations \nwith the given key/value combination.\n-->\n{{key=???}}\n{{value=???}}\n{{type=???}}\n<osm-script output="json">\n  <query type="{{type}}">\n    <has-kv k="{{key}}" v="{{value}}"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="body"/>\n  <recurse type="down"/>\n  <print mode="skeleton"/>\n</osm-script>'
  };
  s.save();
});
settings.define_upgrade_callback(23, (s) => {
  s.saves["type-id"] = {
    type: "template",
    parameters: ["type", "id"],
    overpass:
      '<!--\nthis query looks for a node, way or relation \nwith the given id.\n-->\n{{type=???}}\n{{id=???}}\n<osm-script output="json">\n  <id-query type="{{type}}" ref="{{id}}"/>\n  <print mode="body"/>\n  <recurse type="down"/>\n  <print mode="skeleton"/>\n</osm-script>'
  };
  s.save();
});
settings.define_upgrade_callback(24, (s) => {
  // categorize saved queries
  for (const q in s.saves) {
    if (!s.saves[q].type) s.saves[q].type = "saved_query";
  }
  s.save();
});
settings.define_upgrade_callback(25, (s) => {
  // upgrade template description text
  for (const q in s.saves) {
    if (s.saves[q].type == "template") {
      s.saves[q].overpass = s.saves[q].overpass.replace("<!--\nt", "<!--\nT");
      s.saves[q].overpass = s.saves[q].overpass.replace(
        "\n-->",
        "\nChoose your region and hit the Run button above!\n-->"
      );
    }
  }
  s.save();
});
settings.define_upgrade_callback(27, (s) => {
  // rename "List Areas" to "Where am I?"
  if (!s.saves["Where am I?"]) {
    s.saves["Where am I?"] = s.saves["List Areas"];
    delete s.saves["List Areas"];
  }
  // add mapcss example
  s.saves["MapCSS styling"] = {
    type: "example",
    overpass: examples["MapCSS styling"]
  };
  s.save();
});
settings.define_upgrade_callback(28, (s) => {
  // generalize URLs to not explicitly use http protocol
  s.server = s.server.replace(/^http:\/\//, "//");
  s.tile_server = s.tile_server.replace(/^http:\/\//, "//");
  s.save();
});
settings.define_upgrade_callback(29, (s) => {
  // convert templates to wizard-syntax
  _.each(s.saves, (save, name) => {
    if (save.type !== "template") return;
    switch (name) {
      case "key":
        save.wizard = "{{key}}=*";
        break;
      case "key-type":
        save.wizard = "{{key}}=* and type:{{type}}";
        break;
      case "key-value":
        save.wizard = "{{key}}={{value}}";
        break;
      case "key-value-type":
        save.wizard = "{{key}}={{value}} and type:{{type}}";
        break;
      case "type-id":
        save.wizard = "type:{{type}} and id:{{id}} global";
        break;
      default:
        return;
    }
    delete save.overpass;
  });
  s.save();
});

settings.define_upgrade_callback(30, (s) => {
  // add comments for templates
  const chooseAndRun = "\nChoose your region and hit the Run button above!";
  _.each(s.saves, (save, name) => {
    if (save.type !== "template") return;
    switch (name) {
      case "key":
        save.comment =
          "This query looks for nodes, ways and relations \nwith the given key.";
        save.comment += chooseAndRun;
        break;
      case "key-type":
        save.comment =
          "This query looks for nodes, ways or relations \nwith the given key.";
        save.comment += chooseAndRun;
        break;
      case "key-value":
        save.comment =
          "This query looks for nodes, ways and relations \nwith the given key/value combination.";
        save.comment += chooseAndRun;
        break;
      case "key-value-type":
        save.comment =
          "This query looks for nodes, ways or relations \nwith the given key/value combination.";
        save.comment += chooseAndRun;
        break;
      case "type-id":
        save.comment =
          "This query looks for a node, way or relation \nwith the given id.";
        save.comment += "\nTo execute, hit the Run button above!";
        break;
      default:
        return;
    }
    delete save.overpass;
  });
  s.save();
});

settings.define_upgrade_callback(31, (s) => {
  // rewrite examples in OverpassQL
  _.each(s.saves, (save, name) => {
    if (save.type !== "example") return;
    switch (name) {
      case "Drinking Water":
      case "Cycle Network":
      case "Mountains in Area":
      case "Map Call":
      case "Where am I?":
      case "MapCSS styling":
        save.overpass = examples[name].overpass;
        break;
      default:
        return;
    }
  });
  delete s.saves["Drinking Water (Overpass QL)"];
  s.save();
});

settings.define_upgrade_callback(32, (s) => {
  // fix typo in query definition
  s.saves["MapCSS styling"].overpass = s.saves[
    "MapCSS styling"
  ].overpass.replace("<;", ">;");
  s.save();
});

settings.define_upgrade_callback(33, (s) => {
  s.saves["Attic date query"] = {
    type: "example",
    overpass: [
      "/* This query loads all objects as of 2016-01-01 */",
      '[date:"2016-01-01T00:00:00Z"]',
      "(",
      "  node({{bbox}});",
      "  way({{bbox}});",
      "  relation({{bbox}});",
      ");",
      "out body;",
      ">;",
      "out skel qt;"
    ].join("\n")
  };
  s.save();
});

settings.define_upgrade_callback(34, (s) => {
  s.saves["Attic date query"].overpass = s.saves[
    "Attic date query"
  ].overpass.replace('00:00Z"]\n', '00:00Z"];\n');
});

settings.define_upgrade_callback(36, (s) => {
  s.saves["Mountains in Area"].overpass =
    '/*\nThis shows all mountains (peaks) in the Dolomites.\nYou may want to use the "zoom onto data" button. =>\n*/\n[out:json];\n// search the relation of the Dolomites\nrel\n  [place=region]\n  ["region:type"="mountain_area"]\n  ["name:en"="Dolomites"];\n// show the outline\nout geom;\n// turn the relation into an area\nmap_to_area;\n// get all peaks in the area\nnode\n  [natural=peak]\n  (area);\nout body qt;';
  s.saves["Cycle Network"].overpass = s.saves["Cycle Network"].overpass.replace(
    "->.cr",
    ""
  );
});
settings.define_upgrade_callback(37, (s) => {
  // Update the Rambler API endpoint
  s.server = s.server.replace(
    /overpass\.osm\.rambler\.ru/,
    "overpass.openstreetmap.ru"
  );
  s.save();
});

settings.define_upgrade_callback(38, (s) => {
  s.tile_server = s.tile_server.replace(
    /\{s\}\.tile\.openstreetmap\.org/,
    "tile.openstreetmap.org"
  );
});
