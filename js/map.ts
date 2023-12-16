// escape strings to show them directly in the html.
import $ from "jquery";
import "leaflet";

// include the CSS files
import "leaflet/dist/leaflet.css";
import "../css/map.css";

import configs from "./configs";
import overpass from "./overpass";
import Query from "./query";
import {parseUrlParameters} from "./urlParameters";

$(document).ready(() => {
  // main map cache
  const cache = {};

  window.addEventListener(
    "message",
    async (evt) => {
      const data = typeof evt.data === "string" ? JSON.parse(evt.data) : {};
      if (data.cmd === "update_map") {
        settings.code["overpass"] = data.value[0];
        ide.update_map();
      } else if (data.cmd === "cache") {
        settings.code["overpass"] = data.value[0];
        const query = await ide.getQuery();
        const query_lang = ide.getQueryLang();
        overpass.run_query(
          query,
          query_lang,
          cache,
          true,
          undefined,
          ide.mapcss
        );
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
    silent: false,
    force_simple_cors_request: true,
    disable_poiomatic: false
  };
  const ide = {
    map: undefined as unknown as L.Map,
    mapcss: "",
    async getQuery(): Promise<string> {
      let query = settings.code["overpass"];
      const queryParser = new Query();
      query = await queryParser.parse(query, {});
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
        for (const src of data_source) {
          const tmp = src.split("=");
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

      return query;
    },
    getQueryLang() {
      return $.trim(settings.code["overpass"]).match(/^</)
        ? "xml"
        : "OverpassQL";
    },
    async update_map() {
      $("#data_stats").remove();
      if (typeof overpass.osmLayer != "undefined")
        ide.map.removeLayer(overpass.osmLayer);
      const query = await ide.getQuery();
      const query_lang = ide.getQueryLang();
      overpass.run_query(
        query,
        query_lang,
        cache,
        false,
        undefined,
        ide.mapcss
      );
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
  const params = parseUrlParameters();
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
    ajaxStart() {
      $("#loading-dialog").addClass("is-active");
    },
    ajaxStop() {
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
  overpass.handlers["onEmptyMap"] = (empty_msg) => {
    $(
      `<div id="map_blank" style="z-index:700; display:block; position:absolute; top:50px; width:100%; text-align:center; background-color:#eee; opacity: 0.8;">This map intentionally left blank. <small>(${empty_msg})</small></div>`
    ).appendTo("#map");
  };
  if (settings.silent) {
    overpass.handlers["onAjaxError"] = (errmsg) => {
      parent.postMessage(
        JSON.stringify({handler: "onAjaxError", msg: errmsg}),
        "*"
      );
    };
    overpass.handlers["onQueryError"] = (errmsg) => {
      parent.postMessage(
        JSON.stringify({handler: "onQueryError", msg: errmsg}),
        "*"
      );
    };
  } else {
    overpass.handlers["onAjaxError"] = (errmsg) => {
      alert(
        `An error occured during the execution of the overpass query!\n${errmsg}`
      );
    };
    overpass.handlers["onQueryError"] = (errmsg) => {
      alert(
        `An error occured during the execution of the overpass query!\nThis is what overpass API returned:\n${errmsg}`
      );
    };
  }
  overpass.handlers["onGeoJsonReady"] = () => {
    ide.map.addLayer(overpass.osmLayer);
  };
  overpass.handlers["onPopupReady"] = (p) => {
    p.openOn(ide.map);
  };
  overpass.handlers["onDataReceived"] = (amount, txt, abortCB, continueCB) => {
    continueCB();
  };
  overpass.handlers["onRawDataPresent"] = () => {
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
