// nominatim module
import configs from "./configs";
import {requestJson} from "./httpRequest";

const cache = {};

export default class nominatim {
  static request(search, callback) {
    // GET request to nominatim
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("X-Requested-With", configs.appname);
    url.searchParams.set("format", "json");
    url.searchParams.set("q", search);
    requestJson(url).then(
      (data) => {
        cache[search] = data;
        callback(undefined, data);
      },
      (error) => {
        const err =
          "An error occurred while contacting the osm search server nominatim.openstreetmap.org :(";
        console.log(err, error);
        callback(err, null);
      }
    );
  }

  static get(search, callback) {
    if (cache[search] === undefined) this.request(search, callback);
    else callback(undefined, cache[search]);
    return this;
  }

  static getBest(search, filter, callback) {
    // shift parameters if filter is omitted
    if (!callback) {
      callback = filter;
      filter = null;
    }
    this.get(search, (err, data) => {
      if (err) {
        callback(err, null);
        return;
      }
      if (filter) data = data.filter(filter);
      if (data.length === 0) callback("No result found", null);
      else callback(err, data[0]);
    });
    return this;
  }
}
