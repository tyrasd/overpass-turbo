
// global overpass object

var overpass = new(function() {
  // == private members ==
  var geojsonLayer = null;

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
      ways[i].tainted = false;
      coords = new Array();
      for (j=0;j<ways[i].nodes.length;j++) {
        if (typeof ways[i].nodes[j] == "object")
          coords.push([ways[i].nodes[j].lon, ways[i].nodes[j].lat]);
        else
          ways[i].tainted = true;
      }
      var way_type = "LineString"; // default
      if (ways[i].nodes[0] == ways[i].nodes[ways[i].nodes.length-1]) {
        if (typeof ways[i].tags != "undefined")
          if ((typeof ways[i].tags["landuse"] != "undefined") ||
              (typeof ways[i].tags["building"] != "undefined") ||
              (typeof ways[i].tags["leisure"] != "undefined") ||
              (typeof ways[i].tags["area"] == "yes") ||
              ($.inArray(ways[i].tags["natural"], new Array("forest","wood","water"))) ||
              false) {
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
    var query = ide.getQuery();
    query = query.replace(/\(bbox\)/g,ide.map2bbox("ql")); // expand bbox query
    query = query.replace(/<bbox-query\/>/g,ide.map2bbox("xml")); // -"-
    query = query.replace(/<coord-query\/>/g,ide.map2coord("xml")); // expand coord query
    query = query.replace(/(\n|\r)/g," "); // remove newlines
    query = query.replace(/\s+/g," "); // remove some whitespace
    // if json: //TODO
    $.getJSON("http://overpass-api.de/api/interpreter?data="+encodeURIComponent(query),
      function(json, textStatus, jqXHR) {
        // print raw data
        ide.dataViewer.setValue(jqXHR.responseText);
        // convert to geoJSON
        var geojson = overpassJSON2geoJSON(json);
        // 5. add geojson to map - profit :)
        if (geojsonLayer != null) 
          ide.map.removeLayer(geojsonLayer);
        // if there is only non map-visible data, show it directly
        if ((geojson[0].features.length + geojson[1].features.length == 0) &&
            (json.elements.length > 0))
          ide.switchTab("Data");
        geojsonLayer = new L.GeoJSON(geojson[0], {
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
                if (v["role"]) 
                  popup += " (as "+v["role"]+")";
                popup += "</li>";
              });
              popup += "</ul>";
            }
            switch (feature.geometry.type) {
            case "LineString":
            case "Polygon": 
            case "Multipolygon":
              if (feature.properties && feature.properties.tainted==true) {
                popup += "<strong>Attention: uncomplete way (some nodes missing)</strong>";
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
          geojsonLayer.addData(geojson[i]);
        }
        ide.map.addLayer(geojsonLayer);

    });
    
  }

  // == initializations ==
})(); // end create ide object













