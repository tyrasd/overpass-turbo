// nominatim module
import $ from "jquery";

import configs from "./configs";

var cache = {};

export default class nominatim {
  static request(search, callback) {
    // ajax (GET) request to nominatim
    $.ajax(
      "https://nominatim.openstreetmap.org/search" +
        "?X-Requested-With=" +
        configs.appname,
      {
        data: {
          format: "json",
          q: search
        },
        success: function (data) {
          // hacky firefox hack :( (it is not properly detecting json from the content-type header)
          if (typeof data == "string") {
            // if the data is a string, but looks more like a json object
            try {
              data = JSON.parse(data);
            } catch (e) {}
          }
          cache[search] = data;
          callback(undefined, data);
        },
        error: function () {
          var err =
            "An error occurred while contacting the osm search server nominatim.openstreetmap.org :(";
          console.log(err);
          callback(err, null);
        }
      }
    );
  }

  static get(search, callback) {
    if (cache[search] === undefined) request(search, callback);
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
