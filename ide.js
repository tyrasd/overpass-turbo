// global ide object

var ide = new(function() {
  // == private members ==
  var codeEditor = null;
  var attribControl = null;
  var scaleControl = null;
  // == public members ==
  this.appname = "overpass-ide";
  this.dataViewer = null;
  this.map = null;

  // == private methods ==
  var init = function() {
    ide.waiter.addInfo("ide starting up");
    // load settings
    settings.load();
    // (very raw) compatibility check <- TODO: put this into its own function
    if (jQuery.support.cors != true ||
        typeof localStorage  != "object" ||
        false) {
      // the currently used browser is not capable of running the IDE. :(
      $('<div title="Your browser is not supported :(">'+
          '<p>The browser you are currently using, is (most likely) not capable of running (significant parts of) this Application. <small>It must support <a href="http://en.wikipedia.org/wiki/Web_storage#localStorage">Web Storage API</a> and <a href="http://en.wikipedia.org/wiki/Cross-origin_resource_sharing">cross origin resource sharing (CORS)</a>.</small></p>'+
          '<p>Please upgrade to a more up-to-date version of your browser or switch to a more capable one! Recent versions of <a href="http://www.opera.com">Opera</a>, <a href="http://www.google.com/intl/de/chrome/browser/">Chrome</a> and <a href="http://www.mozilla.org/de/firefox/">Firefox</a> have been tested to work. Alternatively, you can still use the <a href="http://overpass-api.de/query_form.html">Overpass_API query form</a>.</p>'+
        '</div>').dialog({modal:true});
    }
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
          var tmp = kv[1].match(/([A-Za-z0-9\-_]+)([A-Za-z0-9\-_])/);
          var decode_coords = function(str) {
            var coords_cpr = Base64.decodeNum(str);
            var res = {};
            res.lat = coords_cpr % (180*100000) / 100000 - 90;
            res.lng = Math.floor(coords_cpr / (180*100000)) / 100000 - 180;
            return res;
          }
          var coords = decode_coords(tmp[1]);
          settings.coords_zoom = Base64.decodeNum(tmp[2]);
          settings.coords_lat = coords.lat;
          settings.coords_lon = coords.lng;
          override_use_html5_coords = true;
        }
        if (kv[0] == "C") { // map center & zoom (uncompressed)
          var tmp = kv[1].match(/(-?[\d.]+);(-?[\d.]+);(\d+)/);
          settings.coords_lat = +tmp[1];
          settings.coords_lon = +tmp[2];
          settings.coords_zoom = +tmp[3];
          override_use_html5_coords = true;
        }
        if (kv[0] == "R") { // indicates that the supplied query shall be executed immediately
          ide.run_query_on_startup = true;
        }
      }
      settings.save();
    }

    // init codemirror
    $("#editor textarea")[0].value = settings.code["overpass"];
    if (settings.use_rich_editor) {
      pending=0;
      CodeMirror.defineMIME("text/x-overpassQL", {
        name: "clike",
        keywords: (function(str){var r={}; var a=str.split(" "); for(var i=0; i<a.length; i++) r[a[i]]=true; return r;})(
          "out json xml custom popup timeout maxsize" // initial declarations
          +" relation way node is_in area around user uid newer poly" // queries
          +" out meta quirks body skel ids qt asc" // actions
          //+"r w n br bw" // recursors
          +" bbox" // overpass ide shortcut(s)
        ),
      });
      CodeMirror.defineMIME("text/x-overpassXML", 
        "xml"
      );
      CodeMirror.defineMode("xml+mustache", function(config) {
        return CodeMirror.multiplexingMode(
          CodeMirror.getMode(config, "xml"),
          {open: "{{", close: "}}",
           mode: CodeMirror.getMode(config, "text/plain"),
           delimStyle: "mustache"}
        );
      });
      CodeMirror.defineMode("ql+mustache", function(config) {
        return CodeMirror.multiplexingMode(
          CodeMirror.getMode(config, "text/x-overpassQL"),
          {open: "{{", close: "}}",
           mode: CodeMirror.getMode(config, "text/plain"),
           delimStyle: "mustache"}
        );
      });
      codeEditor = CodeMirror.fromTextArea($("#editor textarea")[0], {
        //value: settings.code["overpass"],
        lineNumbers: true,
        lineWrapping: true,
        mode: "text/plain",
        onChange: function(e) {
          clearTimeout(pending);
          pending = setTimeout(function() {
            if (ide.getQueryLang() == "xml") {
              if (e.getOption("mode") != "xml+mustache") {
                e.closeTagEnabled = true;
                e.setOption("matchBrackets",false);
                e.setOption("mode","xml+mustache");
              }
            } else {
              if (e.getOption("mode") != "ql+mustache") {
                e.closeTagEnabled = false;
                e.setOption("matchBrackets",true);
                e.setOption("mode","ql+mustache");
              }
            }
          },500);
          settings.code["overpass"] = e.getValue();
          settings.save();
        },
        closeTagEnabled: true,
        closeTagIndent: ["osm-script","query","union","foreach"],
        extraKeys: {
          "'>'": function(cm) {cm.closeTag(cm, '>');},
          "'/'": function(cm) {cm.closeTag(cm, '/');},
        },
      });
      codeEditor.getOption("onChange")(codeEditor);
    } else {
      codeEditor = $("#editor textarea")[0];
      codeEditor.getValue = function() {
        return this.value;
      };
      codeEditor.setValue = function(v) {
        this.value = v;
      };
      codeEditor.lineCount = function() {
        return this.value.split(/\r\n|\r|\n/).length;
      };
      codeEditor.setLineClass = function() {};
      $("#editor textarea").bind("input change", function(e) {
        settings.code["overpass"] = e.target.getValue();
        settings.save();
      });
    }
    ide.dataViewer = CodeMirror($("#data")[0], {
      value:'no data loaded yet', 
      lineNumbers: true, 
      readOnly: true,
      mode: "javascript",
    });

    // init leaflet
    ide.map = new L.Map("map", {
      attributionControl:false,
      minZoom:4,
      maxZoom:18,
    });
    var tilesUrl = settings.tile_server;//"http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    var tilesAttrib = '&copy; OpenStreetMap.org contributors&ensp;<small>Data:ODbL, Map:cc-by-sa</small>';
    var tiles = new L.TileLayer(tilesUrl,{
      attribution:tilesAttrib,
    });
    attribControl = new L.Control.Attribution({prefix:""});
    attribControl.addAttribution(tilesAttrib);
    var pos = new L.LatLng(settings.coords_lat,settings.coords_lon);
    ide.map.setView(pos,settings.coords_zoom).addLayer(tiles);
    ide.map.tile_layer = tiles;
    // inverse opacity layer
    ide.map.inv_opacity_layer = L.tileLayer("data:image/gif;base64,R0lGODlhAQABAIAAAP7//wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==")
      .setOpacity(1-settings.background_opacity)
    if (settings.background_opacity != 1)
      ide.map.inv_opacity_layer.addTo(ide.map);
    scaleControl = new L.Control.Scale({metric:true,imperial:false,});
    scaleControl.addTo(ide.map);
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
        if (!ide.waiter.opened) {
          ide.waiter.open();
          ide.waiter.ajaxAutoOpened = true;
        }
      },
      ajaxStop: function() {
        if (ide.waiter.ajaxAutoOpened) {
          ide.waiter.close();
          delete ide.waiter.AjaxAutoOpened;
        }
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
        link.href = 'javascript:return false;';
        link.title = "zoom onto data";
        L.DomEvent.addListener(link, 'click', function() {
          try {ide.map.fitBounds(ide.map.geojsonLayer.getBounds()); } catch (e) {}  
        }, ide.map);
        link = L.DomUtil.create('a', "leaflet-control-buttons-myloc", container);
        $('<span class="ui-icon ui-icon-radio-off"/>').appendTo($(link));
        link.href = 'javascript:return false;';
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
        link = L.DomUtil.create('a', "leaflet-control-buttons-bboxfilter", container);
        $('<span class="ui-icon ui-icon-image"/>').appendTo($(link));
        link.href = 'javascript:return false;';
        link.title = "manually select bbox";
        L.DomEvent.addListener(link, 'click', function(e) {
          if (!ide.map.bboxfilter.isEnabled()) {
            ide.map.bboxfilter.setBounds(ide.map.getBounds());
            ide.map.bboxfilter.enable();
          } else {
            ide.map.bboxfilter.disable();
          }
          $(e.target).toggleClass("ui-icon-circlesmall-close");
          $(e.target).toggleClass("ui-icon-image");
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
        $('<span class="ui-icon ui-icon-search" style="position:absolute; right:3px; top:3px; opacity:0.5;"/>').click(function(e) {$(this).prev().autocomplete("search");}).insertAfter(inp);
        inp.id = "search";
        // hack against focus stealing leaflet :/
        inp.onclick = function() {this.focus();}
        // autocomplete functionality
        $(inp).autocomplete({
          source: function(request,response) {
            // ajax (GET) request to nominatim
            $.ajax("http://nominatim.openstreetmap.org/search"+"?X-Requested-With="+ide.appname, {
              data:{
                format:"json",
                q: request.term
              },
              success: function(data) {
                response($.map(data,function(item) {
                  return {label:item.display_name, value:item.display_name,lat:item.lat,lon:item.lon,}
                }));
              },
              error: function() {
                // todo: better error handling
                alert("An error occured while contacting the osm search server nominatim.openstreetmap.org :(");
              },
            });
          },
          minLength: 2,
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
        $(inp).autocomplete("option","delay",2000000000); // do not do this at all
        $(inp).autocomplete().keypress(function(e) {if (e.which==13) $(this).autocomplete("search");});
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
   
    ide.map.bboxfilter = new L.LocationFilter({enable:!true,adjustButton:false,enableButton:false,}).addTo(ide.map);


    ide.map.on("popupopen popupclose",function(e) {
      if (typeof e.popup.layer != "undefined") {
        var layer = e.popup.layer;
        var layer_fun;
        if (e.type == "popupopen")
          layer_fun = function(l) {
            l.setStyle({color:"#f50",_color:l.options["color"]});
          };
        else // e.type == "popupclose"
          layer_fun = function(l) {
            l.setStyle({color:l.options["_color"]});
            delete l.options["_color"];
          };
        if (typeof layer.eachLayer == "function")
          layer.eachLayer(layer_fun);
        else
          layer_fun(layer);
      }
    });

    // load optional js libraries asynchronously
    $("script[lazy-src]").each(function(i,s) { s.setAttribute("src", s.getAttribute("lazy-src")); s.removeAttribute("lazy-src"); });

    // close startup waiter
    ide.waiter.close();
    $(".modal .wait-info h4").text("processing query...");

    // automatically load help, if this is the very first time the IDE is started
    if (settings.first_time_visit === true && ide.run_query_on_startup !== true)
      ide.onHelpClick();
    // run the query immediately, if the appropriate flag was set.
    if (ide.run_query_on_startup === true)
      overpass.update_map();
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

  // == public sub objects ==

  this.waiter = {
    opened: false,
    open: function(show_info) {
      if (show_info) {
        $(".wait-info").show();
      } else {
        $(".wait-info").hide();
      }
      $("body").addClass("loading");
      ide.waiter.opened = true;
    },
    close: function() {
      $("body").removeClass("loading");
      $(".wait-info ul li").remove();
      delete ide.waiter.onAbort;
      ide.waiter.opened = false;
    },
    addInfo: function(txt, abortCallback) {
      $("#aborter").remove(); // remove previously added abort button, which cannot be used anymore.
      $(".wait-info ul li:nth-child(n+1)").css("opacity",0.5);
      $(".wait-info ul li:nth-child(n+4)").hide();
      var li = $("<li>"+txt+"</li>");
      if (typeof abortCallback == "function") {
        ide.waiter.onAbort = abortCallback;
        li.append('<span id="aborter">&nbsp;(<a href="#" onclick="ide.waiter.abort(); return false;">abort</a>)</span>');
      }
      $(".wait-info ul").prepend(li);
    },
    abort: function() {
      if (typeof ide.waiter.onAbort == "function")
        ide.waiter.onAbort();
      ide.waiter.close();
    },
  };

  // == public methods ==

  // returns the current visible bbox as a bbox-query
  this.map2bbox = function(lang) {
    var bbox;
    if (!ide.map.bboxfilter.isEnabled())
      bbox = this.map.getBounds();
    else
      bbox = ide.map.bboxfilter.getBounds();
    if (lang=="OverpassQL")
      return bbox.getSouthWest().lat+','+bbox.getSouthWest().lng+','+bbox.getNorthEast().lat+','+bbox.getNorthEast().lng;
    else if (lang=="xml")
      return 's="'+bbox.getSouthWest().lat+'" w="'+bbox.getSouthWest().lng+'" n="'+bbox.getNorthEast().lat+'" e="'+bbox.getNorthEast().lng+'"';
  }
  // returns the current visible map center as a coord-query
  this.map2coord = function(lang) {
    var center = this.map.getCenter();
    if (lang=="OverpassQL")
      return center.lat+','+center.lng;
    else if (lang=="xml")
      return 'lat="'+center.lat+'" lon="'+center.lng+'"';
  }
  /*this returns the current query in the editor.
   * processed (boolean, optional, default: false): determines weather shortcuts should be expanded or not.
   * trim_ws (boolean, optional, default: true): if false, newlines and whitespaces are not touched.*/
  this.getQuery = function(processed,trim_ws) {
    var query = codeEditor.getValue();
    if (processed) {
      // preproces query
      var const_defs = query.match(/{{[a-zA-Z0-9_]+=.+?}}/gm);
      if ($.isArray(const_defs))
        for (var i=0; i<const_defs.length; i++) {
          var const_def = const_defs[i].match(/{{(.+?)=(.+)}}/);
          query = query.replace(const_defs[i],""); // remove constant definition
          query = query.replace(new RegExp("{{"+const_def[1]+"}}","g"),const_def[2]); // expand defined constants
        }
      query = query.replace(/{{bbox}}/g,ide.map2bbox(this.getQueryLang())); // expand bbox
      query = query.replace(/{{center}}/g,ide.map2coord(this.getQueryLang())); // expand map center
      // ignore unknown mustache templates:
      query = query.replace(/{{[\S\s]*?}}/gm,"");
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
  this.getQueryLang = function() {
    // note: cannot use this.getQuery() here, as this function is required by that.
    if (codeEditor.getValue().replace(/{{.*?}}/g,"").trim().match(/^</))
      return "xml";
    else
      return "OverpassQL";
  }
  this.highlightError = function(line) {
    codeEditor.setLineClass(line-1,null,"errorline");
  }
  this.resetErrors = function() {
    for (var i=0; i<codeEditor.lineCount(); i++)
      codeEditor.setLineClass(i,null,null);
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
          '<a href="" onclick="ide.loadExample(\''+htmlentities(example)+'\'); $(this).parents(\'.ui-dialog-content\').dialog(\'close\'); return false;">'+example+'</a>'+
          '<a href="" onclick="ide.removeExample(\''+htmlentities(example)+'\',this); return false;"><span class="ui-icon ui-icon-close" style="display:inline-block;"/></a>'+
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
    this.resetErrors();
    overpass.update_map();
  }
  var compose_share_link = function(query,compression,coords,run) {
    var share_link = "";
    if (!compression) { // compose uncompressed share link
      share_link += "?Q="+encodeURIComponent(query);
      if (coords)
        share_link += "&C="+L.Util.formatNum(ide.map.getCenter().lat)+";"+L.Util.formatNum(ide.map.getCenter().lng)+";"+ide.map.getZoom();
      if (run)
        share_link += "&R";
    } else { // compose compressed share link
      share_link += "?q="+encodeURIComponent(Base64.encode(lzw_encode(query)));
      if (coords) {
        var encode_coords = function(lat,lng) {
          var coords_cpr = Base64.encodeNum( Math.round((lat+90)*100000) + Math.round((lng+180)*100000)*180*100000 );
          return "AAAAAAAA".substring(0,9-coords_cpr.length)+coords_cpr;
        }
        share_link += "&c="+encode_coords(ide.map.getCenter().lat, ide.map.getCenter().lng)+Base64.encodeNum(ide.map.getZoom());
      }
      if (run)
        share_link += "&R";
    }
    return share_link;
  }
  this.updateShareLink = function() {
    var baseurl=location.protocol+"//"+location.host+location.pathname;
    var query = codeEditor.getValue();
    var compress = ((settings.share_compression == "auto" && query.length > 300) ||
        (settings.share_compression == "on"))
    var inc_coords = $("div#share-dialog input[name=include_coords]")[0].checked;
    var run_immediately = $("div#share-dialog input[name=run_immediately]")[0].checked;

    var share_link = baseurl+compose_share_link(query,compress,inc_coords,run_immediately);

    var warning = '';
    if (share_link.length >= 2000)
      warning = '<p style="color:orange">Warning: This share-link is quite long. It may not work under certain circumstances</a> (browsers, webservers).</p>';
    if (share_link.length >= 8000)
      warning = '<p style="color:red">Warning: This share-link is very long. It is likely to fail under normal circumstances (browsers, webservers). Use with caution.</p>';

    $("div#share-dialog #share_link_warning").html(warning);
    $("div#share-dialog #share_link_a")[0].href=share_link;
    $("div#share-dialog #share_link_textarea")[0].value=share_link;
  }
  this.onShareClick = function() {
    $("div#share-dialog input[name=include_coords]")[0].checked = settings.share_include_pos;
    ide.updateShareLink();
    $("div#share-dialog").dialog({
      modal:true,
      buttons: {
        "done": function() {$(this).dialog("close");}
      }
    });
  }
  this.onExportClick = function() {
    // prepare export dialog
    var query = ide.getQuery(true);
    var baseurl=location.protocol+"//"+location.host+location.pathname.match(/.*\//)[0];
    $("#export-dialog a#export-interactive-map")[0].href = baseurl+"map.html?Q="+encodeURIComponent(query);
    $("#export-dialog a#export-overpass-openlayers")[0].href = settings.server+"convert?data="+encodeURIComponent(query)+"&target=openlayers";
    $("#export-dialog a#export-overpass-api")[0].href = settings.server+"interpreter?data="+encodeURIComponent(query);
    $("#export-dialog a#export-text")[0].href = "data:text/plain;charset=\""+(document.characterSet||document.charset)+"\";base64,"+Base64.encode(ide.getQuery(true,false),true);
    $("#export-dialog a#export-map-state").unbind("click").bind("click",function() {
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
    $("#export-dialog a#export-geoJSON").on("click", function() {
      var geoJSON_str;
      if (!overpass.geoJSON_data)
        geoJSON_str = "No geoJSON data available! Please run a query first.";
      else
        geoJSON_str = JSON.stringify(overpass.geoJSON_data, undefined, 2);
      var d = $("#export-geojson");
      $("textarea",d)[0].value=geoJSON_str;
      d.dialog({
        modal:true,
        width:500,
        buttons: {
          "close": function() {$(this).dialog("close");}
        },
      });
      return false;
    });
    $("#export-dialog a#export-convert-xml")[0].href = settings.server+"convert?data="+encodeURIComponent(query)+"&target=xml";
    $("#export-dialog a#export-convert-ql")[0].href = settings.server+"convert?data="+encodeURIComponent(query)+"&target=mapql";
    $("#export-dialog a#export-convert-compact")[0].href = settings.server+"convert?data="+encodeURIComponent(query)+"&target=compact";
    $("#export-dialog a#export-josm").click(function() {
      //$(this).parents("div.ui-dialog-content").first().dialog("close");
      var export_dialog = $(this).parents("div.ui-dialog-content").first();
      var JRC_url="http://127.0.0.1:8111/";
      $.getJSON(JRC_url+"version")
      .success(function(d,s,xhr) {
        if (d.protocolversion.major == 1) {
          $.get(JRC_url+"import", {
            url: settings.server+"interpreter?data="+encodeURIComponent(ide.getQuery(true,true)),
          }).error(function(xhr,s,e) {
            alert("Error: Unexpected JOSM remote control error.");
          }).success(function(d,s,xhr) {
            export_dialog.dialog("close");
          });
        } else {
          $('<div title="Remote Control Error"><p>Error: incompatible JOSM remote control version: '+d.protocolversion.major+"."+d.protocolversion.minor+" :(</p></div>").dialog({
            modal:true,
            width:350,
            buttons: {
              "OK": function() {$(this).dialog("close");}
            }
          });
        }
      }).error(function(xhr,s,e) {
        $('<div title="Remote Control Error"><p>Remote control not found. :( Make sure JOSM is already started and properly configured.</p></div>').dialog({
          modal:true,
          width:350,
          buttons: {
            "OK": function() {$(this).dialog("close");}
          }
        });
      });
      return false;
    });
    // open the export dialog
    $("#export-dialog").dialog({
      modal:true,
      width:350,
      buttons: {
        "done": function() {$(this).dialog("close");}
      }
    });
  }
  this.onExportImageClick = function() {
    $("body").addClass("loading");
    // 1. render canvas from map tiles
    // hide map controlls in this step :/
    $("#map .leaflet-control-container .leaflet-top").hide();
    $('a[title="Zoom in"]').removeClass("leaflet-control-zoom-in");
    $('a[title="Zoom out"]').removeClass("leaflet-control-zoom-out");
    if (settings.export_image_attribution) attribControl.addTo(ide.map);
    if (!settings.export_image_scale) scaleControl.removeFrom(ide.map);
    // try to use crossOrigin image loading. osm tiles should be served with the appropriate headers -> no need of bothering the proxy
    $("#map").html2canvas({useCORS:true, allowTaint:false, onrendered: function(canvas) {
      if (settings.export_image_attribution) attribControl.removeFrom(ide.map);
      if (!settings.export_image_scale) scaleControl.addTo(ide.map);
      $('a[title="Zoom in"]').addClass("leaflet-control-zoom-in");
      $('a[title="Zoom out"]').addClass("leaflet-control-zoom-out");
      $("#map .leaflet-control-container .leaflet-top").show();
      // 2. render overlay data onto canvas
      canvas.id = "render_canvas";
      var ctx = canvas.getContext("2d");
      // get geometry for svg rendering
      var height = $("#map .leaflet-overlay-pane svg").height();
      var width  = $("#map .leaflet-overlay-pane svg").width();
      var tmp = $("#map .leaflet-map-pane")[0].style.cssText.match(/.*?(-?\d+)px.*?(-?\d+)px.*/);
      var offx   = +tmp[1];
      var offy   = +tmp[2];
      if ($("#map .leaflet-overlay-pane").html().length > 0)
        ctx.drawSvg($("#map .leaflet-overlay-pane").html(),offx,offy,width,height);
      // 3. export canvas as html image
      var imgstr = canvas.toDataURL("image/png");
      var attrib_message = "";
      if (!settings.export_image_attribution)
        attrib_message = '<p style="font-size:smaller; color:orange;">Make sure to include proper attributions when distributing this image!</p>';
      $('<div title="Export Image" id="export_image_dialog"><p><img src="'+imgstr+'" alt="the exported map" width="480px"/><a href="'+imgstr+'" download="export.png">Download</a></p>'+attrib_message+'</div>').dialog({
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
    $("#settings-dialog input[name=force_simple_cors_request]")[0].checked = settings.force_simple_cors_request;
    $("#settings-dialog input[name=use_html5_coords]")[0].checked = settings.use_html5_coords;
    $("#settings-dialog input[name=use_rich_editor]")[0].checked = settings.use_rich_editor;
    // sharing options
    $("#settings-dialog input[name=share_include_pos]")[0].checked = settings.share_include_pos;
    $("#settings-dialog input[name=share_compression]")[0].value = settings.share_compression;
    make_combobox($("#settings-dialog input[name=share_compression]"),["auto","on","off"]);
    // map settings
    $("#settings-dialog input[name=tile_server]")[0].value = settings.tile_server;
    make_combobox($("#settings-dialog input[name=tile_server]"), [
      "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      //"http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png",
      //"http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png",
      //"http://{s}.tile3.opencyclemap.org/landscape/{z}/{x}/{y}.png",
      //"http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg",
      //"http://oatile1.mqcdn.com/naip/{z}/{x}/{y}.jpg",
    ]);
    $("#settings-dialog input[name=background_opacity]")[0].value = settings.background_opacity;
    $("#settings-dialog input[name=enable_crosshairs]")[0].checked = settings.enable_crosshairs;
    $("#settings-dialog input[name=export_image_scale]")[0].checked = settings.export_image_scale;
    $("#settings-dialog input[name=export_image_attribution]")[0].checked = settings.export_image_attribution;
    // open dialog
    $("#settings-dialog").dialog({
      modal:true,
      width:400,
      buttons: {
        "Save": function() {
          // save settings
          settings.server = $("#settings-dialog input[name=server]")[0].value;
          settings.force_simple_cors_request = $("#settings-dialog input[name=force_simple_cors_request]")[0].checked;
          settings.use_html5_coords = $("#settings-dialog input[name=use_html5_coords]")[0].checked;
          settings.use_rich_editor  = $("#settings-dialog input[name=use_rich_editor]")[0].checked;
          settings.share_include_pos = $("#settings-dialog input[name=share_include_pos]")[0].checked;
          settings.share_compression = $("#settings-dialog input[name=share_compression]")[0].value;
          var prev_tile_server = settings.tile_server;
          settings.tile_server = $("#settings-dialog input[name=tile_server]")[0].value;
          // update tile layer (if changed)
          if (prev_tile_server != settings.tile_server)
            ide.map.tile_layer.setUrl(settings.tile_server);
          var prev_background_opacity = settings.background_opacity;
          settings.background_opacity = +$("#settings-dialog input[name=background_opacity]")[0].value;
          // update background opacity layer
          if (settings.background_opacity != prev_background_opacity)
            if (settings.background_opacity == 1)
              ide.map.removeLayer(ide.map.inv_opacity_layer);
            else
              ide.map.inv_opacity_layer.setOpacity(1-settings.background_opacity).addTo(ide.map);
          settings.enable_crosshairs = $("#settings-dialog input[name=enable_crosshairs]")[0].checked;
          $(".crosshairs").toggle(settings.enable_crosshairs); // show/hide crosshairs
          settings.export_image_scale = $("#settings-dialog input[name=export_image_scale]")[0].checked;
          settings.export_image_attribution = $("#settings-dialog input[name=export_image_attribution]")[0].checked;
          settings.save();
          $(this).dialog("close");
        },
        /*"Reset": function() {
          alert("not jet implemented"); // todo: reset all settings
        },*/
      }
    });
    $("#settings-dialog").accordion();
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










