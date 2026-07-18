// shortcuts module
// see http://wiki.openstreetmap.org/wiki/Overpass_turbo/Extended_Overpass_Queries
import clamp from "lodash/clamp";
import ide from "./ide";
import nominatim from "./nominatim";

// clamps a coordinate to the given range and rounds it to OSM's precision
// of 7 decimal places (~1cm), avoiding long floating point artifacts
function coord(value: number | string, limit: number) {
  return clamp(Number(value), -limit, limit).toFixed(7);
}

// returns the current visible bbox as a bbox-query
function map2bbox(lang) {
  let bbox;
  if (!(ide.map.bboxfilter && ide.map.bboxfilter.isEnabled()))
    bbox = ide.map.getBounds();
  else bbox = ide.map.bboxfilter.getBounds();
  const lat1 = coord(bbox.getSouthWest().lat, 90);
  const lat2 = coord(bbox.getNorthEast().lat, 90);
  const lng1 = coord(bbox.getSouthWest().lng, 180);
  const lng2 = coord(bbox.getNorthEast().lng, 180);
  if (lang == "OverpassQL") return `${lat1},${lng1},${lat2},${lng2}`;
  else if (lang == "xml")
    return `s="${lat1}" w="${lng1}" n="${lat2}" e="${lng2}"`;
  else if (lang == "SQL")
    return `st_setsrid(st_makebox2d(st_makepoint(${lng1},${lat1}), st_makepoint(${lng2},${lat2})), 4326)`;
}

// returns the current visible bbox in west,south,east,north order
function map2wsen() {
  let bbox;
  if (!(ide.map.bboxfilter && ide.map.bboxfilter.isEnabled()))
    bbox = ide.map.getBounds();
  else bbox = ide.map.bboxfilter.getBounds();
  const south = coord(bbox.getSouthWest().lat, 90);
  const north = coord(bbox.getNorthEast().lat, 90);
  const west = coord(bbox.getSouthWest().lng, 180);
  const east = coord(bbox.getNorthEast().lng, 180);
  return `${west},${south},${east},${north}`;
}

// returns the current visible map center as a coord-query
function map2coord(lang) {
  const center = ide.map.getCenter();
  const lat = coord(center.lat, 90);
  const lng = coord(center.lng, 180);
  if (lang == "OverpassQL") return `${lat},${lng}`;
  else if (lang == "xml") return `lat="${lat}" lon="${lng}"`;
}

// converts relative time to ISO time string
function relativeTime(instr, callback) {
  const now = Date.now();
  // very basic differential date
  if (instr == "") instr = "0 seconds";
  instr = instr
    .toLowerCase()
    .match(
      /(-?[0-9]+) ?(seconds?|minutes?|hours?|days?|weeks?|months?|years?)?/
    );
  if (instr === null) {
    callback(""); // todo: throw an error. do not silently fail
    return;
  }
  const count = parseInt(instr[1]);
  let interval;
  switch (instr[2]) {
    case "second":
    case "seconds":
      interval = 1;
      break;
    case "minute":
    case "minutes":
      interval = 60;
      break;
    case "hour":
    case "hours":
      interval = 3600;
      break;
    case "day":
    case "days":
    default:
      interval = 86400;
      break;
    case "week":
    case "weeks":
      interval = 604800;
      break;
    case "month":
    case "months":
      interval = 2628000;
      break;
    case "year":
    case "years":
      interval = 31536000;
      break;
  }
  const date = now - count * interval * 1000;
  callback(new Date(date).toISOString());
}

// geocoded values (object/area ids, coords, bbox)
function geocodeId(instr, callback) {
  const lang = ide.getQueryLang();
  function filter(n) {
    return n.osm_type && n.osm_id;
  }
  nominatim.getBest(instr, filter, (err, res) => {
    if (err) return ide.onNominatimError(instr, "Id");
    if (lang == "OverpassQL") res = `${res.osm_type}(${res.osm_id})`;
    else if (lang == "xml") res = `type="${res.osm_type}" ref="${res.osm_id}"`;
    callback(res);
  });
}
function geocodeArea(instr, callback) {
  const lang = ide.getQueryLang();
  function filter(n) {
    return n.osm_type && n.osm_id && n.osm_type !== "node";
  }
  nominatim.getBest(instr, filter, (err, res) => {
    if (err) return ide.onNominatimError(instr, "Area");
    let area_ref = 1 * res.osm_id;
    if (res.osm_type == "way") area_ref += 2400000000;
    if (res.osm_type == "relation") area_ref += 3600000000;
    if (lang == "OverpassQL") {
      // Do not +2400000000 for ways since version 0.7.57,
      // for backward compatibility query both IDs, see
      // https://github.com/tyrasd/overpass-turbo/issues/537
      if (res.osm_type === "way") area_ref += `,${res.osm_id}`;
      return callback(`area(id:${area_ref})`);
    } else if (lang == "xml") {
      // https://github.com/tyrasd/overpass-turbo/issues/537
      if (res.osm_type === "way") area_ref += `" ref_1="${res.osm_id}`;
      return callback(`type="area" ref="${area_ref}"`);
    }
  });
}
function geocodeBbox(instr, callback) {
  const lang = ide.getQueryLang();
  nominatim.getBest(instr, (err, res) => {
    if (err) return ide.onNominatimError(instr, "Bbox");
    const lat1 = coord(res.boundingbox[0], 90);
    const lat2 = coord(res.boundingbox[1], 90);
    const lng1 = coord(res.boundingbox[2], 180);
    const lng2 = coord(res.boundingbox[3], 180);
    if (lang == "OverpassQL") res = `${lat1},${lng1},${lat2},${lng2}`;
    else if (lang == "xml")
      res = `s="${lat1}" w="${lng1}" n="${lat2}" e="${lng2}"`;
    callback(res);
  });
}
function geocodeCoords(instr, callback) {
  const lang = ide.getQueryLang();
  nominatim.getBest(instr, (err, res) => {
    if (err) return ide.onNominatimError(instr, "Coords");
    if (lang == "OverpassQL") res = `${res.lat},${res.lon}`;
    else if (lang == "xml") res = `lat="${res.lat}" lon="${res.lon}"`;
    callback(res);
  });
}

export type Shortcut =
  | string
  | ((instr: string, callback: (s: string) => void) => void);

export default function shortcuts(): Record<string, Shortcut> {
  const queryLang = ide.getQueryLang();
  return {
    bbox: map2bbox(queryLang),
    wsen: map2wsen(),
    center: map2coord(queryLang),
    // special handling for global bbox in xml queries (which uses an OverpassQL-like notation instead of n/s/e/w parameters):
    __bbox__global_bbox_xml__ezs4K8__: map2bbox("OverpassQL"),
    date: relativeTime,
    geocodeId: geocodeId,
    geocodeArea: geocodeArea,
    geocodeBbox: geocodeBbox,
    geocodeCoords: geocodeCoords,
    // legacy
    nominatimId:
      queryLang == "xml"
        ? geocodeId
        : (instr, callback) =>
            geocodeId(instr, (result) => callback(`${result};`)),
    nominatimArea:
      queryLang == "xml"
        ? geocodeArea
        : (instr, callback) =>
            geocodeArea(instr, (result) => callback(`${result};`)),
    nominatimBbox: geocodeBbox,
    nominatimCoords: geocodeCoords
  };
}
