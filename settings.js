
// global settings object

var settings = new(function() {
  // == private members ==
  var prefix = "overpass-ide_";
  // == public properties with defaults ==
  // map coordinates
  this.use_html5_coords = true;
  this.coords_lat = 46.48;
  this.coords_lon = 11.32;
  this.coords_zoom = 12;
  // saved
  this.code = {"overpass": null};
  this.saves;// = examples;

  // == public methods ==
  this.load = function() {
    var tmp;
    if ((tmp = localStorage.getItem(prefix+"use_html5_coords")) !== null)
      this.use_html5_coords = tmp=="true";
    if ((tmp = localStorage.getItem(prefix+"coords_lat")) !== null)
      this.coords_lat = tmp*1.;
    if ((tmp = localStorage.getItem(prefix+"coords_lon")) !== null)
      this.coords_lon = tmp*1.;
    if ((tmp = localStorage.getItem(prefix+"coords_zoom")) !== null)
      this.coords_zoom = tmp*1;
    if ((tmp = localStorage.getItem(prefix+"code")) !== null)
      this.code = JSON.parse(tmp);
    else
      this.code = examples[examples_initial_example];
    if ((tmp = localStorage.getItem(prefix+"saves")) !== null)
      this.saves = JSON.parse(tmp);
    else
      this.saves = examples;
    this.save(); // this saves any new, yet unsaved, settings
  }
  this.save = function() {
    localStorage.setItem(prefix+"use_html5_coords",this.use_html5_coords);
    localStorage.setItem(prefix+"coords_lat",this.coords_lat);
    localStorage.setItem(prefix+"coords_lon",this.coords_lon);
    localStorage.setItem(prefix+"coords_zoom",this.coords_zoom);
    localStorage.setItem(prefix+"code",JSON.stringify(this.code));
    localStorage.setItem(prefix+"saves",JSON.stringify(this.saves));
    //localStorage.setItem(prefix+"",this.);
  }
  
})(); // end create settings object
