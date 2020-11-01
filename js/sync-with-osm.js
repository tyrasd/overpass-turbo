import osmAuth from "osm-auth";
import configs from "./configs";

var enabled =
  configs.osmAuth &&
  configs.osmAuth.oauth_consumer_key &&
  configs.osmAuth.oauth_secret;

var auth;
if (enabled) auth = osmAuth(configs.osmAuth);

export default {
  enabled: enabled,
  load: function (callback) {
    if (!auth.authenticated()) {
      auth.authenticate(function (err) {
        //check err param exists
        if (err) return callback(err);
        loadQueries(callback);
      });
    } else {
      loadQueries(callback);
    }
  },
  save: function (query, callback) {
    if (!auth.authenticated()) {
      auth.authenticate(function (err) {
        //check err param exists
        if (err) return callback(err);
        saveQuery(query, callback);
      });
    } else {
      saveQuery(query, callback);
    }
  },
  delete: function (query, callback) {
    if (!auth.authenticated())
      return callback(new Error("must be logged in to delete a synced query"));
    query = {
      name: query,
      deleteMe: true
    };
    saveQuery(query, callback);
  },
  logout: function (callback) {
    if (auth.authenticated()) auth.logout();
  },
  authenticated: function () {
    return enabled && auth.authenticated();
  }
};

function loadQueries(callback) {
  auth.xhr(
    {
      method: "GET",
      path: "/api/0.6/user/preferences"
    },
    function (err, res) {
      if (err) return callback(err);

      var pref_count = 0,
        cnt_elem;
      if (
        (cnt_elem = res.querySelector(
          'preference[k="' + configs.appname + '_query-count"]'
        ))
      )
        pref_count = +cnt_elem.getAttribute("v");

      var result = [];
      for (var i = 0; i < pref_count; i++) {
        var pref_elem = res.querySelector(
          'preference[k="' + configs.appname + "_query_" + i + '_0"]'
        );
        if (!pref_elem) continue;
        var first_chunk = pref_elem.getAttribute("v").split("&");
        var length = +first_chunk[0].slice(2);
        var name = first_chunk[1].slice(2);
        var query = first_chunk[2].slice(2);
        for (var j = 1; j < length; j++) {
          query += res
            .querySelector(
              'preference[k="' +
                configs.appname +
                "_query_" +
                i +
                "_" +
                j +
                '"]'
            )
            .getAttribute("v");
        }
        result.push({
          name: name,
          query: query
        });
      }

      callback(null, result, res);
    }
  );
}

function saveQuery(new_query, callback) {
  loadQueries(function (err, existing_queries, dom) {
    if (err) return callback(err);

    var preferences = dom.querySelector("preferences");
    // clean up existing data
    var existing = preferences.querySelectorAll(
      'preference[k^="' + configs.appname + '_query"]'
    );
    for (var i = 0; i < existing.length; i++) {
      preferences.removeChild(existing[i]);
    }
    // insert new query into list of existing ones
    var is_new = true;
    existing_queries.forEach(function (q, idx) {
      if (q.name == new_query.name) {
        q.query = new_query.query;
        is_new = idx;
      }
    });
    if (is_new === true) {
      existing_queries.push(new_query);
    } else if (new_query.deleteMe) {
      existing_queries.splice(is_new, 1);
    }
    // construct new preferences xml
    var new_elem = dom.createElement("preference");
    new_elem.setAttribute("k", configs.appname + "_query-count");
    new_elem.setAttribute("v", existing_queries.length);
    preferences.appendChild(new_elem);
    for (var i = 0; i < existing_queries.length; i++) {
      var q = existing_queries[i];
      if (q.name.length > 200)
        return callback(
          new Error("query name too long to be saved on osm.org")
        );
      var numParts = Math.ceil((q.query.length + q.name.length + 8) / 255);
      if (numParts > 9)
        return callback(new Error("query too long to be saved on osm.org"));
      var queryStr = "p=" + numParts;
      queryStr += "&n=" + q.name;
      queryStr += "&q=" + q.query;
      // split into chunks of max 255 characters length
      queryStr = queryStr.match(/.{1,255}/g);

      for (var j = 0; j < numParts; j++) {
        var new_elem = dom.createElement("preference");
        new_elem.setAttribute("k", configs.appname + "_query_" + i + "_" + j);
        new_elem.setAttribute("v", queryStr[j]);
        preferences.appendChild(new_elem);
      }
    }
    // upload to osm.org
    auth.xhr(
      {
        method: "PUT",
        path: "/api/0.6/user/preferences",
        options: {header: {"Content-Type": "text/xml"}},
        content: dom.firstChild.outerHTML
      },
      function (err, res) {
        if (err) return callback(err);
        callback(null, existing_queries);
      }
    );
  });
}
