export default {
  appname: "overpass-turbo",
  // used for localStorage and openstreetmap.org/api/0.6/user/preferences
  settingNamespace: "overpass-ide",
  defaultServer: "https://overpass-api.de/api/",
  // https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances
  suggestedServers: [
    "https://overpass-api.de/api/",
    "https://overpass-api.de/api/",
    "https://maps.mail.ru/osm/tools/overpass/api/",
    "https://overpass.openstreetmap.ru/api/",
    "https://overpass.kumi.systems/api/"
  ],
  defaultTiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  // https://wiki.osmfoundation.org/wiki/Licence/Attribution_Guidelines
  // > Attribution must be to "OpenStreetMap".
  // > Attribution must also make it clear that the data is available under the Open Database License.
  // > This may be done by making the text "OpenStreetMap" a link to openstreetmap.org/copyright, which has information about OpenStreetMap’s data sources (which OpenStreetMap needs to credit) as well as the ODbL.
  // https://www.openstreetmap.org/copyright
  tileServerAttribution: `© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`,
  suggestedTiles: [
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    //"http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png",
    //"http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png",
    //"http://{s}.tile3.opencyclemap.org/landscape/{z}/{x}/{y}.png",
    //"http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg",
  ],
  defaultMapView: {
    lat: 41.89,
    lon: 12.492,
    zoom: 16
  },
  maxMapZoom: 20,
  short_url_service: "",
  push_history_url: true,
  html2canvas_use_proxy: false,
  // api key for osmnames geocoder, go to http://osmnames.org/api/ to get one if you run your own overpass instance
  osmnamesApiKey: "gtXyh2mBSaN5zWqqqQRh",
  // osmAuth configuration object (used for syncing saved queries). expects an osm-auth config object (min. the oauth_consumer_key and oauth_secret must be given), see https://github.com/osmlab/osm-auth#getting-keys
  osmAuth: {
    url: "https://www.openstreetmap.org",
    client_id: "lIifli2M7Enpi1LUqCxSNe3yDXhBHwf_n8HzJ03mKFg"
  }
};
