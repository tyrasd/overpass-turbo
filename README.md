# overpass turbo

This is a GUI for testing and developing queries for the [Overpass-API](http://www.overpass-api.de/). It can also used for simple analysis of OSM data.

[![](http://wiki.openstreetmap.org/w/images/thumb/9/99/Overpass_turbo_showcase_1.png/600px-Overpass_turbo_showcase_1.png)](http://overpass-turbo.eu)

## Getting Started

Just point your browser to [overpass-turbo.eu](http://overpass-turbo.eu) and start running your Overpass queries.

More information about _overpass turbo_ is found in the [OSM wiki](http://wiki.openstreetmap.org/wiki/Overpass_turbo).

## Translating

Translations are managed using the [Transifex](https://www.transifex.com/projects/p/overpass-turbo) platform. After signing up, you can go to [overpass-turbo's project page](https://www.transifex.com/projects/p/overpass-turbo), select a language and click _Translate now_ to start translating.

If your language isn't currently in the list, just drop me a [mail](mailto:tyr.asd@gmail.com) or open an [issue ticket](https://github.com/tyrasd/overpass-turbo/issues/new).

To download the latest translations from Transifex, run `tx pull --all` using the [Transifex client `tx`](https://docs.transifex.com/client/introduction).

## Development

[![Build Status](https://secure.travis-ci.org/tyrasd/overpass-turbo.png)](https://travis-ci.org/tyrasd/overpass-turbo)

### URL parameters

_overpass turbo_ can be linked from other applications by using [URL parameters](http://wiki.openstreetmap.org/wiki/Overpass_turbo/Development#URL_Parameters).
For example, one can provide a query to load, set the initial map location, or instruct turbo to load a [template](http://wiki.openstreetmap.org/wiki/Overpass_turbo/Templates).

### git-branches

Development is done in the _master_ branch, stable releases are marked with git tags, the _gh-pages_ branch contains static builds of the releases.

### install & run

1. `npm install`
2. `npm start` for a Development server listening at http://localhost:8080
3. `npm run build` for a minified build in `./build`
