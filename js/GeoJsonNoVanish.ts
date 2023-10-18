class GeoJsonNoVanish extends L.GeoJSON {
  threshold = 10;
  constructor(geojson, options) {
    super(geojson, options);
    this.threshold = options?.threshold ?? 10;
  }
  onAdd(map) {
    this._map = map;
    this.eachLayer(map.addLayer, map);

    this._map.addEventListener("zoomend", this._onZoomEnd, this);
    this._onZoomEnd();
    return this;
  }
  onRemove(map) {
    this._map.removeEventListener("zoomend", this._onZoomEnd, this);

    this.eachLayer(map.removeLayer, map);
    this._map = null;
    return this;
  }
  _onZoomEnd() {
    // todo: name
    // todo: possible optimizations: zoomOut = skip already compressed objects (and vice versa)
    const is_max_zoom = this._map.getZoom() == this._map.getMaxZoom();
    this.eachLayer(function (o) {
      if (!o.feature || !o.feature.geometry) return; // skip invalid layers
      if (o.feature.geometry.type == "Point" && !o.obj) return; // skip node features
      const compress =
        this.options.compress &&
        this.options.compress(o.obj ? o.obj.feature : o.feature);
      const crs = this._map.options.crs;
      if (o.obj) {
        if (compress === "point") return;
        // already compressed feature
        const bounds = o.obj.getBounds();
        const p1 = crs.latLngToPoint(bounds.getSouthWest(), o._map.getZoom());
        const p2 = crs.latLngToPoint(bounds.getNorthEast(), o._map.getZoom());
        const d = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
        if (d > Math.pow(this.threshold, 2) || is_max_zoom) {
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
      const p1 = crs.latLngToPoint(bounds.getSouthWest(), o._map.getZoom());
      const p2 = crs.latLngToPoint(bounds.getNorthEast(), o._map.getZoom());
      const d = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
      if (d > Math.pow(this.threshold, 2) && compress !== "point") return;
      let center;
      if (d <= Math.pow(this.threshold, 2)) {
        center = bounds.getCenter();
      } else {
        center = o.getCenter();
      }
      const f = L.extend({}, o.feature);
      f.is_placeholder = true;
      f.geometry = {
        type: "Point",
        coordinates: [center.lng, center.lat]
      };
      const c = L.GeoJSON.geometryToLayer(f, this.options);
      o.placeholder = c;
      c.feature = f;
      c.obj = o;
      c.on("click", function (e) {
        this.obj.fireEvent(e.type, e);
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
    }, this);
  }
}

export default GeoJsonNoVanish;
