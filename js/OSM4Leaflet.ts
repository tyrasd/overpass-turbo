import osmtogeojson from "osmtogeojson";

type Options = {
  data_mode: string;
  baseLayerClass: typeof L.GeoJSON;
  baseLayerOptions: L.GeoJSONOptions;
  afterParse?: () => void;
};

class OSM4Leaflet extends L.Layer {
  private _resultData: GeoJSON.FeatureCollection;
  private _baseLayer: L.GeoJSON;
  private options: Options = {
    data_mode: "xml",
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
    // if data
    if (data) this.addData(data);
  }
  addData(data, onDone?: () => void) {
    setTimeout(() => {
      // 1. convert to GeoJSON
      const geojson = osmtogeojson(data, {flatProperties: false});
      this._resultData = geojson;
      if (this.options.afterParse) this.options.afterParse();
      setTimeout(() => {
        // 2. add to baseLayer
        this._baseLayer.addData(geojson);
        if (onDone) onDone();
      }, 1); //end setTimeout
    }, 1); //end setTimeout
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
