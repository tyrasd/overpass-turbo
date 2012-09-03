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

Several UI Improvements
-----------------------

* fullscreen mode
* editor: better Syntax highlighting (auto detect query language xml/overpassQL, support for overpassQL)
* editor: code auto completion (with inline help?) and auto tag closing for xml
* map: configurable style for geoJSON elements.
* map: filter content (tags,?) to be shown in popups?
* map: make crosshairs not overlap map popups
* map: make crosshairs optional (default: not visible)
* map: make other map controls optional

