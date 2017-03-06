# this builds overpass turbo
# supported commands:
#   * translations - updates translations from Transifex
#   * presets - grabs presets and their translations from the iD-Project
#   * icons - update icon sets))

translations:
	node locales/update_locales

presets:
	wget "https://github.com/openstreetmap/iD/raw/master/data/presets/presets.json" -O data/iD_presets.json --no-check-certificate
	node data/get_preset_translations

icons: icons-maki icons-mapnik icons-osmic

icons-maki:
	wget https://github.com/mapbox/maki/zipball/mb-pages -O icons/maki.zip
	yes | unzip -ju icons/maki.zip */renders/*.png -d icons/maki/
	rm icons/maki.zip

icons-mapnik:
	wget https://github.com/gravitystorm/openstreetmap-carto/archive/master.zip -O icons/mapnik.zip
	yes | unzip -ju icons/mapnik.zip */symbols/*.png -d icons/mapnik/
	rm icons/mapnik.zip

icons-osmic:
	git clone --depth 1 https://github.com/nebulon42/osmic.git
	./osmic/tools/export.py --basedir osmic/ osmic/tools/config/overpass-turbo-png.yaml
	optipng -o 2 osmic/export/*
	cp osmic/export/* icons/osmic/
	rm -rf osmic
