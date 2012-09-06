ROADMAP
=======

Here are some ideas of features I think of including to overpass-ide. This todo list includes small ui improvements as well as more ambitious ideas of features. There is no plan when or in which order these are going to be implemented.

"Compiler"
----------

A functionality which "kind of" "compiles" the given overpass query into a (single) html file which can be used independently of the overpass-ide.

The idea is to run a query in the ide, which converts it into some geoJSON. This geojson is then put into a framework html file together with some minimal code that loads it.
This will still rely on external data for the leaflet library and the map tiles (and maybe jQuery).

Possible extension: Make a version for completely independent use: This would include all js libraries into the html framework and use a L.ImageOverlay instead of dynamically loaded map tiles (the image is rendered using html2canvas and stored in the output as a dataURL).

Interactive Map Export
----------------------

Just like the current "openlayers overlay" export, but with a leaflet map and clickable geojson objects like in the ide.

There will be a map.html file which takes the (un-shortcuted) query as a GET parameter, executes it, parses the data into geojson and shows it on a map. There should be some error handling and the possibility to provide a fixed map center (and zoom level) or auto zooming to fit the data.

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

Several UI Improvements
-----------------------

* fullscreen mode
* editor: better Syntax highlighting (auto detect query language xml/overpassQL, support for overpassQL)
* editor: code auto completion (with inline help?) ~~and auto tag closing for xml~~
* editor: highline lines where an error occured
* map: configurable style for geoJSON elements.
* map: filter content (tags,?) to be shown in popups?
* map: make crosshairs not overlap map popups
* ~~map: make crosshairs optional (default: not visible)~~
* map: make other map controls optional
