// escape strings to show them directly in the html.
function htmlentities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
$(document).ready(function() {
    // some initalizations
    $.fn.dialog = function() {
        alert("error :( "+$(this).html());
    };
    turbo.settings = function() {
        return {
            code:{},
            server: "http://overpass-api.de/api/",
            tileServer: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            force_simple_cors_request: true,
            disable_poiomatic: true,
        };
    };
    var settings = turbo.settings();
    // (very raw) compatibility check
    if (jQuery.support.cors != true ||
            false) {
        // the currently used browser is not capable of running the IDE. :(
        $('Your browser is not supported :(\n\n'+
                'The browser you are currently using, is not capable of running this Application. It must support cross origin resource sharing (CORS).\n'+
                'Please update to a more up-to-date version of your browser or switch to a more capable browser! Recent versions of Opera, Chrome and Firefox have been tested to work.\n'+
            '').dialog({modal:true});
    }
    // check for any get-parameters
    var get = location.search.substring(1).split("&");
    for (var i=0; i<get.length; i++) {
        var kv = get[i].split("=");
        if (kv[0] == "Q") // uncompressed query set in url
            settings.code["overpass"] = decodeURIComponent(kv[1].replace(/\+/g,"%20"));
    }
    // init leaflet
    var map = new L.Map("map");
    var tilesUrl = settings.tileServer;
    var tilesAttrib = '&copy; <a href="www.openstreetmap.org/copyright">OpenStreetMap</a> contributors&ensp;<small>Data:ODbL, Map:cc-by-sa</small>';
    var tiles = new L.TileLayer(tilesUrl,{attribution:tilesAttrib});
    map.setView([0,0],1).addLayer(tiles);
    scaleControl = new L.Control.Scale({metric:true,imperial:false,});
    scaleControl.addTo(map);
    // wait spinner
    $(document).on({
        ajaxStart: function() {
            $("body").addClass("loading");
        },
        ajaxStop: function() {
            $("body").removeClass("loading");
        },
    });
    map.on("layeradd", function(e) {
        if (!(e.layer instanceof L.GeoJSON)) return;
        map.setView([0,0],18,true);
        map.fitBounds(e.layer.getBounds() );
    });

    var queryParser = turbo.query();
    var query = queryParser.parse( settings.code['overpass'] );
    var main = turbo();
    main.run( query, queryParser.getStatement('data'), queryParser.getStatement('style'), function(geoJson) {
        console.log(geoJson);
        var datalayer = L.geoJson(null, {
            style: function(feature, highlight) {
                var stl = {};
                var s = feature.getStyle();
                // apply mapcss styles
                function get_property(styles, properties) {
                  for (var i=properties.length-1; i>=0; i--)
                    if (styles[properties[i]] !== undefined) return styles[properties[i]];
                  return undefined;
                }
                switch (feature.geometry.type) {
                  case "Point":
                    var styles = _.extend({},s.shapeStyles["default"],s.pointStyles["default"]);
                    var p = get_property(styles, ["color","symbol_stroke_color"]);
                    if (p !== undefined) stl.color       = p;
                    var p = get_property(styles, ["opacity","symbol_stroke_opacity"]);
                    if (p !== undefined) stl.opacity     = p;
                    var p = get_property(styles, ["width","symbol_stroke_width"]);
                    if (p !== undefined) stl.weight      = p;
                    var p = get_property(styles, ["fill_color", "symbol_fill_color"]);
                    if (p !== undefined) stl.fillColor   = p;
                    var p = get_property(styles, ["fill_opacity", "symbol_fill_opacity"]);
                    if (p !== undefined) stl.fillOpacity = p;
                    var p = get_property(styles, ["dashes"]);
                    if (p !== undefined) stl.dashArray   = p.join(",");
                    break;
                  case "LineString":
                    var styles = s.shapeStyles["default"];
                    var p = get_property(styles, ["color"]);
                    if (p !== undefined) stl.color       = p;
                    var p = get_property(styles, ["opacity"]);
                    if (p !== undefined) stl.opacity     = p;
                    var p = get_property(styles, ["width"]);
                    if (p !== undefined) stl.weight      = p;
                    var p = get_property(styles, ["dashes"]);
                    if (p !== undefined) stl.dashArray   = p.join(",");
                  break;
                  case "Polygon":
                  case "MultiPolygon":
                    var styles = s.shapeStyles["default"];
                    var p = get_property(styles, ["color","casing_color"]);
                    if (p !== undefined) stl.color       = p;
                    var p = get_property(styles, ["opacity","casing_opacity"]);
                    if (p !== undefined) stl.opacity     = p;
                    var p = get_property(styles, ["width","casing_width"]);
                    if (p !== undefined) stl.weight      = p;
                    var p = get_property(styles, ["fill_color"]);
                    if (p !== undefined) stl.fillColor   = p;
                    var p = get_property(styles, ["fill_opacity"]);
                    if (p !== undefined) stl.fillOpacity = p;
                    var p = get_property(styles, ["dashes"]);
                    if (p !== undefined) stl.dashArray   = p.join(",");
                  break;
                }
                // todo: more style properties? linecap, linejoin?
                // return style object
                return stl;
            },
            pointToLayer: function (feature, latlng) {
                // todo: labels!
                var s = feature.getStyle();
                var stl = s.pointStyles && s.pointStyles["default"] ? s.pointStyles["default"] : {};
                if (stl["icon_image"]) {
                  // return image marker
                  var iconUrl = stl["icon_image"].match(/^url\(['"](.*)['"]\)$/)[1];
                  var iconSize;
                  if (stl["icon_width"]) iconSize=[stl["icon_width"],stl["icon_width"]];
                  if (stl["icon_height"] && iconSize) iconSize[1] = stl["icon_height"];
                  var icon = new L.Icon({
                    iconUrl: iconUrl,
                    iconSize: iconSize,
                    // todo: anchor, shadow?, ...
                  });
                  return new L.Marker(latlng, {icon: icon});
                } else if (stl["symbol_shape"]=="circle" || true /*if nothing else is specified*/) {
                  // return circle marker
                  var r = stl["symbol_size"] || 9; 
                  return new L.CircleMarker(latlng, {
                    radius: r,
                  });
                }
            }
        });
        datalayer.addData(geoJson);
        datalayer.addTo(map);
    } );
    /*// overpass functionality
    overpass.handlers["onEmptyMap"] = function(empty_msg, data_mode) {$('<div id="map_blank" style="z-index:1; display:block; position:absolute; top:42px; width:100%; text-align:center; background-color:#eee; opacity: 0.8;">This map intentionally left blank. <small>('+empty_msg+')</small></div>').appendTo("#map");};
    overpass.handlers["onAjaxError"] = function(errmsg) {alert("An error occured during the execution of the overpass query!\n" + errmsg);};
    overpass.handlers["onQueryError"] = function(errmsg) {alert("An error occured during the execution of the overpass query!\nThis is what overpass API returned:\n" + errmsg);};
    overpass.handlers["onGeoJsonReady"] = function() {map.addLayer(overpass.osmLayer);};
    overpass.handlers["onPopupReady"] = function(p) {p.openOn(map);};
    overpass.handlers["onDataRecieved"] = function(amount,txt, abortCB,continueCB) {continueCB();};*/
    // load the data
    //ide.update_map();
});
