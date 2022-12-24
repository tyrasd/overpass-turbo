// urlParameters module
import ffs from "./ffs";
import settings from "./settings";
import {Base64, lzw_decode} from "./misc";

export default function urlParameters(param_str, callback) {
  // defaults
  let t = {
    has_query: false,
    query: undefined,
    has_coords: false,
    coords: undefined,
    has_zoom: false,
    zoom: undefined,
    run_query: false
  };

  // split parameter string
  let args = new URLSearchParams(param_str.substring(1));

  // interpret arguments
  if (args.has("q")) {
    // compressed query set in url
    t.query = lzw_decode(Base64.decode(args.get("q")));
    t.has_query = true;
  }
  if (args.has("Q")) {
    // uncompressed query set in url
    t.query = args.get("Q");
    t.has_query = true;
  }
  if (args.has("c")) {
    // map center & zoom (compressed)
    var tmp = args.get("c").match(/([A-Za-z0-9\-_]+)([A-Za-z0-9\-_])/);
    let decode_coords = function (str) {
      let coords_cpr = Base64.decodeNum(str);
      let res = {};
      res.lat = (coords_cpr % (180 * 100000)) / 100000 - 90;
      res.lng = Math.floor(coords_cpr / (180 * 100000)) / 100000 - 180;
      return res;
    };
    t.coords = decode_coords(tmp[1]);
    t.has_coords = true;
    t.zoom = Base64.decodeNum(tmp[2]);
    t.has_zoom = true;
  }
  if (args.has("C")) {
    // map center & zoom (uncompressed)
    var tmp = args.get("C").match(/(-?[\d.]+);(-?[\d.]+);(\d+)/);
    t.coords = {lat: +tmp[1], lng: +tmp[2]};
    t.has_coords = true;
    t.zoom = +tmp[3];
    t.has_zoom = true;
  }
  if (args.has("lat") && args.has("lon")) {
    // map center coords (ols style osm.org parameters)
    t.coords = {lat: +args.get("lat"), lng: +args.get("lon")};
    t.has_coords = true;
  }
  if (args.has("zoom")) {
    // map zoom level (old style osm.org parameter)
    t.zoom = +args.get("zoom");
    t.has_zoom = true;
  }
  if (args.has("template")) {
    // load a template
    let template = settings.saves[args.get("template")];
    if (template && template.type == "template") {
      // build query
      let q = template.wizard;
      let params = template.parameters;
      for (let i = 0; i < params.length; i++) {
        let param = params[i];
        let value = args.get(param);
        if (typeof value !== "string") value = "???";
        q = q.replace("{{" + param + "}}", quotes(value));
      }
      args.append("w", q); // let the wizard do the work
      var wizard_comment = template.comment;
    } else {
      console.log("template not found: " + args.get("template"));
    }
  }
  if (args.has("w")) {
    // construct a query using the wizard
    ffs.construct_query(args.get("w"), wizard_comment, (err, query) => {
      if (!err) {
        t.query = query;
        t.has_query = true;
        if (typeof callback === "function") callback(null, t);
      } else {
        console.log("invalid wizard syntax:\n  " + args.w);
        if (typeof callback === "function") callback(err, t);
      }
    });
  }
  if (args.has("R")) {
    // indicates that the supplied query shall be executed immediately
    if (
      t.has_query // only run if there is also a query to execute
    )
      t.run_query = true;
  }

  return t;
}

function quotes(s) {
  if (s.match(/^[a-zA-Z0-9_]+$/) === null)
    return '"' + s.replace(/"/g, '\\"') + '"';
  return s;
}
