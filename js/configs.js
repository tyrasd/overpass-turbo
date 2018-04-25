export default {
  appname: "overpass-turbo",
  defaultServer: "//overpass-api.de/api/",
  suggestedServers: [
    "//overpass-api.de/api/",
    "https://overpass.kumi.systems/api/",
    "http://overpass.openstreetmap.ru/cgi/",
    "//overpass.openstreetmap.fr/api/"
  ],
  defaultTiles: "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileServerAttribution:
    "&copy; OpenStreetMap.org contributors&ensp;<small>Data:ODbL, Map:cc-by-sa</small>",
  suggestedTiles: [
    "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
  html2canvas_use_proxy: false,
  // api key for osmnames geocoder, go to http://osmnames.org/api/ to get one if you run your own overpass instance
  osmnamesApiKey: "gtXyh2mBSaN5zWqqqQRh",
  // osmAuth configuration object (used for syncing saved queries). expects an osm-auth config object (min. the oauth_consumer_key and oauth_secret must be given), see https://github.com/osmlab/osm-auth#getting-keys
  osmAuth: null
};
