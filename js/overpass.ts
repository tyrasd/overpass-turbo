// global overpass object
import $ from "jquery";
import _ from "lodash";
import "leaflet";
import L_PopupIcon from "./PopupIcon"; // eslint-disable-line @typescript-eslint/no-unused-vars
import L_OSM4Leaflet from "./OSM4Leaflet";
import L_GeoJsonNoVanish from "./GeoJsonNoVanish";

import configs from "./configs";
import settings from "./settings";
import {htmlentities} from "./misc";
import styleparser from "./jsmapcss";
import {featurePopupContent} from "./popup";

export type QueryLang = "xml" | "OverpassQL";

class Overpass {
  ajax_request_duration: number;
  ajax_request_start: number;
  ajax_request;
  copyright;
  data;
  geojson;
  handlers = {};
  osmLayer: L_OSM4Leaflet;
  rerender: (userMapCSS: string) => void = () => {};
  resultText;
  resultType: string;
  stats;
  timestamp;
  timestampAreas;

  private fire(name, ...handler_args) {
    if (typeof this.handlers[name] != "function") return undefined;
    return this.handlers[name].apply({}, handler_args);
  }

  init() {
    // register mapcss extensions
    /* own MapCSS-extension:
     * added symbol-* properties
     * TODO: implement symbol-shape = marker|square?|shield?|...
     */
    styleparser.PointStyle.prototype.properties.push(
      "symbol_shape",
      "symbol_size",
      "symbol_stroke_width",
      "symbol_stroke_color",
      "symbol_stroke_opacity",
      "symbol_fill_color",
      "symbol_fill_opacity"
    );
    styleparser.PointStyle.prototype.symbol_shape = "";
    styleparser.PointStyle.prototype.symbol_size = NaN;
    styleparser.PointStyle.prototype.symbol_stroke_width = NaN;
    styleparser.PointStyle.prototype.symbol_stroke_color = null;
    styleparser.PointStyle.prototype.symbol_stroke_opacity = NaN;
    styleparser.PointStyle.prototype.symbol_fill_color = null;
    styleparser.PointStyle.prototype.symbol_fill_opacity = NaN;
  }

  // updates the map
  run_query(
    query: string,
    query_lang: QueryLang,
    cache,
    shouldCacheOnly = false,
    server: string,
    user_mapcss: string
  ) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const overpass = this;
    server = server || configs.defaultServer;
    // 1. get overpass json data
    if (query_lang == "xml") {
      // beautify not well formed xml queries (workaround for non matching error lines)
      if (!query.match(/^<\?xml/)) {
        if (!query.match(/<osm-script/))
          query = `<osm-script>${query}</osm-script>`;
        query = `<?xml version="1.0" encoding="UTF-8"?>${query}`;
      }
    }
    overpass.fire(
      "onProgress",
      "calling Overpass API interpreter",
      (callback) => {
        // kill the query on abort
        overpass.ajax_request.abort();
        // try to abort queries via kill_my_queries
        $.get(`${server}kill_my_queries`)
          .done(callback)
          .fail(() => {
            console.log("Warning: failed to kill query.");
            callback();
          });
      }
    );
    function onSuccessCb(data, textStatus, jqXHR) {
      //textStatus is not needed in the successCallback, don't cache it
      if (cache) cache[query] = [data, undefined, jqXHR];

      let data_amount = jqXHR.responseText.length;
      let data_txt;
      // round amount of data
      const scale = Math.floor(Math.log(data_amount) / Math.log(10));
      data_amount =
        Math.round(data_amount / Math.pow(10, scale)) * Math.pow(10, scale);
      if (data_amount < 1000) data_txt = `${data_amount} bytes`;
      else if (data_amount < 1000000) data_txt = `${data_amount / 1000} kB`;
      else data_txt = `${data_amount / 1000000} MB`;
      overpass.fire("onProgress", `received about ${data_txt} of data`);
      overpass.fire(
        "onDataReceived",
        data_amount,
        data_txt,
        () => {
          // abort callback
          overpass.fire("onAbort");
          return;
        },
        () => {
          // continue callback
          // different cases of loaded data: json data, xml data or error message?
          let data_mode = null;
          let geojson;
          const stats = {} as {
            data: {
              nodes: number;
              ways: number;
              relations: number;
              areas: number;
            };
            geojson: {
              polys: number;
              lines: number;
              pois: number;
            };
          };
          overpass.ajax_request_duration =
            Date.now() - overpass.ajax_request_start;
          overpass.fire("onProgress", "parsing data");
          setTimeout(() => {
            // hacky firefox hack :( (it is not properly detecting json from the content-type header)
            if (typeof data == "string" && data[0] == "{") {
              // if the data is a string, but looks more like a json object
              try {
                data = $.parseJSON(data);
              } catch (e) {}
            }
            // hacky firefox hack :( (it is not properly detecting xml from the content-type header)
            if (
              typeof data == "string" &&
              data.substr(0, 5) == "<?xml" &&
              jqXHR.status === 200 &&
              !(jqXHR.getResponseHeader("content-type") || "").match(
                /text\/html/
              ) &&
              data.match(/<osm/)
            ) {
              try {
                jqXHR.responseXML = data;
                data = $.parseXML(data);
              } catch (e) {
                delete jqXHR.responseXML;
              }
            }
            if (
              typeof data == "string" ||
              (typeof data == "object" &&
                jqXHR.responseXML &&
                $("remark", data).length > 0) ||
              (typeof data == "object" && data.remark && data.remark.length > 0)
            ) {
              // maybe an error message
              data_mode = "unknown";
              let is_error = false;
              is_error =
                is_error ||
                (typeof data == "string" && // html coded error messages
                  data.indexOf("Error") != -1 &&
                  data.indexOf("<script") == -1 && // detect output="custom" content
                  data.indexOf("<h2>Public Transport Stops</h2>") == -1); // detect output="popup" content
              is_error =
                is_error ||
                (typeof data == "object" &&
                  jqXHR.responseXML &&
                  $("remark", data).length > 0);
              is_error =
                is_error ||
                (typeof data == "object" &&
                  data.remark &&
                  data.remark.length > 0);
              if (is_error) {
                // this really looks like an error message, so lets open an additional modal error message
                let errmsg = "?";
                let fullerrmsg;
                if (typeof data == "string") {
                  errmsg = data
                    .replace(/([\S\s]*<body>)/, "")
                    .replace(/(<\/body>[\S\s]*)/, "");
                  // do some magic cleanup for better legibility of the actual error message
                  errmsg = errmsg.replace(
                    /<p>The data included in this document is from .*?<\/p>/,
                    ""
                  );
                  fullerrmsg = errmsg;
                  errmsg = errmsg.replace(
                    /open64: 0 Success \/osm3s_v\d+\.\d+\.\d+_osm_base (\w+::)*\w+\./,
                    "[…]"
                  );
                }
                if (typeof data == "object" && jqXHR.responseXML)
                  errmsg = `<p>${$.trim($("remark", data).html())}</p>`;
                if (typeof data == "object" && data.remark)
                  errmsg = `<p>${$("<div/>")
                    .text($.trim(data.remark))
                    .html()}</p>`;
                console.log("Overpass API error", fullerrmsg || errmsg); // write (full) error message to console for easier debugging
                overpass.fire("onQueryError", errmsg);
                data_mode = "error";
                // parse errors and highlight error lines
                const errlines = errmsg.match(/line \d+:/g) || [];
                for (const errline of errlines) {
                  overpass.fire(
                    "onQueryErrorLine",
                    1 * errline.match(/\d+/)[0]
                  );
                }
              }
              // the html error message returned by overpass API looks goods also in xml mode ^^
              overpass.resultType = "error";
              data = {elements: []};
              overpass.timestamp = undefined;
              overpass.timestampAreas = undefined;
              overpass.copyright = undefined;
              stats.data = {nodes: 0, ways: 0, relations: 0, areas: 0};
              //geojson = [{features:[]}, {features:[]}, {features:[]}];
            } else if (typeof data == "object" && jqXHR.responseXML) {
              // xml data
              overpass.resultType = "xml";
              data_mode = "xml";
              overpass.timestamp = $("osm > meta:first-of-type", data).attr(
                "osm_base"
              );
              overpass.timestampAreas = $(
                "osm > meta:first-of-type",
                data
              ).attr("areas");
              overpass.copyright = $("osm > note:first-of-type", data).text();
              stats.data = {
                nodes: $("osm > node", data).length,
                ways: $("osm > way", data).length,
                relations: $("osm > relation", data).length,
                areas: $("osm > area", data).length
              };
              //// convert to geoJSON
              //geojson = overpass.overpassXML2geoJSON(data);
            } else {
              // maybe json data
              overpass.resultType = "javascript";
              data_mode = "json";
              overpass.timestamp = data.osm3s.timestamp_osm_base;
              overpass.timestampAreas = data.osm3s.timestamp_areas_base;
              overpass.copyright = data.osm3s.copyright;
              stats.data = {
                nodes: $.grep(data.elements, (d) => d.type == "node").length,
                ways: $.grep(data.elements, (d) => d.type == "way").length,
                relations: $.grep(data.elements, (d) => d.type == "relation")
                  .length,
                areas: $.grep(data.elements, (d) => d.type == "area").length
              };
              //// convert to geoJSON
              //geojson = overpass.overpassJSON2geoJSON(data);
            }

            //overpass.fire("onProgress", "applying styles"); // doesn't correspond to what's really going on. (the whole code could in principle be put further up and called "preparing mapcss styles" or something, but it's probably not worth the effort)

            // show rerender button, if query contains mapcss styles
            if (user_mapcss) {
              $("#rerender-button").show();
            } else {
              $("#rerender-button").hide();
            }

            overpass.rerender = function (userMapCSS) {
              // test user supplied mapcss stylesheet
              try {
                const dummy_mapcss = new styleparser.RuleSet();
                dummy_mapcss.parseCSS(userMapCSS);
                try {
                  dummy_mapcss.getStyles(
                    {
                      isSubject() {
                        return true;
                      },
                      getParentObjects() {
                        return [];
                      }
                    },
                    [],
                    18
                  );
                } catch (e) {
                  throw new Error("MapCSS runtime error.");
                }
              } catch (e) {
                userMapCSS = "";
                overpass.fire("onStyleError", `<p>${e.message}</p>`);
              }
              const mapcss = new styleparser.RuleSet();
              mapcss.parseCSS(
                `` +
                  `node, way, relation {color:black; fill-color:black; opacity:1; fill-opacity: 1; width:10;} \n` +
                  // point features
                  `node {color:#03f; width:2; opacity:0.7; fill-color:#fc0; fill-opacity:0.3;} \n` +
                  // line features
                  `line {color:#03f; width:5; opacity:0.6; render:auto;} \n` +
                  // polygon features
                  `area {color:#03f; width:2; opacity:0.7; fill-color:#fc0; fill-opacity:0.3; render:auto;} \n` +
                  // style modifications
                  // objects in relations
                  `relation node, relation way, relation {color:#d0f;} \n` +
                  // tainted objects
                  `way:tainted, relation:tainted {dashes:5,8;} \n` +
                  // placeholder points
                  `way:placeholder, relation:placeholder {fill-color:#f22;} \n` +
                  // highlighted features
                  `node:active, way:active, relation:active {color:#f50; fill-color:#f50;} \n${
                    // user supplied mapcss
                    userMapCSS
                  }`
              );
              function get_feature_style(feature, highlight = false) {
                function hasInterestingTags(props) {
                  // this checks if the node has any tags other than "created_by"
                  return (
                    props &&
                    props.tags &&
                    (function (o) {
                      for (const k in o)
                        if (k != "created_by" && k != "source") return true;
                      return false;
                    })(props.tags)
                  );
                }
                const s = mapcss.getStyles(
                  {
                    isSubject(subject) {
                      switch (subject) {
                        case "node":
                          return (
                            feature.properties.type == "node" ||
                            feature.geometry.type == "Point"
                          );
                        case "area":
                          return (
                            feature.geometry.type == "Polygon" ||
                            feature.geometry.type == "MultiPolygon"
                          );
                        case "line":
                          return (
                            feature.geometry.type == "LineString" ||
                            feature.geometry.type == "MultiLineString"
                          );
                        case "way":
                          return feature.properties.type == "way";
                        case "relation":
                          return feature.properties.type == "relation";
                      }
                      return false;
                    },
                    getParentObjects() {
                      if (feature.properties.relations.length == 0) return [];
                      else
                        return feature.properties.relations.map((rel) => ({
                          tags: rel.reltags,
                          isSubject(subject) {
                            return (
                              subject == "relation" ||
                              (subject == "area" &&
                                rel.reltags.type == "multipolyon")
                            );
                          },
                          getParentObjects() {
                            return [];
                          }
                        }));
                    }
                  },
                  $.extend(
                    feature.properties && feature.properties.tainted
                      ? {":tainted": true}
                      : {},
                    feature.properties && feature.properties.geometry
                      ? {":placeholder": true}
                      : {},
                    feature.is_placeholder ? {":placeholder": true} : {},
                    hasInterestingTags(feature.properties)
                      ? {":tagged": true}
                      : {":untagged": true},
                    highlight ? {":active": true} : {},
                    (function (tags, meta, id) {
                      const res = {"@id": id};
                      for (const key in meta) res[`@${key}`] = meta[key];
                      for (const key in tags)
                        res[key.replace(/^@/, "@@")] = tags[key];
                      return res;
                    })(
                      feature.properties.tags,
                      feature.properties.meta,
                      feature.properties.id
                    )
                  ),
                  18 /*restyle on zoom??*/
                );
                return s;
              }

              overpass.osmLayer = new L_OSM4Leaflet(null, {
                afterParse() {
                  overpass.fire("onProgress", "rendering geoJSON");
                },
                baseLayerClass: L_GeoJsonNoVanish,
                baseLayerOptions: {
                  threshold: 9 * Math.sqrt(2) * 2,
                  compress(feature) {
                    const render = this.style(feature).render;
                    if (render === "auto" && settings.disable_poiomatic)
                      return "native";
                    else return render;
                  },
                  style(feature, highlight) {
                    const stl: L.PathOptions = {};
                    const s = get_feature_style(feature, highlight);
                    // apply mapcss styles
                    function get_property(styles, properties) {
                      for (let i = properties.length - 1; i >= 0; i--)
                        if (styles[properties[i]] !== undefined)
                          return styles[properties[i]];
                      return undefined;
                    }
                    let p;
                    let styles;
                    switch (feature.geometry.type) {
                      case "Point":
                        styles = $.extend(
                          {},
                          s.shapeStyles["default"],
                          s.pointStyles["default"]
                        );
                        p = get_property(styles, [
                          "color",
                          "symbol_stroke_color"
                        ]);
                        if (p !== undefined) stl.color = p;
                        p = get_property(styles, [
                          "opacity",
                          "symbol_stroke_opacity"
                        ]);
                        if (p !== undefined) stl.opacity = p;
                        p = get_property(styles, [
                          "width",
                          "symbol_stroke_width"
                        ]);
                        if (p !== undefined) stl.weight = p;
                        p = get_property(styles, [
                          "fill_color",
                          "symbol_fill_color"
                        ]);
                        if (p !== undefined) stl.fillColor = p;
                        p = get_property(styles, [
                          "fill_opacity",
                          "symbol_fill_opacity"
                        ]);
                        if (p !== undefined) stl.fillOpacity = p;
                        p = get_property(styles, ["dashes"]);
                        if (p !== undefined) stl.dashArray = p.join(" ");
                        break;
                      case "LineString":
                      case "MultiLineString":
                        styles = s.shapeStyles["default"];
                        p = get_property(styles, ["color"]);
                        if (p !== undefined) stl.color = p;
                        p = get_property(styles, ["opacity"]);
                        if (p !== undefined) stl.opacity = p;
                        p = get_property(styles, ["width"]);
                        if (p !== undefined) stl.weight = p;
                        p = get_property(styles, ["offset"]);
                        if (p !== undefined) stl.dashOffset = String(-p); // MapCSS and PolylineOffset definitions use different signs
                        p = get_property(styles, ["dashes"]);
                        if (p !== undefined) stl.dashArray = p.join(" ");
                        p = get_property(styles, ["render"]);
                        if (p !== undefined) stl.render = p;
                        break;
                      case "Polygon":
                      case "MultiPolygon":
                        styles = s.shapeStyles["default"];
                        p = get_property(styles, ["color", "casing_color"]);
                        if (p !== undefined) stl.color = p;
                        p = get_property(styles, ["opacity", "casing_opacity"]);
                        if (p !== undefined) stl.opacity = p;
                        p = get_property(styles, ["width", "casing_width"]);
                        if (p !== undefined) stl.weight = p;
                        p = get_property(styles, ["fill_color"]);
                        if (p !== undefined) stl.fillColor = p;
                        p = get_property(styles, ["fill_opacity"]);
                        if (p !== undefined) stl.fillOpacity = p;
                        p = get_property(styles, ["dashes"]);
                        if (p !== undefined) stl.dashArray = p.join(" ");
                        p = get_property(styles, ["render"]);
                        if (p !== undefined) stl.render = p;
                        break;
                    }
                    // todo: more style properties? linecap, linejoin?
                    // return style object
                    return stl;
                  },
                  pointToLayer(feature, latlng) {
                    const s = get_feature_style(feature);
                    const stl = s.pointStyles["default"] || {};
                    let marker;
                    if (stl["icon_image"]) {
                      // return image marker
                      const iconUrl = stl["icon_image"].match(
                        /^url\(['"](.*)['"]\)$/
                      )[1];
                      let iconSize;
                      if (stl["icon_width"])
                        iconSize = [stl["icon_width"], stl["icon_width"]];
                      if (stl["icon_height"] && iconSize)
                        iconSize[1] = stl["icon_height"];
                      const icon = new L.Icon({
                        iconUrl: iconUrl,
                        iconSize: iconSize
                        // todo: anchor, shadow?, ...
                      });
                      marker = new L.Marker(latlng, {icon: icon});
                    } else if (stl["symbol_shape"] == "none") {
                      marker = new L.Marker(latlng, {
                        icon: new L.DivIcon({
                          iconSize: [0, 0],
                          html: "",
                          className: "leaflet-dummy-none-marker"
                        })
                      });
                    } else {
                      // return circle marker
                      const r = stl["symbol_size"] || 9;
                      marker = new L.CircleMarker(latlng, {
                        radius: r
                      });
                    }
                    return marker;
                  },
                  onEachFeature(feature, layer) {
                    const s = get_feature_style(feature, false);
                    const stl = s.textStyles["default"] || {};
                    let text = stl["text"];
                    if (
                      (text && stl.evals["text"]) ||
                      (text && (text = feature.properties.tags[text]))
                    ) {
                      const tooltip = new L.Tooltip({
                        direction: stl["text_position"],
                        className: "text-tooltip",
                        permanent: true
                      });
                      tooltip.setContent(htmlentities(text));
                      tooltip._initLayout = function () {
                        L.Tooltip.prototype._initLayout.call(this);
                        this._container.setAttribute(
                          "style",
                          styleparser.TextStyle.prototype.textStyleAsCSS.call(
                            stl
                          )
                        );
                      };
                      layer.bindTooltip(tooltip);
                    }
                    layer.on("click", function (e) {
                      const popup = featurePopupContent(feature);
                      let latlng;
                      // node-ish features (circles, markers, icons, placeholders)
                      if (typeof e.target.getLatLng == "function")
                        latlng = e.target.getLatLng();
                      // if there is a placeholder on a line, polygon or multipolygon
                      // then get the center instead of the position of the click
                      else if (e.target.placeholder)
                        latlng = e.target.placeholder._latlng;
                      else latlng = e.latlng; // all other (lines, polygons, multipolygons)
                      const p = L.popup({maxHeight: 600}, this)
                        .setLatLng(latlng)
                        .setContent(popup);
                      p.layer = layer;
                      overpass.fire("onPopupReady", p);
                    });
                  }
                } as L.GeoJSONOptions
              });

              setTimeout(() => {
                overpass.osmLayer.addData(data, () => {
                  // save geojson and raw data
                  geojson = overpass.osmLayer.getGeoJSON();
                  overpass.geojson = geojson;
                  overpass.data = data;

                  // calc stats
                  stats.geojson = {
                    polys: 0,
                    lines: 0,
                    pois: 0
                  };
                  for (const feature of geojson.features)
                    switch (feature.geometry.type) {
                      case "Polygon":
                      case "MultiPolygon":
                        stats.geojson.polys++;
                        break;
                      case "LineString":
                      case "MultiLineString":
                        stats.geojson.lines++;
                        break;
                      case "Point":
                      case "MultiPoint":
                        stats.geojson.pois++;
                        break;
                    }
                  overpass.stats = stats;

                  if (!shouldCacheOnly) overpass.fire("onGeoJsonReady");

                  // print raw data
                  overpass.fire("onProgress", "printing raw data");
                  setTimeout(() => {
                    overpass.resultText = jqXHR.responseText;
                    overpass.fire("onRawDataPresent");

                    // todo: the following would profit from some unit testing
                    // this is needed for auto-tab-switching: if there is only non map-visible data, show it directly
                    if (geojson.features.length === 0) {
                      // no visible data
                      // switch only if there is some unplottable data in the returned json/xml.
                      let empty_msg;
                      if (
                        (data_mode == "json" && data.elements.length > 0) ||
                        (data_mode == "xml" &&
                          $("osm", data).children().not("note,meta,bounds")
                            .length > 0)
                      ) {
                        // check for "only areas returned"
                        if (
                          (data_mode == "json" &&
                            _.every(data.elements, {type: "area"})) ||
                          (data_mode == "xml" &&
                            $("osm", data)
                              .children()
                              .not("note,meta,bounds,area").length == 0)
                        )
                          empty_msg = "only areas returned";
                        else if (
                          (data_mode == "json" &&
                            _.some(data.elements, {type: "node"})) ||
                          (data_mode == "xml" &&
                            $("osm", data).children().filter("node").length > 0)
                        )
                          // check for "ids_only" or "tags" on nodes
                          empty_msg = "no coordinates returned";
                        else if (
                          (data_mode == "json" &&
                            _.some(data.elements, {type: "way"}) &&
                            !_.some(
                              _.filter(data.elements, {type: "way"}),
                              "nodes"
                            )) ||
                          (data_mode == "xml" &&
                            $("osm", data).children().filter("way").length >
                              0 &&
                            $("osm", data)
                              .children()
                              .filter("way")
                              .children()
                              .filter("nd").length == 0)
                        )
                          // check for "ids_only" or "tags" on ways
                          empty_msg = "no coordinates returned";
                        else if (
                          (data_mode == "json" &&
                            _.some(data.elements, {type: "relation"}) &&
                            !_.some(
                              _.filter(data.elements, {type: "relation"}),
                              "members"
                            )) ||
                          (data_mode == "xml" &&
                            $("osm", data).children().filter("relation")
                              .length > 0 &&
                            $("osm", data)
                              .children()
                              .filter("relation")
                              .children()
                              .filter("member").length == 0)
                        )
                          // check for "ids_only" or "tags" on relations
                          empty_msg = "no coordinates returned";
                        else empty_msg = "no visible data";
                      } else if (data_mode == "error") {
                        empty_msg = "an error occured";
                      } else if (data_mode == "unknown") {
                        empty_msg = "unstructured data returned";
                      } else {
                        empty_msg = "received empty dataset";
                      }
                      // show why there is an empty map
                      overpass.fire("onEmptyMap", empty_msg, data_mode);
                    }

                    // closing wait spinner
                    overpass.fire("onDone");
                  }, 1); // end setTimeout
                });
              }, 1); // end setTimeout
            }; // end overpass.rerender
            setTimeout(overpass.rerender, 1, user_mapcss);
          }, 1); // end setTimeout
        }
      );
    }
    // eslint-disable-next-line no-prototype-builtins
    if (cache && cache.hasOwnProperty(query)) {
      onSuccessCb.apply(this, cache[query]);
    } else {
      overpass.ajax_request_start = Date.now();
      overpass.ajax_request = $.ajax(`${server}interpreter`, {
        type: "POST",
        data: {data: query},
        success: onSuccessCb,
        error(jqXHR, textStatus) {
          if (textStatus == "abort") return; // ignore aborted queries.
          overpass.fire("onProgress", "error during ajax call");
          if (
            jqXHR.status == 400 ||
            jqXHR.status == 504 ||
            jqXHR.status == 429
          ) {
            // todo: handle those in a separate routine
            // pass 400 Bad Request errors to the standard result parser, as this is most likely going to be a syntax error in the query.
            this.success(jqXHR.responseText, textStatus, jqXHR);
            return;
          }
          overpass.resultText = jqXHR.resultText;
          let errmsg = "";
          if (jqXHR.state() == "rejected")
            errmsg +=
              "<p>Request rejected. (e.g. server not found, request blocked by browser addon, request redirected, internal server errors, etc.)</p>";
          if (textStatus == "parsererror")
            errmsg += "<p>Error while parsing the data (parsererror).</p>";
          else if (textStatus != "error" && textStatus != jqXHR.statusText)
            errmsg += `<p>Error-Code: ${textStatus}</p>`;
          if (
            (jqXHR.status != 0 && jqXHR.status != 200) ||
            jqXHR.statusText != "OK" // note to me: jqXHR.status "should" give http status codes
          )
            errmsg += `<p>Error-Code: ${jqXHR.statusText} (${jqXHR.status})</p>`;
          overpass.fire("onAjaxError", errmsg);
          // closing wait spinner
          overpass.fire("onDone");
        }
      }); // getJSON
    }
  }
}

const overpass = new Overpass();

export default overpass;
