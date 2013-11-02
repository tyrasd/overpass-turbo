if (typeof require !== "undefined") {
  JXON = require("./jxon.js");
}

function togpx( geojson, options ) {
  options = {
    creator: (options && options.hasOwnProperty("creator")) ? options.creator : "togpx",
    metadata: (options && options.hasOwnProperty("metadata")) ? options.metadata : undefined,
    featureTitle: (options && options.hasOwnProperty("featureTitle")) ? options.featureTitle : get_feature_title,
    featureDescription: (options && options.hasOwnProperty("featureDescription")) ? options.featureDescription : get_feature_description,
    featureLink: (options && options.hasOwnProperty("featureLink")) ? options.featureLink : undefined
  };

  function get_feature_title(props) {
    // a simple default heuristic to determine a title for a given feature
    // uses a nested `tags` object or the feature's `properties` if present
    // and then searchs for the following properties to construct a title:
    // `name`, `ref`, `id`
    if (typeof props.tags === "object") {
      var tags_title = get_feature_title(props.tags);
      if (tags_title !== "")
        return tags_title;
    }
    if (props.name)
      return props.name;
    if (props.ref)
      return props.ref;
    if (props.id)
      return props.id;
    return "";
  }
  function get_feature_description(props) {
    // constructs a description for a given feature
    // uses a nested `tags` object or the feature's `properties` if present
    // and then searchs for the following properties to construct a title:
    // name, ref, id
    if (typeof props.tags === "object")
      return get_feature_description(props.tags);
    var res = "";
    for (var k in props)
      res += k+"="+props[k]+"\n";
    return res.substr(0,res.length-1);
  }
  function add_feature_link(o, f) {
    if (options.featureLink)
      o.link = { "@href": options.featureLink(f.properties) }
  }
  // make gpx object
  var gpx = {"gpx": {
    "@xmlns":"http://www.topografix.com/GPX/1/1",
    "@xmlns:xsi":"http://www.w3.org/2001/XMLSchema-instance",
    "@xsi:schemaLocation":"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd",
    "@version":"1.1",
    "wpt": [],
    "trk": [],
  }};
  if (options.creator)
    gpx.gpx["@creator"] = options.creator;
  if (options.metadata)
    gpx.gpx["metadata"] = options.metadata;
  // todo: also for non-featurecollections?
  geojson.features.forEach(function(f) {
    switch (f.geometry.type) {
    // POIs
    case "Point":
      o = {
        "@lat": f.geometry.coordinates[1],
        "@lon": f.geometry.coordinates[0],
        "name": options.featureTitle(f.properties),
        "desc": options.featureDescription(f.properties)
      };
      add_feature_link(o,f);
      gpx.gpx.wpt.push(o);
      break;
    // LineStrings
    case "LineString":
      o = {
        "name": options.featureTitle(f.properties),
        "desc": options.featureDescription(f.properties)
      };
      add_feature_link(o,f);
      o.trkseg = {trkpt: []};
      f.geometry.coordinates.forEach(function(c) {
        o.trkseg.trkpt.push({"@lat": c[1], "@lon":c[0]});
      });
      gpx.gpx.trk.push(o);
      break;
    // Polygons / Multipolygons
    case "Polygon":
    case "MultiPolygon":
      o = {
        "name": options.featureTitle(f.properties),
        "desc": options.featureDescription(f.properties)
      };
      add_feature_link(o,f);
      o.trkseg = [];
      var coords = f.geometry.coordinates;
      if (f.geometry.type == "Polygon") coords = [coords];
      coords.forEach(function(poly) {
        poly.forEach(function(ring) {
          var seg = {trkpt: []};
          ring.forEach(function(c) {
            seg.trkpt.push({"@lat": c[1], "@lon":c[0]});
          });
          o.trkseg.push(seg);
        });
      });
      gpx.gpx.trk.push(o);
      break;
    default:
      console.log("warning: unsupported geometry type: "+f.geometry.type);
    }
  });
  gpx_str = JXON.stringify(gpx);
  return gpx_str;
};

if (typeof module !== 'undefined') module.exports = togpx;
