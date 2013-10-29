function togpx( geojson, options ) {
  options = {
    creator: options.creator ? options.creator : "togpx";
    metadata: options.metadata ? options.metadata : undefined,
  };

  function get_feature_description(props) {
    if (props && props.tags) {
      if (props.tags.name)
        return props.tags.name;
      if (props.tags.ref)
        return props.tags.ref;
      if (props.tags["addr:housenumber"] && props.tags["addr:street"])
        return props.tags["addr:street"] + " " + props.tags["addr:housenumber"];
    }
    return props.type + " " + props.id;
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
        "link": { "@href": "http://osm.org/browse/"+f.properties.type+"/"+f.properties.id },
        "name": get_feature_description(f.properties)
      };
      gpx.gpx.wpt.push(o);
      break;
    // LineStrings
    case "LineString":
      o = {
        "link": { "@href": "http://osm.org/browse/"+f.properties.type+"/"+f.properties.id },
        "name": get_feature_description(f.properties) 
      };
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
        "link": { "@href": "http://osm.org/browse/"+f.properties.type+"/"+f.properties.id },
        "name": get_feature_description(f.properties) 
      };
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
