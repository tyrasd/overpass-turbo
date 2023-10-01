# overpass turbo

- https://overpass-turbo.eu/ – stable version
- https://tyrasd.github.io/overpass-turbo/ – latest version

This is a GUI for testing and developing queries for the [Overpass-API](http://www.overpass-api.de/). It can also used for simple analysis of OSM data.

[![](https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Overpass_turbo_screenshot_2022.png/1280px-Overpass_turbo_screenshot_2022.png)](https://overpass-turbo.eu)

## Getting Started

Just point your browser to [overpass-turbo.eu](http://overpass-turbo.eu) and start running your Overpass queries.

More information about _overpass turbo_ is found in the [OSM wiki](http://wiki.openstreetmap.org/wiki/Overpass_turbo).

## Translating

Translations are managed using the [Transifex](https://www.transifex.com/projects/p/overpass-turbo) platform. After signing up, you can go to [overpass-turbo's project page](https://www.transifex.com/projects/p/overpass-turbo), select a language and click _Translate now_ to start translating.

If your language isn't currently in the list, just drop me a [mail](mailto:tyr.asd@gmail.com) or open an [issue ticket](https://github.com/tyrasd/overpass-turbo/issues/new).

To download the latest translations from Transifex, run `tx pull --all` using the [Transifex client `tx`](https://docs.transifex.com/client/introduction).

## Development

### URL parameters

_overpass turbo_ can be linked from other applications by using [URL parameters](http://wiki.openstreetmap.org/wiki/Overpass_turbo/Development#URL_Parameters).
For example, one can provide a query to load, set the initial map location, or instruct turbo to load a [template](http://wiki.openstreetmap.org/wiki/Overpass_turbo/Templates).

### git-branches

Development is done in the _master_ branch, stable releases are marked with git tags, the _gh-pages_ branch contains static builds of the releases.

### install & run

1. `yarn install`
2. `yarn run start` for a Development server listening at http://localhost:5173
3. `yarn run build` for a minified build in `./dist`
