Leaflet Polyline Offset
===
Works with Leaflet 0.7.x and 0.8-dev. Should work with the upcoming 1.0.

This plugin adds to Leaflet `Polyline`s the ability to be drawn with a relative pixel offset, without modifying their actual `LatLng`s. The offset value can be either negative or positive, for left- or right-side offset, and remains constant across zoom levels.

## Use cases and demos

Line offsetting is the process of drawing a line parallel to an existant one, at a fixed distance. It's not a simple (x,y) translation of the whole shape, as it shouldn't overlap. It can be used to visually emphasize different properties of the same linear feature, or achieve complex composite styling.

This plugin brings this feature to Leaflet, to apply to client-side vectors.

Demos are clearer than words:
* [Basic demo](http://bbecquet.github.io/Leaflet.PolylineOffset/examples/example.html). The dashed line is the "model", with no offset applied. Red is with a -10px offset, green is with a 5px offset. The three are distinct `Polyline` objects but uses the same coordinate array. 
* [Cycle lanes](http://bbecquet.github.io/Leaflet.PolylineOffset/examples/example_cycle.html). Drawing a road with two directions of cycle lanes, a main one and one shared. 
* [Bus lines](http://bbecquet.github.io/Leaflet.PolylineOffset/examples/example_bus.html). A more complex demo. Offsets are computed automatically depending on the number of bus lines using the same segment. Other non-offset polylines are used to achieve the white and black outline effect.

## Usage

The plugin adds offset capabilities directly to the `L.Polyline` class.
```javascript
// Instantiate a normal Polyline with an 'offset' options, in pixels.
var pl = L.polyline([[48.8508, 2.3455], [48.8497, 2.3504], [48.8494, 2.35654]], {
  offset: 5
});

// Setting the 'offset' property through the 'setStyle' method won't work.
// If you want to set the offset afterwards, use 'setOffset'.
pl.setOffset(-10);

// To cancel the offset, simply set it to 0 
pl.setOffset(0);
```

## License
MIT.

## Authors
[Benjamin Becquet](//github.com/bbecquet)