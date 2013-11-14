# this builds overpass turbo
# supported commands:
#   * all
#   * install
#   * clean
#   * translations
# usage:
#   make && make install install_root=...
# set install_root for installing into a specific directory

UGLIFY = ./node_modules/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(UGLIFY) -b -i 2 -nm -ns
JS_COMPILER = $(UGLIFY)
CSSO = ./node_modules/csso/bin/csso
CSS_COMPILER = $(CSSO)
install_root ?= build

all: \
	turbo.js \
	turbo.min.js \
	turbo.css \
	turbo.min.css \
	turbo.map.js \
	turbo.map.min.js

turbo.js: \
	libs/CodeMirror/lib/codemirror.js \
	libs/CodeMirror/mode/javascript/javascript.js \
	libs/CodeMirror/mode/xml/xml.js \
	libs/CodeMirror/mode/clike/clike.js \
	libs/CodeMirror/mode/css/css.js \
	libs/CodeMirror/lib/util/multiplex.js \
	libs/CodeMirror/lib/util/closetag.js \
	libs/locationfilter/src/locationfilter.js \
	js/jsmapcss/styleparser.js \
	js/jsmapcss/Condition.js \
	js/jsmapcss/Rule.js \
	js/jsmapcss/RuleChain.js \
	js/jsmapcss/Style.js \
	js/jsmapcss/StyleChooser.js \
	js/jsmapcss/StyleList.js \
	js/jsmapcss/RuleSet.js \
	libs/misc.js \
	libs/jxon.js \
	libs/osmtogeojson/osmtogeojson.js \
	js/GeoJsonNoVanish.js \
	js/OSM4Leaflet.js \
	js/configs.js \
	js/settings.js \
	js/urlParameters.js \
	js/nominatim.js \
	js/query.js \
	js/i18n.js \
	js/overpass.js \
	js/ide.js \
	js/ffs_parser.js \
	libs/html2canvas/html2canvas.patched.js \
	libs/html2canvas/jquery.plugin.html2canvas.js \
	libs/canvg/rgbcolor.js \
	libs/canvg/canvg.js \
	libs/tokml/tokml.js \
	libs/togpx/togpx.js \
	libs/Blob.js/Blob.js \
	libs/canvas-toBlob.js/canvas-toBlob.js \
	libs/FileSaver/FileSaver.js

turbo.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

turbo.map.js: \
	js/jsmapcss/styleparser.js \
	js/jsmapcss/Condition.js \
	js/jsmapcss/Rule.js \
	js/jsmapcss/RuleChain.js \
	js/jsmapcss/Style.js \
	js/jsmapcss/StyleChooser.js \
	js/jsmapcss/StyleList.js \
	js/jsmapcss/RuleSet.js \
	libs/osmtogeojson/osmtogeojson.js \
	js/OSM4Leaflet.js \
	js/overpass.js \
	js/map.js

turbo.map.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) $< -c -m -o $@

turbo.css: \
	libs/CodeMirror/lib/codemirror.css \
	libs/locationfilter/src/locationfilter.css \
	css/default.css

turbo.css: Makefile
	@rm -f $@
	cat $(filter %.css,$^) > $@

turbo.min.css: turbo.css Makefile
	@rm -f $@
	$(CSS_COMPILER) $< $@

install: all
	mkdir -p $(install_root)
	mkdir -p $(install_root)/css
	mkdir -p $(install_root)/img
	mkdir -p $(install_root)/locales
	cp LICENSE $(install_root)
	cp turbo.js turbo.min.js $(install_root)
	cp turbo.map.js turbo.map.min.js $(install_root)
	cp turbo.css turbo.min.css $(install_root)
	cp css/compact.css $(install_root)/css
	cp css/map.css $(install_root)/css
	cp turbo.png favicon.ico $(install_root)
	cp index_packaged.html $(install_root)/index.html
	cp map_packaged.html $(install_root)/map.html
	cp map-key.png $(install_root)
	cp locales/*.json $(install_root)/locales
	cp -R libs $(install_root)/libs
	cp -R icons $(install_root)/icons
	cp libs/locationfilter/src/img/* $(install_root)/img

clean:
	rm -f turbo.js
	rm -f turbo.min.js
	rm -f turbo.map.js
	rm -f turbo.map.min.js
	rm -f turbo.css
	rm -f turbo.min.css

translations:
	node locales/update_locales
