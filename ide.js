
// some global variables... hmmm
var codeEditor = null;
var dataViewer = null;
var map = null;
var geojsonLayer = null;


function init() {
  // init codemirror
  codeEditor = CodeMirror($("#editor")[0], {
    //value:'[out:json];\n(\n  node\n    ["amenity"="drinking_water"]\n    (<bbox>)\n);\nout body;', 
    value:'<osm-script output="json">\n'+
          '  <query type="node">\n'+
          '    <has-kv k="amenity" v="drinking_water"/>\n'+
          '    <bbox-query/>\n'+
          '  </query>\n'+
          '  <print mode="body" order="quadtile"/>\n'+
          '</osm-script>\n',
    lineNumbers: true,
    mode: "xml"
  });
  dataViewer = CodeMirror($("#data")[0], {
    value:'no data loaded yet', 
    lineNumbers: true, 
    readonly: true,
    mode: "javascript"
  });
  // init leaflet
  map = new L.Map("map");
  var osmUrl="http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  var osmAttrib="Map data © openstreetmap contributors";
  var osm = new L.TileLayer(osmUrl,{minZoom:8,maxZoom:18,attribution:osmAttrib});
  var pos = new L.LatLng(46.48,11.32);
  map.setView(pos,12).addLayer(osm);

  // tabs
  $("#dataviewer > div#data")[0].style.zIndex = -99;
  $(".tabs a.button").bind("click",function(e) {
    if ($(e.target).hasClass("active")) {
      return;
    } else {
      $("#dataviewer > div#data")[0].style.zIndex = -1*$("#dataviewer > div#data")[0].style.zIndex;
      $(".tabs a.button").toggleClass("active");
    }
  });

  // disabled buttons
  $("a.disabled").bind("click",function() { return false; });
}
// initialize on document ready
$(document).ready(init);

function overpassJSON2geoJSON(json) {
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
        alert("???");
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
function map2bbox(lang) {
  if (lang=="ql")
    return "("+map.getBounds().getSouthWest().lat+','+map.getBounds().getSouthWest().lng+','+map.getBounds().getNorthEast().lat+','+map.getBounds().getNorthEast().lng+")";
  else (lang=="xml")
    return '<bbox-query s="'+map.getBounds().getSouthWest().lat+'" w="'+map.getBounds().getSouthWest().lng+'" n="'+map.getBounds().getNorthEast().lat+'" e="'+map.getBounds().getNorthEast().lng+'"/>';
}

function update_map() {
  // 1. get overpass json data
  var query = codeEditor.getValue();
  query = query.replace(/\(bbox\)/g,map2bbox("ql"));
  query = query.replace(/<bbox-query\/>/g,map2bbox("xml"));
  query = query.replace(/(\n|\r)/g," ");
  query = query.replace(/\s+/g," ");
  // if json:
  $.getJSON("http://overpass-api.de/api/interpreter?data="+encodeURIComponent(query),
    function(json, textStatus, jqXHR) {
      // print raw data
      dataViewer.setValue(jqXHR.responseText);
      // convert to geoJSON
      var geojson = overpassJSON2geoJSON(json);
      // 5. add geojson to map - profit :)
      if (geojsonLayer != null) 
        map.removeLayer(geojsonLayer);
      geojsonLayer = new L.GeoJSON(null, {
        pointToLayer: function (latlng) {
          return new L.CircleMarker(latlng, {
            radius      : 8,
            fillColor   : "#ff7800",
            color       : "#ff7800",
            weight      : 2,
            opacity     : 0.8,
            fillOpacity : 0.4
          });
        }
      });
      geojsonLayer.on("featureparse", function (e) {
        var popup = "";
        if (e.geometryType == "Point")
          popup += "<h2>Node <a href='http://www.openstreetmap.org/browse/node/"+e.id+"'>"+e.id+"</a></h2>";
        else
          popup += "<h2>Way <a href='http://www.openstreetmap.org/browse/way/"+e.id+"'>"+e.id+"</a></h2>";
        if (e.properties && e.properties.tags) {
          popup += "<h3>Tags:</h3><ul>";
          $.each(e.properties.tags, function(k,v) {popup += "<li>"+k+"="+v+"</li>"});
          popup += "</ul>";
        }
        if (e.properties && (typeof e.properties.relations != "undefined")) {
          popup += "<h3>Relations:</h3><ul>";
          $.each(e.properties.relations, function (k,v) {
            popup += "<li><a href='http://www.openstreetmap.org/browse/relation/"+v["rel"]+"'>"+v["rel"]+"</a>";
            if (v["role"]) 
              popup += " (as "+v["role"]+")";
            popup += "</li>";
          });
          popup += "</ul>";
        }
        switch (e.geometryType) {
        case "LineString":
        case "Polygon": 
        case "Multipolygon":
          if (e.properties && e.properties.tainted==true) {
            popup += "<strong>Attention: uncomplete way (some nodes missing)</strong>";
            e.layer.options.opacity *= 0.5;
          }
        }
        switch (e.geometryType) {
        case "Polygon": 
        case "Multipolygon":
          e.layer.options.fillColor = "#90DE3C";
          e.layer.options.fillOpacity = 0.4;
          e.layer.options.color = "#90DE3C";
        }
        if (e.properties && e.properties.relations && e.properties.relations.length>0) {
          e.layer.options.color = "#f13";
        }
        if (popup != "")
          e.layer.bindPopup(popup);
      });
      for (i=0;i<geojson.length;i++) {
        geojsonLayer.addGeoJSON(geojson[i]);
      }
      map.addLayer(geojsonLayer);

  });
  
}


