Scripts
=======

The following javascript callbacks can be defined:
* onStyle
* onPopup
* pointToLayer
* beforeExecute
* onShow

onStyle
-------
Called for each data element when it is rendered on the leaflet map. The appearance of the geoJSON features is set via a style declaration that can be passed to leaflets [geoJSON Layer](http://leafletjs.com/reference.html#geojson).

Parameters
* style: the default style
* feature: the feature to be styled
* highlight: true if the feature is currently selected (popup)

Returns: a style object for leaflets [geoJSON Layer](http://leafletjs.com/reference.html#geojson).

onPopup
-------
Called when a popup is opened. Lets you set the content to be shown in it.

Parameters
* popup: the default popup content
* feature: the feature to be described in the popup

Returns: the html content of the popup to be shown

pointToLayer
------------
Called when a single node is to be shown on the map. Defines how a point feature is going to be rendered as.

Parameters
* feature: the node feature to be shown
* latlng: the position of the node feature

Returns: the [marker](http://leafletjs.com/reference.html#marker) object for the node feature

beforeExecute
-------------
Called before the query is executed. Lets you do some preparation before the next run of a query.

Parameters
* query: the query to be executed

onShow
------
Called when the geoJSON data has been shown on the map. Lets you do analysis with the converted osm data, for example.

Parameters
* geojson: the geoJSON features that are shown on the map.

