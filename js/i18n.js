// global i18n object

var i18n = new(function() {
  var settings = turbo.settings();
  var default_lng = "en";
  var supported_lngs = [
    default_lng, // default language
    "de", // translations found in locale/de.js
  ];
  this.translate = function() {
    var lng = settings.ui_language;
    if (lng == "auto") {
      // get user agent's language
      try {
        lng = navigator.language.replace(/-.*/,"").toLowerCase();
      } catch(e) {}

      if (!_contains(supported_lngs,lng)) {
        lng = default_lng;
        return false;
      }
    }
    if (lng == default_lng)
      return true; // nothing to do here :)

    // load language pack
    var lng_file = "locales/"+lng+".js";
    $.ajax(lng_file,{async:false,dataType:"json"}).success(function(data){
      td = $.extend(td,data);
      i18n.translate_ui();
      // todo: nicer implementation
    }).error(function(){
      console.log("failed to load language file: "+lng_file);
    });
  }
  this.translate_ui = function() {
    // look for all object with the class "t"
    $(".t").each(function(nr,element) {
      // get translation term(s)
      var terms = $(element).attr("t");
      terms = terms.split(";");
      for (var i=0; i<terms.length; i++) {
        var term = terms[i];
        var tmp = term.match(/^(\[(.*)\])?(.*)$/);
        var what = tmp[2];
        var key  = tmp[3];
        var val = td[key];
        if (what === "html") {
          $(element).html(val);
        } else if (what !== undefined) {
          $(element).attr(what,val);
        } else {
          $(element).text(val);
        }
      }
    });
  }
  this.t = function(key) {
    return td[key];
  }

  // default texts
  var td = {
    "map_controlls.zoom_to_data": "zoom to data",
    "map_controlls.localize_user": "locate me!",
    "map_controlls.select_bbox": "manually select bbox",
    "map_controlls.toggle_wide_map": "toggle wide map",
    "map_controlls.clear_data": "clear data overlay",

    "dialog.dismiss": "dismiss",
    "dialog.cancel": "cancel",
    "dialog.save": "save",
    "dialog.delete": "delete",
    "dialog.close": "close",
    "dialog.done": "done",
    "dialog.abort": "abort",
    "dialog.repair_query": "repair query",
    "dialog.continue_anyway": "continue anyway",
    "dialog.show_data": "show data",

    "dialog.delete_query.title": "Delete Query?",
    "dialog.delete_query.expl": "Do you really want to delete the following query",

    "load.delete_query": "delete this query",
    "load.no_saved_query": "no saved query yet",

    "error.query.title": "Query Error",
    "error.query.expl": "An error occured during the execution of the overpass query! This is what overpass API returned:",
    "error.ajax.title": "Ajax Error",
    "error.ajax.expl": "An error occured during the execution of the overpass query!",
    "error.mapcss.title": "MapCSS Error",
    "error.mapcss.expl": "Invalid MapCSS stylesheet:",
    "error.remote.title": "Remote Control Error",
    "error.remote.incompat": "Error: incompatible JOSM remote control version",
    "error.remote.not_found": "Remote control not found. :( Make sure JOSM is already running and properly configured.",

    "warning.browser.title": "Your browser is not supported :(",
    "warning.browser.expl.1": "<p>The browser you are currently using, is (most likely) not capable of running (significant parts of) this Application. <small>It must support <a href=\"http://en.wikipedia.org/wiki/Web_storage#localStorage\">Web Storage API</a> and <a href=\"http://en.wikipedia.org/wiki/Cross-origin_resource_sharing\">cross origin resource sharing (CORS)</a>.</small></p>",
    "warning.browser.expl.2": "<p>Note that you may have to enable cookies and/or \"local Data\" for this site on some browsers (such as Firefox and Chrome).</p>",
    "warning.browser.expl.3": "<p>Please upgrade to a more up-to-date version of your browser or switch to a more capable one! Recent versions of <a href=\"http://www.opera.com\">Opera</a>, <a href=\"http://www.google.com/intl/de/chrome/browser/\">Chrome</a> and <a href=\"http://www.mozilla.org/de/firefox/\">Firefox</a> have been tested to work. Alternatively, you can still use the <a href=\"http://overpass-api.de/query_form.html\">Overpass_API query form</a>.</p>",

    "warning.incomplete.title": "Incomplete Data",
    "warning.incomplete.expl": "<p>This query returned no nodes. In OSM, only nodes contain coordinates. For example, a way cannot be displayed without its nodes.</p><p>If this is not what you meant to get, <i>overpass tubo</i> can help you to repair (auto-complete) the query by choosing \"repair query\" below. Otherwise you can continue to the data.</p>",
    "warning.incomplete.not_again": "do not show this message again.",
    "warning.incomplete.remote": "<p>It looks like if this query will not return OSM data in XML format with metadata. Editors like JOSM require the data to be in that format, though.</p><p><i>overpass turbo</i> can help you to correct the query by choosing \"repair query\" below.</p>",

    "warning.share.long": "Warning: This share-link is quite long. It may not work under certain circumstances",
    "warning.share.very_long": "Warning: This share-link is very long. It is likely to fail under normal circumstances (browsers, webservers). Use with caution!",

    "warning.huge_data.title": "Large amounts of data",
    "warning.huge_data.expl": "<p>This query returned quite a lot of data (approx. {{amount_txt}}).</p><p>Your browser may have a hard time trying to render this. Do you really want to continue?</p>",

    "waiter.processing_query": "processing query...",
    "waiter.export_as_image": "exporting as image...",

    "export.map_view.title": "Current Map View",
    "export.map_view.permalink_osm": "<h4>Permalink</h4> to",
    "export.map_view.center": "Center",
    "export.map_view.center_expl": "lat/lon",
    "export.map_view.bounds": "Bounds",
    "export.map_view.bounds_selection": "Bounds (manually selected bbox)",
    "export.map_view.bounds_expl": "south/west north/east",
    "export.map_view.zoom": "Zoom",

    "export.geoJSON.no_data": "No GeoJSON data available! Please run a query first.",
    "export.GPX.no_data": "No GPX data available! Please run a query first.",
    "export.raw.no_data": "No raw data available! Please run a query first.",

    "export.image.title": "Export - Image",
    "export.image.alt": "the exported map",
    "export.image.download": "Download",
    "export.image.attribution_missing": "Make sure to include proper attributions when distributing this image!",

    "data_stats.loaded": "Loaded",
    "data_stats.displayed": "Displayed",
    "data_stats.nodes": "nodes",
    "data_stats.ways": "ways",
    "data_stats.relations": "relations",
    "data_stats.areas": "areas",
    "data_stats.pois": "pois",
    "data_stats.lines": "lines",
    "data_stats.polygons": "polygons",

    "map.intentianally_blank": "This map intentionally left blank.",

    "the end":""
  };
})(); // end create i18n object













