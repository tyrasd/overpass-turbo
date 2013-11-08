if (typeof require !== "undefined") {
  _ = require("lodash");
}

var osmtogeojson = {};

osmtogeojson.toGeojson = function( data, options ) {

  options = _.merge(
    {
      flatProperties: false,
      uninterestingTags: {
        "source": true,
        "source_ref": true,
        "source:ref": true,
        "history": true,
        "attribution": true,
        "created_by": true,
        "tiger:county": true,
        "tiger:tlid": true,
        "tiger:upload_uuid": true
      },
      polygonFeatures: {
        "building": true,
        "highway": {
          "included_values": {
            "services": true,
            "rest_area": true,
            "escape": true
          }
        },
        "natural": {
          "excluded_values": {
            "coastline": true,
            "ridge": true,
            "arete": true,
            "tree_row": true
          }
        },
        "landuse": true,
        "waterway": {
          "included_values": {
            "riverbank": true,
            "dock": true,
            "boatyard": true,
            "dam": true
          }
        },
        "amenity": true,
        "leisure": true,
        "barrier": {
          "included_values": {
            "city_wall": true,
            "ditch": true,
            "hedge": true,
            "retaining_wall": true,
            "wall": true,
            "spikes": true
          }
        },
        "railway": {
          "included_values": {
            "station": true,
            "turntable": true,
            "roundhouse": true,
            "platform": true
          }
        },
        "area": true,
        "boundary": true,
        "man_made": {
          "excluded_values": {
            "cutline": true,
            "embankment": true,
            "pipeline": true
          }
        },
        "power": {
          "included_values": {
            "generator": true,
            "station": true,
            "sub_station": true,
            "transformer": true
          }
        },
        "place": true,
        "shop": true,
        "aeroway": {
          "excluded_values": {
            "taxiway": true
          }
        },
        "tourism": true,
        "historic": true,
        "public_transport": true,
        "office": true,
        "building:part": true,
        "military": true,
        "ruins": true,
        "area:highway": true,
        "craft": true
      }
    },
    options
  );

  var result;
  if ( ((typeof XMLDocument !== "undefined") && data instanceof XMLDocument ||
        (typeof XMLDocument === "undefined") && data.childNodes) )
    result = _osmXML2geoJSON(data);
  else
    result = _overpassJSON2geoJSON(data);
  return result;

  function _overpassJSON2geoJSON(json) {
    // create copy of json to make sure the original object doesn't get altered
    json = JSON.parse(JSON.stringify(json));
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
    return _convert2geoJSON(nodes,ways,rels);
  }
  function _osmXML2geoJSON(xml) {
    // helper function
    function copy_attribute( x, o, attr ) {
      if (x.hasAttribute(attr))
        o[attr] = x.getAttribute(attr);
    }
    // sort elements
    var nodes = new Array();
    var ways  = new Array();
    var rels  = new Array();
    // nodes
    _.each( xml.getElementsByTagName('node'), function( node, i ) {
      var tags = {};
      _.each( node.getElementsByTagName('tag'), function( tag ) {
        tags[tag.getAttribute('k')] = tag.getAttribute('v');
      });
      nodes[i] = {
        'type': 'node'
      };
      copy_attribute( node, nodes[i], 'id' );
      copy_attribute( node, nodes[i], 'lat' );
      copy_attribute( node, nodes[i], 'lon' );
      copy_attribute( node, nodes[i], 'version' );
      copy_attribute( node, nodes[i], 'timestamp' );
      copy_attribute( node, nodes[i], 'changeset' );
      copy_attribute( node, nodes[i], 'uid' );
      copy_attribute( node, nodes[i], 'user' );
      if (!_.isEmpty(tags))
        nodes[i].tags = tags;
    });
    // ways
    _.each( xml.getElementsByTagName('way'), function( way, i ) {
      var tags = {};
      var wnodes = [];
      _.each( way.getElementsByTagName('tag'), function( tag ) {
        tags[tag.getAttribute('k')] = tag.getAttribute('v');
      });
      _.each( way.getElementsByTagName('nd'), function( nd, i ) {
        wnodes[i] = nd.getAttribute('ref');
      });
      ways[i] = {
        "type": "way"
      };
      copy_attribute( way, ways[i], 'id' );
      copy_attribute( way, ways[i], 'version' );
      copy_attribute( way, ways[i], 'timestamp' );
      copy_attribute( way, ways[i], 'changeset' );
      copy_attribute( way, ways[i], 'uid' );
      copy_attribute( way, ways[i], 'user' );
      if (wnodes.length > 0)
        ways[i].nodes = wnodes;
      if (!_.isEmpty(tags))
        ways[i].tags = tags;
    });
    // relations
    _.each( xml.getElementsByTagName('relation'), function( relation, i ) {
      var tags = {};
      var members = [];
      _.each( relation.getElementsByTagName('tag'), function( tag ) {
        tags[tag.getAttribute('k')] = tag.getAttribute('v');
      });
      _.each( relation.getElementsByTagName('member'), function( member, i ) {
        members[i] = {};
        copy_attribute( member, members[i], 'ref' );
        copy_attribute( member, members[i], 'role' );
        copy_attribute( member, members[i], 'type' );
      });
      rels[i] = {
        "type": "relation"
      }
      copy_attribute( relation, rels[i], 'id' );
      copy_attribute( relation, rels[i], 'version' );
      copy_attribute( relation, rels[i], 'timestamp' );
      copy_attribute( relation, rels[i], 'changeset' );
      copy_attribute( relation, rels[i], 'uid' );
      copy_attribute( relation, rels[i], 'user' );
      if (members.length > 0)
        rels[i].members = members;
      if (!_.isEmpty(tags))
        rels[i].tags = tags;
    });
    return _convert2geoJSON(nodes,ways,rels);
  }
  function _convert2geoJSON(nodes,ways,rels) {
    // helper function that checks if there are any tags other than "created_by", "source", etc. or any tag provided in ignore_tags
    function has_interesting_tags(t, ignore_tags) {
      if (typeof ignore_tags !== "object")
        ignore_tags={};
      if (typeof options.uninterestingTags === "function")
        return !options.uninterestingTags(t, ignore_tags);
      for (var k in t)
        if (!(options.uninterestingTags[k]===true) &&
            !(ignore_tags[k]===true || ignore_tags[k]===t[k]))
          return true;
      return false;
    };
    // some data processing (e.g. filter nodes only used for ways)
    var nodeids = new Object();
    for (var i=0;i<nodes.length;i++) {
      if (nodes[i].lat === undefined)
        continue; // ignore nodes without coordinates (e.g. returned by an ids_only query)
      nodeids[nodes[i].id] = nodes[i];
    }
    var poinids = new Object();
    for (var i=0;i<nodes.length;i++) {
      if (typeof nodes[i].tags != 'undefined' &&
          has_interesting_tags(nodes[i].tags)) // this checks if the node has any tags other than "created_by"
        poinids[nodes[i].id] = true;
    }
    for (var i=0;i<rels.length;i++) {
      if (!_.isArray(rels[i].members))
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      for (var j=0;j<rels[i].members.length;j++) {
        if (rels[i].members[j].type == "node")
          poinids[rels[i].members[j].ref] = true;
      }
    }
    var wayids = new Object();
    var waynids = new Object();
    for (var i=0;i<ways.length;i++) {
      if (!_.isArray(ways[i].nodes))
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
      if (!_.isArray(rels[i].members))
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      relids[rels[i].id] = rels[i];
    }
    for (var i=0;i<rels.length;i++) {
      if (!_.isArray(rels[i].members))
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
    var geojson;
    var geojsonnodes = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    for (i=0;i<pois.length;i++) {
      if (typeof pois[i].lon == "undefined" || typeof pois[i].lat == "undefined")
        continue; // lon and lat are required for showing a point
      geojsonnodes.features.push({
        "type"       : "Feature",
        "id"         : "node/"+pois[i].id,
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
        if (!_.isArray(rels[i].members))
          continue; // ignore relations without members (e.g. returned by an ids_only query)
        var outer_count = 0;
        for (var j=0;j<rels[i].members.length;j++)
          if (rels[i].members[j].role == "outer")
            outer_count++;
        _.each(rels[i].members, function(m) {
          if (wayids[m.ref]) {
            // this even works in the following corner case:
            // a multipolygon amenity=xxx with outer line tagged amenity=yyy
            // see https://github.com/tyrasd/osmtogeojson/issues/7
            if (m.role==="outer" && !has_interesting_tags(wayids[m.ref].tags,rels[i].tags))
              wayids[m.ref].is_multipolygon_outline = true;
            if (m.role==="inner" && !has_interesting_tags(wayids[m.ref].tags))
              wayids[m.ref].is_multipolygon_outline = true;
          }
        });
        if (outer_count == 0)
          continue; // ignore multipolygons without outer ways
        var simple_mp = false;
        if (outer_count == 1 && !has_interesting_tags(rels[i].tags, {"type":true}))
          simple_mp = true;
        if (!simple_mp) {
          var is_tainted = false;
          // prepare mp members
          var members;
          members = _.filter(rels[i].members, function(m) {return m.type === "way";});
          members = _.map(members, function(m) {
            var way = wayids[m.ref];
            if (way === undefined) { // check for missing ways
              is_tainted = true;
              return;
            }
            return { // TODO: this is slow! :(
              id: m.ref,
              role: m.role || "outer",
              way: way,
              nodes: _.filter(way.nodes, function(n) {
                if (n !== undefined)
                  return true;
                is_tainted = true;
                return false;
              })
            };
          });
          members = _.compact(members);
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
                  break; // Invalid geometry (dangling way, unclosed ring)
                ways.splice(i, 1);
                how.apply(current, what);
              }
            }
            return joined;
          }
          outers = join(_.filter(members, function(m) {return m.role==="outer";}));
          inners = join(_.filter(members, function(m) {return m.role==="inner";}));
          // sort rings
          var mp;
          function findOuter(inner) {
            var polygonIntersectsPolygon = function(outer, inner) {
              for (var i=0; i<inner.length; i++)
                if (pointInPolygon(inner[i], outer))
                  return true;
              return false;
            }
            var mapCoordinates = function(from) {
              return _.map(from, function(n) {
                return [+n.lat,+n.lon];
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
            // todo: all this coordinate mapping makes this unneccesarily slow.
            // see the "todo: this is slow! :(" above.
            inner = mapCoordinates(inner);
            /*for (o = 0; o < outers.length; o++) {
              outer = mapCoordinates(outers[o]);
              if (polygonContainsPolygon(outer, inner))
                return o;
            }*/
            for (o = 0; o < outers.length; o++) {
              outer = mapCoordinates(outers[o]);
              if (polygonIntersectsPolygon(outer, inner))
                return o;
            }
          }
          mp = _.map(outers, function(o) {return [o];});
          for (var j=0; j<inners.length; j++) {
            var o = findOuter(inners[j]);
            if (o !== undefined)
              mp[o].push(inners[j]);
            else
              // so, no outer ring for this inner ring is found.
              // We're going to ignore holes in empty space.
              ;
          }
          // sanitize mp-coordinates (remove empty clusters or rings, {lat,lon,...} to [lon,lat]
          var mp_coords = [];
          mp_coords = _.compact(_.map(mp, function(cluster) { 
            var cl = _.compact(_.map(cluster, function(ring) {
              if (ring.length < 4) // todo: is this correct: ring.length < 4 ?
                return;
              return _.compact(_.map(ring, function(node) {
                return [+node.lon,+node.lat];
              }));
            }));
            if (cl.length == 0)
              return;
            return cl;
          }));

          if (mp_coords.length == 0)
            continue; // ignore multipolygons without coordinates
          // mp parsed, now construct the geoJSON
          var feature = {
            "type"       : "Feature",
            "id"         : "relation/"+rels[i].id,
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
        } else {
          // simple multipolygon
          rels[i].tainted = false;
          var outer_coords = new Array();
          var inner_coords = new Array();
          var outer_way = undefined;
          for (var j=0;j<rels[i].members.length;j++) {
            if ((rels[i].members[j].type == "way") &&
                _.contains(["outer","inner"], rels[i].members[j].role)) {
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
                outer_way = w;
                outer_way.is_multipolygon_outline = true;
              } else if (rels[i].members[j].role == "inner") {
                inner_coords.push(coords);
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
            "id"         : "way/"+outer_way.id,
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
      if (!_.isArray(ways[i].nodes))
        continue; // ignore ways without nodes (e.g. returned by an ids_only query)
      if (ways[i].is_multipolygon_outline)
        continue; // ignore ways which are already rendered as (part of) a multipolygon
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
      if (typeof ways[i].nodes[0] != "undefined" && // way has its nodes loaded
        ways[i].nodes[0] === ways[i].nodes[ways[i].nodes.length-1] && // ... and forms a closed ring
        typeof ways[i].tags != "undefined" && // ... and has tags
        _isPolygonFeature(ways[i].tags) // ... and tags say it is a polygon
      ) {
        way_type = "Polygon";
        coords = [coords];
      }
      var feature = {
        "type"       : "Feature",
        "id"         : "way/"+ways[i].id,
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
      if (way_type == "LineString")
        geojsonlines.features.push(feature);
      else
        geojsonpolygons.features.push(feature);
    }

    geojson = {
      "type": "FeatureCollection",
      "features": []
    };
    geojson.features = geojson.features.concat(geojsonpolygons.features);
    geojson.features = geojson.features.concat(geojsonlines.features);
    geojson.features = geojson.features.concat(geojsonnodes.features);
    // optionally, flatten properties
    if (options.flatProperties) {
      _.each(geojson.features, function(f) {
        f.properties = _.merge(
          f.properties.meta,
          f.properties.tags,
          {id: f.properties.type+"/"+f.properties.id}
        );
      });
    }
    return geojson;
  }
  function _isPolygonFeature( tags ) {
    var polygonFeatures = options.polygonFeatures;
    if (typeof polygonFeatures === "function")
      return polygonFeatures(tags);
    // explicitely tagged non-areas
    if ( tags['area'] === 'no' )
      return false;
    // assuming that a typical OSM way has in average less tags than
    // the polygonFeatures list, this way around should be faster
    for ( var key in tags ) {
      var val = tags[key];
      var pfk = polygonFeatures[key];
      // continue with next if tag is unknown or not "categorizing"
      if ( typeof pfk === 'undefined' )
        continue;
      // continue with next if tag is explicitely un-set ("building=no")
      if ( val === 'no' )
        continue;
      // check polygon features for: general acceptance, included or excluded values
      if ( pfk === true )
        return true;
      if ( pfk.included_values && pfk.included_values[val] === true )
        return true;
      if ( pfk.excluded_values && pfk.excluded_values[val] !== true )
        return true;
    }
    // if no tags matched, this ain't no area. 
    return false;
  }
};

if (typeof module !== 'undefined') module.exports = osmtogeojson;
