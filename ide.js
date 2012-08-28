
// global ide object

var ide = new(function() {
  // == private members ==
  var codeEditor = null;
  // == public members ==
  this.dataViewer = null;
  this.map = null;

  // == private methods ==
  var init = function() {
    // load settings
    settings.load();
    // check for any get-parameters
    var override_use_html5_coords = false;
    if (location.search != "") {
      var get = location.search.substring(1).split("&");
      for (var i=0; i<get.length; i++) {
        var kv = get[i].split("=");
        if (kv[0] == "q") // compressed query set in url
          settings.code["overpass"] = lzw_decode(Base64.decode(decodeURIComponent(kv[1])));
        if (kv[0] == "Q") // uncompressed query set in url
          settings.code["overpass"] = decodeURIComponent(kv[1]);
        if (kv[0] == "c") { // map center & zoom (compressed)
          var tmp = kv[1].match(/([A-Za-z0-9\-_]+)\.([A-Za-z0-9\-_]+)\.([A-Za-z0-9\-_]+)/);
          settings.coords_lat = Base64.decodeNum(tmp[1])/100000;
          settings.coords_lon = Base64.decodeNum(tmp[2])/100000;
          settings.coords_zoom = Base64.decodeNum(tmp[3])*1;
          override_use_html5_coords = true;
        }
        if (kv[0] == "C") { // map center & zoom (uncompressed)
          var tmp = kv[1].match(/([\d.]+)-([\d.]+)-(\d+)/);
          settings.coords_lat = tmp[1]*1;
          settings.coords_lon = tmp[2]*1;
          settings.coords_zoom = tmp[3]*1;
          override_use_html5_coords = true;
        }
      }
      settings.save();
    }

    // init codemirror
    $("#editor textarea")[0].value = settings.code["overpass"];
    if (settings.use_rich_editor) {
      codeEditor = CodeMirror.fromTextArea($("#editor textarea")[0], {
        //value: settings.code["overpass"],
        lineNumbers: true,
        mode: "xml",
        onChange: function(e) {
          settings.code["overpass"] = e.getValue();
          settings.save();
        },
      });
    } else {
      codeEditor = $("#editor textarea")[0];
      codeEditor.getValue = function() {
        return this.value;
      };
      codeEditor.setValue = function(v) {
        this.value = v;
      };
      $("#editor textarea").bind("input change", function(e) {
        settings.code["overpass"] = e.target.getValue();
        settings.save();
      });
    }
    ide.dataViewer = CodeMirror($("#data")[0], {
      value:'no data loaded yet', 
      lineNumbers: true, 
      readonly: true,
      mode: "javascript",
    });

    // init leaflet
    ide.map = new L.Map("map", {
      attributionControl:false,
      minZoom:4,
      maxZoom:18,
    });
    var osmUrl="http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    var osmAttrib="Map data © openstreetmap contributors";
    var osm = new L.TileLayer(osmUrl,{
      attribution:osmAttrib,
    });
    var pos = new L.LatLng(settings.coords_lat,settings.coords_lon);
    ide.map.setView(pos,settings.coords_zoom).addLayer(osm);
    L.control.scale().addTo(ide.map);
    if (settings.use_html5_coords && !override_use_html5_coords) {
      // One-shot position request.
      try {
        navigator.geolocation.getCurrentPosition(function (position){
          var pos = new L.LatLng(position.coords.latitude,position.coords.longitude);
          ide.map.setView(pos,settings.coords_zoom);
        });
      } catch(e) {}
    }
    ide.map.on('moveend', function() {
      settings.coords_lat = ide.map.getCenter().lat;
      settings.coords_lon = ide.map.getCenter().lng;
      settings.coords_zoom = ide.map.getZoom();
      settings.save(); // save settings
    });

    // disabled buttons
    $("a.disabled").bind("click",function() { return false; });

    // tabs
    $("#dataviewer > div#data")[0].style.zIndex = -1001;
    $(".tabs a.button").bind("click",function(e) {
      if ($(e.target).hasClass("active")) {
        return;
      } else {
        $("#dataviewer > div#data")[0].style.zIndex = -1*$("#dataviewer > div#data")[0].style.zIndex;
        $(".tabs a.button").toggleClass("active");
      }
    });

    // wait spinner
    $("body").on({
      ajaxStart: function() {
        $(this).addClass("loading");
      },
      ajaxStop: function() {
        $(this).removeClass("loading");
      },
    });

    // keyboard event listener
    $("body").keypress(ide.onKeyPress);

    // leaflet extension
    var MyControl = L.Control.extend({
      options: {
        position:'topleft',
      },
      onAdd: function(map) {
        // create the control container with a particular class name
        var container = L.DomUtil.create('div', 'leaflet-control-buttons');
        var link = L.DomUtil.create('a', "leaflet-control-buttons-fitdata", container);
        link.href = '#';
        link.title = "fit zoom to data";
        L.DomEvent.addListener(link, 'click', function() {
          try {ide.map.fitBounds(ide.map.geojsonLayer.getBounds()); } catch (e) {}  
        }, ide.map);
        var link = L.DomUtil.create('a', "leaflet-control-buttons-myloc", container);
        link.href = '#';
        link.title = "pan to current location";
        L.DomEvent.addListener(link, 'click', function() {
          // One-shot position request.
          try {
            navigator.geolocation.getCurrentPosition(function (position){
              var pos = new L.LatLng(position.coords.latitude,position.coords.longitude);
              ide.map.setView(pos,settings.coords_zoom);
            });
          } catch(e) {}
        }, ide.map);
        return container;
      },
    });
  }
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

  // == public methods ==

  // returns the current visible bbox as a bbox-query
  this.map2bbox = function(lang) {
    if (lang=="ql")
      return "("+this.map.getBounds().getSouthWest().lat+','+this.map.getBounds().getSouthWest().lng+','+this.map.getBounds().getNorthEast().lat+','+this.map.getBounds().getNorthEast().lng+")";
    else (lang=="xml")
      return '<bbox-query s="'+this.map.getBounds().getSouthWest().lat+'" w="'+this.map.getBounds().getSouthWest().lng+'" n="'+this.map.getBounds().getNorthEast().lat+'" e="'+this.map.getBounds().getNorthEast().lng+'"/>';
  }
  // returns the current visible map center as a coord-query
  this.map2coord = function(lang) {
    if (lang=="xml")
      return '<coord-query lat="'+this.map.getCenter().lat+'" lon="'+this.map.getCenter().lng+'"/>';
  }
  this.getQuery = function(processed) {
    var query = codeEditor.getValue();
    if (processed) {
      query = query.replace(/\(bbox\)/g,ide.map2bbox("ql")); // expand bbox query
      query = query.replace(/<bbox-query\/>/g,ide.map2bbox("xml")); // -"-
      query = query.replace(/<coord-query\/>/g,ide.map2coord("xml")); // expand coord query
      query = query.replace(/(\n|\r)/g," "); // remove newlines
      query = query.replace(/\s+/g," "); // remove some whitespace
    }
    return query;
  }
  this.setQuery = function(query) {
    codeEditor.setValue(query);
  }

  this.switchTab = function(tab) {
    $("#navs .tabs a:contains('"+tab+"')").click();
  }

  // Event handlers
  this.onLoadClick = function() {
    var ex_html = "";
    for(var example in settings.saves)
      ex_html += '<li><input type="radio" name="ex_list" value="'+example+'" />'+example+'</li>';
    $('<div title="Load"><p>Select example to load:</p><ul>'+ex_html+'</ul></div>').dialog({
      modal:true,
      //height:250,
      buttons: {
        "Load" : function() {
          $("input",this).each(function(i,inp) {
            if (inp.checked)
              ide.setQuery(settings.saves[inp.value].overpass);
          });
          $(this).dialog("close");
        },
        "Cancel" : function() {$(this).dialog("close");}
      }
    });
    
  }
  this.onSaveClick = function() {
    $('<div title="Save"><p>Select name</p><p><input name="save" type="text" /></p></div>').dialog({
      modal:true,
      //height:150,
      buttons: {
        "Save" : function() {
          var name = $("input",this)[0].value;
          settings.saves[name] = {
            "overpass": ide.getQuery()
          };
          settings.save();
          $(this).dialog("close");
        },
        "Cancel": function() {$(this).dialog("close");}
      }
    });
  }
  this.onRunClick = function() {
    overpass.update_map();
  }
  this.onShareClick = function() {
    var baseurl=location.protocol+"//"+location.host+location.pathname;
    var shared_code = codeEditor.getValue();
    var share_link_uncompressed = baseurl+"?Q="+encodeURIComponent(shared_code);
    if (settings.share_include_pos)
      share_link_uncompressed += "&C="+L.Util.formatNum(ide.map.getCenter().lat)+"-"+L.Util.formatNum(ide.map.getCenter().lng)+"-"+ide.map.getZoom();
    var share_link;
    if ((settings.share_compression == "auto" && shared_code.length <= 300) ||
        (settings.share_compression == "off"))
      share_link = share_link_uncompressed;
    else {
      var share_link_compressed = baseurl+"?q="+encodeURIComponent(Base64.encode(lzw_encode(shared_code)));
      if (settings.share_include_pos)
        share_link_compressed += "&c="+Base64.encodeNum(ide.map.getCenter().lat*100000)+"."+Base64.encodeNum(ide.map.getCenter().lng*100000)+"."+Base64.encodeNum(ide.map.getZoom());
      share_link = share_link_compressed;
    }

    var warning = '';
    if (share_link.length >= 2000)
      warning = '<p style="color:orange">Warning: This share-link is quite long. It may not work under certain circumstances</a> (browsers, webservers).</p>';
    if (share_link.length >= 8000)
      warning = '<p style="color:red">Warning: This share-link is very long. It is likely to fail under normal circumstances (browsers, webservers). Use with caution.</p>';
    //alert(share_link_uncompressed.length + " / " + share_link_compressed.length + " => " + ((share_link_uncompressed.length-share_link_compressed.length)/share_link_uncompressed.length * 100) + "%");
    $('<div title="Share"><p>Copy this <a href="'+share_link+'">link</a> to share the current code:</p><p><textarea rows=4 style="width:100%" readonly>'+share_link+'</textarea></p>'+warning+'</div>').dialog({
      modal:true,
      buttons: {
        "OK": function() {$(this).dialog("close");}
      }
    });
  }
  this.onExportClick = function() {
    var expo = "<ul>";
    var query = ide.getQuery(true);
    expo += '<li><a href="'+settings.server+'interpreter?data='+encodeURIComponent(query)+'">raw API interpreter link</a></li>';
    expo += '<li><a href="'+settings.server+'convert?data='+encodeURIComponent(query)+'&target=openlayers">OpenLayers overlay</a> <span style="font-size:smaller;">(only for queries returning valid OSM-XML)</span></li>';
    //expo += '<li><a href="data:text/plain,'+encodeURI(ide.getQuery())+'" download="query.txt">query as raw text</a></li>';
    expo += "<li><a href='data:text/plain;charset=\""+(document.characterSet||document.charset)+"\";base64,"+Base64.encode(ide.getQuery(),true)+"' download='query.txt'>query as raw text</a></li>";
    expo += "</ul>";
    $('<div title="Export">'+expo+'</div>').dialog({
      modal:true,
      buttons: {
        "OK": function() {$(this).dialog("close");}
      }
    });
  }
  this.onSettingsClick = function() {
    var set = "";
    set += "<h3>General settings</h3>";
    //set += '<p><label>Server:</label><br /><select style="width:100%;"><option>http://www.overpass-api.de/api</option><option>http://overpass.osm.rambler.ru/cgi</option></select></p>';
    set += '<p><label>Server:</label><br /><input type="text" style="width:100%;" name="server" value="'+settings.server+'"/></p>';
    set += '<p><input type="checkbox" name="use_html5_coords" '+(settings.use_html5_coords ? "checked" : "")+'/>&nbsp;Start at current location (html5 geolocation)</p>';
    set += '<p><input type="checkbox" name="use_rich_editor" '+(settings.use_rich_editor ? "checked" : "")+'/>&nbsp;Enable rich code editor (disable this on mobile devices; requires a page-reload to take effect).</p>';
    // sharing options
    set += "<h3>Sharing</h3>";
    set += '<p><input type="checkbox" name="share_include_pos" '+(settings.share_include_pos ? "checked" : "")+'/>&nbsp;Include current map state in shared links</p>';
    set += '<p><label>compression in shared links</label>&nbsp;<input type="text" style="width:30%;" name="share_compression" value="'+settings.share_compression+'"/></p>';
    // open dialog
    $('<div title="Settings">'+set+'</div>').dialog({
      modal:true,
      buttons: {
        "Save": function() {
          // save settings
          settings.server = $("input[name=server]").last()[0].value;
          settings.use_html5_coords = $("input[name=use_html5_coords]").last()[0].checked;
          settings.use_rich_editor  = $("input[name=use_rich_editor]").last()[0].checked;
          settings.share_include_pos = $("input[name=share_include_pos]").last()[0].checked;
          settings.share_compression = $("input[name=share_compression]").last()[0].value;
          settings.save();
          $(this).dialog("close");
        },
        /*"Reset": function() {
          alert("not jet implemented"); // todo: reset all settings
        },*/
      }
    });
  }
  this.onHelpClick = function() {
    $("#help").dialog({
      modal:false,
      width:450,
      buttons: {
        "Close": function() {
          $(this).dialog("close");
        },
      }
    });
  }
  this.onKeyPress = function(event) {
    if ((event.keyCode == 120 && event.which == 0) || // F9
        ((event.which == 13 || event.which == 10) && (event.ctrlKey || event.metaKey))) { // Ctrl+Enter
      ide.onRunClick(); // run query
      event.preventDefault();
    }
    // todo: more shortcuts
  }

  // == initializations ==
  // initialize on document ready
  $(document).ready(init);

})(); // end create ide object










