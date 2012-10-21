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

// global settings object
var settings = new Settings("overpass-ide",10);
//map coordinates
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
//settings.define_setting(,,,);
