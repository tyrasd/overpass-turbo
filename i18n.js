
// global i18n object
// todo: use messageformat.js for complex texts??

var i18n = new(function() {
  var default_lng = "en";
  var supported_lngs = [
    default_lng, // default language
    "de", // translations found in locale/de.js
  ];
  this.translate = function() {
    var lng = settings.ui_language;
    if (lng == "auto") {
      // get user agent's language
      lng = navigator.language.replace(/-.*/,"").toLowerCase();
      if ($.inArray(lng,supported_lngs) == -1) {
        lng = default_lng;
        return false;
      }
    }
    if (lng == default_lng)
      return true; // nothing to do here :)

    // load language pack
    $.ajax("locales/"+lng+".js",{async:false,dataType:"json"}).success(function(data){
      td = $.extend(td,data);
      i18n.translate_ui();
      // todo: nicer implementation
    }).error(function(){
      alert("foo!!!");
    });
  }
  this.translate_ui = function() {
    // look for all object with the class "t"
    $(".t").each(function(nr,element) {
      // get translation term(s)
      var terms = $(element).attr("t");
      terms = terms.split(";");
      for (var i=0; i<terms.length; i++) {
        var term = terms[i];
        var tmp = term.match(/^(\[(.*)\])?(.*)$/);
        var what = tmp[2];
        var key  = tmp[3];
        var val = td[key];
        if (what !== undefined) {
          $(element).attr(what,val);
        } else {
          $(element).text(val);
        }
      }
    });
  }
  this.t = function(key) {
    return td[key];
  }

  // default texts
  var td = {
    "map_controlls.zoom_to_data": "zoom onto data",
    "map_controlls.localize_user": "pan to user location",
    "map_controlls.select_bbox": "manually select bbox",
    "map_controlls.toggle_wide_map": "toggle wide map",
    "map_controlls.clear_data": "clear data overlay"
  };
})(); // end create overpass object













