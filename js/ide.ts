import {Canvg} from "canvg";
import CodeMirror from "codemirror";
import {default as colorbrewer} from "colorbrewer";
import colormap from "colormap";
import html2canvas from "html2canvas";
import "leaflet";
import $ from "jquery";
// global ide object
import debounce from "lodash/debounce";
import togpx from "togpx";
import tokml from "tokml";

import Autorepair from "./autorepair";
//import { schemegroups as colorbrewer } from "colorbrewer";
import configs from "./configs";
import {
  ffs_construct_query,
  ffs_invalidateCache,
  ffs_repair_search
} from "./ffs";
import i18n from "./i18n";
import {Base64, htmlentities, lzw_encode, lzw_decode} from "./misc";
import overpass, {type QueryLang} from "./overpass";
import Query from "./query";
import settings from "./settings";
import shortcuts, {Shortcut} from "./shortcuts";
import sync from "./sync-with-osm";
import urlParameters from "./urlParameters";

declare module "leaflet" {
  // leaflet.locationfilter ships no type definitions
  // eslint-disable-next-line no-unused-vars
  class LocationFilter extends Layer {
    constructor(options?: {
      enable?: boolean;
      adjustButton?: boolean;
      enableButton?: boolean;
    });
    isEnabled(): boolean;
    enable(): void;
    disable(): void;
    getBounds(): LatLngBounds;
    setBounds(bounds: LatLngBounds): void;
  }
}

declare global {
  // the jQuery UI widgets used by the IDE ("jquery-ui" ships no type definitions)
  interface JQuery<TElement = HTMLElement> {
    autocomplete(method: string, ...args: unknown[]): any;
    autocomplete(options: Record<string, unknown>): JQuery<TElement>;
    button(options?: Record<string, unknown>): JQuery<TElement>;
    resizable(method: string, ...args: unknown[]): any;
    resizable(options?: Record<string, unknown>): JQuery<TElement>;
    tooltip(method: string, ...args: unknown[]): any;
    tooltip(options?: Record<string, unknown>): JQuery<TElement>;
  }
}

/** a clipboard payload, keyed by MIME type */
type CopyData = Record<string, string>;

/** an item of the autocomplete source lists used by {@link make_combobox} */
type ComboboxItem = string | {value: string; label: string};

/** a button of the modal dialogs created by {@link showDialog} */
interface DialogButton {
  name: string;
  callback?: () => void;
}

/** a query saved in the user's OSM preferences (see {@link sync}) */
interface OsmSavedQuery {
  name: string;
  query: string;
}

/** the `{{data:…}}` statement of a query, e.g. `{{data:overpass,server=…}}` */
interface DataSource {
  mode: string;
  options: Record<string, string>;
}

/**
 * the subset of the CodeMirror API used by the IDE. it is also implemented by
 * the plain textarea fallback (see `settings.use_rich_editor`).
 */
interface Editor {
  getValue(): string;
  setValue(value: string): void;
  lineCount(): number;
  addLineClass(line: number, where: string, className: string): void;
  removeLineClass(line: number, where: string, className: string): void;
  getOption(option: string): unknown;
  setOption(option: string, value: unknown): void;
  on(event: string, handler: (editor: Editor) => void): void;
}

/** the leaflet map, including the layers/controls attached to it by the IDE */
export interface OverpassTurboMap extends L.Map {
  tile_layer: L.TileLayer;
  inv_opacity_layer: L.TileLayer;
  bboxfilter: import("leaflet").LocationFilter;
}

// Handler to allow copying in various MIME formats
// @see https://developer.mozilla.org/en-US/docs/Web/Events/copy
// @see https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent/clipboardData
let copyData: CopyData = undefined;
$(document).on("copy", (e) => {
  const clipboardEvent = e.originalEvent as ClipboardEvent | undefined;
  if (copyData && clipboardEvent && clipboardEvent.clipboardData) {
    Object.keys(copyData).forEach((format) => {
      clipboardEvent.clipboardData.setData(format, copyData[format]);
    });
    clipboardEvent.preventDefault();
    copyData = undefined;
  } else if (copyData && copyData["text/plain"]) {
    prompt(i18n.t("export.copy_to_clipboard"), copyData["text/plain"]);
    copyData = null;
  }
});

function make_combobox(
  input: JQuery<HTMLElement>,
  options: ComboboxItem[],
  deletables?: string[],
  deleteCallback?: (value: string) => void
): void {
  const inputElement = input[0] as HTMLElement & {is_combobox?: boolean};
  if (inputElement.is_combobox) {
    input.autocomplete("option", {source: options});
    return;
  }
  const wrapper = input.wrap("<span>").parent().addClass("ui-combobox");
  input
    .autocomplete({
      source: options,
      minLength: 0
    })
    .addClass("ui-widget ui-widget-content ui-corner-left ui-state-default")
    .autocomplete("instance")._renderItem = (
    ul: JQuery<HTMLElement>,
    item: {value: string; label: string}
  ) =>
    $("<li>")
      .append(
        deletables && deletables.indexOf(item.value) !== -1
          ? `<div title="shift-click to remove from list" style="font-style:italic;">${item.label}</div>`
          : `<div>${item.label}</div>`
      )
      .on("click", function (event) {
        if (event.shiftKey && deletables.indexOf(item.value) !== -1) {
          deleteCallback(item.value);
          $(this).remove();
          const options = input.autocomplete("option", "source");
          options.splice(options.indexOf(item), 1);
          input.autocomplete("option", "source", options);
          return false;
        }
      })
      .appendTo(ul);
  $("<a>")
    .attr("tabIndex", -1)
    .attr("title", "show all items")
    .appendTo(wrapper)
    .button({
      icons: {primary: "ui-icon-triangle-1-s"},
      text: false
    })
    .removeClass("ui-corner-all")
    .addClass("ui-corner-right ui-combobox-toggle")
    .click(() => {
      // close if already visible
      if (input.autocomplete("widget").is(":visible")) {
        input.autocomplete("close");
        return;
      }
      // pass empty string as value to search for, displaying all results
      input.autocomplete("search", "");
      input.focus();
    });
  inputElement.is_combobox = true;
} // make_combobox()

function showDialog(
  title: string,
  content: string,
  buttons: DialogButton[]
): void {
  const dialogContent = `\
      <div class="modal is-active">\
        <div class="modal-background"></div>\
        <div class="modal-card">\
          <header class="modal-card-head">\
            <p class="modal-card-title">${title}</p>\
            <button class="delete" aria-label="close"></button>\
          </header>\
          <section class="modal-card-body">\
            ${content}\
          </section>\
          <footer class="modal-card-foot">\
            <div class="level">\
              <div class="level-right">\
                <div class="level-item">\
                </div>\
              </div>\
            </div>\
          </footer>\
        </div>\
      </div>\
    `;

  // Create modal in body
  const element = $(dialogContent);
  // Handle close event
  $(".delete", element).click(() => $(element).remove());

  // Add all the buttons
  for (const index in buttons) {
    const button = buttons[index];
    $(`<button class="button">${button.name}</button>`)
      .click(() => {
        button.callback?.();
        // destroy modal dialog after callback, see #528
        $(element).remove();
      })
      .appendTo($("footer .level-item", element));
  }

  // Add the element to the body
  element.appendTo("body");
}

class IDE {
  // == private members ==
  private attribControl: L.Control.Attribution = null;
  private scaleControl: L.Control.Scale = null;
  private queryParser = new Query();
  /** `true` if the query is to be run on startup, or a callback to be invoked once its data is loaded */
  private run_query_on_startup: boolean | (() => void) = false;
  // == public members ==
  codeEditor: Editor = null;
  dataViewer: Editor = null;
  map: OverpassTurboMap = null;
  /** `true` if the browser is not capable of running the IDE */
  not_supported: boolean;
  /** the mapcss of the current query, as parsed by {@link getQuery} */
  mapcss: string;
  /** the data source of the current query, as parsed by {@link getQuery} */
  data_source: DataSource;

  // == public sub objects ==

  waiter = new (class Waiter {
    opened = true;
    frames = ["◴", "◷", "◶", "◵"];
    frameDelay = 250;
    onAbort: (done: () => void) => void = undefined;
    interval: ReturnType<typeof setInterval> = undefined;
    isAlert: boolean;
    alertFrame: string;
    _initialTitle = document.title;

    open(show_info?: string) {
      if (show_info) {
        $(".modal .wait-info h4").text(show_info);
        $(".wait-info").show();
      } else {
        $(".wait-info").hide();
      }
      $("#loading-dialog").addClass("is-active");
      document.title = `${this.frames[0]} ${this._initialTitle}`;
      let f = 0;
      this.interval = setInterval(() => {
        const title = this.isAlert
          ? this.alertFrame
          : this.frames[++f % this.frames.length];
        document.title = `${title} ${this._initialTitle}`;
      }, this.frameDelay);
      this.opened = true;
    }
    close(title_prefix = "") {
      if (!this.opened) return;
      clearInterval(this.interval);
      document.title = `${title_prefix}${this._initialTitle}`;
      $("#loading-dialog").removeClass("is-active");
      $(".wait-info ul li").remove();
      delete this.onAbort;
      this.opened = false;
    }
    addInfo(txt: string, abortCallback?: (done: () => void) => void) {
      $("#aborter").remove(); // remove previously added abort button, which cannot be used anymore.
      $(".wait-info ul li:nth-child(n+1)").css("opacity", 0.5);
      $(".wait-info ul li span.fas")
        .removeClass("fa-spinner")
        .removeClass("fa-spin")
        .addClass("fa-check");
      $(".wait-info ul li:nth-child(n+4)").hide();
      const li = $(
        `<li><span class="fas fa-spinner fa-spin" style="display:inline-block; margin-bottom:-2px; margin-right:3px;"></span>${txt}</li>`
      );
      if (typeof abortCallback == "function") {
        this.onAbort = abortCallback;
        const aborter = $(
          '<span id="aborter">&nbsp;(<a href="#">abort</a>)</span>'
        ).on("click", () => {
          this.abort();
          return false;
        });
        li.append(aborter);
      }
      $(".wait-info ul").prepend(li);
    }
    abort() {
      if (typeof this.onAbort == "function") {
        this.addInfo("aborting");
        this.onAbort(() => ide.waiter.close());
      }
    }
  })();

  // == public methods ==

  init() {
    this.waiter.addInfo("ide starting up");
    $("#overpass-turbo-version").html(
      `overpass-turbo <code>${GIT_VERSION}</code>` // eslint-disable-line no-undef
    );
    $("#overpass-turbo-dependencies").html(
      APP_DEPENDENCIES // eslint-disable-line no-undef
    );
    // (very raw) compatibility check <- TODO: put this into its own function
    if (
      // CORS support (jQuery.support.cors was removed in jQuery 4)
      typeof XMLHttpRequest !== "function" ||
      !("withCredentials" in new XMLHttpRequest()) ||
      //typeof localStorage  != "object" ||
      typeof (function () {
        let ls = undefined;
        try {
          localStorage.setItem("startup_localstorage_quota_test", "123");
          localStorage.removeItem("startup_localstorage_quota_test");
          ls = localStorage;
        } catch {}
        return ls;
      })() != "object" ||
      false
    ) {
      // the currently used browser is not capable of running the IDE. :(
      this.not_supported = true;
      $("#warning-unsupported-browser").addClass("is-active");
    }
    // load settings
    this.waiter.addInfo("load settings");
    settings.load();
    // translate ui
    this.waiter.addInfo("translate ui");
    i18n.translate().then(() => this.initAfterI18n());

    if (sync.enabled) {
      $("#load-dialog .osm").show();
      if (sync.authenticated()) {
        $("#logout").show();
        $("#logout").appendTo($("#logout").parent());
      }
    }
  }

  initAfterI18n() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const ide = this;
    // parse url string parameters
    ide.waiter.addInfo("parse url parameters");
    const args = urlParameters();
    // set appropriate settings
    if (args.has_coords) {
      // map center coords set via url
      settings.coords_lat = args.coords.lat;
      settings.coords_lon = args.coords.lng;
    }
    if (args.has_zoom) {
      // map zoom set via url
      settings.coords_zoom = args.zoom;
    }
    if (args.run_query) {
      // query autorun activated via url
      ide.run_query_on_startup = true;
    }
    settings.save();

    ide.waiter.addInfo("initialize page");
    // init page layout
    const isInitialAspectPortrait =
      $(window).width() / $(window).height() < 0.8;
    if (settings.editor_width != "" && !isInitialAspectPortrait) {
      $("#editor").css("width", settings.editor_width);
      $("#dataviewer").css("left", settings.editor_width);
    }
    if (isInitialAspectPortrait) {
      $("#editor, #dataviewer").addClass("portrait");
    }
    // make panels resizable
    $("#editor").resizable({
      handles: isInitialAspectPortrait ? "s" : "e",
      minWidth: isInitialAspectPortrait ? undefined : "200",
      resize() {
        if (!isInitialAspectPortrait) {
          $(this)
            .next()
            .css("left", `${$(this).outerWidth()}px`);
        } else {
          const top = $(this).offset().top + $(this).outerHeight();
          $(this).next().css("top", `${top}px`);
        }
        ide.map.invalidateSize(false);
      },
      stop() {
        if (isInitialAspectPortrait) return;
        settings.editor_width = $("#editor").css("width");
        settings.save();
      }
    });
    $("#editor").prepend(
      "<span class='ui-resizable-handle ui-resizable-se ui-icon ui-icon-gripsmall-diagonal-se'/>"
    );

    // init codemirror
    $<HTMLTextAreaElement>("#editor textarea")[0].value =
      settings.code["overpass"];
    if (settings.use_rich_editor) {
      CodeMirror.defineMIME("text/x-overpassQL", {
        name: "clike",
        keywords: (function (str) {
          const r = {};
          const a = str.split(" ");
          for (const ai of a) r[ai] = true;
          return r;
        })(
          "out json xml custom popup timeout maxsize bbox" + // initial declarations
            " date diff adiff" + //attic declarations
            " foreach" + // block statements
            " relation rel way node is_in area around user uid user_touched uid_touched newer changed poly pivot nwr nw nr wr derived" + // queries
            " out meta body skel tags ids count qt asc" + // actions
            " center bb geom" // geometry types
          //+"r w n br bw" // recursors
        )
      });
      CodeMirror.defineMIME("text/x-overpassXML", "xml");
      CodeMirror.defineMode("xml+mustache", (config) =>
        CodeMirror.multiplexingMode(
          CodeMirror.multiplexingMode(CodeMirror.getMode(config, "xml"), {
            open: "{{",
            close: "}}",
            mode: CodeMirror.getMode(config, "text/plain"),
            delimStyle: "mustache"
          }),
          {
            open: "{{style:",
            close: "}}",
            mode: CodeMirror.getMode(config, "text/css"),
            delimStyle: "mustache"
          }
        )
      );
      CodeMirror.defineMode("ql+mustache", (config) =>
        CodeMirror.multiplexingMode(
          CodeMirror.multiplexingMode(
            CodeMirror.getMode(config, "text/x-overpassQL"),
            {
              open: "{{",
              close: "}}",
              mode: CodeMirror.getMode(config, "text/plain"),
              delimStyle: "mustache"
            }
          ),
          {
            open: "{{style:",
            close: "}}",
            mode: CodeMirror.getMode(config, "text/css"),
            delimStyle: "mustache"
          }
        )
      );
      CodeMirror.defineMode("sql+mustache", (config) =>
        CodeMirror.multiplexingMode(
          CodeMirror.multiplexingMode(
            CodeMirror.getMode(config, "text/x-sql"),
            {
              open: "{{",
              close: "}}",
              mode: CodeMirror.getMode(config, "text/plain"),
              delimStyle: "mustache"
            }
          ),
          {
            open: "{{style:",
            close: "}}",
            mode: CodeMirror.getMode(config, "text/css"),
            delimStyle: "mustache"
          }
        )
      );
      const autoCloseTagsOptions = {
        indentTags: ["osm-script", "query", "union", "foreach", "difference"]
      };
      const onCodeChange = debounce(
        (e) => {
          settings.code["overpass"] = e.getValue();
          settings.save();
          ide.getQuery({}).then(() => {
            const query_lang = ide.getQueryLang();
            // update syntax highlighting mode
            switch (query_lang) {
              case "xml":
                if (e.getOption("mode") != "xml+mustache") {
                  e.setOption("autoCloseTags", autoCloseTagsOptions);
                  e.setOption("matchBrackets", false);
                  e.setOption("mode", "xml+mustache");
                }
                break;
              case "SQL":
                if (e.getOption("mode") != "sql+mustache") {
                  e.setOption("autoCloseTags", false);
                  e.setOption("matchBrackets", true);
                  e.setOption("mode", "sql+mustache");
                }
                break;
              default:
                if (e.getOption("mode") != "ql+mustache") {
                  e.setOption("autoCloseTags", false);
                  e.setOption("matchBrackets", true);
                  e.setOption("mode", "ql+mustache");
                }
            }
            // check for inactive ui elements
            const bbox_filter = $(".leaflet-control-buttons-bboxfilter");
            if (ide.getRawQuery().match(/\{\{bbox\}\}/)) {
              if (bbox_filter.hasClass("disabled")) {
                bbox_filter.removeClass("disabled");
                bbox_filter.attr("data-t", "[title]map_controlls.select_bbox");
                i18n.translate_ui(bbox_filter[0]);
              }
            } else {
              if (!bbox_filter.hasClass("disabled")) {
                bbox_filter.addClass("disabled");
                bbox_filter.attr(
                  "data-t",
                  "[title]map_controlls.select_bbox_disabled"
                );
                i18n.translate_ui(bbox_filter[0]);
              }
            }
          });
        },
        100,
        {leading: true, trailing: true}
      );
      ide.codeEditor = CodeMirror.fromTextArea($("#editor textarea")[0], {
        lineNumbers: true,
        lineWrapping: true,
        mode: "text/plain",
        autoCloseTags: autoCloseTagsOptions
      });
      ide.codeEditor.on("change", onCodeChange);
      // fire change handler after initialization
      onCodeChange(ide.codeEditor);
    } else {
      // use non-rich editor
      const textarea = $("#editor textarea")[0] as HTMLTextAreaElement &
        Partial<Editor>;
      textarea.getValue = function () {
        return this.value;
      };
      textarea.setValue = function (v: string) {
        this.value = v;
      };
      textarea.lineCount = function () {
        return this.value.split(/\r\n|\r|\n/).length;
      };
      textarea.addLineClass = function () {};
      textarea.removeLineClass = function () {};
      ide.codeEditor = textarea as unknown as Editor;
      $("#editor textarea").bind("input change", (e) => {
        settings.code["overpass"] = (e.target as typeof textarea).getValue();
        settings.save();
      });
    }
    // set query if provided as url parameter or template:
    if (args.has_query) {
      // query set via url
      ide.codeEditor.setValue(args.query);
    }
    // init dataviewer
    ide.dataViewer = CodeMirror($("#data")[0], {
      value: "no data loaded yet",
      lineNumbers: true,
      readOnly: true,
      mode: "javascript"
    });

    // init leaflet
    ide.map = new L.Map("map", {
      attributionControl: false,
      minZoom: 0,
      maxZoom: configs.maxMapZoom,
      worldCopyJump: false
    }) as OverpassTurboMap;
    const tilesUrl = settings.tile_server;
    const tilesAttrib = configs.tileServerAttribution;
    const tiles = new L.TileLayer(tilesUrl, {
      attribution: tilesAttrib,
      noWrap: true,
      maxNativeZoom: 19,
      maxZoom: ide.map.options.maxZoom
    });
    const attribControl = (ide.attribControl = new L.Control.Attribution({
      position: "bottomright"
    }));
    attribControl.addAttribution(tilesAttrib);
    attribControl.addTo(ide.map);
    const pos = new L.LatLng(settings.coords_lat, settings.coords_lon);
    ide.map.setView(pos, settings.coords_zoom).addLayer(tiles);
    ide.map.tile_layer = tiles;
    // inverse opacity layer
    ide.map.inv_opacity_layer = L.tileLayer(
      "data:image/gif;base64,R0lGODlhAQABAIAAAP7//wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
    ).setOpacity(1 - settings.background_opacity);
    if (settings.background_opacity != 1)
      ide.map.inv_opacity_layer.addTo(ide.map);
    ide.scaleControl = new L.Control.Scale({metric: true, imperial: false});
    ide.scaleControl.addTo(ide.map);
    ide.map.on("moveend", () => {
      settings.coords_lat = ide.map.getCenter().lat;
      settings.coords_lon = ide.map.getCenter().lng;
      settings.coords_zoom = ide.map.getZoom();
      settings.save(); // save settings
    });

    // tabs
    $("#dataviewer > div#data")[0].style.zIndex = "-1001";
    $(".tabs li").bind("click", (e) => {
      if ($(e.target).hasClass("is-active")) {
        return;
      } else {
        $("#dataviewer > div#data")[0].style.zIndex = String(
          -1 * +$("#dataviewer > div#data")[0].style.zIndex
        );
        $(".tabs li").toggleClass("is-active");
      }
    });

    // keyboard event listener
    $(document).keydown((event) => ide.onKeyPress(event));

    // leaflet extension: more map controls
    const MapButtons = L.Control.extend({
      options: {
        position: "topleft"
      },
      onAdd() {
        // create the control container with a particular class name
        const container = L.DomUtil.create(
          "div",
          "leaflet-control-buttons leaflet-bar"
        );
        let link = L.DomUtil.create(
          "a",
          "leaflet-control-buttons-fitdata leaflet-bar-part leaflet-bar-part-top",
          container
        );
        $('<span class="fas fa-search"/>').appendTo($(link));
        link.href = "#";
        link.className += " t";
        link.setAttribute("data-t", "[title]map_controlls.zoom_to_data");
        i18n.translate_ui(link);
        L.DomEvent.addListener(
          link,
          "click",
          () => {
            // hardcoded maxZoom of 18, should be ok for most real-world use-cases
            try {
              ide.map.fitBounds(overpass.osmLayer.getBaseLayer().getBounds(), {
                maxZoom: 18
              });
            } catch {}
            return false;
          },
          ide.map
        );
        link = L.DomUtil.create(
          "a",
          "leaflet-control-buttons-myloc leaflet-bar-part",
          container
        );
        $('<span class="fas fa-crosshairs"/>').appendTo($(link));
        link.href = "#";
        link.className += " t";
        link.setAttribute("data-t", "[title]map_controlls.localize_user");
        if (!window.isSecureContext) {
          link.className += " disabled";
          link.setAttribute(
            "data-t",
            "[title]map_controlls.localize_user_disabled"
          );
        }
        i18n.translate_ui(link);
        L.DomEvent.addListener(
          link,
          "click",
          () => {
            // One-shot position request.
            try {
              navigator.geolocation.getCurrentPosition((position) => {
                const pos = new L.LatLng(
                  position.coords.latitude,
                  position.coords.longitude
                );
                ide.map.setView(pos, settings.coords_zoom);
              });
            } catch {}
            return false;
          },
          ide.map
        );
        link = L.DomUtil.create(
          "a",
          "leaflet-control-buttons-bboxfilter leaflet-bar-part",
          container
        );
        $('<span class="fas fa-image"/>').appendTo($(link));
        link.href = "#";
        link.className += " t";
        link.setAttribute("data-t", "[title]map_controlls.select_bbox");
        i18n.translate_ui(link);
        L.DomEvent.addListener(
          link,
          "click",
          (e) => {
            if (
              $(e.target).parent().hasClass("disabled") // check if this button is enabled
            )
              return false;
            if (!ide.map.bboxfilter.isEnabled()) {
              ide.map.bboxfilter.setBounds(ide.map.getBounds().pad(-0.2));
              ide.map.bboxfilter.enable();
            } else {
              ide.map.bboxfilter.disable();
            }
            $(e.target).toggleClass("fa-times-circle").toggleClass("fa-image");
            return false;
          },
          ide.map
        );
        link = L.DomUtil.create(
          "a",
          "leaflet-control-buttons-fullscreen leaflet-bar-part",
          container
        );
        $('<span class="fas fa-step-backward"/>').appendTo($(link));
        link.href = "#";
        link.className += " t";
        link.setAttribute("data-t", "[title]map_controlls.toggle_wide_map");
        i18n.translate_ui(link);
        L.DomEvent.addListener(
          link,
          "click",
          (e) => {
            $("#dataviewer").toggleClass("fullscreen");
            ide.map.invalidateSize();
            $(e.target)
              .toggleClass("fa-step-forward")
              .toggleClass("fa-step-backward");
            $("#editor").toggleClass("hidden");
            if ($("#editor").resizable("option", "disabled"))
              $("#editor").resizable("enable");
            else $("#editor").resizable("disable");
            return false;
          },
          ide.map
        );
        link = L.DomUtil.create(
          "a",
          "leaflet-control-buttons-clearoverlay leaflet-bar-part leaflet-bar-part-bottom",
          container
        );
        $('<span class="fas fa-ban"/>').appendTo($(link));
        link.href = "#";
        link.className += " t";
        link.setAttribute("data-t", "[title]map_controlls.toggle_data");
        i18n.translate_ui(link);
        L.DomEvent.addListener(
          link,
          "click",
          (e) => {
            e.preventDefault();
            if (ide.map.hasLayer(overpass.osmLayer))
              ide.map.removeLayer(overpass.osmLayer);
            else ide.map.addLayer(overpass.osmLayer);
            return false;
          },
          ide.map
        );
        return container;
      }
    });
    ide.map.addControl(new MapButtons());
    // prevent propagation of doubleclicks on map controls
    $(".leaflet-control-buttons > a").bind("dblclick", (e) =>
      e.stopPropagation()
    );
    // add tooltips to map controls
    $(".leaflet-control-buttons > a").tooltip({
      items: "a[title]",
      hide: {
        effect: "fadeOut",
        duration: 100
      },
      position: {
        my: "left+5 center",
        at: "right center"
      }
    });
    // leaflet extension: search box
    const SearchBox = L.Control.extend({
      options: {
        position: "topright"
      },
      onAdd() {
        const container = L.DomUtil.create(
          "div",
          "leaflet-control-search control has-icons-left"
        );
        container.style.position = "absolute";
        container.style.right = "0";
        const inp = L.DomUtil.create("input", "input is-rounded", container);
        $('<span class="icon is-left"><span class="fas fa-search"/></span>')
          .click(function () {
            $(this).prev().autocomplete("search");
          })
          .insertAfter(inp);
        inp.id = "search";
        inp.type = "search";
        // hack against focus stealing leaflet :/
        inp.onclick = () => inp.focus();
        // prevent propagation of doubleclicks to map container
        container.ondblclick = function (e: MouseEvent) {
          e.stopPropagation();
        };
        // autocomplete functionality
        $(inp).autocomplete({
          source(request, response) {
            // ajax (GET) request to nominatim
            $.ajax(
              `https://search.osmnames.org/q/${encodeURIComponent(
                request.term
              )}.js?key=${configs.osmnamesApiKey}`,
              {
                success(data) {
                  // hacky firefox hack :( (it is not properly detecting json from the content-type header)
                  if (typeof data == "string") {
                    // if the data is a string, but looks more like a json object
                    try {
                      data = JSON.parse(data);
                    } catch {}
                  }
                  response(
                    data.results.slice(0, 10).map((item) => ({
                      label: item.display_name,
                      value: item.display_name,
                      lat: item.lat,
                      lon: item.lon,
                      boundingbox: item.boundingbox
                    }))
                  );
                },
                error() {
                  // todo: better error handling
                  console.error(
                    "An error occurred while contacting the search server osmnames.org :("
                  );
                }
              }
            );
          },
          minLength: 2,
          autoFocus: true,
          select(event, ui) {
            if (ui.item.boundingbox && ui.item.boundingbox instanceof Array)
              ide.map.fitBounds(
                L.latLngBounds([
                  [ui.item.boundingbox[1], ui.item.boundingbox[0]],
                  [ui.item.boundingbox[3], ui.item.boundingbox[2]]
                ]),
                {maxZoom: 18}
              );
            else ide.map.panTo(new L.LatLng(ui.item.lat, ui.item.lon));
            this.value = "";
            return false;
          },
          open() {
            $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
          },
          close() {
            $(this).addClass("ui-corner-all").removeClass("ui-corner-top");
          }
        });
        $(inp).autocomplete("option", "delay", 20);
        return container;
      }
    });
    ide.map.addControl(new SearchBox());
    // add cross hairs to map
    $('<span class="fas fa-plus" />')
      .addClass("crosshairs")
      .hide()
      .appendTo("#map");
    if (settings.enable_crosshairs) $(".crosshairs").show();

    ide.map.bboxfilter = new L.LocationFilter({
      enable: !true,
      adjustButton: false,
      enableButton: false
    }).addTo(ide.map);

    ide.map.on("popupopen popupclose", (e) => {
      if (typeof e.popup.layer != "undefined") {
        const layer = e.popup.layer.placeholder || e.popup.layer;
        // re-call style handler to eventually modify the style of the clicked feature
        const style = overpass.osmLayer.getBaseLayer().options.style as (
          feature: GeoJSON.Feature,
          highlight: boolean
        ) => L.PathOptions;
        const stl = style(layer.feature, e.type == "popupopen");
        if (typeof layer.eachLayer != "function") {
          if (typeof layer.setStyle == "function") layer.setStyle(stl); // other objects (pois, ways)
        } else
          layer.eachLayer((layer) => {
            if (typeof layer.setStyle == "function") layer.setStyle(stl);
          }); // for multipolygons!
      }
    });

    // init overpass object
    overpass.init();

    // event handlers for overpass object
    overpass.handlers["onProgress"] = function (msg, abortcallback) {
      ide.waiter.addInfo(msg, abortcallback);
    };
    overpass.handlers["onDone"] = function () {
      const name_match = ide.getRawQuery().match(/@name ([^\n]+)/);
      // parse document title from @name in query
      const title_prefix = name_match ? `${name_match[1]} | ` : "";
      ide.waiter.close(title_prefix);
      const map_bounds = ide.map.getBounds();
      const data_bounds = overpass.osmLayer.getBaseLayer().getBounds();
      if (data_bounds.isValid() && !map_bounds.intersects(data_bounds)) {
        // show tooltip for button "zoom to data"
        const prev_content = $(".leaflet-control-buttons-fitdata").tooltip(
          "option",
          "content"
        );
        $(".leaflet-control-buttons-fitdata").tooltip(
          "option",
          "content",
          `← ${i18n.t("map_controlls.suggest_zoom_to_data")}`
        );
        $(".leaflet-control-buttons-fitdata").tooltip("open");
        $(".leaflet-control-buttons-fitdata").tooltip("option", "hide", {
          effect: "fadeOut",
          duration: 1000
        });
        setTimeout(() => {
          $(".leaflet-control-buttons-fitdata").tooltip(
            "option",
            "content",
            prev_content
          );
          $(".leaflet-control-buttons-fitdata").tooltip("close");
          $(".leaflet-control-buttons-fitdata").tooltip("option", "hide", {
            effect: "fadeOut",
            duration: 100
          });
        }, 2600);
      }
    };
    overpass.handlers["onEmptyMap"] = function (empty_msg, data_mode) {
      // get the current query
      const query = ide.getRawQuery();

      // check if 'out' followed by any number of characters (non-greedy) and then 'count' is present in the query
      const isCountPresent = /out[^;]+?count/.test(query);

      // show warning/info if only invisible data is returned and 'out...count' is not present in the query
      if (empty_msg == "no visible data") {
        if (!isCountPresent && !settings.no_autorepair) {
          const content = `<p>${i18n.t(
            "warning.incomplete.expl.1"
          )}</p><p>${i18n.t(
            "warning.incomplete.expl.2"
          )}</p><p><input type="checkbox" name="hide_incomplete_data_warning"/>&nbsp;${i18n.t(
            "warning.incomplete.not_again"
          )}</p>`;

          const dialog_buttons = [
            {
              name: i18n.t("dialog.repair_query"),
              callback() {
                ide.repairQuery("no visible data");
              }
            },
            {
              name: i18n.t("dialog.show_data"),
              callback() {
                if (
                  $<HTMLInputElement>(
                    "input[name=hide_incomplete_data_warning]"
                  )?.[0]?.checked
                ) {
                  settings.no_autorepair = true;
                  settings.save();
                }
                ide.switchTab("Data");
              }
            }
          ];
          showDialog(
            i18n.t("warning.incomplete.title"),
            content,
            dialog_buttons
          );
        } else if (isCountPresent) {
          ide.switchTab("Data");
        }
      }
      // auto tab switching (if only areas are returned)
      if (empty_msg == "only areas returned") ide.switchTab("Data");
      // auto tab switching (if nodes without coordinates are returned)
      if (empty_msg == "no coordinates returned") ide.switchTab("Data");
      // auto tab switching (if unstructured data is returned)
      if (data_mode == "unknown") ide.switchTab("Data");
      // display empty map badge
      $(
        `<div id="map_blank" style="z-index:700; display:block; position:relative; top:50px; width:100%; text-align:center; background-color:#eee; opacity: 0.8;">${i18n.t(
          "map.intentionally_blank"
        )} <small>(${empty_msg})</small></div>`
      ).appendTo("#map");
    };
    overpass.handlers["onDataReceived"] = function (
      amount_bytes,
      amount_txt,
      amount_elements,
      abortCB,
      continueCB
    ) {
      if (
        (amount_elements > 5e3 || amount_bytes > 1e7) &&
        !settings.disable_warning_huge_data
      ) {
        ide.waiter.close();
        const _originalDocumentTitle = document.title;
        document.title = `❗ ${_originalDocumentTitle}`;
        // more than 5k features or ~10MB of raw data:
        // show warning dialog
        const dialog_buttons = [
          {
            name: i18n.t("dialog.abort"),
            callback() {
              document.title = _originalDocumentTitle;
              abortCB();
            }
          },
          {
            name: i18n.t("dialog.continue_anyway"),
            callback() {
              document.title = _originalDocumentTitle;
              if (
                $<HTMLInputElement>(
                  "input[name=dialog_disable_warning_huge_data]"
                )?.[0]?.checked
              ) {
                settings.disable_warning_huge_data = true;
                settings.save();
              }
              continueCB();
            }
          }
        ];

        const content = `<p>${i18n
          .t("warning.huge_data.expl.1")
          .replace("{{amount_txt}}", amount_txt)}</p><p>${i18n.t(
          "warning.huge_data.expl.2"
        )}</p><p><input type="checkbox" name="dialog_disable_warning_huge_data"/>&nbsp;${i18n.t(
          "warning.incomplete.not_again"
        )}</p>`;
        showDialog(i18n.t("warning.huge_data.title"), content, dialog_buttons);
      } else continueCB();
    };
    overpass.handlers["onAbort"] = function () {
      ide.waiter.close();
    };
    overpass.handlers["onAjaxError"] = function (errmsg) {
      ide.waiter.close();
      const _originalDocumentTitle = document.title;
      document.title = `❗ ${_originalDocumentTitle}`;
      // show error dialog
      const dialog_buttons = [
        {
          name: i18n.t("dialog.dismiss"),
          callback() {
            document.title = _originalDocumentTitle;
          }
        }
      ];

      const content = `<p style="color:red;">${i18n.t(
        "error.ajax.expl"
      )}</p>${errmsg}`;
      showDialog(i18n.t("error.ajax.title"), content, dialog_buttons);

      // print error text, if present
      if (overpass.resultText) ide.dataViewer.setValue(overpass.resultText);
    };
    overpass.handlers["onQueryError"] = function (errmsg) {
      ide.waiter.close();
      const _originalDocumentTitle = document.title;
      document.title = `❗ ${_originalDocumentTitle}`;
      const dialog_buttons = [
        {
          name: i18n.t("dialog.dismiss"),
          callback() {
            document.title = _originalDocumentTitle;
          }
        }
      ];
      const content = `<div class="notification is-danger is-light">${i18n.t(
        "error.query.expl"
      )}<br>${errmsg}</div>`;
      showDialog(i18n.t("error.query.title"), content, dialog_buttons);
    };
    overpass.handlers["onStyleError"] = function (errmsg) {
      const dialog_buttons = [{name: i18n.t("dialog.dismiss")}];
      const content = `<p style="color:red;">${i18n.t(
        "error.mapcss.expl"
      )}</p>${errmsg}`;
      showDialog(i18n.t("error.mapcss.title"), content, dialog_buttons);
    };
    overpass.handlers["onQueryErrorLine"] = function (linenumber) {
      ide.highlightError(linenumber);
    };
    overpass.handlers["onRawDataPresent"] = function () {
      ide.dataViewer.setOption("mode", overpass.resultType);
      try {
        ide.dataViewer.setValue(overpass.resultText);
      } catch {
        ide.dataViewer.setOption("mode", "text");
        ide.dataViewer.setValue(overpass.resultText);
      }
    };
    overpass.handlers["onGeoJsonReady"] = function () {
      // show layer
      ide.map.addLayer(overpass.osmLayer);
      // autorun callback (e.g. zoom to data)
      if (typeof ide.run_query_on_startup === "function") {
        ide.run_query_on_startup();
      }
      // enable auto-styler
      $("#styler-button").show();
      // display stats
      if (settings.show_data_stats) {
        const stats = overpass.stats;
        let stats_txt = "";
        if (stats.data !== undefined) {
          stats_txt +=
            `<small>${i18n.t("data_stats.loaded")}</small>&nbsp;&ndash;&nbsp;` +
            `${i18n.t("data_stats.nodes")}:&nbsp;${stats.data.nodes}, ${i18n.t(
              "data_stats.ways"
            )}:&nbsp;${stats.data.ways}, ${i18n.t(
              "data_stats.relations"
            )}:&nbsp;${stats.data.relations}${
              stats.data.areas > 0
                ? `, ${i18n.t("data_stats.areas")}:&nbsp;${stats.data.areas}`
                : ""
            }<br/>`;
        }
        stats_txt +=
          `<small>${i18n.t(
            "data_stats.displayed"
          )}</small>&nbsp;&ndash;&nbsp;` +
          `${i18n.t("data_stats.pois")}:&nbsp;${stats.geojson.pois}, ${i18n.t(
            "data_stats.lines"
          )}:&nbsp;${stats.geojson.lines}, ${i18n.t(
            "data_stats.polygons"
          )}:&nbsp;${stats.geojson.polys}</small>`;
        $(
          `<div id="data_stats" class="stats leaflet-control">${stats_txt}</div>`
        ).insertAfter("#map .leaflet-control-attribution");
        // show more stats as a tooltip
        const backlogOverpass =
          overpass.timestamp && Date.now() - Date.parse(overpass.timestamp);
        const backlogOverpassAreas =
          overpass.timestampAreas &&
          Date.now() - Date.parse(overpass.timestampAreas);
        $("#data_stats").tooltip({
          items: "div",
          tooltipClass: "stats",
          content() {
            let str = "<div>";
            if (overpass.ajax_request_duration) {
              let duration: number | string = overpass.ajax_request_duration;
              if (duration.toLocaleString) {
                duration = duration.toLocaleString();
              }
              str += `${i18n.t(
                "data_stats.request_duration"
              )}: ${duration}ms<br>`;
            }
            if (overpass.timestamp) {
              str +=
                `${i18n.t("data_stats.lag")}: ${Math.floor(
                  backlogOverpass / 1000
                )}s` + ` <small>${i18n.t("data_stats.lag.expl")}</small>`;
            }
            if (overpass.timestampAreas) {
              str +=
                `<br>${i18n.t("data_stats.lag_areas")}: ${Math.floor(
                  backlogOverpassAreas / 1000
                )}s` + ` <small>${i18n.t("data_stats.lag.expl")}</small>`;
            }
            str += "</div>";
            return str;
          },
          hide: {
            effect: "fadeOut",
            duration: 100
          },
          position: {
            my: "right bottom-5",
            at: "right top"
          }
        });
        if (
          backlogOverpass > 24 * 60 * 60 * 1000 ||
          backlogOverpassAreas > 96 * 60 * 60 * 1000
        ) {
          $("#data_stats").css("background-color", "yellow");
        }
      }
    };
    overpass.handlers["onPopupReady"] = function (p) {
      p.openOn(ide.map);
    };

    // close startup waiter
    ide.waiter.close();

    // run the query immediately, if the appropriate flag was set.
    if (ide.run_query_on_startup === true) {
      ide.getQuery({}).then(ide.update_map.bind(this));
      // automatically zoom to data.
      if (
        !args.has_coords &&
        args.has_query &&
        args.query.match(/\{\{(bbox|center)\}\}/) === null
      ) {
        ide.run_query_on_startup = function () {
          ide.run_query_on_startup = null;
          // hardcoded maxZoom of 18, should be ok for most real-world use-cases
          try {
            ide.map.fitBounds(overpass.osmLayer.getBaseLayer().getBounds(), {
              maxZoom: 18
            });
          } catch {}
          // todo: zoom only to specific zoomlevel if args.has_zoom is given
        };
      }
    }
  } // init()

  onNominatimError(search: string, type: string): void {
    // close waiter
    this.waiter.close();
    // highlight error lines
    const query = this.getRawQuery().split("\n");
    query.forEach((line, i) => {
      if (line.indexOf(`{{geocode${type}:${search}}}`) !== -1)
        this.highlightError(i + 1);
    });
    // show error message dialog
    const dialog_buttons = [{name: i18n.t("dialog.dismiss")}];
    const content = `<p style="color:red;">${i18n.t(
      "error.nominatim.expl"
    )}</p><p><i>${htmlentities(search)}</i></p>`;
    showDialog(i18n.t("error.nominatim.title"), content, dialog_buttons);
  }

  /* this returns the current raw query in the editor.
   * shortcuts are not expanded. */
  getRawQuery(): string {
    return this.codeEditor.getValue();
  }

  /* this returns the current query in the editor.
   * shortcuts are expanded. */
  async getQuery(
    _shortcuts: Record<string, Shortcut> = undefined
  ): Promise<string> {
    let query = this.getRawQuery();
    // parse query and process shortcuts
    // special handling for global bbox in xml queries (which uses an OverpassQL-like notation instead of n/s/e/w parameters):
    query = query.replace(
      /(<osm-script[^>]+bbox[^=]*=[^"'']*["'])({{bbox}})(["'])/,
      "$1{{__bbox__global_bbox_xml__ezs4K8__}}$3"
    );
    query = await this.queryParser.parse(
      query,
      _shortcuts ? _shortcuts : shortcuts()
    );
    // parse mapcss declarations
    let mapcss = "";
    if (this.queryParser.hasStatement("style"))
      mapcss = this.queryParser.getStatement("style");
    this.mapcss = mapcss;
    // parse data-source statements
    let data_source: DataSource = null;
    if (this.queryParser.hasStatement("data")) {
      const statement = this.queryParser.getStatement("data").split(",");
      const data_mode = statement[0].toLowerCase();
      const options: Record<string, string> = {};
      for (const src of statement.slice(1)) {
        const tmp = src.split("=");
        options[tmp[0]] = tmp[1];
      }
      data_source = {
        mode: data_mode,
        options: options
      };
    }
    this.data_source = data_source;
    return query;
  }

  setQuery(query: string): void {
    this.codeEditor.setValue(query);
  }
  getQueryLang(): QueryLang {
    if (this.data_source && this.data_source.mode == "sql") return "SQL";
    const q = this.getRawQuery()
      .replace(/{{.*?}}/g, "")
      .trim();
    if (q.match(/^</)) return "xml";
    else return "OverpassQL";
  }
  /* this is for repairing obvious mistakes in the query, such as missing recurse statements */
  repairQuery(repair: "no visible data" | "xml+metadata"): void {
    // - preparations -
    const q = this.getRawQuery(), // get original query
      lng = this.getQueryLang();
    const autorepair = Autorepair(q, lng);
    // - repairs -
    if (repair == "no visible data") {
      // repair missing recurse statements
      autorepair.recurse();
    } else if (repair == "xml+metadata") {
      // repair output for OSM editors
      autorepair.editors();
    }
    // - set repaired query -
    this.setQuery(autorepair.getQuery());
  }
  highlightError(line: number): void {
    this.codeEditor.addLineClass(line - 1, "background", "errorline");
  }
  resetErrors(): void {
    for (let i = 0; i < this.codeEditor.lineCount(); i++)
      this.codeEditor.removeLineClass(i, "background", "errorline");
  }

  switchTab(tab: "Data" | "Map"): void {
    $(`.tabs li.${tab}`).click();
  }

  loadExample(ex: string) {
    if (typeof settings.saves[ex] != "undefined") {
      let query = settings.saves[ex].overpass;
      if (!/@name/.test(query)) {
        query = `// @name ${ex}\n\n${query}`;
      }
      this.setQuery(query);
    }
  }
  removeExample(ex: string): void {
    const dialog_buttons = [
      {
        name: i18n.t("dialog.delete"),
        callback: () => {
          delete settings.saves[ex];
          settings.save();
          this.onLoadClick();
        }
      },
      {name: i18n.t("dialog.cancel")}
    ];

    const content =
      `<p>` +
      `<span class="fas fa-exclamation-triangle" style="float:left; margin:1px 7px 20px 0;"></span>${i18n.t(
        "dialog.delete_query.expl"
      )}: &quot;<i>${ex}</i>&quot;?</p>`;
    showDialog(i18n.t("dialog.delete_query.title"), content, dialog_buttons);
  }
  removeExampleSync(query: OsmSavedQuery, self: HTMLElement): void {
    const dialog_buttons = [
      {
        name: i18n.t("dialog.delete"),
        callback() {
          sync.delete(query.name, (err) => {
            if (err) return console.error(err);

            $(self).parent().remove();
          });
        }
      },
      {
        name: i18n.t("dialog.cancel")
      }
    ];

    const content = `<p><span class="fas fa-exclamation-triangle" style="float:left; margin:1px 7px 20px 0;"></span>${i18n.t(
      "dialog.delete_query.expl-osm"
    )}: &quot;<i>${query.name}</i>&quot;?</p>`;
    showDialog(i18n.t("dialog.delete_query.title"), content, dialog_buttons);
  }

  // Event handlers
  onLoadClick() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const ide = this;
    $("#load-dialog .panel.saved_query .panel-block").remove();
    $("#load-dialog .panel.example .panel-block").remove();
    // load example list
    let has_saved_query = false;
    for (const example in settings.saves) {
      const type = settings.saves[example].type;
      if (type == "template") continue;
      $('<a class="panel-block">')
        .attr("href", "#")
        .text(example)
        .on("click", () => {
          ide.loadExample(example);
          $("#load-dialog").removeClass("is-active");
          return false;
        })
        .append(
          $('<button class="ml-auto">')
            .attr("title", `${i18n.t("load.delete_query")}: ${example}`)
            .addClass("delete")
            .on("click", () => {
              ide.removeExample(example);
              return false;
            })
        )
        .appendTo(`#load-dialog .panel.${type}`);
      if (type == "saved_query") has_saved_query = true;
    }
    if (!has_saved_query)
      $('<div class="panel-block">')
        .text(i18n.t("load.no_saved_query"))
        .appendTo("#load-dialog .panel.saved_query");
    $("#load-dialog").addClass("is-active");

    if (sync.authenticated()) {
      ide.loadOsmQueries();
    } else {
      const ui = $("#load-dialog .panel.osm-queries");
      if (location.protocol === "https:" || location.hostname === "127.0.0.1") {
        ui.show();
        ui.find(".panel-block").remove();
        $('<div class="panel-block">')
          .append(
            $(
              `<button class='button is-link is-outlined t' title='load.title'>${i18n.t(
                "load.title"
              )}</button>`
            ).on("click", () => {
              ide.loadOsmQueries();
            })
          )
          .appendTo(ui);
      } else {
        ui.hide();
      }
    }
  }
  loadOsmQueries() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const ide = this;
    const ui = $("#load-dialog .panel.osm-queries");
    ui.show();
    ui.find(".panel-block").remove();
    $('<div class="panel-block">')
      .text(i18n.t("load.saved_queries-osm-loading"))
      .appendTo(ui);

    sync.load((err: unknown, queries: OsmSavedQuery[]) => {
      if (err) {
        ui.find(".panel-block").remove();
        $('<div class="panel-block">')
          .text(i18n.t("load.saved_queries-osm-error"))
          .appendTo(ui);
        return console.error(err);
      }
      ui.find(".panel-block").remove();
      $("#logout").show();
      $("#logout").appendTo($("#logout").parent());
      queries.forEach((q) => {
        $('<a class="panel-block">')
          .attr("href", "#")
          .text(q.name)
          .on("click", () => {
            ide.setQuery(lzw_decode(Base64.decode(q.query)));
            $("#load-dialog").removeClass("is-active");
            return false;
          })
          .append(
            $('<button class="ml-auto">')
              .attr("title", `${i18n.t("load.delete_query")}: ${q.name}`)
              .addClass("delete")
              .on("click", function (this: HTMLElement) {
                ide.removeExampleSync(q, this);
                return false;
              })
          )
          .appendTo(ui);
      });
    });
  }
  onLoadClose() {
    $("#load-dialog").removeClass("is-active");
  }
  onSaveClick() {
    // combobox for existing saves.
    const saves_names = [];
    for (const key in settings.saves)
      if (settings.saves[key].type != "template") saves_names.push(key);
    make_combobox($("#save-dialog input[name=save]"), saves_names);

    if (
      sync.enabled &&
      (location.protocol === "https:" || location.hostname === "127.0.0.1")
    ) {
      $("#save-dialog button.osm").show();
    }
    $("#save-dialog").addClass("is-active");
  }
  onSaveSumbit() {
    const name = $<HTMLInputElement>("#save-dialog input[name=save]")[0].value;
    settings.saves[htmlentities(name)] = {
      overpass: this.getRawQuery(),
      type: "saved_query"
    };
    settings.save();
    $("#save-dialog").removeClass("is-active");
  }
  onSaveOsmSumbit() {
    const name = $<HTMLInputElement>("#save-dialog input[name=save]")[0].value;
    const query = this.compose_share_link(this.getRawQuery(), true).slice(3);
    sync.save(
      {
        name: name,
        query: query
      },
      (err) => {
        if (err) return console.error(err);
        $("#logout").show();
        $("#logout").appendTo($("#logout").parent());
        $("#save-dialog").removeClass("is-active");
      }
    );
  }
  onSaveClose() {
    $("#save-dialog").removeClass("is-active");
  }
  onLogoutClick() {
    sync.logout();
    $("#load-dialog .panel.osm-queries .panel-block").remove();
    $("#logout").hide();
    $("#logout").insertBefore($("#logout").prev());
  }
  onRunClick() {
    this.update_map();
  }
  onRerenderClick() {
    this.rerender_map();
  }
  compose_share_link(
    query: string,
    compression?: boolean,
    coords?: boolean,
    run?: boolean
  ): string {
    const share_link = new URLSearchParams();
    if (!compression) {
      // compose uncompressed share link
      share_link.append("Q", query);
      if (coords)
        share_link.append(
          "C",
          `${L.Util.formatNum(this.map.getCenter().lat)};${L.Util.formatNum(
            this.map.getCenter().lng
          )};${this.map.getZoom()}`
        );
    } else {
      // compose compressed share link
      share_link.append("q", Base64.encode(lzw_encode(query)));
      if (coords) {
        share_link.append(
          "c",
          encode_coords(this.map.getCenter().lat, this.map.getCenter().lng) +
            Base64.encodeNum(this.map.getZoom())
        );
      }
    }
    if (run) share_link.append("R", "");
    return `?${share_link}`.replace(/\+/g, "%20");
    function encode_coords(lat: number, lng: number): string {
      const coords_cpr = Base64.encodeNum(
        Math.round((lat + 90) * 100000) +
          Math.round((lng + 180) * 100000) * 180 * 100000
      );
      return "AAAAAAAA".substring(0, 9 - coords_cpr.length) + coords_cpr;
    }
  }
  updateShareLink() {
    const baseurl = `${location.protocol}//${location.host}${location.pathname}`;
    const query = this.getRawQuery();
    const compress =
      (settings.share_compression == "auto" && query.length > 300) ||
      settings.share_compression == "on";
    const inc_coords = $<HTMLInputElement>(
      "div#share-dialog input[name=include_coords]"
    )[0].checked;
    const run_immediately = $<HTMLInputElement>(
      "div#share-dialog input[name=run_immediately]"
    )[0].checked;

    const shared_query = this.compose_share_link(
      query,
      compress,
      inc_coords,
      run_immediately
    );
    const share_link = baseurl + shared_query;

    let warning = "";
    if (share_link.length >= 2000)
      warning = `<p class="warning">${i18n.t("warning.share.long")}</p>`;
    if (share_link.length >= 4000)
      warning = `<p class="warning severe">${i18n.t(
        "warning.share.very_long"
      )}</p>`;

    $("div#share-dialog #share_link_warning").html(warning);

    $<HTMLAnchorElement>("div#share-dialog #share_link_a")[0].href = share_link;
    $<HTMLTextAreaElement>("div#share-dialog #share_link_textarea")[0].value =
      share_link;

    // automatically minify urls if enabled
    if (configs.short_url_service != "") {
      $.get(
        configs.short_url_service + encodeURIComponent(share_link),
        (data) => {
          $<HTMLAnchorElement>("div#share-dialog #share_link_a")[0].href = data;
          $<HTMLTextAreaElement>(
            "div#share-dialog #share_link_textarea"
          )[0].value = data;
        }
      );
    }
  }
  onShareClick() {
    $<HTMLInputElement>(
      "div#share-dialog input[name=include_coords]"
    )[0].checked = settings.share_include_pos;
    this.updateShareLink();
    $("#share-dialog").addClass("is-active");
  }
  onShareClose() {
    $("#share-dialog").removeClass("is-active");
  }
  async onExportClick() {
    // prepare export dialog
    const query = await this.getQuery();
    const baseurl = `${location.protocol}//${location.host}${
      location.pathname.match(/.*\//)[0]
    }`;
    const server =
      this.data_source &&
      this.data_source.options.server &&
      (this.data_source.mode == "sql" || this.data_source.mode == "overpass")
        ? this.data_source.options.server
        : settings.server;
    let queryWithMapCSS = query;
    if (this.queryParser.hasStatement("style"))
      queryWithMapCSS += `{{style: ${this.queryParser.getStatement(
        "style"
      )} }}`;
    if (this.queryParser.hasStatement("data"))
      queryWithMapCSS += `{{data:${this.queryParser.getStatement("data")}}}`;
    else if (settings.server !== configs.defaultServer)
      queryWithMapCSS += `{{data:overpass,server=${settings.server}}}`;
    $<HTMLAnchorElement>("#export-dialog a#export-interactive-map")[0].href =
      `${baseurl}map.html?${new URLSearchParams({
        Q: queryWithMapCSS
      })}`;
    // encoding exclamation marks for better command line usability (bash)
    $<HTMLAnchorElement>("#export-dialog a#export-overpass-api")[0].href =
      `${server}interpreter?data=${encodeURIComponent(query)
        .replace(/!/g, "%21")
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29")}`;
    function toDataURL(text: string, mediatype?: string): string {
      return `data:${mediatype || "text/plain"};charset=${
        document.characterSet || document.charset
      };base64,${Base64.encode(text, true)}`;
    }
    function saveAs(text: string, mediatype: string, filename: string): void {
      const save_link = document.createElement("a");
      save_link.href = toDataURL(text, mediatype);
      save_link.download = filename;
      save_link.dispatchEvent(new MouseEvent("click"));
    }
    function copyHandler(text: string, successMessage?: string) {
      return function (): false {
        // selector
        $("#export-clipboard-success").addClass("is-active");
        copyData = {
          "text/plain": text
        };
        document.execCommand("copy");
        $("#export-clipboard-success .message").html(
          i18n.t("export.copy_to_clipboard_success-message")
        );
        $("#export-clipboard-success .export-copy_to_clipboard-content").html(
          successMessage
        );
        return false;
      };
    }
    // export query
    $("#export-text .format").html(i18n.t("export.format_text"));
    $("#export-text .export").attr({
      download: "query.overpassql",
      target: "_blank",
      href: toDataURL(query)
    });
    $("#export-text .copy").attr("href", "").click(copyHandler(query));
    // export raw query
    const query_raw = this.getRawQuery();
    $("#export-text_raw .format").html(i18n.t("export.format_text_raw"));
    $("#export-text_raw .export").attr({
      download: "query-raw.overpassql",
      target: "_blank",
      href: toDataURL(query_raw)
    });
    $("#export-text_raw .copy").attr("href", "").click(copyHandler(query_raw));
    // export wiki query
    let query_wiki = `{{OverpassTurboExample|loc=${L.Util.formatNum(
      this.map.getCenter().lat
    )};${L.Util.formatNum(
      this.map.getCenter().lng
    )};${this.map.getZoom()}|query=\n`;
    query_wiki += query_raw
      .replace(/{{/g, "mSAvmrw81O8NgWlX")
      .replace(/{/g, "Z9P563g6zQYzjiLE")
      .replace(/}}/g, "AtUhvGGxAlM1mP5i")
      .replace(/}/g, "Yfxw6RTW5lewTqtg")
      .replace(/mSAvmrw81O8NgWlX/g, "{{((}}")
      .replace(/Z9P563g6zQYzjiLE/g, "{{(}}")
      .replace(/AtUhvGGxAlM1mP5i/g, "{{))}}")
      .replace(/Yfxw6RTW5lewTqtg/g, "{{)}}")
      .replace(/\|/g, "{{!}}")
      .replace(/{{!}}{{!}}/g, "{{!!}}");
    query_wiki += "\n}}";
    $("#export-text_wiki .format").html(i18n.t("export.format_text_wiki"));
    $("#export-text_wiki .export").attr({
      download: "query-wiki.mediawiki",
      target: "_blank",
      href: toDataURL(query_wiki)
    });
    $("#export-text_wiki .copy")
      .attr("href", "")
      .click(copyHandler(query_wiki));
    // export umap query
    let query_umap = query;
    // remove /* */ comments from query
    query_umap = query_umap.replace(/\/\*[\S\s]*?\*\//g, "");
    // replace //  comments from query
    query_umap = query_umap.replace(/\/\/.*/g, "");
    // removes indentation
    query_umap = query_umap.replace(/\n\s*/g, "");
    // replace bbox with south west north east
    query_umap = query_umap.replace(
      new RegExp(shortcuts().bbox, "g"),
      "{south},{west},{north},{east}"
    );
    $("#export-text_umap .format").html(i18n.t("export.format_text_umap"));
    $("#export-text_umap .export").attr({
      download: "query-umap.overpassql",
      target: "_blank",
      href: toDataURL(query_umap)
    });
    $("#export-text_umap .copy")
      .attr("href", "")
      .click(
        copyHandler(
          query_umap,
          `${i18n.t("export.section.query")} (${i18n.t(
            "export.format_text_umap"
          )})`
        )
      );
    const dialog_buttons = [{name: i18n.t("dialog.done")}];
    $("#export-dialog a#export-map-state")
      .unbind("click")
      .bind("click", () => {
        const content =
          `<h4>${i18n.t("export.map_view.permalink")}</h4>` +
          `<p><a href="//www.openstreetmap.org/#map=${this.map.getZoom()}/${L.Util.formatNum(
            this.map.getCenter().lat
          )}/${L.Util.formatNum(
            this.map.getCenter().lng
          )}" target="_blank">${i18n.t(
            "export.map_view.permalink_osm"
          )}</a></p>` +
          `<h4>${i18n.t("export.map_view.center")}</h4><p>${L.Util.formatNum(
            this.map.getCenter().lat
          )}, ${L.Util.formatNum(this.map.getCenter().lng)} <small>(${i18n.t(
            "export.map_view.center_expl"
          )})</small></p>` +
          `<h4>${i18n.t("export.map_view.bounds")}</h4><p>${L.Util.formatNum(
            this.map.getBounds().getSouthWest().lat
          )}, ${L.Util.formatNum(
            this.map.getBounds().getSouthWest().lng
          )}, ${L.Util.formatNum(
            this.map.getBounds().getNorthEast().lat
          )}, ${L.Util.formatNum(
            this.map.getBounds().getNorthEast().lng
          )}<br /><small>(${i18n.t(
            "export.map_view.bounds_expl"
          )})</small></p>${
            this.map.bboxfilter.isEnabled()
              ? `<h4>${i18n.t(
                  "export.map_view.bounds_selection"
                )}</h4><p>${L.Util.formatNum(
                  this.map.bboxfilter.getBounds().getSouthWest().lat
                )}, ${L.Util.formatNum(
                  this.map.bboxfilter.getBounds().getSouthWest().lng
                )}, ${L.Util.formatNum(
                  this.map.bboxfilter.getBounds().getNorthEast().lat
                )}, ${L.Util.formatNum(
                  this.map.bboxfilter.getBounds().getNorthEast().lng
                )}<br /><small>(${i18n.t(
                  "export.map_view.bounds_expl"
                )})</small></p>`
              : ""
          }<h4>${i18n.t(
            "export.map_view.zoom"
          )}</h4><p>${this.map.getZoom()}</p>`;
        showDialog(i18n.t("export.map_view.title"), content, dialog_buttons);
        return false;
      });
    $("#export-dialog a#export-image")
      .unbind("click")
      .on("click", () => {
        this.onExportImageClick();
        $("#export-dialog").removeClass("is-active");
        return false;
      });
    // GeoJSON format
    function constructGeojsonString(geojson: GeoJSON.FeatureCollection) {
      let geoJSON_str: string;
      if (!geojson) geoJSON_str = i18n.t("export.geoJSON.no_data");
      else {
        console.log(new Date());
        const gJ = {
          type: "FeatureCollection",
          generator: configs.appname,
          copyright: overpass.copyright,
          timestamp: overpass.timestamp,
          features: geojson.features.map(
            (feature): GeoJSON.Feature => ({
              type: "Feature",
              properties: feature.properties,
              geometry: feature.geometry
            })
          ) // makes deep copy
        };
        gJ.features.forEach((f) => {
          const p = f.properties;
          f.id = `${p.type}/${p.id}`;
          f.properties = {
            "@id": f.id
          };
          // escapes tags beginning with an @ with another @
          for (const m in p.tags || {})
            f.properties[m.replace(/^@/, "@@")] = p.tags[m];
          for (const m in p.meta || {}) f.properties[`@${m}`] = p.meta[m];
          // expose internal properties:
          // * tainted: indicates that the feature's geometry is incomplete
          if (p.tainted) f.properties["@tainted"] = p.tainted;
          // * geometry: indicates that the feature's geometry is approximated via the Overpass geometry types "center" or "bounds"
          if (p.geometry) f.properties["@geometry"] = p.geometry;
          // expose relation membership (complex data type)
          if (p.relations && p.relations.length > 0)
            f.properties["@relations"] = p.relations;
          // todo: expose way membership for nodes?
        });
        geoJSON_str = JSON.stringify(gJ, undefined, 2);
      }
      return geoJSON_str;
    }
    $("#export-geoJSON .format").text("GeoJSON");
    $("#export-geoJSON .export")
      .attr("href", "")
      .unbind("click")
      .on("click", () => {
        const geoJSON_str = constructGeojsonString(overpass.geojson);
        const d = $("#export-download-dialog");

        // make content downloadable as file
        if (overpass.geojson) {
          saveAs(geoJSON_str, "application/geo+json", "export.geojson");
        } else {
          d.addClass("is-active");
          $(".message", d).text(geoJSON_str);
        }
        return false;
      });
    $("#export-geoJSON .copy")
      .attr("href", "")
      .click(() => {
        const d = overpass.geojson
          ? $("#export-clipboard-success")
          : $("#export-download-dialog");
        d.addClass("is-active");
        if (overpass.geojson) {
          const geojson = constructGeojsonString(overpass.geojson);
          copyData = {
            "text/plain": geojson,
            "application/geo+json": geojson
          };
          document.execCommand("copy");
          $(".message", d).html(
            i18n.t("export.copy_to_clipboard_success-message")
          );
          $(".export-copy_to_clipboard-content", d).text("GeoJSON");
        } else {
          $(".message", d).text(i18n.t("export.geoJSON.no_data"));
        }
        return false;
      });
    $("#export-dialog a#export-geoJSON-gist")
      .unbind("click")
      .on("click", () => {
        const geoJSON_str = constructGeojsonString(overpass.geojson);
        $.ajax("https://api.github.com/gists", {
          method: "POST",
          data: JSON.stringify({
            description: "data exported by overpass turbo", // todo:descr
            public: true,
            files: {
              "overpass.geojson": {
                // todo:name
                content: geoJSON_str
              }
            }
          })
        })
          .done((data) => {
            const dialog_buttons = [{name: i18n.t("dialog.done")}];
            const content =
              `<p>${i18n.t("export.geoJSON_gist.gist")}&nbsp;<a href="${
                data.html_url
              }" target="_blank" class="external">${data.id}</a></p>` +
              `<p>${i18n.t(
                "export.geoJSON_gist.geojsonio"
              )}&nbsp;<a href="http://geojson.io/#id=gist:anonymous/${
                data.id
              }" target="_blank" class="external">${i18n.t(
                "export.geoJSON_gist.geojsonio_link"
              )}</a></p>`;
            showDialog(
              i18n.t("export.geoJSON_gist.title"),
              content,
              dialog_buttons
            );
            // data.html_url;
          })
          .fail((jqXHR) => {
            alert(
              `an error occurred during the creation of the overpass gist:\n${JSON.stringify(
                jqXHR
              )}`
            );
          });
        return false;
      });
    // GPX format
    function constructGpxString(geojson: GeoJSON.FeatureCollection) {
      let gpx_str: string;
      if (!geojson) gpx_str = i18n.t("export.GPX.no_data");
      else {
        gpx_str = togpx(geojson, {
          creator: configs.appname,
          metadata: {
            desc: "Filtered OSM data converted to GPX by overpass turbo",
            copyright: {"@author": overpass.copyright},
            time: overpass.timestamp
          },
          featureTitle(props: Record<string, any>) {
            if (props.tags) {
              if (props.tags.name) return props.tags.name;
              if (props.tags.ref) return props.tags.ref;
              if (props.tags["addr:housenumber"] && props.tags["addr:street"])
                return `${props.tags["addr:street"]} ${props.tags["addr:housenumber"]}`;
            }
            return `${props.type}/${props.id}`;
          },
          //featureDescription: function(props) {},
          featureLink(props: Record<string, any>) {
            return `http://osm.org/browse/${props.type}/${props.id}`;
          }
        });
        if (gpx_str[1] !== "?")
          gpx_str = `<?xml version="1.0" encoding="UTF-8"?>\n${gpx_str}`;
      }
      return gpx_str;
    }
    $("#export-GPX .format").text("GPX");
    $("#export-GPX .export")
      .attr("href", "")
      .unbind("click")
      .on("click", () => {
        const geojson = overpass.geojson;
        const gpx_str = constructGpxString(geojson);
        // make content downloadable as file
        if (geojson) {
          saveAs(gpx_str, "application/gpx+xml", "export.gpx");
        } else {
          const d = $("#export-download-dialog");
          d.addClass("is-active");
          $(".message", d).text(gpx_str);
        }
        return false;
      });
    $("#export-GPX .copy")
      .attr("href", "")
      .click(() => {
        const d = overpass.geojson
          ? $("#export-clipboard-success")
          : $("#export-download-dialog");
        d.addClass("is-active");
        if (overpass.geojson) {
          const gpx = constructGpxString(overpass.geojson);
          copyData = {
            "text/plain": gpx,
            "application/gpx+xml": gpx
          };
          document.execCommand("copy");
          $(".message", d).html(
            i18n.t("export.copy_to_clipboard_success-message")
          );
          $(".export-copy_to_clipboard-content", d).text("GPX");
        } else {
          $(".message", d).text(i18n.t("export.GPX.no_data"));
        }
        return false;
      });
    // KML format
    function constructKmlString(geojson: GeoJSON.FeatureCollection): string {
      geojson = geojson && JSON.parse(constructGeojsonString(geojson));
      if (!geojson) return i18n.t("export.KML.no_data");
      else {
        return tokml(geojson, {
          documentName: "overpass-turbo.eu export",
          documentDescription:
            `Filtered OSM data converted to KML by overpass turbo.\n` +
            `Copyright: ${overpass.copyright}\n` +
            `Timestamp: ${overpass.timestamp}`,
          name: "name",
          description: "description"
        });
      }
    }
    $("#export-KML .format").text("KML");
    $("#export-KML .export")
      .attr("href", "")
      .unbind("click")
      .on("click", () => {
        const geojson = overpass.geojson;
        const kml_str = constructKmlString(geojson);
        // make content downloadable as file
        if (geojson) {
          saveAs(kml_str, "application/vnd.google-earth.kml+xml", "export.kml");
        } else {
          $("#export-download-dialog").addClass("is-active");
          $("#export-download-dialog .message").text(kml_str);
        }
        return false;
      });
    $("#export-KML .copy")
      .attr("href", "")
      .click(() => {
        const d = overpass.geojson
          ? $("#export-clipboard-success")
          : $("#export-download-dialog");
        d.addClass("is-active");
        if (overpass.geojson) {
          const kml = constructKmlString(overpass.geojson);
          copyData = {
            "text/plain": kml,
            "application/vnd.google-earth.kml+xml": kml
          };
          document.execCommand("copy");
          $(".message", d).html(
            i18n.t("export.copy_to_clipboard_success-message")
          );
          $(".export-copy_to_clipboard-content", d).text("KML");
        } else {
          $(".message", d).text(i18n.t("export.kml.no_data"));
        }
        return false;
      });
    // RAW format
    function constructRawData(geojson: GeoJSON.FeatureCollection): {
      raw_str: string;
      raw_type?: "osm" | "xml" | "json";
    } {
      let raw_str: string, raw_type: "osm" | "xml" | "json";
      if (!geojson) raw_str = i18n.t("export.raw.no_data");
      else {
        const data = overpass.data;
        if (data instanceof XMLDocument) {
          raw_str = new XMLSerializer().serializeToString(data);
          raw_type = raw_str.match(/<osm/) ? "osm" : "xml";
        } else if (data instanceof Object) {
          raw_str = JSON.stringify(data, undefined, 2);
          raw_type = "json";
        } else {
          try {
            raw_str = data.toString();
          } catch {
            raw_str = "Error while exporting the data";
          }
        }
      }
      return {
        raw_str: raw_str,
        raw_type: raw_type
      };
    }
    $("#export-raw .format").text(i18n.t("export.raw_data"));
    $("#export-raw .export")
      .attr("href", "")
      .unbind("click")
      .on("click", () => {
        const geojson = overpass.geojson;
        const raw = constructRawData(geojson);
        const raw_str = raw.raw_str;
        const raw_type = raw.raw_type;
        // make content downloadable as file
        if (geojson) {
          if (raw_type == "osm" || raw_type == "xml") {
            saveAs(raw_str, "application/xml", `export.${raw_type}`);
          } else if (raw_type == "json") {
            saveAs(raw_str, "application/json", "export.json");
          } else {
            saveAs(raw_str, "application/octet-stream", "export.dat");
          }
        } else {
          const d = $("#export-download-dialog");
          d.addClass("is-active");
          $(".message", d).text(raw_str);
        }
        return false;
      });
    $("#export-raw .copy")
      .attr("href", "")
      .click(() => {
        const d = overpass.geojson
          ? $("#export-clipboard-success")
          : $("#export-download-dialog");
        d.addClass("is-active");
        const geojson = overpass.geojson;
        if (geojson) {
          const raw = constructRawData(geojson);
          const raw_str = raw.raw_str;
          const raw_type = raw.raw_type;
          copyData = {
            "text/plain": raw_str
          };
          if (raw_type == "osm" || raw_type == "xml") {
            copyData["application/xml"] = raw_str;
          } else if (raw_type == "json") {
            copyData["application/json"] = raw_str;
          } else {
            copyData["application/octet-stream"] = raw_str;
          }
          document.execCommand("copy");
          $(".message", d).html(
            i18n.t("export.copy_to_clipboard_success-message")
          );
          $(".export-copy_to_clipboard-content", d).html(
            i18n.t("export.raw_data")
          );
        } else {
          $(".message", d).text(i18n.t("export.raw.no_data"));
        }
        return false;
      });

    $<HTMLAnchorElement>("#export-dialog a#export-convert-xml")[0].href =
      `${server}convert?${new URLSearchParams({
        data: query,
        target: "xml"
      })}`;
    $<HTMLAnchorElement>("#export-dialog a#export-convert-ql")[0].href =
      `${server}convert?${new URLSearchParams({
        data: query,
        target: "mapql"
      })}`;
    $<HTMLAnchorElement>("#export-dialog a#export-convert-compact")[0].href =
      `${server}convert?${new URLSearchParams({
        data: query,
        target: "compact"
      })}`;

    // OSM editors
    // first check for possible mistakes in query.
    const validEditorQuery = Autorepair.detect.editors(
      this.getRawQuery(),
      this.getQueryLang()
    );
    // * Level0
    const exportToLevel0 = $<HTMLAnchorElement>(
      "#export-dialog a#export-editors-level0"
    );
    exportToLevel0.unbind("click");
    function constructLevel0Link(query: string): string {
      return `https://level0.osmz.ru/?${new URLSearchParams({
        url: `${server}interpreter?${new URLSearchParams({data: query})}`
      })}`;
    }
    if (validEditorQuery) {
      exportToLevel0[0].href = constructLevel0Link(query);
    } else {
      exportToLevel0[0].href = "";
      exportToLevel0.bind("click", () => {
        const dialog_buttons = [
          {
            name: i18n.t("dialog.repair_query"),
            callback: async () => {
              this.repairQuery("xml+metadata");
              const query = await this.getQuery();
              exportToLevel0.unbind("click");
              exportToLevel0[0].href = constructLevel0Link(query);
              window.open(exportToLevel0[0].href, "_blank");
            }
          },
          {
            name: i18n.t("dialog.continue_anyway"),
            callback: () => {
              exportToLevel0.unbind("click");
              exportToLevel0[0].href = constructLevel0Link(query);
              window.open(exportToLevel0[0].href, "_blank");
            }
          }
        ];
        const content = `<p>${i18n.t(
          "warning.incomplete.remote.expl.1"
        )}</p><p>${i18n.t("warning.incomplete.remote.expl.2")}</p>`;
        showDialog(i18n.t("warning.incomplete.title"), content, dialog_buttons);
        return false;
      });
    }
    // * JOSM
    $("#export-dialog a#export-editors-josm")
      .unbind("click")
      .on("click", () => {
        const export_dialog = $("#export-dialog");
        function send_to_josm(query: string): void {
          const JRC_url = "http://127.0.0.1:8111/";
          $.getJSON(`${JRC_url}version`)
            .done((d) => {
              if (d.protocolversion.major == 1) {
                $.get(`${JRC_url}import`, {
                  // JOSM doesn't handle protocol-less links very well
                  url: `${server.replace(
                    /^\/\//,
                    `${location.protocol}//`
                  )}interpreter?data=${encodeURIComponent(query)}`
                })
                  .fail(() => {
                    alert("Error: Unexpected JOSM remote control error.");
                  })
                  .done(() => {
                    console.log("successfully invoked JOSM remote control");
                  });
              } else {
                const dialog_buttons = [{name: i18n.t("dialog.dismiss")}];
                const content = `<p>${i18n.t("error.remote.incompat")}: ${
                  d.protocolversion.major
                }.${d.protocolversion.minor} :(</p>`;
                showDialog(
                  i18n.t("error.remote.title"),
                  content,
                  dialog_buttons
                );
              }
            })
            .fail(() => {
              const dialog_buttons = [{name: i18n.t("dialog.dismiss")}];
              const content = `<p>${i18n.t("error.remote.not_found")}</p>`;
              showDialog(i18n.t("error.remote.title"), content, dialog_buttons);
            });
        }
        // first check for possible mistakes in query.
        const valid = Autorepair.detect.editors(
          this.getRawQuery(),
          this.getQueryLang()
        );
        if (valid) {
          // now send the query to JOSM via remote control
          send_to_josm(query);
          return false;
        } else {
          const dialog_buttons = [
            {
              name: i18n.t("dialog.repair_query"),
              callback: async () => {
                this.repairQuery("xml+metadata");
                const query = await this.getQuery();
                send_to_josm(query);
                export_dialog.removeClass("is-active");
              }
            },
            {
              name: i18n.t("dialog.continue_anyway"),
              callback: () => {
                send_to_josm(query);
                export_dialog.removeClass("is-active");
              }
            }
          ];
          const content = `<p>${i18n.t(
            "warning.incomplete.remote.expl.1"
          )}</p><p>${i18n.t("warning.incomplete.remote.expl.2")}</p>`;
          showDialog(
            i18n.t("warning.incomplete.title"),
            content,
            dialog_buttons
          );
          return false;
        }
      });
    // open the export dialog
    $("#export-dialog").addClass("is-active");
  }
  onExportDownloadClose() {
    $("#export-download-dialog").removeClass("is-active");
  }
  onExportClipboardClose() {
    $("#export-clipboard-success").removeClass("is-active");
  }
  onExportClose() {
    $("#export-dialog").removeClass("is-active");
  }
  async onExportImageClick() {
    this.waiter.open(i18n.t("waiter.export_as_image"));
    // 1. render canvas from map tiles
    // hide map controlls in this step :/
    // todo: also hide popups?
    this.waiter.addInfo("prepare map");
    $("#map .leaflet-control-container .leaflet-top").hide();
    $("#data_stats").hide();
    if (settings.export_image_attribution)
      this.map.addControl(this.attribControl);
    if (!settings.export_image_scale) this.map.removeControl(this.scaleControl);
    // try to use crossOrigin image loading. osm tiles should be served with the appropriate headers -> no need of bothering the proxy
    this.waiter.addInfo("rendering map tiles");
    $("#map .leaflet-overlay-pane").hide();
    const canvas = await html2canvas(document.getElementById("map"), {
      useCORS: true,
      allowTaint: false,
      proxy: configs.html2canvas_use_proxy ? "/html2canvas_proxy/" : undefined // use own proxy if necessary and available
    });
    $("#map .leaflet-overlay-pane").show();
    if (settings.export_image_attribution)
      this.map.removeControl(this.attribControl);
    if (!settings.export_image_scale) this.map.addControl(this.scaleControl);
    if (settings.show_data_stats) $("#data_stats").show();
    $("#map .leaflet-control-container .leaflet-top").show();
    this.waiter.addInfo("rendering map data");
    // 2. render overlay data onto canvas
    canvas.id = "render_canvas";
    const ctx = canvas.getContext("2d");
    // get geometry for svg rendering
    const height = $("#map .leaflet-overlay-pane svg").height();
    const width = $("#map .leaflet-overlay-pane svg").width();
    const tmp = $("#map .leaflet-map-pane")[0].style.cssText.match(
      /.*?(-?\d+)px.*?(-?\d+)px.*/
    );
    const offsetX = +tmp[1];
    const offsetY = +tmp[2];
    const svg = $("#map .leaflet-overlay-pane").html();
    if (svg.length > 0) {
      const v = await Canvg.from(ctx, svg, {
        ignoreAnimation: true,
        ignoreClear: true,
        ignoreDimensions: true,
        ignoreMouse: true,
        offsetX,
        offsetY,
        scaleHeight: height,
        scaleWidth: width
      });
      v.render();
    }
    this.waiter.addInfo("converting to png image");
    // 3. export canvas as html image
    const imgstr = canvas.toDataURL("image/png");
    let attrib_message = "";
    if (!settings.export_image_attribution)
      attrib_message =
        '<p style="font-size:smaller; color:orange;">Make sure to include proper attributions when distributing this image!</p>';
    const dialog_buttons = [{name: i18n.t("dialog.done")}];

    this.waiter.close();
    const content = `<p><img src="${imgstr}" alt="${i18n.t(
      "export.image.alt"
    )}" width="480px"/><br><!--<a href="${imgstr}" download="export.png" target="_blank">${i18n.t(
      "export.image.download"
    )}</a>--></p>${attrib_message}`;
    showDialog(i18n.t("export.image.title"), content, dialog_buttons);
    const save_link = document.createElement("a");
    save_link.href = imgstr;
    save_link.download = "export.png";
    save_link.dispatchEvent(new MouseEvent("click"));
  }
  onFfsClick() {
    $("#ffs-dialog #ffs-dialog-parse-error").hide();
    $("#ffs-dialog #ffs-dialog-typo").hide();
    $("#ffs-dialog .loading").hide();
    $("#ffs-dialog").addClass("is-active");
    $("#ffs-dialog input[type=search]")
      .removeClass("is-danger")
      .unbind("keypress")
      .bind("keypress", (e) => {
        if (e.key === "Enter") {
          this.onFfsRun(true);
          e.preventDefault();
        }
      })
      .first()
      .focus();
  }
  onFfsClose() {
    $("#ffs-dialog").removeClass("is-active");
  }
  onFfsBuild() {
    this.onFfsRun(false);
  }
  onFfsRun(autorun: boolean): void {
    // Show loading spinner and hide all errors
    $("#ffs-dialog input[type=search]").removeClass("is-danger");
    $("#ffs-dialog #ffs-dialog-parse-error").hide();
    $("#ffs-dialog #ffs-dialog-typo").hide();
    $("#ffs-dialog .loading").show();

    // Build query and run it immediately if autorun is set
    this.update_ffs_query(undefined, (err, ffs_result) => {
      $("#ffs-dialog .loading").hide();
      if (!err) {
        $("#ffs-dialog").removeClass("is-active");
        if (autorun !== false) this.onRunClick();
      } else {
        if (Array.isArray(ffs_result)) {
          // show parse error message
          $("#ffs-dialog #ffs-dialog-parse-error").hide();
          $("#ffs-dialog #ffs-dialog-typo").show();
          $("#ffs-dialog input[type=search]").addClass("is-danger");
          const correction = ffs_result.join("");
          const correction_html = ffs_result
            .map((ffs_result_part, i) => {
              if (i % 2 === 1) return `<b>${ffs_result_part}</b>`;
              else return ffs_result_part;
            })
            .join("");
          $("#ffs-dialog #ffs-dialog-typo-correction").html(correction_html);
          $("#ffs-dialog #ffs-dialog-typo-correction")
            .unbind("click")
            .bind("click", function (e) {
              $("#ffs-dialog input[type=search]").val(correction);
              $(this).parent().hide();
              e.preventDefault();
            });
        } else {
          // show parse error message
          $("#ffs-dialog #ffs-dialog-typo").hide();
          $("#ffs-dialog #ffs-dialog-parse-error").show();
          $("#ffs-dialog input[type=search]").addClass("is-danger");
        }
      }
    });
  }
  onStylerClick() {
    if (!overpass.geojson || overpass.geojson.features.length === 0) return;
    $("#styler-dialog").addClass("is-active");
    let allTags: Record<string, string> = {};
    overpass.geojson.features.forEach(
      (feature) => (allTags = {...allTags, ...feature.properties.tags})
    );
    make_combobox(
      $("#styler-dialog input[name=attribute]"),
      Object.keys(allTags)
    );
    function checkTag(key?: string): boolean {
      key =
        key || String($("#styler-dialog input[type=text]").first().val() ?? "");
      if (allTags[key] !== undefined) {
        $("#styler-dialog button.is-success").removeAttr("disabled");
        return true;
      } else {
        $("#styler-dialog button.is-success").attr("disabled", "disabled");
        return false;
      }
    }
    $("#styler-dialog input[type=text]")
      .first()
      .unbind("keypress")
      .bind("keypress", (e) => {
        if (e.key === "Enter") {
          if (checkTag()) {
            this.onStylerRun();
            e.preventDefault();
          }
        }
      })
      .unbind("input")
      .bind("input", () => checkTag())
      .unbind("autocompleteselect")
      .bind("autocompleteselect", (_, ui: {item: {value: string}}) =>
        checkTag(ui.item.value)
      )
      .focus();
  }
  onStylerRun() {
    if (!overpass.geojson || overpass.geojson.features.length === 0) return;
    const key = String($("#styler-dialog input[name=attribute]").val() ?? "");
    const values = [
      ...new Set<string>(
        overpass.geojson.features
          .map((f) => f.properties.tags[key])
          .filter(Boolean)
      )
    ].sort((a, b) =>
      isFinite(+a) && isFinite(+b) ? +a - +b : a < b ? -1 : a > b ? 1 : 0
    );

    let colors: string[];
    if (
      $("#styler-dialog input[name=palette]:checked").val() === "qualitative"
    ) {
      colors = colorbrewer["Set1"][Math.min(Math.max(values.length, 3), 9)];
    } else if (values.length <= 9) {
      colors = colorbrewer["YlOrRd"][Math.max(values.length, 3)];
    } else {
      colors = colormap({
        colormap: "inferno",
        nshades: values.length,
        format: "hex",
        alpha: 1
      }).reverse();
    }

    const mapCssColors: Record<string, string[]> = {};
    values.forEach((value, i) => {
      const color = colors[i % colors.length];
      if (!mapCssColors[color]) mapCssColors[color] = [];
      mapCssColors[color].push(`*[${key}=${value}]`);
    });
    const mapcss = Object.keys(mapCssColors)
      .map(
        (color) =>
          `${mapCssColors[color].join(",\n")}\n{ color: ${color}; fill-color:${color}; }`
      )
      .join("\n");

    let query = ide.getRawQuery();
    // drop previous auto-styler mapcss
    query = query.replace(
      /(\n\n)?{{style: \/\* added by auto-styler \*\/[\s\S]*?}}/,
      ""
    );
    ide.setQuery(
      `${query}\n\n{{style: /* added by auto-styler */\n${mapcss}\n}}`
    );

    this.rerender_map();
    this.onStylerClose();
  }
  onStylerClose() {
    $("#styler-dialog").removeClass("is-active");
  }
  onSettingsClick() {
    $<HTMLInputElement>("#settings-dialog input[name=ui_language]")[0].value =
      settings.ui_language;
    const lngDescs = i18n.getSupportedLanguagesDescriptions();
    make_combobox(
      $("#settings-dialog input[name=ui_language]"),
      ["auto"].concat(i18n.getSupportedLanguages()).map((lng) => ({
        value: lng,
        label: lng == "auto" ? "auto" : `${lng} - ${lngDescs[lng]}`
      }))
    );
    $<HTMLInputElement>("#settings-dialog input[name=server]")[0].value =
      settings.server;
    make_combobox(
      $("#settings-dialog input[name=server]"),
      configs.suggestedServers.concat(settings.customServers),
      settings.customServers,
      (server) => {
        settings.customServers.splice(
          settings.customServers.indexOf(server),
          1
        );
        settings.save();
      }
    );
    $<HTMLInputElement>(
      "#settings-dialog input[name=no_autorepair]"
    )[0].checked = settings.no_autorepair;
    $<HTMLInputElement>(
      "#settings-dialog input[name=disable_warning_huge_data]"
    )[0].checked = settings.disable_warning_huge_data;
    // editor options
    $<HTMLInputElement>(
      "#settings-dialog input[name=use_rich_editor]"
    )[0].checked = settings.use_rich_editor;
    $<HTMLInputElement>("#settings-dialog input[name=editor_width]")[0].value =
      settings.editor_width;
    // sharing options
    $<HTMLInputElement>(
      "#settings-dialog input[name=share_include_pos]"
    )[0].checked = settings.share_include_pos;
    $<HTMLInputElement>(
      "#settings-dialog input[name=share_compression]"
    )[0].value = settings.share_compression;
    make_combobox($("#settings-dialog input[name=share_compression]"), [
      "auto",
      "on",
      "off"
    ]);
    // map settings
    $<HTMLInputElement>("#settings-dialog input[name=tile_server]")[0].value =
      settings.tile_server;
    make_combobox(
      $("#settings-dialog input[name=tile_server]"),
      configs.suggestedTiles.concat(settings.customTiles),
      settings.customTiles,
      (tileServer) => {
        settings.customTiles.splice(
          settings.customTiles.indexOf(tileServer),
          1
        );
        settings.save();
      }
    );
    $<HTMLInputElement>(
      "#settings-dialog input[name=background_opacity]"
    )[0].value = String(settings.background_opacity);
    $<HTMLInputElement>(
      "#settings-dialog input[name=enable_crosshairs]"
    )[0].checked = settings.enable_crosshairs;
    $<HTMLInputElement>(
      "#settings-dialog input[name=disable_poiomatic]"
    )[0].checked = settings.disable_poiomatic;
    $<HTMLInputElement>(
      "#settings-dialog input[name=show_data_stats]"
    )[0].checked = settings.show_data_stats;
    $<HTMLSelectElement>(
      "#settings-dialog select[name=editor_preference]"
    )[0].value = settings.editor_preference;
    // export settings
    $<HTMLInputElement>(
      "#settings-dialog input[name=export_image_scale]"
    )[0].checked = settings.export_image_scale;
    $<HTMLInputElement>(
      "#settings-dialog input[name=export_image_attribution]"
    )[0].checked = settings.export_image_attribution;
    // open dialog
    $("#settings-dialog").addClass("is-active");
  }
  onSettingsSave() {
    // save settings
    const new_ui_language = $<HTMLInputElement>(
      "#settings-dialog input[name=ui_language]"
    )[0].value;
    // reload ui if language has been changed
    if (settings.ui_language != new_ui_language) {
      i18n.translate(new_ui_language);
      ffs_invalidateCache();
    }
    settings.ui_language = new_ui_language;
    settings.server = $<HTMLInputElement>(
      "#settings-dialog input[name=server]"
    )[0].value;
    if (
      configs.suggestedServers.indexOf(settings.server) === -1 &&
      settings.customServers.indexOf(settings.server) === -1
    ) {
      settings.customServers.push(settings.server);
    }
    settings.no_autorepair = $<HTMLInputElement>(
      "#settings-dialog input[name=no_autorepair]"
    )[0].checked;
    settings.disable_warning_huge_data = $<HTMLInputElement>(
      "#settings-dialog input[name=disable_warning_huge_data]"
    )[0].checked;
    settings.use_rich_editor = $<HTMLInputElement>(
      "#settings-dialog input[name=use_rich_editor]"
    )[0].checked;
    const prev_editor_width = settings.editor_width;
    settings.editor_width = $<HTMLInputElement>(
      "#settings-dialog input[name=editor_width]"
    )[0].value;
    // update editor width (if changed)
    if (prev_editor_width != settings.editor_width) {
      $("#editor").css("width", settings.editor_width);
      $("#dataviewer").css("left", settings.editor_width);
    }
    settings.share_include_pos = $<HTMLInputElement>(
      "#settings-dialog input[name=share_include_pos]"
    )[0].checked;
    settings.share_compression = $<HTMLInputElement>(
      "#settings-dialog input[name=share_compression]"
    )[0].value;
    const prev_tile_server = settings.tile_server;
    settings.tile_server = $<HTMLInputElement>(
      "#settings-dialog input[name=tile_server]"
    )[0].value;
    if (
      configs.suggestedTiles.indexOf(settings.tile_server) === -1 &&
      settings.customTiles.indexOf(settings.tile_server) === -1
    ) {
      settings.customTiles.push(settings.tile_server);
    }
    // update tile layer (if changed)
    if (prev_tile_server != settings.tile_server)
      this.map.tile_layer.setUrl(settings.tile_server);
    const prev_background_opacity = settings.background_opacity;
    settings.background_opacity = +$<HTMLInputElement>(
      "#settings-dialog input[name=background_opacity]"
    )[0].value;
    // update background opacity layer
    if (settings.background_opacity != prev_background_opacity)
      if (settings.background_opacity == 1)
        this.map.removeLayer(this.map.inv_opacity_layer);
      else
        this.map.inv_opacity_layer
          .setOpacity(1 - settings.background_opacity)
          .addTo(this.map);
    settings.enable_crosshairs = $<HTMLInputElement>(
      "#settings-dialog input[name=enable_crosshairs]"
    )[0].checked;
    settings.disable_poiomatic = $<HTMLInputElement>(
      "#settings-dialog input[name=disable_poiomatic]"
    )[0].checked;
    settings.show_data_stats = $<HTMLInputElement>(
      "#settings-dialog input[name=show_data_stats]"
    )[0].checked;
    settings.editor_preference = $<HTMLSelectElement>(
      "#settings-dialog select[name=editor_preference]"
    )[0].value;
    $(".crosshairs").toggle(settings.enable_crosshairs); // show/hide crosshairs
    settings.export_image_scale = $<HTMLInputElement>(
      "#settings-dialog input[name=export_image_scale]"
    )[0].checked;
    settings.export_image_attribution = $<HTMLInputElement>(
      "#settings-dialog input[name=export_image_attribution]"
    )[0].checked;
    settings.save();
    $("#settings-dialog").removeClass("is-active");
  }
  onSettingsClose() {
    $("#settings-dialog").removeClass("is-active");
  }
  onSettingsReset() {
    if (!window.confirm("Reset?")) return;
    settings.reset();
    location.reload();
  }
  onHelpClick() {
    $("#help-dialog").addClass("is-active");
  }
  onHelpClose() {
    $("#help-dialog").removeClass("is-active");
  }
  onKeyPress(event: KeyboardEvent | JQuery.KeyDownEvent): void {
    if (
      event.key === "F9" || // F9
      (event.key === "Enter" && (event.ctrlKey || event.metaKey))
    ) {
      // Ctrl+Enter
      this.onRunClick(); // run query
      event.preventDefault();
    }
    if (
      event.key == "e" &&
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      !event.altKey
    ) {
      // Ctrl+E
      this.onExportClick();
      event.preventDefault();
    }
    if (
      event.key == "s" &&
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      !event.altKey
    ) {
      // Ctrl+S
      this.onSaveClick();
      event.preventDefault();
    }
    if (
      event.key == "o" &&
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      !event.altKey
    ) {
      // Ctrl+O
      this.onLoadClick();
      event.preventDefault();
    }
    if (
      event.key == "h" &&
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      !event.altKey
    ) {
      // Ctrl+H
      this.onHelpClick();
      event.preventDefault();
    }
    if (
      (event.key == "i" &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey) ||
      (event.key == "F" &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        !event.altKey)
    ) {
      // Ctrl+I or Ctrl+Shift+F
      this.onFfsClick();
      event.preventDefault();
    }
    if (
      event.key == "k" &&
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      !event.altKey
    ) {
      // Ctrl+K
      if (overpass.geojson) {
        this.onStylerClick();
      }
      event.preventDefault();
    }

    if (event.key === "Escape") {
      // Escape
      $(".modal").removeClass("is-active");
    }

    // todo: more shortcuts
  }
  async update_map() {
    this.waiter.open(i18n.t("waiter.processing_query"));
    this.waiter.addInfo("resetting map");
    $("#data_stats").remove();
    // resets previously highlighted error lines
    this.resetErrors();
    // reset previously loaded data and overlay
    this.dataViewer.setValue("");
    if (typeof overpass.osmLayer != "undefined")
      this.map.removeLayer(overpass.osmLayer);
    $("#map_blank").remove();

    this.waiter.addInfo("building query");
    // run the query via the overpass object
    const query = await this.getQuery();
    if (configs.push_history_url && typeof history.pushState == "function") {
      const url = this.compose_share_link(this.getRawQuery(), true);
      if (url.length > 2000) {
        // avoid HTTP 431 Request Header Fields Too Large
        // see https://stackoverflow.com/a/417184
        // simply store as hash in URL
        history.pushState({}, "", `?#${url.slice(1)}`);
      } else {
        history.pushState({}, "", url);
      }
    }
    const query_lang = this.getQueryLang();
    const server =
      this.data_source &&
      this.data_source.options.server &&
      (this.data_source.mode == "sql" || this.data_source.mode == "overpass")
        ? this.data_source.options.server
        : settings.server;

    overpass.run_query(
      query,
      query_lang,
      undefined,
      undefined,
      server,
      this.data_source ? this.data_source.options : undefined,
      this.mapcss
    );
  }
  async rerender_map() {
    $("#data_stats").remove();
    if (typeof overpass.osmLayer != "undefined")
      this.map.removeLayer(overpass.osmLayer);
    await this.getQuery();
    overpass.rerender(this.mapcss);
  }
  update_ffs_query(
    s: string | undefined,
    callback: (err: unknown, ffs_result?: string[]) => void
  ): void {
    const search = s || String($("#ffs-dialog input[type=search]").val() ?? "");
    const comment = $<HTMLInputElement>(
      "#ffs-dialog input[name='ffs.comments']"
    )[0].checked;
    ffs_construct_query(search, comment, (err: unknown, query: string) => {
      if (err) {
        ffs_repair_search(search, (repaired: string[] | false) => {
          if (repaired) {
            callback("repairable query", repaired);
          } else {
            if (s) return callback(true);
            // try to parse as generic ffs search
            this.update_ffs_query(`"${search}"`, callback);
          }
        });
      } else {
        this.setQuery(query);
        callback(null);
      }
    });
  }
  onClearClick() {
    this.setQuery("");
  }
}

const ide = new IDE();

export default ide;
