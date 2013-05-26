// osm data format module
turbo.formats.osm = {

    var format = {};

    format.match = function( data, meta ) {
        return true; // todo
    };

    format.toGeoJson = function( data ) {
        return; // ...
    };

    
    function _overpassJSON2geoJSON( json ) {
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
            _.each( node.getElementsByTagName('nd'), function( nd, i ) {
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
        _.each( xml.getElementsByTagName('way'), function( relation, i ) {
            var tags = {};
            var members = [];
            _.each( way.getElementsByTagName('tag'), function( relation ) {
                tags[tag.getAttribute('k')] = tag.getAttribute('v');
            });
            _.each( node.getElementsByTagName('member'), function( member, i ) {
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
                    (function(o){for(var k in o) if(k!="created_by"&&k!="source") return true; return false;})(nodes[i].tags)) // this checks if the node has any tags other than "created_by"
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
                if (!_.isArray(rels[i].members))
                    continue; // ignore relations without members (e.g. returned by an ids_only query)
                var outer_count = 0;
                _.each(rels[i].members, function(m) {
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
                        // stolen from iD/relation.js
                        var joined = [], current, first, last, i, how, what;
                        while (ways.length) {
                            current = ways.pop().nodes.slice();
                            joined.push(current);
                            while (ways.length && _.first(current) !== _.last(current)) {
                                first = _.first(current);
                                last  = _.last(current);
                                for (i = 0; i < ways.length; i++) {
                                    what = ways[i].nodes;
                                    if (last === _.first(what)) {
                                        how  = current.push;
                                        what = what.slice(1);
                                        break;
                                    } else if (last === _.last(what)) {
                                        how  = current.push;
                                        what = what.slice(0, -1).reverse();
                                        break;
                                    } else if (first == _.last(what)) {
                                        how  = current.unshift;
                                        what = what.slice(0, -1);
                                        break;
                                    } else if (first == _.first(what)) {
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
                        var _pluck_latlon = function(from) {
                            return _.map(from, function(n) {
                                if (n === undefined)
                                    return; 
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
                        inner = _pluck_latlon(inner);
                        /*for (o = 0; o < outers.length; o++) {
                            outer = _pluck(outers[o]);
                            if (polygonContainsPolygon(outer, inner))
                                return o;
                        }*/
                        for (o = 0; o < outers.length; o++) {
                            outer = _pluck_latlon(outers[o]);
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
                            ;//mp.push(inners[j]); // invalid geometry // tyr: why?
                    }
                    // sanitize mp-coordinates (remove empty clusters or rings, {lat,lon,...} to [lon,lat]
                    // TODO: this looks very slow
                    var mp_coords = [];
                    mp_coords = _.compact(_.map(mp, function(cluster) { 
                        var cl = _.compact(_.map(cluster, function(ring) {
                            if (ring === undefined || ring.length <= 1) {
                                is_tainted = true;
                                return;
                            }
                            return _.compact(_.map(ring, function(node) {
                                if (node === undefined || node.lat === undefined) {
                                    is_tainted = true;
                                    return;
                                }
                                return [+node.lon,+node.lat];
                            }));
                        }));
                        if (cl.length == 0) {
                            is_tainted = true;
                            return;
                        }
                        return cl;
                    }));
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
            if (!_.isArray(ways[i].nodes))
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
            var is_area_by_tag = function(tags, key, excluded_values, included_values) {
                var tag = tags[key];
                return (
                        (typeof tag !== "undefined") &&
                        (tag !== "no") &&
                        (!excluded_values || !_.contains(excluded_values, tag)) &&
                        (!included_values ||  _.contains(included_values, tag))
                );
            }
            if (typeof ways[i].nodes[0] != "undefined" && 
                    ways[i].nodes[0] == ways[i].nodes[ways[i].nodes.length-1] &&
                    (ways[i].tags && ways[i].tags["area"] !== "no")) {
                if (typeof ways[i].tags != "undefined")
                    if (is_area_by_tag(ways[i].tags, "building") ||
                            is_area_by_tag(ways[i].tags, "highway", undefined, "services;rest_area;escape".split(";")) ||
                            is_area_by_tag(ways[i].tags, "natural", "coastline;ridge;arete;tree_row".split(";")) ||
                            is_area_by_tag(ways[i].tags, "landuse") ||
                            is_area_by_tag(ways[i].tags, "waterway", undefined, "riverbank;dock;boatyard;dam".split(";")) ||
                            is_area_by_tag(ways[i].tags, "amenity") ||
                            is_area_by_tag(ways[i].tags, "leisure") ||
                            is_area_by_tag(ways[i].tags, "barrier", undefined, "city_wall;ditch;hedge;retaining_wall;wall;spikes".split(";")) ||
                            is_area_by_tag(ways[i].tags, "railway", undefined, "station;turntable;roundhouse;platform".split(";")) ||
                            is_area_by_tag(ways[i].tags, "area") ||
                            is_area_by_tag(ways[i].tags, "boundary") ||
                            is_area_by_tag(ways[i].tags, "man_made", "cutline;embankment;pipeline".split(";")) ||
                            is_area_by_tag(ways[i].tags, "power", undefined, "generator;station;sub_station;transformer".split(";")) ||
                            is_area_by_tag(ways[i].tags, "place") ||
                            is_area_by_tag(ways[i].tags, "shop") ||
                            is_area_by_tag(ways[i].tags, "aeroway", "taxiway".split(";")) ||
                            is_area_by_tag(ways[i].tags, "tourism") ||
                            is_area_by_tag(ways[i].tags, "historic") ||
                            is_area_by_tag(ways[i].tags, "public_transport") ||
                            is_area_by_tag(ways[i].tags, "office") ||
                            is_area_by_tag(ways[i].tags, "building:part") ||
                            is_area_by_tag(ways[i].tags, "military") ||
                            is_area_by_tag(ways[i].tags, "craft") ||
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
    }

    return format;
};