/* Polygon Feature detection heuristic/algorithm.
 * See: http://wiki.openstreetmap.org/wiki/Overpass_turbo/Polygon_Features
 * Usage: call "isPolygonFeature" with in the tags (key-value object)
 *        of any closed way and get a boolean answer.
 */
turbo.formats.osm.isPolygonFeature = function( tags ) {
    var polygonFeatures = this.isPolygonFeature.polygonFeatures;
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
turbo.formats.osm.isPolygonFeature.polygonFeatures = {
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
};
