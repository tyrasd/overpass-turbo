L.OSM4Leaflet = L.Class.extend({
  initialize: function (data, options) {
    this.options = {
      data_mode: "xml",
      baseLayerClass: L.GeoJSON,
      baseLayerOptions: {}
    };
    L.Util.setOptions(this,options);
    
    this._baseLayer = new this.options.baseLayerClass(null, this.options.baseLayerOptions);
    this._resultData = null;
    // if data
    if (data)
      this.addData(data);
  },
  addData: function(data, onDone) {
    var obj = this;
setTimeout(function(){
    // 1. convert to GeoJSON
    var converter = obj.options.data_mode == "xml" ? 
                      obj._osmXML2geoJSON :
                      obj._overpassJSON2geoJSON;
    var geojson = converter.call(obj, data);
    obj._resultData = geojson;
    if (obj.options.afterParse)
      obj.options.afterParse();
setTimeout(function(){
    // 2. add to baseLayer
    for (var i=0; i<geojson.length; i++)
      obj._baseLayer.addData(geojson[i]);
    if (onDone)
      onDone();
},1); //end setTimeout
},1); //end setTimeout
  },
  getGeoJSON: function() {
    return this._resultData;
  },
  getBaseLayer: function() {
    return this._baseLayer;
  },
  onAdd: function(map) {
    this._baseLayer.addTo(map);
  },
  onRemove: function(map) {
    map.removeLayer(this._baseLayer);
  },
  _overpassJSON2geoJSON: function(json) {
    // sort elements
    var nodes = new Array();
    var ways  = new Array();
    var rels  = new Array();
    for (var i=0;i<json.elements.length;i++) {
      switch (json.elements[i].type) {
        case "node":
          nodes.push(json.elements[i]);
        break;
        case "way":
          ways.push(json.elements[i]);
        break;
        case "relation":
          rels.push(json.elements[i]);
        break;
        default:
        // type=area (from coord-query) is an example for this case.
      }
    }
    return this._convert2geoJSON(nodes,ways,rels);
  },
  _osmXML2geoJSON: function(xml) {
    // 2. sort elements
    var nodes = new Array();
    var ways  = new Array();
    var rels  = new Array();
    // nodes
    jQuery("node",xml).each(function(i) {
      var tags = new Object();
      jQuery(this).find("tag").each(function(i) {
        tags[jQuery(this).attr("k")] = jQuery(this).attr("v");
      });
      nodes[i] = {
        "id":   jQuery(this).attr("id"),
        "lat":  jQuery(this).attr("lat"),
        "lon":  jQuery(this).attr("lon"),
        "version": jQuery(this).attr("version"),
        "timestamp": jQuery(this).attr("timestamp"),
        "changeset": jQuery(this).attr("changeset"),
        "uid": jQuery(this).attr("uid"),
        "user": jQuery(this).attr("user"),
        "type": "node",
      };
      if (!jQuery.isEmptyObject(tags))
        nodes[i].tags = tags;
    });
    // ways
    jQuery("way",xml).each(function(i) {
      var tags = new Object();
      var wnodes = new Array();
      jQuery(this).find("tag").each(function(i) {
        tags[jQuery(this).attr("k")] = jQuery(this).attr("v");
      });
      jQuery(this).find("nd").each(function(i) {
        wnodes[i] = jQuery(this).attr("ref");
      });
      ways[i] = {
        "id":   jQuery(this).attr("id"),
        "version": jQuery(this).attr("version"),
        "timestamp": jQuery(this).attr("timestamp"),
        "changeset": jQuery(this).attr("changeset"),
        "uid": jQuery(this).attr("uid"),
        "user": jQuery(this).attr("user"),
        "type": "way",
      };
      if (wnodes.length > 0)
        ways[i].nodes = wnodes;
      if (!jQuery.isEmptyObject(tags))
        ways[i].tags = tags;
    });
    // relations
    jQuery("relation",xml).each(function(i) {
      var tags = new Object();
      var members = new Array();
      jQuery(this).find("tag").each(function(i) {
        tags[jQuery(this).attr("k")] = jQuery(this).attr("v");
      });
      jQuery(this).find("member").each(function(i) {
        members[i] = {
          "ref":  jQuery(this).attr("ref"),
          "role": jQuery(this).attr("role"),
          "type": jQuery(this).attr("type"),
        };
      });
      rels[i] = {
        "id":   jQuery(this).attr("id"),
        "tags": tags,
        "version": jQuery(this).attr("version"),
        "timestamp": jQuery(this).attr("timestamp"),
        "changeset": jQuery(this).attr("changeset"),
        "uid": jQuery(this).attr("uid"),
        "user": jQuery(this).attr("user"),
        "type": "relation",
      };
      if (members.length > 0)
        rels[i].members = members;
      if (!jQuery.isEmptyObject(tags))
        rels[i].tags = tags;
    });
    return this._convert2geoJSON(nodes,ways,rels);
  },
  _convert2geoJSON: function(nodes,ways,rels) {
    // some data processing (e.g. filter nodes only used for ways)
    var nodeids = new Object();
    for (var i=0;i<nodes.length;i++) {
      if (!jQuery.isNumeric(nodes[i].lat))
        continue; // ignore nodes without coordinates (e.g. returned by an ids_only query)
      nodeids[nodes[i].id] = nodes[i];
    }
    var poinids = new Object();
    for (var i=0;i<nodes.length;i++) {
      if (typeof nodes[i].tags != 'undefined' &&
          (function(o){for(var k in o) if(k!="created_by"&&k!="source") return true; return false;})(nodes[i].tags)) // this checks if the node has any tags other than "created_by"
        poinids[nodes[i].id] = true;
    }
    for (var i=0;i<rels.length;i++) {
      if (!jQuery.isArray(rels[i].members))
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      for (var j=0;j<rels[i].members.length;j++) {
        if (rels[i].members[j].type == "node")
          poinids[rels[i].members[j].ref] = true;
      }
    }
    var wayids = new Object();
    var waynids = new Object();
    for (var i=0;i<ways.length;i++) {
      if (!jQuery.isArray(ways[i].nodes))
        continue; // ignore ways without nodes (e.g. returned by an ids_only query)
      wayids[ways[i].id] = ways[i];
      for (var j=0;j<ways[i].nodes.length;j++) {
        waynids[ways[i].nodes[j]] = true;
        ways[i].nodes[j] = nodeids[ways[i].nodes[j]];
      }
    }
    var pois = new Array();
    for (var i=0;i<nodes.length;i++) {
      if ((!waynids[nodes[i].id]) ||
          (poinids[nodes[i].id]))
        pois.push(nodes[i]);
    }
    var relids = new Array();
    for (var i=0;i<rels.length;i++) {
      if (!jQuery.isArray(rels[i].members))
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      relids[rels[i].id] = rels[i];
    }
    for (var i=0;i<rels.length;i++) {
      if (!jQuery.isArray(rels[i].members))
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      for (var j=0;j<rels[i].members.length;j++) {
        var m;
        switch (rels[i].members[j].type) {
          case "node":
            m = nodeids[rels[i].members[j].ref];
          break;
          case "way":
            m = wayids[rels[i].members[j].ref];
          break;
          case "relation":
            m = relids[rels[i].members[j].ref];
          break;
        }
        if (m) { // typeof m != "undefined"
          if (typeof m.relations == "undefined")
            m.relations = new Array();
          m.relations.push({
              "role" : rels[i].members[j].role,
              "rel" : rels[i].id,
              "reltags" : rels[i].tags,
              });
        }
      }
    }
    // construct geojson
    var geojson = new Array();
    var geojsonnodes = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    for (i=0;i<pois.length;i++) {
      if (typeof pois[i].lon == "undefined" || typeof pois[i].lat == "undefined")
        continue; // lon and lat are required for showing a point
      geojsonnodes.features.push({
        "type"       : "Feature",
        "properties" : {
          "type" : "node",
          "id"   : pois[i].id,
          "tags" : pois[i].tags || {},
          "relations" : pois[i].relations || [],
          "meta": function(o){var res={}; for(k in o) if(o[k] != undefined) res[k]=o[k]; return res;}({"timestamp": pois[i].timestamp, "version": pois[i].version, "changeset": pois[i].changeset, "user": pois[i].user, "uid": pois[i].uid}),
        },
        "geometry"   : {
          "type" : "Point",
          "coordinates" : [+pois[i].lon, +pois[i].lat],
        }
      });
    }
    var geojsonlines = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    var geojsonpolygons = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    // process multipolygons
    for (var i=0;i<rels.length;i++) {
      if ((typeof rels[i].tags != "undefined") &&
          (rels[i].tags["type"] == "multipolygon" || rels[i].tags["type"] == "boundary")) {
        if (!jQuery.isArray(rels[i].members))
          continue; // ignore relations without members (e.g. returned by an ids_only query)
        var outer_count = 0;
        jQuery.each(rels[i].members, function(n,m) {
          if (wayids[m.ref])
            wayids[m.ref].is_multipolygon_outline = true;
        });
        for (var j=0;j<rels[i].members.length;j++)
          if (rels[i].members[j].role == "outer")
            outer_count++;
        if (outer_count == 0)
          continue; // ignore multipolygons without outer ways
        var simple_mp = false;
        if (outer_count == 1 &&
            !(function(o){for(var k in o) if(k!="created_by"&&k!="source"&&k!="type") return true; return false;})(rels[i].tags)) // this checks if the relation has any tags other than "created_by", "source" and "type"
          simple_mp = true;
        if (!simple_mp) {
          var is_tainted = false;
          // prepare mp members
          var members;
          members = jQuery.grep(rels[i].members, function(m) {return m.type === "way";});
          members = jQuery.map(members, function(m) {
            var way = wayids[m.ref];
            if (way === undefined) { // check for missing ways
              is_tainted = true;
              return;
            }
            return {
              id: m.ref,
              role: m.role || "outer",
              way: way,
              nodes: jQuery.grep(way.nodes, function(n) {
                if (n !== undefined)
                  return true;
                is_tainted = true;
                return false;
              })
            };
          });
          // construct outer and inner rings
          var outers, inners;
          function join(ways) {
            var _first = function(arr) {return arr[0]};
            var _last  = function(arr) {return arr[arr.length-1]};
            // stolen from iD/relation.js
            var joined = [], current, first, last, i, how, what;
            while (ways.length) {
              current = ways.pop().nodes.slice();
              joined.push(current);
              while (ways.length && _first(current) !== _last(current)) {
                first = _first(current);
                last  = _last(current);
                for (i = 0; i < ways.length; i++) {
                  what = ways[i].nodes;
                  if (last === _first(what)) {
                    how  = current.push;
                    what = what.slice(1);
                    break;
                  } else if (last === _last(what)) {
                    how  = current.push;
                    what = what.slice(0, -1).reverse();
                    break;
                  } else if (first == _last(what)) {
                    how  = current.unshift;
                    what = what.slice(0, -1);
                    break;
                  } else if (first == _first(what)) {
                    how  = current.unshift;
                    what = what.slice(1).reverse();
                    break;
                  } else {
                    what = how = null;
                  }
                }
                if (!what)
                  break; // Invalid geometry (unclosed ring)
                ways.splice(i, 1);
                how.apply(current, what);
              }
            }
            return joined;
          }
          outers = join(jQuery.grep(members, function(m) {return m.role==="outer";}));
          inners = join(jQuery.grep(members, function(m) {return m.role==="inner";}));
          // sort rings
          var mp;
          function findOuter(inner) {
            var polygonIntersectsPolygon = function(outer, inner) {
              for (var i=0; i<inner.length; i++)
                if (pointInPolygon(inner[i], outer))
                  return true;
              return false;
            }
            var _pluck = function(from) {
              return jQuery.map(from, function(n) {
                if (n === undefined)
                  return; 
                return [[+n.lat,+n.lon]];
              });
            }
            // stolen from iD/geo.js, 
            // based on https://github.com/substack/point-in-polygon, 
            // ray-casting algorithm based on http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
            var pointInPolygon = function(point, polygon) {
              var x = point[0], y = point[1], inside = false;
              for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                var xi = polygon[i][0], yi = polygon[i][1];
                var xj = polygon[j][0], yj = polygon[j][1];
                var intersect = ((yi > y) != (yj > y)) &&
                  (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
              }
              return inside;
            };
            // stolen from iD/relation.js
            var o, outer;
            inner = _pluck(inner);
            /*for (o = 0; o < outers.length; o++) {
              outer = _pluck(outers[o]);
              if (polygonContainsPolygon(outer, inner))
                return o;
            }*/
            for (o = 0; o < outers.length; o++) {
              outer = _pluck(outers[o]);
              if (polygonIntersectsPolygon(outer, inner))
                return o;
            }
          }
          mp = jQuery.map(outers, function(o) {return [[o]];});
          for (var j=0; j<inners.length; j++) {
            var o = findOuter(inners[j]);
            if (o !== undefined)
              mp[o].push(inners[j]);
            else
              ;//mp.push(inners[j]); // invalid geometry // tyr: why?
          }
          // sanitize mp-coordinates (remove empty clusters or rings, {lat,lon,...} to [lon,lat]
          var mp_coords = [];
          mp_coords = jQuery.map(mp, function(cluster) { 
            var cl = jQuery.map(cluster, function(ring) {
              if (ring === undefined || ring.length <= 1) {
                is_tainted = true;
                return;
              }
              return [jQuery.map(ring, function(node) {
                if (node === undefined || node.lat === undefined) {
                  is_tainted = true;
                  return;
                }
                return [[+node.lon,+node.lat]];
              })];
            });
            if (cl.length == 0) {
              is_tainted = true;
              return;
            }
            return [cl];
          });
          if (mp_coords.length == 0)
            continue; // ignore multipolygons without coordinates
          // mp parsed, now construct the geoJSON
          var feature = {
            "type"       : "Feature",
            "properties" : {
              "type" : "relation",
              "id"   : rels[i].id,
              "tags" : rels[i].tags || {},
              "relations" : rels[i].relations || [],
              "meta": function(o){var res={}; for(k in o) if(o[k] != undefined) res[k]=o[k]; return res;}({"timestamp": rels[i].timestamp, "version": rels[i].version, "changeset": rels[i].changeset, "user": rels[i].user, "uid": rels[i].uid}),
            },
            "geometry"   : {
              "type" : "MultiPolygon",
              "coordinates" : mp_coords,
            }
          }
          if (is_tainted)
            feature.properties["tainted"] = true;
          geojsonpolygons.features.push(feature);
          //continue; // abort this complex multipolygon
        } else {
          // simple multipolygon
          rels[i].tainted = false;
          var outer_coords = new Array();
          var inner_coords = new Array();
          var outer_way = undefined;
          for (var j=0;j<rels[i].members.length;j++) {
            if ((rels[i].members[j].type == "way") &&
                jQuery.inArray(rels[i].members[j].role, ["outer","inner"]) != -1) {
              var w = wayids[rels[i].members[j].ref];
              if (typeof w == "undefined") {
                rels[i].tainted = true;
                continue;
              }
              var coords = new Array();
              for (var k=0;k<w.nodes.length;k++) {
                if (typeof w.nodes[k] == "object")
                    coords.push([+w.nodes[k].lon, +w.nodes[k].lat]);
                else
                  rels[i].tainted = true;
              }
              if (rels[i].members[j].role == "outer") {
                outer_coords.push(coords);
                w.is_multipolygon = true;
                outer_way = w;
              } else if (rels[i].members[j].role == "inner") {
                inner_coords.push(coords);
                w.is_multipolygon_inner = true;
              }
            }
          }
          if (typeof outer_way == "undefined")
            continue; // abort if outer way object is not present
          if (outer_coords[0].length == 0)
            continue; // abort if coordinates of outer way is not present
          way_type = "Polygon";
          var feature = {
            "type"       : "Feature",
            "properties" : {
              "type" : "way",
              "id"   : outer_way.id,
              "tags" : outer_way.tags || {},
              "relations" : outer_way.relations || [],
              "meta": function(o){var res={}; for(k in o) if(o[k] != undefined) res[k]=o[k]; return res;}({"timestamp": outer_way.timestamp, "version": outer_way.version, "changeset": outer_way.changeset, "user": outer_way.user, "uid": outer_way.uid}),
            },
            "geometry"   : {
              "type" : way_type,
              "coordinates" : ([].concat(outer_coords,inner_coords)),
            }
          }
          if (rels[i].tainted)
            feature.properties["tainted"] = true;
          geojsonpolygons.features.push(feature);
        }
      }
    }
    // process lines and polygons
    for (var i=0;i<ways.length;i++) {
      if (!jQuery.isArray(ways[i].nodes))
        continue; // ignore ways without nodes (e.g. returned by an ids_only query)
      if (ways[i].is_multipolygon)
        continue; // ignore ways which are already rendered as multipolygons
      ways[i].tainted = false;
      ways[i].hidden = false;
      coords = new Array();
      for (j=0;j<ways[i].nodes.length;j++) {
        if (typeof ways[i].nodes[j] == "object")
          coords.push([+ways[i].nodes[j].lon, +ways[i].nodes[j].lat]);
        else
          ways[i].tainted = true;
      }
      if (coords.length <= 1) // invalid way geometry
        continue;
      var way_type = "LineString"; // default
      if (typeof ways[i].nodes[0] != "undefined" && 
          ways[i].nodes[0] == ways[i].nodes[ways[i].nodes.length-1] &&
          (ways[i].tags && ways[i].tags["area"] !== "no")) {
        if (typeof ways[i].tags != "undefined")
          if ((typeof ways[i].tags["building"] != "undefined" && ways[i].tags["building"] != "no") ||
              (typeof ways[i].tags["natural"] != "undefined" && jQuery.inArray(ways[i].tags["natural"], "coastline;arete".split(";")) == -1) ||
              (typeof ways[i].tags["landuse"] != "undefined") ||
              (jQuery.inArray(ways[i].tags["waterway"], "riverbank;dock;boatyard;dam".split(";")) != -1) ||
              (typeof ways[i].tags["amenity"] != "undefined") ||
              (typeof ways[i].tags["leisure"] != "undefined") ||
              (jQuery.inArray(ways[i].tags["railway"], "station;turntable;roundhouse;platform".split(";")) != -1) ||
              (typeof ways[i].tags["area"] != "undefined") ||
              (typeof ways[i].tags["man_made"] != "undefined" && jQuery.inArray(ways[i].tags["man_made"], "cutline;embankment;pipeline".split(";")) == -1) ||
              (jQuery.inArray(ways[i].tags["power"], "generator;station;sub_station;transformer".split(";")) != -1) ||
              (typeof ways[i].tags["place"] != "undefined") ||
              (typeof ways[i].tags["shop"] != "undefined") ||
              (typeof ways[i].tags["aeroway"] != "undefined" && jQuery.inArray(ways[i].tags["aeroway"], "taxiway".split(";")) == -1) ||
              (typeof ways[i].tags["tourism"] != "undefined") ||
              (typeof ways[i].tags["historic"] != "undefined") ||
              (typeof ways[i].tags["public_transport"] != "undefined") ||
              (typeof ways[i].tags["office"] != "undefined") ||
              (typeof ways[i].tags["military"] != "undefined") ||
              false) 
             way_type="Polygon";
        if (way_type == "Polygon")
          coords = [coords];
      }
      var feature = {
        "type"       : "Feature",
        "properties" : {
          "type" : "way",
          "id"   : ways[i].id,
          "tags" : ways[i].tags || {},
          "relations" : ways[i].relations || [],
          "meta": function(o){var res={}; for(k in o) if(o[k] != undefined) res[k]=o[k]; return res;}({"timestamp": ways[i].timestamp, "version": ways[i].version, "changeset": ways[i].changeset, "user": ways[i].user, "uid": ways[i].uid}),
        },
        "geometry"   : {
          "type" : way_type,
          "coordinates" : coords,
        }
      }
      if (ways[i].tainted)
        feature.properties["tainted"] = true;
      if (ways[i].is_multipolygon_outline)
        feature.properties["mp_outline"] = true;
      if (way_type == "LineString")
        geojsonlines.features.push(feature);
      else
        geojsonpolygons.features.push(feature);
    }

    geojson.push(geojsonpolygons);
    geojson.push(geojsonlines);
    geojson.push(geojsonnodes);
    return geojson;
  },
});

L.osm4Leaflet = function (data, options) {
  return new L.OSM4Leaflet(data, options);
};
