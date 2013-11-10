// urlParameters module
if (typeof turbo === "undefined") turbo={};
turbo.urlParameters = function(args) {
    t = {
      has_query: false,
      query: undefined,
      has_coords: false,
      coords: undefined,
      has_zoom: false,
      zoom: undefined,
      run_query: false
    }

    if (args.q) { // compressed query set in url
      t.query = lzw_decode(Base64.decode(args.q));
      t.has_query = true;
    }
    if (args.Q) { // uncompressed query set in url
      t.query = args.Q;
      t.has_query = true;
    }
    if (args.c) { // map center & zoom (compressed)
      var tmp = args.c.match(/([A-Za-z0-9\-_]+)([A-Za-z0-9\-_])/);
      var decode_coords = function(str) {
        var coords_cpr = Base64.decodeNum(str);
        var res = {};
        res.lat = coords_cpr % (180*100000) / 100000 - 90;
        res.lng = Math.floor(coords_cpr / (180*100000)) / 100000 - 180;
        return res;
      }
      t.coords = decode_coords(tmp[1]);
      t.has_coords = true;
      t.zoom = Base64.decodeNum(tmp[2]);
      t.has_zoom = true;
    }
    if (args.C) { // map center & zoom (uncompressed)
      var tmp = args.C.match(/(-?[\d.]+);(-?[\d.]+);(\d+)/);
      t.coords = {lat: +tmp[1], lng: +tmp[2]};
      t.has_coords = true;
      t.zoom = +tmp[3];
      t.has_zoom = true;
    }
    if (args.lat && args.lon) { // map center coords (ols style osm.org parameters)
      t.coords = {lat: +args.lat, lng: +args.lon};
      t.has_coords = true;
    }
    if (args.zoom) { // map zoom level (old style osm.org parameter)
      t.zoom = +args.zoom;
      t.has_zoom = true;
    }
    if (args.R !== undefined) { // indicates that the supplied query shall be executed immediately
      t.run_query = true;
    }
    if (args.template) { // load a template
      var template = settings.saves[args.template];
      if (template && template.type == "template") {
        // build query
        var q = template.overpass;
        var params = template.parameters;
        for (var i=0; i<params.length; i++) {
          var param = params[i];
          if (typeof args[param] !== "string") continue;
          var value = args[param];
          value = value.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/\t/g,"&#09;").replace(/\n/g,"&#10;").replace(/\r/g,"&#13;");
          // additionally escape curly brackets
          value = value.replace(/\}/g,"&#125;").replace(/\{/g,"&#123;");
          q = q.replace("{{"+param+"=???}}","{{"+param+"="+value+"}}");
          // special case for empty tag value in templates
          // Overpass API doesn't properly support searching for empty tag values. see drolbr/Overpass-API#53
          if (param === "value" && value === "") {
            q = q.replace("{{value=}}\n","");
            q = q.replace(/v="\{\{value\}\}"/g,'regv="^$"');
          }
        }
        t.query = q;
        t.has_query = true;
      } else {
        console.log("template not found");
      }
    }

    return t;
};