import * as L from "leaflet";

/** How a feature should be rendered, as decided by the MapCSS `render` property. */
type Compress = "auto" | "native" | "point" | undefined;

/** A GeoJSON feature, plus the marker set on the stand-ins created below. */
type PlaceholderFeature = GeoJSON.Feature & {is_placeholder?: boolean};

/**
 * A layer rendered from a GeoJSON feature, plus the links this module hangs
 * off it to pair a feature with the point standing in for it.
 */
interface FeatureLayer extends L.Layer {
  feature?: PlaceholderFeature;
  /** On a stand-in, the layer whose geometry it replaces. */
  obj?: FeatureLayer;
  /** On a replaced layer, the stand-in currently drawn for it. */
  placeholder?: FeatureLayer;
  _tooltip?: L.Tooltip;
  options: L.PathOptions;
  getBounds(): L.LatLngBounds;
  getCenter(): L.LatLng;
}

interface Options extends L.GeoJSONOptions {
  /** Features smaller than this many pixels across are drawn as a point. */
  threshold?: number;
  compress?: (feature: PlaceholderFeature) => Compress;
}

/**
 * A GeoJSON layer that replaces features too small to see at the current zoom
 * with a point, so that they do not vanish, and restores their real geometry
 * once zoomed in far enough.
 */
class GeoJsonNoVanish extends L.GeoJSON {
  threshold = 10;
  declare options: Options;

  constructor(geojson, options: Options) {
    super(geojson, options);
    this.threshold = options?.threshold ?? 10;
  }
  override onAdd(map: L.Map): this {
    this._map = map;
    this.eachLayer(map.addLayer, map);

    this._map.addEventListener("zoomend", this._onZoomEnd, this);
    this._onZoomEnd();
    return this;
  }
  override onRemove(map: L.Map): this {
    this._map.removeEventListener("zoomend", this._onZoomEnd, this);

    this.eachLayer(map.removeLayer, map);
    this._map = null;
    return this;
  }

  /** The size of a layer's bounding box, in squared pixels at the current zoom. */
  private _sizeOnScreen(bounds: L.LatLngBounds): number {
    const crs = this._map.options.crs;
    const zoom = this._map.getZoom();
    const p1 = crs.latLngToPoint(bounds.getSouthWest(), zoom);
    const p2 = crs.latLngToPoint(bounds.getNorthEast(), zoom);
    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
  }

  _onZoomEnd() {
    // todo: name
    // todo: possible optimizations: zoomOut = skip already compressed objects (and vice versa)
    const is_max_zoom = this._map.getZoom() == this._map.getMaxZoom();
    const threshold = Math.pow(this.threshold, 2);
    this.eachLayer((layer) => {
      const o = layer as FeatureLayer;
      if (!o.feature || !o.feature.geometry) return; // skip invalid layers
      if (o.feature.geometry.type == "Point" && !o.obj) return; // skip node features
      const compress =
        this.options.compress &&
        this.options.compress(o.obj ? o.obj.feature : o.feature);
      if (o.obj) {
        if (compress === "point") return;
        // already compressed feature
        if (this._sizeOnScreen(o.obj.getBounds()) > threshold || is_max_zoom) {
          delete o.obj.placeholder;
          this.removeLayer(o);
          if (o._tooltip) {
            o.obj.bindTooltip(o._tooltip);
          }
          this.addLayer(o.obj);
        }
        return;
      }
      if (is_max_zoom && compress !== "point") return; // do not compress objects at max zoom, except if mapcss says always to render as points
      if (compress === "native") return; // do not compress if mapcss specifies not to
      const bounds = o.getBounds();
      const d = this._sizeOnScreen(bounds);
      if (d > threshold && compress !== "point") return;
      const center = d <= threshold ? bounds.getCenter() : o.getCenter();
      const f: PlaceholderFeature = {
        ...o.feature,
        is_placeholder: true,
        geometry: {
          type: "Point",
          coordinates: [center.lng, center.lat]
        }
      };
      const c = L.GeoJSON.geometryToLayer(f, this.options) as FeatureLayer;
      o.placeholder = c;
      c.feature = f;
      c.obj = o;
      c.on("click", (e) => {
        o.fire(e.type, e);
      });
      this.removeLayer(o);
      this.resetStyle(c);
      c.options.interactive = true;
      c.options.stroke = true;
      c.options.fill = true;
      if (o._tooltip) {
        c.bindTooltip(o._tooltip);
      }
      this.addLayer(c);
    });
  }
}

export default GeoJsonNoVanish;
