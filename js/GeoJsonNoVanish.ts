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
      const crs = this._map.options.crs;
      if (o.obj) {
        // already compressed feature
        const bounds = o.obj.getBounds();
        const p1 = crs.latLngToPoint(bounds.getSouthWest(), o._map.getZoom());
        const p2 = crs.latLngToPoint(bounds.getNorthEast(), o._map.getZoom());
        const d = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
        if (d > Math.pow(this.threshold, 2) || is_max_zoom) {
          delete o.obj.placeholder;
          this.removeLayer(o);
          o.obj.bindTooltip(o._tooltip);
          this.addLayer(o.obj);
        }
        return;
      }
      if (is_max_zoom) return; // do not compress objects at max zoom
      if (this.options.compress && !this.options.compress(o.feature)) return;
      const bounds = o.getBounds();
      const p1 = crs.latLngToPoint(bounds.getSouthWest(), o._map.getZoom());
      const p2 = crs.latLngToPoint(bounds.getNorthEast(), o._map.getZoom());
      const d = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
      if (d > Math.pow(this.threshold, 2)) return;
      const center = bounds.getCenter();
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
      c.bindTooltip(o._tooltip);
      this.addLayer(c);
    }, this);
  }
}

export default GeoJsonNoVanish;
