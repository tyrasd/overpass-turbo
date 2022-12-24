// escape strings to show them directly in the html.
import $ from "jquery";
import L from "leaflet";

// include the CSS files
import "leaflet/dist/leaflet.css";
import "../css/map.css";

import configs from "./configs";
import overpass from "./overpass";
import Query from "./query";

$(document).ready(() => {
  // main map cache
  const cache = {};

  window.addEventListener(
    "message",
    (evt) => {
      const data = typeof evt.data === "string" ? JSON.parse(evt.data) : {};
      switch (data.cmd) {
        case "update_map":
          settings.code["overpass"] = data.value[0];
          ide.update_map();
          break;
        case "cache":
          settings.code["overpass"] = data.value[0];
          ide.getQuery((query) => {
            const query_lang = ide.getQueryLang();
            overpass.run_query(
              query,
              query_lang,
              cache,
              true,
              undefined,
              ide.mapcss
            );
          });
          break;
      }
    },
    false
  );

  // some initalizations
  $.fn.dialog = function () {
    alert(`error :( ${$(this).html()}`);
  };
  configs.appname = "overpass-ide-map";
  const settings = {
    code: {},
    server: configs.defaultServer,
    tileServer: configs.defaultTiles,
    force_simple_cors_request: true,
    disable_poiomatic: false
  };
  const ide = {
    getQuery: function (callback) {
      const query = settings.code["overpass"];
      const queryParser = Query();

      queryParser.parse(query, {}, (query) => {
        // parse mapcss declarations
        let mapcss = "";
        if (queryParser.hasStatement("style"))
          mapcss = queryParser.getStatement("style");
        ide.mapcss = mapcss;
        // parse data-source statements
        let data_source = null;
        if (queryParser.hasStatement("data")) {
          data_source = queryParser.getStatement("data");
          data_source = data_source.split(",");
          const data_mode = data_source[0].toLowerCase();
          data_source = data_source.slice(1);
          const options = {};
          for (let i = 0; i < data_source.length; i++) {
            const tmp = data_source[i].split("=");
            options[tmp[0]] = tmp[1];
          }
          data_source = {
            mode: data_mode,
            options: options
          };
        }
        ide.data_source = data_source;
        // remove newlines
        query = query.trim();

        // call result callback
        callback(query);
      });
    },
    getQueryLang: function () {
      return $.trim(settings.code["overpass"]).match(/^</)
        ? "xml"
        : "OverpassQL";
    },
    update_map: function () {
      $("#data_stats").remove();
      if (typeof overpass.osmLayer != "undefined")
        ide.map.removeLayer(overpass.osmLayer);
      ide.getQuery((query) => {
        const query_lang = ide.getQueryLang();
        overpass.run_query(
          query,
          query_lang,
          cache,
          false,
          undefined,
          ide.mapcss
        );
      });
      $("#map_blank").remove();
    }
  };
  overpass.init();
  // (very raw) compatibility check
  if ($.support.cors != true || false) {
    // the currently used browser is not capable of running the IDE. :(
    $(
      '<div title="Your browser is not supported :(">' +
        '<p>The browser you are currently using, is not capable of running this Application. <small>It has to support <a href="http://en.wikipedia.org/wiki/Cross-origin_resource_sharing">cross origin resource sharing (CORS)</a>.</small></p>' +
        '<p>Please update to a more up-to-date version of your browser or switch to a more capable browser! Recent versions of <a href="http://www.opera.com">Opera</a>, <a href="http://www.google.com/intl/de/chrome/browser/">Chrome</a> and <a href="http://www.mozilla.org/de/firefox/">Firefox</a> have been tested to work.</p>' +
        "</div>"
    ).dialog({modal: true});
  }
  // check for any get-parameters
  const params = new URLSearchParams(location.search.substring(1));
  // uncompressed query set in url
  settings.code["overpass"] = params.get("Q");
  // don't alert on overpass errors, but send messages to parent window
  settings.silent = params.has("silent");
  // init leaflet
  ide.map = new L.Map("map");
  const tilesUrl = settings.tileServer;
  const tilesAttrib = configs.tileServerAttribution;
  const tiles = new L.TileLayer(tilesUrl, {attribution: tilesAttrib});
  ide.map.setView([0, 0], 1).addLayer(tiles);
  const scaleControl = new L.Control.Scale({metric: true, imperial: false});
  scaleControl.addTo(ide.map);
  // wait spinner
  $(document).on({
    ajaxStart: function () {
      $("#loading-dialog").addClass("is-active");
    },
    ajaxStop: function () {
      $("#loading-dialog").removeClass("is-active");
    }
  });
  ide.map.on("layeradd", (e) => {
    if (!(e.layer instanceof L.GeoJSON)) return;
    ide.map.setView([0, 0], 18, true);
    try {
      ide.map.fitBounds(e.layer.getBounds());
    } catch (err) {}
  });
  // overpass functionality
  overpass.handlers["onEmptyMap"] = function (empty_msg) {
    $(
      `<div id="map_blank" style="z-index:1; display:block; position:absolute; top:42px; width:100%; text-align:center; background-color:#eee; opacity: 0.8;">This map intentionally left blank. <small>(${empty_msg})</small></div>`
    ).appendTo("#map");
  };
  if (settings.silent) {
    overpass.handlers["onAjaxError"] = function (errmsg) {
      parent.postMessage(
        JSON.stringify({handler: "onAjaxError", msg: errmsg}),
        "*"
      );
    };
    overpass.handlers["onQueryError"] = function (errmsg) {
      parent.postMessage(
        JSON.stringify({handler: "onQueryError", msg: errmsg}),
        "*"
      );
    };
  } else {
    overpass.handlers["onAjaxError"] = function (errmsg) {
      alert(
        `An error occured during the execution of the overpass query!\n${errmsg}`
      );
    };
    overpass.handlers["onQueryError"] = function (errmsg) {
      alert(
        `An error occured during the execution of the overpass query!\nThis is what overpass API returned:\n${errmsg}`
      );
    };
  }
  overpass.handlers["onGeoJsonReady"] = function () {
    ide.map.addLayer(overpass.osmLayer);
  };
  overpass.handlers["onPopupReady"] = function (p) {
    p.openOn(ide.map);
  };
  overpass.handlers["onDataReceived"] = function (
    amount,
    txt,
    abortCB,
    continueCB
  ) {
    continueCB();
  };
  overpass.handlers["onRawDataPresent"] = function () {
    parent.postMessage(
      JSON.stringify({
        query: settings.code["overpass"],
        resultType: overpass.resultType,
        resultText: overpass.resultText
      }),
      "*"
    );
  };
  // load the data
  ide.update_map();
});
