
// global overpass object

var overpass = new(function() {
  // == private members ==
  // == public members ==
  this.handlers = {};

  // == private methods ==
  var overpassJSON2geoJSON = function(json) {
    // 2. sort elements
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
    return convert2geoJSON(nodes,ways,rels);
  }
  var overpassXML2geoJSON = function(xml) {
    // 2. sort elements
    var nodes = new Array();
    var ways  = new Array();
    var rels  = new Array();
    // nodes
    $("node",xml).each(function(i) {
      var tags = new Object();
      $(this).find("tag").each(function(i) {
        tags[$(this).attr("k")] = $(this).attr("v");
      });
      nodes[i] = {
        "id":   $(this).attr("id"),
        "lat":  $(this).attr("lat"),
        "lon":  $(this).attr("lon"),
        "version": $(this).attr("version"),
        "timestamp": $(this).attr("timestamp"),
        "changeset": $(this).attr("changeset"),
        "uid": $(this).attr("uid"),
        "user": $(this).attr("user"),
        "type": "node",
      };
      if (!$.isEmptyObject(tags))
        nodes[i].tags = tags;
    });
    // ways
    $("way",xml).each(function(i) {
      var tags = new Object();
      var wnodes = new Array();
      $(this).find("tag").each(function(i) {
        tags[$(this).attr("k")] = $(this).attr("v");
      });
      $(this).find("nd").each(function(i) {
        wnodes[i] = $(this).attr("ref");
      });
      ways[i] = {
        "id":   $(this).attr("id"),
        "tags": tags,
        "version": $(this).attr("version"),
        "timestamp": $(this).attr("timestamp"),
        "changeset": $(this).attr("changeset"),
        "uid": $(this).attr("uid"),
        "user": $(this).attr("user"),
        "type": "way",
      };
      if (wnodes.length > 0)
        ways[i].nodes = wnodes;
      if (!$.isEmptyObject(tags))
        ways[i].tags = tags;
    });
    // relations
    $("relation",xml).each(function(i) {
      var tags = new Object();
      var members = new Array();
      $(this).find("tag").each(function(i) {
        tags[$(this).attr("k")] = $(this).attr("v");
      });
      $(this).find("member").each(function(i) {
        members[i] = {
          "ref":  $(this).attr("ref"),
          "role": $(this).attr("role"),
          "type": $(this).attr("type"),
        };
      });
      rels[i] = {
        "id":   $(this).attr("id"),
        "tags": tags,
        "version": $(this).attr("version"),
        "timestamp": $(this).attr("timestamp"),
        "changeset": $(this).attr("changeset"),
        "uid": $(this).attr("uid"),
        "user": $(this).attr("user"),
        "type": "relation",
      };
      if (members.length > 0)
        rels[i].members = members;
      if (!$.isEmptyObject(tags))
        rels[i].tags = tags;
    });
    return convert2geoJSON(nodes,ways,rels);
  }
  var convert2geoJSON = function(nodes,ways,rels) {
    // 3. some data processing (e.g. filter nodes only used for ways)
    var nodeids = new Object();
    for (var i=0;i<nodes.length;i++) {
      if (!$.isNumeric(nodes[i].lat))
        continue; // ignore nodes without coordinates (e.g. returned by an ids_only query)
      nodeids[nodes[i].id] = nodes[i];
    }
    var poinids = new Object();
    for (var i=0;i<nodes.length;i++) {
      if (typeof nodes[i].tags != 'undefined' &&
          (function(o){for(var k in o) if(k!="created_by"&&k!="source") return true; return false;})(nodes[i].tags)) // this checks if the node has any tags other than "created_by"
        poinids[nodes[i].id] = true;
    }
    var wayids = new Object();
    var waynids = new Object();
    for (var i=0;i<ways.length;i++) {
      if (!$.isArray(ways[i].nodes))
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
      if (!$.isArray(rels[i].members))
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      relids.push(rels[i].id);
      for (var j=0;j<rels[i].members.length;j++) {
        switch (rels[i].members[j].type) {
        case "node":
          var n = nodeids[rels[i].members[j].ref];
          if (n) { // typeof n != "undefined"
            if (typeof n.relations == "undefined")
              n.relations = new Array();
            n.relations.push({
              "rel" : rels[i].id,
              "role" : rels[i].members[j].role,
              "reltags" : rels[i].tags,
            });
          }
        break;
        case "way":
          var w = wayids[rels[i].members[j].ref];
          if (w) { // typeof w != "undefined"
            if (typeof w.relations == "undefined")
              w.relations = new Array();
            w.relations.push({
              "rel" : rels[i].id,
              "role" : rels[i].members[j].role,
              "reltags" : rels[i].tags,
            });
          }
        break;
        default:
        }
      }
    }
    // 4. construct geojson
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
          "tags" : pois[i].tags,
          "relations" : pois[i].relations,
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
    // process simple multipolygons
    for (var i=0;i<rels.length;i++) {
      if ((typeof rels[i].tags != "undefined") &&
          (rels[i].tags["type"] == "multipolygon")) {
        if (!$.isArray(rels[i].members))
          continue; // ignore relations without members (e.g. returned by an ids_only query)
        var outer_count = 0;
        for (var j=0;j<rels[i].members.length;j++)
          if (rels[i].members[j].role == "outer")
            outer_count++;
        if (outer_count != 1)
          continue; // abort this complex multipolygon
        rels[i].tainted = false;
        var outer_coords = new Array();
        var inner_coords = new Array();
        var outer_way = undefined;
        for (var j=0;j<rels[i].members.length;j++) {
          if ((rels[i].members[j].type == "way") &&
              $.inArray(rels[i].members[j].role, ["outer","inner"]) != -1) {
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
        way_type = "MultiPolygon";
        var feature = {
          "type"       : "Feature",
          "properties" : {
            "type" : "way",
            "id"   : outer_way.id,
            "tags" : outer_way.tags,
            "relations" : outer_way.relations,
            "meta": function(o){var res={}; for(k in o) if(o[k] != undefined) res[k]=o[k]; return res;}({"timestamp": outer_way.timestamp, "version": outer_way.version, "changeset": outer_way.changeset, "user": outer_way.user, "uid": outer_way.uid}),
          },
          "geometry"   : {
            "type" : way_type,
            "coordinates" : [[].concat(outer_coords,inner_coords)],
          }
        }
        if (rels[i].tainted)
          feature.properties["tainted"] = true;
        geojsonpolygons.features.push(feature);
      }
    }
    // process lines and polygons
    for (var i=0;i<ways.length;i++) {
      if (!$.isArray(ways[i].nodes))
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
      if (typeof ways[i].nodes[0] != "undefined" && ways[i].nodes[0] == ways[i].nodes[ways[i].nodes.length-1]) {
        if (typeof ways[i].tags != "undefined")
          if ((typeof ways[i].tags["landuse"] != "undefined") ||
              (typeof ways[i].tags["building"] != "undefined") ||
              (typeof ways[i].tags["leisure"] != "undefined") ||
              (typeof ways[i].tags["amenity"] != "undefined") ||
              (ways[i].tags["area"] == "yes") ||
              ($.inArray(ways[i].tags["natural"], new Array("forest","wood","water")) != -1) ||
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
          "tags" : ways[i].tags,
          "relations" : ways[i].relations,
          "meta": function(o){var res={}; for(k in o) if(o[k] != undefined) res[k]=o[k]; return res;}({"timestamp": ways[i].timestamp, "version": ways[i].version, "changeset": ways[i].changeset, "user": ways[i].user, "uid": ways[i].uid}),
        },
        "geometry"   : {
          "type" : way_type,
          "coordinates" : coords,
        }
      }
      if (ways[i].tainted)
        feature.properties["tainted"] = true;
      if (ways[i].is_multipolygon_inner)
        feature.properties["mp_inner"] = true;
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
  var fire = function() {
    var args = fire.arguments;
    var name = args[0];
    if (typeof overpass.handlers[name] != "function")
      return undefined;
    var handler_args = [];
    for (var i=1; i<args.length; i++) 
      handler_args.push(args[i]);
    overpass.handlers[name].apply({},handler_args);
  }

  // == public methods ==

  // updates the map
  this.run_query = function (query, query_lang) {
    // 1. get overpass json data
    fire("onProgress", "building query");
    if (query_lang == "xml") {
      // beautify not well formed xml queries (workaround for non matching error lines)
      if (!query.match(/^<\?xml/)) {
        if (!query.match(/<osm-script/))
          query = '<osm-script>'+query+'</osm-script>';
        query = '<?xml version="1.0" encoding="UTF-8"?>'+query;
      }
    }
    fire("onProgress", "calling Overpass API interpreter", function() {
      // kill the query on abort
      overpass.ajax_request.abort();
      // try to abort queries via kill_my_queries
      $.get(settings.server+"kill_my_queries");
    });
    var request_headers = {};
    var additional_get_data = "";
    if (settings.force_simple_cors_request) {
      additional_get_data = "?X-Requested-With="+settings.appname; // todo: move appname to settings object?
    } else {
      request_headers["X-Requested-With"] = settings.appname;
    }
    overpass.ajax_request = $.ajax(settings.server+"interpreter"+additional_get_data, {
      type: 'POST',
      data: {data:query},
      headers: request_headers,
      success: function(data, textStatus, jqXHR) {
        fire("onProgress", "data recieved from Overpass API");
        // different cases of loaded data: json data, xml data or error message?
        var data_mode = null;
        var geojson;
        overpass.resultData = null;
        fire("onProgress", "parsing data");
        // hacky firefox hack :( (it is not properly detecting json from the content-type header)
        if (typeof data == "string" && data[0] == "{") { // if the data is a string, but looks more like a json object
          try {
            data = $.parseJSON(data);
          } catch (e) {}
        }
        if ((typeof data == "string") ||
            (typeof data == "object" && jqXHR.responseXML && $("remark",data).length > 0) ||
            (typeof data == "object" && data.remark && data.remark.length > 0)
           ) { // maybe an error message
          data_mode = "unknown";
          var is_error = false;
          is_error = is_error || (typeof data == "string" && // html coded error messages
            data.indexOf("Error") != -1 && 
            data.indexOf("<script") == -1 && // detect output="custom" content
            data.indexOf("<h2>Public Transport Stops</h2>") == -1); // detect output="popup" content
          is_error = is_error || (typeof data == "object" &&
            jqXHR.responseXML &&
            $("remark",data).length > 0);
          is_error = is_error || (typeof data == "object" &&
            data.remark &&
            data.remark.length > 0);
          if (is_error) {
            // this really looks like an error message, so lets open an additional modal error message
            var errmsg = "?";
            if (typeof data == "string")
              errmsg = data.replace(/((.|\n)*<body>|<\/body>(.|\n)*)/g,"");
            if (typeof data == "object" && jqXHR.responseXML)
              errmsg = "<p>"+$.trim($("remark",data).text())+"</p>";
            if (typeof data == "object" && data.remark)
              errmsg = "<p>"+$.trim(data.remark)+"</p>";
            fire("onQueryError", errmsg)
            data_mode = "error";
            // parse errors and highlight error lines
            var errlines = errmsg.match(/line \d+:/g) || [];
            for (var i=0; i<errlines.length; i++) {
              fire("onQueryErrorLine", 1*errlines[i].match(/\d+/)[0]);
            }
          }
          // the html error message returned by overpass API looks goods also in xml mode ^^
          overpass.resultType = "error";
          geojson = [{features:[]}, {features:[]}, {features:[]}];
        } else if (typeof data == "object" && jqXHR.responseXML) { // xml data
          overpass.resultType = "xml";
          data_mode = "xml";
          // convert to geoJSON
          geojson = overpassXML2geoJSON(data);
        } else { // maybe json data
          overpass.resultType = "javascript";
          data_mode = "json";
          // convert to geoJSON
          geojson = overpassJSON2geoJSON(data);
        }
        overpass.resultData = geojson;
        // print raw data
        fire("onProgress", "printing raw data");
        overpass.resultText = jqXHR.responseText;
        fire("onRawDataPresent");
        // 5. add geojson to map - profit :)
        // auto-tab-switching: if there is only non map-visible data, show it directly
        if (geojson[0].features.length == 0 && geojson[1].features.length == 0 && geojson[2].features.length == 0) { // no visible data
          // switch only if there is some unplottable data in the returned json/xml.
          if ((data_mode == "json" && data.elements.length > 0) ||
              (data_mode == "xml" && $("osm",data).children().not("note,meta").length > 0)) {
            // check for "only areas returned"
            if ((data_mode == "json" && (function(e) {for(var i=0;i<e.length;e++) if (e[i].type!="area") return false; return true;})(data.elements)) ||
                (data_mode == "xml" && $("osm",data).children().not("note,meta,area").length == 0))
              empty_msg = "only areas returned";
            // check for "ids_only"
            else if ((data_mode == "json" && (function(e) {for(var i=0;i<e.length;e++) if (e[i].type=="node") return true; return false;})(data.elements)) ||
                     (data_mode == "xml" && $("osm",data).children().filter("node").length != 0))
              empty_msg = "no coordinates returned";
            else
              empty_msg = "no visible data";
          } else if(data_mode == "error") {
            empty_msg = "an error occured";
          } else if(data_mode == "unknown") {
            empty_msg = "unstructured data returned";
          } else {
            empty_msg = "recieved empty dataset";
          }
          // show why there is an empty map
          fire("onEmptyMap", empty_msg, data_mode);
        }
        fire("onProgress", "rendering geoJSON");
        overpass.geojsonLayer = new L.GeoJSON(null, {
          style: function(feature) {
            var stl = {};
            var color = "#03f";
            var fillColor = "#fc0";
            var relColor = "#d0f";
            // point features
            if (feature.geometry.type == "Point") {
              stl.color = color;
              stl.weight = 2;
              stl.opacity = 0.7;
              stl.fillColor = fillColor;
              stl.fillOpacity = 0.3;
            }
            // line features
            else if (feature.geometry.type == "LineString") {
              stl.color = color;
              stl.opacity = 0.6;
              stl.weight = 5;
            }
            // polygon features
            else if ($.inArray(feature.geometry.type, ["Polygon","MultiPolygon"]) != -1) {
              stl.color = color;
              stl.opacity = 0.7;
              stl.weight = 2;
              stl.fillColor = fillColor;
              stl.fillOpacity = 0.3;
            }

            // style modifications
            // tainted objects
            if (feature.properties && feature.properties.tainted==true) {
              stl.dashArray = "5,8";
            }
            // multipolygon inner lines without tags
            if (feature.properties && feature.properties.mp_inner==true)
              if (typeof feature.properties.tags == "undefined" ||
                  $.isEmptyObject(feature.properties.tags)) {
                stl.opacity = 0.7;
                stl.weight = 2;
            }
            // objects in relations
            if (feature.properties && feature.properties.relations && feature.properties.relations.length>0) {
              stl.color = relColor;
            }

            return stl;
          },
          pointToLayer: function (feature, latlng) {
            return new L.CircleMarker(latlng, {
              radius: 9,
            });
          },
          onEachFeature : function (feature, layer) {
            layer.on('click', function(e) {
              var popup = "";
              if (feature.properties.type == "node")
                popup += "<h2>Node <a href='http://www.openstreetmap.org/browse/node/"+feature.properties.id+"'>"+feature.properties.id+"</a></h2>";
              else
                popup += "<h2>Way <a href='http://www.openstreetmap.org/browse/way/"+feature.properties.id+"'>"+feature.properties.id+"</a></h2>";
              if (feature.properties && feature.properties.tags && !$.isEmptyObject(feature.properties.tags)) {
                popup += '<h3>Tags:</h3><ul class="plain">';
                $.each(feature.properties.tags, function(k,v) {
                  k = htmlentities(k); // escaping strings!
                  v = htmlentities(v);
                  popup += "<li>"+k+"="+v+"</li>"
                });
                popup += "</ul>";
              }
              if (feature.properties && feature.properties.relations && !$.isEmptyObject(feature.properties.relations)) {
                popup += '<h3>Relations:</h3><ul class="plain">';
                $.each(feature.properties.relations, function (k,v) {
                  popup += "<li><a href='http://www.openstreetmap.org/browse/relation/"+v["rel"]+"'>"+v["rel"]+"</a>";
                  if (v.reltags && 
                      (v.reltags.name || v.reltags.ref || v.reltags.type))
                    popup += " <i>" + 
                      $.trim((v.reltags.type ? htmlentities(v.reltags.type)+" " : "") +
                             (v.reltags.ref ?  htmlentities(v.reltags.ref)+" " : "") +
                             (v.reltags.name ? htmlentities(v.reltags.name)+" " : "")) +
                      "</i>";
                  if (v["role"]) 
                    popup += " as <i>"+htmlentities(v["role"])+"</i>";
                  popup += "</li>";
                });
                popup += "</ul>";
              }
              if (feature.properties && feature.properties.meta && !$.isEmptyObject(feature.properties.meta)) {
                popup += '<h3>Meta:</h3><ul class="plain">';
                $.each(feature.properties.meta, function (k,v) {
                  k = htmlentities(k);
                  v = htmlentities(v);
                  popup += "<li>"+k+"="+v+"</li>";
                });
                popup += "</ul>";
              }
              if (feature.geometry.type == "Point")
                popup += "<h3>Coordinates:</h3><p>"+feature.geometry.coordinates[1]+" / "+feature.geometry.coordinates[0]+" <small>(lat/lon)</small></p>";
              if ($.inArray(feature.geometry.type, ["LineString","Polygon","MultiPolygon"]) != -1) {
                if (feature.properties && feature.properties.tainted==true) {
                  popup += "<p><strong>Attention: incomplete geometry (e.g. some nodes missing)</strong></p>";
                }
              }
              var p = L.popup({},this).setLatLng(e.latlng).setContent(popup);
              p.layer = layer;
              fire("onPopupReady", p);
            });
          },
        });
        for (i=0;i<geojson.length;i++) {
          overpass.geojsonLayer.addData(geojson[i]);
        }
        fire("onGeoJsonReady");
        // closing wait spinner
        fire("onDone");
      },
      error: function(jqXHR, textStatus, errorThrown) {
        if (textStatus == "abort")
          return; // ignore aborted queries.
        fire("onProgress", "error during ajax call");
        if (jqXHR.status == 400) {
          // pass 400 Bad Request errors to the standard result parser, as this is most likely going to be a syntax error in the query.
          this.success(jqXHR.responseText, textStatus, jqXHR);
          return;
        }
        overpass.resultText = jqXHR.resultText;
        var errmsg = "";
        if (jqXHR.state() == "rejected")
          errmsg += "<p>Request rejected. (e.g. server not found, redirection, internal server errors, etc.)</p>";
        if (textStatus == "parsererror")
          errmsg += "<p>Error while parsing the data (parsererror).</p>";
        else if (textStatus != "error" && textStatus != jqXHR.statusText)
          errmsg += "<p>Error-Code: "+textStatus+"</p>";
        if ((jqXHR.status != 0 && jqXHR.status != 200) || jqXHR.statusText != "OK") // note to me: jqXHR.status "should" give http status codes
          errmsg += "<p>Error-Code: "+jqXHR.statusText+" ("+jqXHR.status+")</p>";
        fire("onAjaxError", errmsg);
        // closing wait spinner
        fire("onDone");
      },
    }); // getJSON

  }

  // == initializations ==
})(); // end create overpass object













