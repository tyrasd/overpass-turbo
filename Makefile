#

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

.INTERMEDIATE turbo.js: \
	libs/CodeMirror/lib/codemirror.js \
	libs/CodeMirror/mode/javascript/javascript.js \
	libs/CodeMirror/mode/xml/xml.js \
	libs/CodeMirror/mode/clike/clike.js \
	libs/CodeMirror/mode/css/css.js \
	libs/CodeMirror/lib/util/multiplex.js \
	libs/CodeMirror/lib/util/closetag.js \
	libs/locationfilter/src/locationfilter.js \
	libs/GeoJsonNoVanish.js \
	libs/OSM4Leaflet.js \
        libs/jsmapcss/styleparser.js \
        libs/jsmapcss/Condition.js \
        libs/jsmapcss/Rule.js \
        libs/jsmapcss/RuleChain.js \
        libs/jsmapcss/Style.js \
        libs/jsmapcss/StyleChooser.js \
        libs/jsmapcss/StyleList.js \
        libs/jsmapcss/RuleSet.js \
	libs/misc.js \
	libs/html2canvas/html2canvas.patched.js \
	libs/html2canvas/jquery.plugin.html2canvas.js \
	libs/canvg/rgbcolor.js \
	libs/canvg/canvg.js \
	settings.js \
	i18n.js \
	overpass.js \
	ide.js

turbo.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

.INTERMEDIATE turbo.map.js: \
	libs/OSM4Leaflet.js \
	overpass.js \
	map.js

turbo.map.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) $< -c -m -o $@

.INTERMEDIATE turbo.css: \
	libs/CodeMirror/lib/codemirror.css \
	libs/locationfilter/src/locationfilter.css \
	default.css

turbo.css: Makefile
	@rm -f $@
	cat $(filter %.css,$^) > $@

turbo.min.css: turbo.css Makefile
	@rm -f $@
	$(CSS_COMPILER) $< $@

install: all
	mkdir -p $(install_root)
	cp turbo.js turbo.min.js $(install_root)
	cp turbo.map.js turbo.map.min.js $(install_root)
	cp turbo.css turbo.min.css $(install_root)
	cp compact.css $(install_root)
	cp map.css $(install_root)
	cp turbo.png favicon.ico $(install_root)
	cp index_packaged.html $(install_root)/index.html
	cp map_packaged.html $(install_root)/map.html
	cp map-key.png $(install_root)
	cp -R locales/. $(install_root)/locales
	cp -R libs $(install_root)/libs
	mkdir -p $(install_root)/img
	cp libs/locationfilter/src/img/* $(install_root)/img/

clean:
	rm -f turbo.js
	rm -f turbo.min.js
	rm -f turbo.map.js
	rm -f turbo.map.min.js
	rm -f turbo.css
	rm -f turbo.min.css

