2013.04.29
----------
* reworked export dialog
* export GeoJSON with flattened properties (see #14)
* bugfixes and UI improvements

2013.04.15
----------
* MapCSS support :) Read more: http://wiki.openstreetmap.org/wiki/Overpass_turbo/MapCSS
* enabled an url-shortening service on http://overpass-turbo.eu
* new "as GPX" export
* some bugfixes and UI improvements

2013.03.24
----------
* implemented a build system - should result in much faster startup :)
* better area-detection. See http://wiki.openstreetmap.org/wiki/Overpass_turbo/Polygon_Features
* improved URL and email formatting/linkification
* removed min-zoom level on the map

2013.03.21
----------
* showing hyperlinks for http/https/ftp-URLs, email addresses and wikipedia entries
* added new "welcome" message for first time users
* slightly more robust template code

2013.03.02
----------
* showing warning message for queries returning large amounts of data (>~ 1MB).
* better progress indicator: show checkmarks for past events; also: made it a little more responsive during lenghty calculations
* improved bbox-selector: hide if there is no use of {{bbox}} in the query, also: show manually selected bbox in "map view" info dialog
* support for standard lat/lon/zoom parameters (in addition to turbo specific params)
* added type-id template
* updated template descriptions
* fixed several compatibility issues and bugfixes

2013.02.10
----------
* multipolygon rendering
* implemented "templates" as an alternative to permalinks for basic queries
* showing stats about number of elements loaded and displayed
* more complete polygon detection
* some internal code restructuring (new OSM4Leaflet and NoVanish classes)
* added map key to help
* bugfixes

2013.02.04
----------
* display small features at low zoom like POIs
* i18n support (and translation to German)
* added "fullscreen" (wide) map view
* handle untagged nodes as POIs when they are member of at least 1 relation
* implemented first set of unit tests
* upgraded to CodeMirror 2.38
* bugfixes

2013.01.30
----------
* resizable panels (editor/map)
* tooltips for map controls
* auto-repair also for "JOSM" export
* enabled "include current map state in shared link" by default
* upgrade to jquery 1.9.0 and jqueryUI 1.10.0
* bugfixes

2013.01.28
----------
* implemented auto-repairing of queries with a possible lack of recurse statements
* upgrade to leaflet 0.5
* disabled "start at current location" by default
* added keyboard shortcuts for saving/loading and help
* added clear data overlay button
* added permalink to osm.org on export->map view
* bugfixes
* some internal code restructuring
* appname (for X-Requested-With headers) set to overpass-turbo

2013.01.24
----------
* initial release
