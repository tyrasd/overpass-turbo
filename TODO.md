ROADMAP
=======

Here are some ideas of features I think of including to overpass turbo. This todo list includes small ui improvements as well as more ambitious ideas of features. There is no plan when or in which order these are going to be implemented.

Scripting Engine
----------------

A possibility to postprocess the data recieved from overpass-api via a user definable script. This is most probably going to be javascript executed directly via eval(). The exact implementation is yet to be decided; a possible script could look like the following:

```javascript
function beforeExecute(query) {
  // alter query
}
function onParse(data, datamode) {
  // perform raw data (json/xml/text) analysis
}
function onShow(geoJSON) {
 // perform analysis with geoJSON parsed data
}
ide.executeQuery();
```

There is going to be a documented api with functions which can be used within a script. For example there will be a new "log" tab, which can be written via `ide.log("...");`.

As the scripts are (most probably) not going to be sandboxed, this is going to be an advanced feature, that has to be activated manually by the user. Scripts can be saved and shared together with the query, but a warning will be shown when loading a share-link with a script.

Also to be configurable via scripts:
* style for geoJSON elements.
* content (tags,...) to be shown in popups.

The compiler should be able to support scripts. There has to be a possibility to tell the compiler which (parts of) libraries have to be included "linked" in the output.

Support for Complex Multipolygons
---------------------------------

This would be a very nice feature. ^^

Query-Builder
-------------

Maybe with some presets and a list of tag values (maybe using taginfo API)?

"Compiler"
----------

A functionality which "kind of" "compiles" the given overpass query into a (single) html file which can be used independently of the overpass turbo.

The idea is to run a query in turbo, which converts it into some geoJSON. This geojson is then put into a framework html file together with some minimal code that loads it.
This will still rely on external data for the leaflet library and the map tiles (and maybe jQuery).

Possible extension: Make a version for completely independent use: This would include all js libraries into the html framework and use a L.ImageOverlay instead of dynamically loaded map tiles (the image is rendered using html2canvas and stored in the output as a dataURL).

Interactive Map Export
----------------------

Just like the current "openlayers overlay" export, but with a leaflet map and clickable geojson objects like in the ide.

(A prototype of this is already implemented in the master banch. But I will redo it with the following procedure.)

There will be a map.html file which takes the ~~(un-shortcuted)~~ query as a GET parameter, executes it, parses the data into geojson and shows it on a map. There should be some error handling and the possibility to provide a fixed map center (and zoom level) or auto zooming to fit the data.

Implementation: This should be easy to implement once the compiler and scripting engine are ready (the compiler has to explicitly support scripts!). It should be "easy" to write a script that implements this *standalone map* behaviour. Then the compiled version of this script is the map.html.

Several UI Improvements
-----------------------

* ~~resizable panels (editor/map)- maybe also: hide editor temporarily for map inspections (or just go with a fullscreen mode?)~~
* ~~editor: better Syntax highlighting (auto detect query language xml/overpassQL, support for overpassQL)~~
* editor: code auto completion (with inline help?) ~~and auto tag closing for xml~~
* ~~editor: highline lines where an error occured~~
* map: make crosshairs not overlap map popups
* ~~map: make crosshairs optional (default: not visible)~~
* map popups: ~~show coordinates of points~~ (and bbox of ways?), ~~show metadata (if present)~~
* ~~tool: convert overpassql<->xml~~
* ? better layer management: allow multiple layers to be set up (if #layers>1 show layer switcher). allow also other types of layers (WMS, ImageOverlay?)
* ~~wide map view~~
* ~~make UI texts translatable~~
* ~~export: to-josm should print a warning, when data is not in XML+meta format.~~
* editor: pretty-print on button press
* editor: highlighting of structural elements?
* editor: ~~tooltips~~ , inline help
* editor: syntax check on button press
* ~~map: reset data~~
* implement short url generator
* ~~disable "start at current pos" by default~~
* ~~implement auto-correct for queries returning no nodes by adding recurse statements~~
* ~~fix for disappearing line and polygon features at low zoom.~~
* ~~print number of found elements (pois, ways, polygons)~~
* ~~add "map key" to help~~
* ~~add templates~~
* rendering GeoJSON: sort polygons by area (or simply bbox area), such that smaller polygons are drawn over large ones.
* export as png: render scale & attribution separately, and blend in after the data overlay
* OSM4Leaflet: add "context" callback instead of hardcoded magic
