
// global ide object

var ide = new(function() {
  // == private members ==
  var codeEditor = null;
  // == public members ==
  this.appname = "overpass-ide";
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
        lineWrapping: true,
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
    L.control.scale({metric:true,imperial:false,}).addTo(ide.map);
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

    // leaflet extension: more map controls
    var MapButtons = L.Control.extend({
      options: {
        position:'topleft',
      },
      onAdd: function(map) {
        // create the control container with a particular class name
        var container = L.DomUtil.create('div', 'leaflet-control-buttons');
        var link = L.DomUtil.create('a', "leaflet-control-buttons-fitdata", container);
        $('<span class="ui-icon ui-icon-search"/>').appendTo($(link));
        link.href = '#';
        link.title = "fit zoom to data";
        L.DomEvent.addListener(link, 'click', function() {
          try {ide.map.fitBounds(ide.map.geojsonLayer.getBounds()); } catch (e) {}  
        }, ide.map);
        var link = L.DomUtil.create('a', "leaflet-control-buttons-myloc", container);
        $('<span class="ui-icon ui-icon-radio-off"/>').appendTo($(link));
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
    ide.map.addControl(new MapButtons());
    // leaflet extension: search box
    var SearchBox = L.Control.extend({
      options: {
        position:'topleft',
      },
      onAdd: function(map) {
        var container = L.DomUtil.create('div', 'ui-widget');
        container.style.opacity = "0.6";
        container.style.position = "absolute";
        container.style.left = "40px";
        var inp = L.DomUtil.create('input', '', container);
        inp.id = "search";
        // hack against focus stealing leaflet :/
        inp.onclick = function() {this.focus();}
        // autocomplete functionality
        $(inp).autocomplete({
          source: function(request,response) {
            // ajax (GET) request to nominatim
            $.ajax("http://nominatim.openstreetmap.org/search"+"?app="+ide.appname, {
              data:{
                format:"json",
                q: request.term
              },
              success: function(data) {
                response($.map(data,function(item) {
                  return {label:item.display_name, value:item.display_name,lat:item.lat,lon:item.lon,}
                }));
              },
              // todo: error handling
            });
          },
          minLength: 2,
          dalay: 600,
          select: function(event,ui) {
            ide.map.panTo(new L.LatLng(ui.item.lat,ui.item.lon));
            this.value="";
            return false;
          },
          open: function() {
            $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
          },
          close: function() {
            $(this).addClass("ui-corner-all").removeClass("ui-corner-top");
          },
        });
        return container;
      },
    });
    ide.map.addControl(new SearchBox());
    // add cross hairs to map
    $('<span class="ui-icon ui-icon-plus" />')
      .addClass("crosshairs")
      .hide()
      .appendTo("#map");
    if (settings.enable_crosshairs)
      $(".crosshairs").show();
  } // init()

  var make_combobox = function(input, options) {
    if (input[0].is_combobox) {
      input.autocomplete("option", {source:options});
      return;
    }
    var wrapper = input.wrap("<span>").parent().addClass("ui-combobox");
    input.autocomplete({
      source: options,
      minLength: 0,
    }).addClass("ui-widget ui-widget-content ui-corner-left ui-state-default");
    $( "<a>" ).attr("tabIndex", -1).attr("title","show all items").appendTo(wrapper).button({
      icons: {primary: "ui-icon-triangle-1-s"}, text:false
    }).removeClass( "ui-corner-all" ).addClass( "ui-corner-right ui-combobox-toggle" ).click(function() {
      // close if already visible
      if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
        input.autocomplete( "close" );
        return;
      }
      // pass empty string as value to search for, displaying all results
      input.autocomplete( "search", "" );
      input.focus();
    });
    input[0].is_combobox = true;
  } // make_combobox()

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
  /*this returns the current query in the editor.
   * processed (boolean, optional, default: false): determines weather shortcuts should be expanded or not.
   * trim_ws (boolean, optional, default: true): if false, newlines and whitespaces are not touched.*/
  this.getQuery = function(processed,trim_ws) {
    var query = codeEditor.getValue();
    if (processed) {
      query = query.replace(/\(bbox\)/g,ide.map2bbox("ql")); // expand bbox query
      query = query.replace(/<bbox-query\/>/g,ide.map2bbox("xml")); // -"-
      query = query.replace(/<coord-query\/>/g,ide.map2coord("xml")); // expand coord query
      if (typeof trim_ws == "undefined" || trim_ws) {
        query = query.replace(/(\n|\r)/g," "); // remove newlines
        query = query.replace(/\s+/g," "); // remove some whitespace
      }
    }
    return query;
  }
  this.setQuery = function(query) {
    codeEditor.setValue(query);
  }

  this.switchTab = function(tab) {
    $("#navs .tabs a:contains('"+tab+"')").click();
  }

  this.loadExample = function(ex) {
    if (typeof settings.saves[ex] != "undefined")
      ide.setQuery(settings.saves[ex].overpass);
  }
  this.removeExample = function(ex,self) {
    $('<div title="Delete Query?"><p><span class="ui-icon ui-icon-alert" style="float:left; margin:1px 7px 20px 0;"></span>Do you really want to delete &quot;'+ex+'&quot;?</p></div>').dialog({
      modal: true,
      buttons: {
        "Delete": function() {
          delete settings.saves[ex];
          settings.save();
          $(self).parent().remove();
          $(this).dialog( "close" );
        },
        "Cancel": function() {$( this ).dialog( "close" );},
      },
    });
  }

  // Event handlers
  this.onLoadClick = function() {
    $("#load-dialog ul").html(""); // reset example list
    // load example list
    for(var example in settings.saves)
      $('<li>'+
          '<a href="#load-example" onclick="ide.loadExample(\''+htmlentities(example)+'\'); $(this).parents(\'.ui-dialog-content\').dialog(\'close\');">'+example+'</a>'+
          '<a href="#delete-example" onclick="ide.removeExample(\''+htmlentities(example)+'\',this);"><span class="ui-icon ui-icon-close" style="display:inline-block;"/></a>'+
        '</li>').appendTo("#load-dialog ul");
    $("#load-dialog").dialog({
      modal:true,
      buttons: {
        "Cancel" : function() {$(this).dialog("close");}
      }
    });
    
  }
  this.onSaveClick = function() {
    // combobox for existing saves.
    var saves_names = new Array();
    for (var key in settings.saves)
      saves_names.push(key);
    make_combobox($("#save-dialog input[name=save]"), saves_names);
    $("#save-dialog").dialog({
      modal:true,
      buttons: {
        "Save" : function() {
          var name = $("input[name=save]",this)[0].value;
          settings.saves[htmlentities(name)] = {
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
    // prepare export dialog
    var query = ide.getQuery(true);
    $("#export-dialog a#export-overpass-openlayers")[0].href = settings.server+"convert?data="+encodeURIComponent(query)+"&target=openlayers";
    $("#export-dialog a#export-overpass-api")[0].href = settings.server+"interpreter?data="+encodeURIComponent(query);
    $("#export-dialog a#export-text")[0].href = "data:text/plain;charset=\""+(document.characterSet||document.charset)+"\";base64,"+Base64.encode(ide.getQuery(),true);
    $("#export-dialog a#export-map-state").unbind("click");
    $("#export-dialog a#export-map-state").bind("click",function() {
      $('<div title="Current Map State">'+
        '<p><strong>Center:</strong> </p>'+L.Util.formatNum(ide.map.getCenter().lat)+' / '+L.Util.formatNum(ide.map.getCenter().lng)+' <small>(lat/lon)</small>'+
        '<p><strong>Bounds:</strong> </p>'+L.Util.formatNum(ide.map.getBounds().getSouthWest().lat)+' / '+L.Util.formatNum(ide.map.getBounds().getSouthWest().lng)+'<br />'+L.Util.formatNum(ide.map.getBounds().getNorthEast().lat)+' / '+L.Util.formatNum(ide.map.getBounds().getNorthEast().lng)+'<br /><small>(south/west north/east)</small>'+
        '<p><strong>Zoom:</strong> </p>'+ide.map.getZoom()+
        '</div>').dialog({
        modal:true,
        buttons: {
          "OK": function() {$(this).dialog("close");}
        },
      });
    });
    // open the export dialog
    $("#export-dialog").dialog({
      modal:true,
      buttons: {
        "OK": function() {$(this).dialog("close");}
      }
    });
  }
  this.onExportImageClick = function() {
    $("body").addClass("loading");
    // 1. render canvas from map tiles
    // hide map controlls in this step :/ 
    // todo? (also: hide map overlay data somehow, if possible to speed things up)
    $("#map .leaflet-control-container .leaflet-top").hide();
    $("#map").html2canvas({onrendered: function(canvas) {
      $("#map .leaflet-control-container .leaflet-top").show();
      // 2. render overlay data onto canvas
      canvas.id = "render_canvas";
      var ctx = canvas.getContext("2d");
      // get geometry for svg rendering
      var height = $("#map .leaflet-overlay-pane svg").height();
      var width  = $("#map .leaflet-overlay-pane svg").width();
      var tmp = $("#map .leaflet-map-pane")[0].style.cssText.match(/.*?(-?\d+)px.*?(-?\d+)px.*/);
      var offx   = tmp[1]*1;
      var offy   = tmp[2]*1;
      if ($("#map .leaflet-overlay-pane").html().length > 0)
        ctx.drawSvg($("#map .leaflet-overlay-pane").html(),offx,offy,width,height);
      // 3. export canvas as html image
      var imgstr = canvas.toDataURL("image/png");
      $('<div title="Export Image" id="export_image_dialog"><p><img src="'+imgstr+'" alt="xx" width="480px"/><a href="'+imgstr+'" download="export.png">Download</a></p></div>').dialog({
        modal:true,
        width:500,
        position:["center",60],
        open: function() {
          $("body").removeClass("loading");
        },
        buttons: {
          "OK": function() {
            $(this).dialog("close");
            // free dialog from DOM
            $("#export_image_dialog").remove();
          }
        }
      });
    }});
  }
  this.onSettingsClick = function() {
    $("#settings-dialog input[name=server]")[0].value = settings.server;
    make_combobox($("#settings-dialog input[name=server]"), [
      "http://www.overpass-api.de/api/",
      "http://overpass.osm.rambler.ru/cgi/",
    ]);
    $("#settings-dialog input[name=use_html5_coords]")[0].checked = settings.use_html5_coords;
    $("#settings-dialog input[name=use_rich_editor]")[0].checked = settings.use_rich_editor;
    // sharing options
    $("#settings-dialog input[name=share_include_pos]")[0].checked = settings.share_include_pos;
    $("#settings-dialog input[name=share_compression]")[0].value = settings.share_compression;
    make_combobox($("#settings-dialog input[name=share_compression]"),["auto","on","off"]);
    // map settings
    $("#settings-dialog input[name=enable_crosshairs]")[0].checked = settings.enable_crosshairs;
    // open dialog
    $("#settings-dialog").dialog({
      modal:true,
      buttons: {
        "Save": function() {
          // save settings
          settings.server = $("#settings-dialog input[name=server]")[0].value;
          settings.use_html5_coords = $("#settings-dialog input[name=use_html5_coords]")[0].checked;
          settings.use_rich_editor  = $("#settings-dialog input[name=use_rich_editor]")[0].checked;
          settings.share_include_pos = $("#settings-dialog input[name=share_include_pos]")[0].checked;
          settings.share_compression = $("#settings-dialog input[name=share_compression]")[0].value;
          settings.enable_crosshairs = $("#settings-dialog input[name=enable_crosshairs]")[0].checked;
          $(".crosshairs").toggle(settings.enable_crosshairs); // show/hide crosshairs
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
    $("#help-dialog").dialog({
      modal:false,
      width:450,
      buttons: {
        "Close": function() {
          $(this).dialog("close");
        },
      }
    });
    $("#help-dialog").accordion();
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










