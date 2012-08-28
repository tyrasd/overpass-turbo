
// global overpass object

var overpass = new(function() {
  // == private members ==

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
    var nids = new Object();
    var nodeids = new Array();
    for (var i=0;i<nodes.length;i++) {
      nids[nodes[i].id] = nodes[i];
      nodeids.push(nodes[i].id);
    }
    var poinids = new Array();
    for (var i=0;i<nodes.length;i++) {
      if (typeof nodes[i].tags != 'undefined')
        poinids.push(nodes[i].id);
    }
    var waynids = new Array();
    var wayids = new Array();
    for (var i=0;i<ways.length;i++) {
      if (!(ways[i].nodes instanceof Array))
        continue; // ignore ways without nodes (e.g. returned by an ids_only query)
      wayids.push(ways[i].id);
      for (var j=0;j<ways[i].nodes.length;j++) {
        waynids.push(ways[i].nodes[j]);
        ways[i].nodes[j] = nids[ways[i].nodes[j]];
      }
    }
    var pois = new Array();
    for (var i=0;i<nodes.length;i++) {
      if ((waynids.indexOf(nodes[i].id) == -1) || // not related to any way
          (poinids.indexOf(nodes[i].id) != -1))   // or has tags
        pois.push(nodes[i]);
    }
    var relids = new Array();
    for (var i=0;i<rels.length;i++) {
      relids.push(rels[i].id);
      for (var j=0;j<rels[i].members.length;j++) {
        switch (rels[i].members[j].type) {
        case "node":
          n = nodeids.indexOf(rels[i].members[j].ref);
          if (n != -1) {
            if (typeof nodes[n].relations == "undefined")
              nodes[n].relations = new Array();
            nodes[n].relations.push({
              "rel" : rels[i].id,
              "role" : rels[i].members[j].role,
              "relname" : rels[i].tags && rels[i].tags.name ? rels[i].tags.name : undefined,
            });
          }
        break;
        case "way":
          w = wayids.indexOf(rels[i].members[j].ref);
          if (w != -1) {
            if (typeof ways[w].relations == "undefined")
              ways[w].relations = new Array();
            ways[w].relations.push({
              "rel" : rels[i].id,
              "role" : rels[i].members[j].role,
              "relname" : rels[i].tags && rels[i].tags.name ? rels[i].tags.name : undefined,
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
          "tags" : pois[i].tags,
          "relations" : pois[i].relations,
        },
        "id"         : pois[i].id,
        "geometry"   : {
          "type" : "Point",
          "coordinates" : [pois[i].lon, pois[i].lat],
        }
      });
    }
    geojson.push(geojsonnodes);
    var geojsonways = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    for (var i=0;i<ways.length;i++) {
      if (!(ways[i].nodes instanceof Array))
        continue; // ignore ways without nodes (e.g. returned by an ids_only query)
      ways[i].tainted = false;
      coords = new Array();
      for (j=0;j<ways[i].nodes.length;j++) {
        if (typeof ways[i].nodes[j] == "object")
          coords.push([ways[i].nodes[j].lon, ways[i].nodes[j].lat]);
        else
          ways[i].tainted = true;
      }
      var way_type = "LineString"; // default
      if (typeof ways[i].nodes[0] != "undefined" && ways[i].nodes[0] == ways[i].nodes[ways[i].nodes.length-1]) {
        if (typeof ways[i].tags != "undefined")
          if ((typeof ways[i].tags["landuse"] != "undefined") ||
              (typeof ways[i].tags["building"] != "undefined") ||
              (typeof ways[i].tags["leisure"] != "undefined") ||
              (ways[i].tags["area"] == "yes") ||
              ($.inArray(ways[i].tags["natural"], new Array("forest","wood","water")) != -1) ||
              !false) {
             way_type="Polygon";
             coords = [coords];
           }
      }
      geojsonways.features.push({
        "type"       : "Feature",
        "properties" : {
          "tainted" : ways[i].tainted,
          "tags" : ways[i].tags,
          "relations" : ways[i].relations,
        },
        "id"         : ways[i].id,
        "geometry"   : {
          "type" : way_type,
          "coordinates" : coords,
        }
      });
    }
    geojson.push(geojsonways);
    return geojson;
  }

  // == public methods ==

  // updates the map
  this.update_map = function () {
    // 1. get overpass json data
    var query = ide.getQuery(true);
    //$.getJSON("http://overpass-api.de/api/interpreter?data="+encodeURIComponent(query),
    $.post(settings.server+"interpreter", {data: query},
      function(data, textStatus, jqXHR) {
        // clear previous data and messages
        ide.dataViewer.setValue("");
        if (typeof ide.map.geojsonLayer != "undefined") 
          ide.map.removeLayer(ide.map.geojsonLayer);
        $("#map_blank").remove();
        // different cases of loaded data: json data, xml data or error message?
        var data_mode = null;
        var geojson;
        // hacky firefox hack :( (it is not properly detecting json from the content-type header)
        if (typeof data == "string" && data[0] == "{") { // if the data is a string, but looks more like a json object
          try {
            data = $.parseJSON(data);
          } catch (e) {}
        }
        if (typeof data == "string") { // maybe an error message
          data_mode = "unknown";
          if (data.indexOf("Error") != -1 &&
              data.indexOf("<script") == -1 &&
              data.indexOf("<h2>Public Transport Stops</h2>") == -1) {
            // this really looks like an error message, so lets open an additional modal error message
            $('<div title="Error"><p style="color:red;">An error occured during the execution of the overpass query! This is what overpass API returned:</p>'+data.replace(/((.|\n)*<body>|<\/body>(.|\n)*)/g,"")+"</div>").dialog({
              modal:true,
              buttons:{"ok": function(){$(this).dialog("close");}},
            });
            data_mode = "error";
          }
          // the html error message returned by overpass API looks goods also in xml mode ^^
          ide.dataViewer.setOption("mode","xml");
          geojson = [{features:[]}, {features:[]}];
        } else if (typeof data == "object" && data instanceof XMLDocument) { // xml data
          ide.dataViewer.setOption("mode","xml");
          data_mode = "xml";
          // convert to geoJSON
          geojson = overpassXML2geoJSON(data);
            [{features:[]}, {features:[]}];
        } else { // maybe json data
          ide.dataViewer.setOption("mode","javascript");
          data_mode = "json";
          // convert to geoJSON
          geojson = overpassJSON2geoJSON(data);
        }
        // print raw data
        ide.dataViewer.setValue(jqXHR.responseText);
        // 5. add geojson to map - profit :)
        // auto-tab-switching: if there is only non map-visible data, show it directly
        if (geojson[0].features.length == 0 && geojson[1].features.length == 0) { // no visible data
          // switch only if there is some unplottable data in the returned json/xml.
          if ((data_mode == "json" && data.elements.length > 0) ||
              (data_mode == "xml" && $("osm",data).children().not("note,meta").length > 0)) {
            ide.switchTab("Data");
            empty_msg = "no visible data";
          } else if(data_mode == "error") {
            empty_msg = "an error occured";
          } else if(data_mode == "unknown") {
            // switch also if some unstructured data is returned (e.g. output="popup"/"custom")
            ide.switchTab("Data");
            empty_msg = "unstructured data returned";
          } else {
            empty_msg = "recieved empty dataset";
          }
          // show why there is an empty map
          $('<div id="map_blank" style="z-index:1; display:block; position:absolute; top:10px; width:100%; text-align:center; background-color:#eee; opacity: 0.8;">This map intentionally left blank. <small>('+empty_msg+')</small></div>').appendTo("#map");
        }
        ide.map.geojsonLayer = new L.GeoJSON(null, {
          style: function(feature) {
            return { // todo
            };
          },
          pointToLayer: function (feature, latlng) {
            return new L.CircleMarker(latlng, {
              radius      : 8,
              fillColor   : "#ff7800",
              color       : "#ff7800",
              weight      : 2,
              opacity     : 0.8,
              fillOpacity : 0.4
            });
          },
          onEachFeature : function (feature, layer) {
            var popup = "";
            if (feature.geometry.type == "Point")
              popup += "<h2>Node <a href='http://www.openstreetmap.org/browse/node/"+feature.id+"'>"+feature.id+"</a></h2>";
            else
              popup += "<h2>Way <a href='http://www.openstreetmap.org/browse/way/"+feature.id+"'>"+feature.id+"</a></h2>";
            if (feature.properties && feature.properties.tags) {
              popup += "<h3>Tags:</h3><ul>";
              $.each(feature.properties.tags, function(k,v) {popup += "<li>"+k+"="+v+"</li>"});
              popup += "</ul>";
            }
            if (feature.properties && (typeof feature.properties.relations != "undefined")) {
              popup += "<h3>Relations:</h3><ul>";
              $.each(feature.properties.relations, function (k,v) {
                popup += "<li><a href='http://www.openstreetmap.org/browse/relation/"+v["rel"]+"'>"+v["rel"]+"</a>";
                if (v["relname"])
                  popup += " ("+v["relname"]+")"
                if (v["role"]) 
                  popup += " as "+v["role"]+"";
                popup += "</li>";
              });
              popup += "</ul>";
            }
            switch (feature.geometry.type) {
            case "LineString":
            case "Polygon": 
            case "Multipolygon":
              if (feature.properties && feature.properties.tainted==true) {
                popup += "<strong>Attention: incomplete way geometry (some nodes missing)</strong>";
                layer.options.opacity *= 0.5;
              }
            }
            switch (feature.geometry.type) {
            case "Polygon": 
            case "Multipolygon":
              layer.options.fillColor = "#90DE3C";
              layer.options.fillOpacity = 0.4;
              layer.options.color = "#90DE3C";
            }
            if (feature.properties && feature.properties.relations && feature.properties.relations.length>0) {
              layer.options.color = "#f13";
            }
            if (popup != "")
              layer.bindPopup(popup);
          },
        });
        for (i=0;i<geojson.length;i++) {
          ide.map.geojsonLayer.addData(geojson[i]);
        }
        ide.map.addLayer(ide.map.geojsonLayer);

    }).error(function(jqXHR, textStatus, errorThrown) {
      ide.dataViewer.setValue("");
      var errmsg = "";
      if (jqXHR.state() == "rejected")
        errmsg += "<p>Request rejected. (e.g. server not found, redirection, etc.)</p>";
      if (jqXHR.status != 0) // note to me: jqXHR.status "should" give http status codes
        errmsg += "<p>Error-Code: "+jqXHR.status+" ("+jqXHR.statusText+")</p>";
      $('<div title="Error"><p style="color:red;">An error occured during the execution of the overpass query!</p>'+errmsg+'</div>').dialog({
        modal:true,
        buttons: {"ok": function() {$(this).dialog("close");}},
      }); // dialog
    }); // getJSON

  }

  // == initializations ==
})(); // end create ide object













