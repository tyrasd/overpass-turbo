import * as L from "leaflet";
import osmtogeojson from "osmtogeojson";

import {yieldToBrowser} from "./misc";

interface Options extends L.LayerOptions {
  /** The GeoJSON layer class to render the result with. */
  baseLayerClass: typeof L.GeoJSON;
  baseLayerOptions: L.GeoJSONOptions;
  /** Invoked once the result has been converted to GeoJSON. */
  afterParse?: () => void;
}

class OSM4Leaflet extends L.Layer {
  private _resultData: GeoJSON.FeatureCollection;
  private _baseLayer: L.GeoJSON;
  options: Options = {
    baseLayerClass: L.GeoJSON,
    baseLayerOptions: {}
  };

  constructor(data, options: Partial<Options>) {
    super();
    L.Util.setOptions(this, options);

    this._baseLayer = new this.options.baseLayerClass(
      null,
      this.options.baseLayerOptions
    );
    this._resultData = null;
    if (data) {
      void this.addData(data);
    }
  }
  async addData(data): Promise<void> {
    await yieldToBrowser();
    // 1. convert to GeoJSON
    const isGeoJSON =
      typeof data === "object" && data?.type === "FeatureCollection";
    const geojson = isGeoJSON
      ? data
      : osmtogeojson(data, {flatProperties: false});
    this._resultData = geojson;
    this.options.afterParse?.();
    await yieldToBrowser();
    // 2. add to baseLayer
    this._baseLayer.addData(geojson);
  }
  getGeoJSON() {
    return this._resultData;
  }
  getBaseLayer() {
    return this._baseLayer;
  }
  onAdd(map) {
    this._baseLayer.addTo(map);
    return this;
  }
  onRemove(map) {
    map.removeLayer(this._baseLayer);
    return this;
  }
}

export default OSM4Leaflet;
