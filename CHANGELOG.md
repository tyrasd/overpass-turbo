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
