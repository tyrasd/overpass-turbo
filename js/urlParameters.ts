// urlParameters module
import {ffs_construct_query} from "./ffs";
import settings from "./settings";
import {Base64, lzw_decode} from "./misc";

export function parseUrlParameters(
  param_str = location.search || location.hash || ""
) {
  return new URLSearchParams(param_str.substring(1));
}

export default function urlParameters(
  param_str = location.search || location.hash || "",
  callback?: (err: unknown, result: ReturnType<typeof urlParameters>) => void
) {
  // defaults
  const t = {
    has_query: false,
    query: null as string | null,
    has_coords: false,
    coords: undefined as {lat: number; lng: number} | undefined,
    has_zoom: false,
    zoom: null as number | null,
    run_query: false
  };

  // split parameter string
  const args = parseUrlParameters(param_str);

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
    const tmp = args.get("c").match(/([A-Za-z0-9\-_]+)([A-Za-z0-9\-_])/);
    if (!tmp) {
      console.warn(`Skipping invalid [${args.get("c")}]`);
    } else {
      const coords_cpr = Base64.decodeNum(tmp[1]);
      t.coords = {
        lat: (coords_cpr % (180 * 100000)) / 100000 - 90,
        lng: Math.floor(coords_cpr / (180 * 100000)) / 100000 - 180
      };
      t.has_coords = true;
      t.zoom = Base64.decodeNum(tmp[2]);
      t.has_zoom = true;
    }
  }
  if (args.has("C")) {
    // map center & zoom (uncompressed)
    const tmp = args.get("C").match(/(-?[\d.]+);(-?[\d.]+);(\d+)/);
    if (!tmp) {
      console.warn(`Skipping invalid [${args.get("C")}]`);
    } else {
      t.coords = {lat: +tmp[1], lng: +tmp[2]};
      t.has_coords = true;
      t.zoom = +tmp[3];
      t.has_zoom = true;
    }
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
  let wizard_comment = "";
  if (args.has("template")) {
    // load a template
    const template = settings.saves[args.get("template")];
    if (template && template.type == "template") {
      // build query
      let q = template.wizard;
      const params = template.parameters;
      for (const param of params) {
        let value = args.get(param);
        if (typeof value !== "string") value = "???";
        q = q.replace(`{{${param}}}`, quotes(value));
      }
      args.append("w", q); // let the wizard do the work
      wizard_comment = template.comment;
    } else {
      console.log(`template not found: ${args.get("template")}`);
    }
  }
  if (args.has("w")) {
    // construct a query using the wizard
    ffs_construct_query(args.get("w").trim(), wizard_comment, (err, query) => {
      if (!err) {
        t.query = query;
        t.has_query = true;
        if (typeof callback === "function") callback(null, t);
      } else {
        console.log(`invalid wizard syntax:\n  ${args.w}`);
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
  if (s.match(/^[a-zA-Z0-9_]+$/) === null) return `"${s.replace(/"/g, '\\"')}"`;
  return s;
}
