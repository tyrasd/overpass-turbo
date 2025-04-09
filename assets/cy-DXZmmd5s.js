const e={"nav.run":"Gweithredu","nav.run_tt":"Gweithredu'r ymholiad hwn ar Overpass API","nav.rerender_tt":"dosrannu'r MapCSS ac ailgynhyrchu'r map","nav.share":"Rhannu","nav.share_tt":"cael dolen barhaol ar gyfer yr ymholiad hwn","nav.export":"Allforio","nav.export_tt":"offer allforio amrywiol","nav.save":"Cadw","nav.save_tt":"cadw'r ymholiad hwn","nav.load":"Llwytho","nav.load_tt":"llwytho ymholiad wedi'i cadw neu enghraifft","nav.wizard":"Dewin","nav.wizard_tt":"adeiladwr ymholiadau","nav.styler":"Style","nav.styler_tt":"style the result based on a given tag","nav.settings":"Gosodiadau","nav.settings_tt":"gosodiadau amrywiol","nav.help":"Cymorth","nav.help_tt":"cymorth, ynghylch a chydnabyddiaeth","nav.logout":"Allgofnodi","nav.logout_tt":"allgofnodi o gyfrif osm cyfredol","tabs.map":"Map","tabs.map_tt":"golwg map","tabs.data":"Data","tabs.data_tt":"golwg data","map_controlls.zoom_to_data":"chwyddo i ddata","map_controlls.localize_user":"canfod fy lleoliad!","map_controlls.localize_user_disabled":"disabled because overpass turbo has not been loaded via https://","map_controlls.select_bbox":"manually select bbox","map_controlls.select_bbox_disabled":"disabled as the current query doesn't require a bbox","map_controlls.toggle_wide_map":"toglo map mawr","map_controlls.toggle_data":"toglo troshaen ddata","map_controlls.suggest_zoom_to_data":"cliciwch yma i ddangos y data","settings.title":"Gosodiadau","settings.section.general":"Gosodiadau Cyffredinol","settings.ui_lang":"Iaith Ryngwyneb","settings.server":"Gweinydd","settings.disable_autorepair":"Disable warning/autorepair message when Overpass API returns no visible data.","settings.disable_warning_huge_data":"Disable warning when Overpass API returns large amounts of data.","settings.section.editor":"Golygydd","settings.enable_rich_editor":"Enable rich code editor","settings.enable_rich_editor_expl":"disable this on mobile devices; requires a page-reload to take effect","settings.editor_width":"Lled y golygydd","settings.editor_width_expl":'e.g. "400px", leave blank for defaults',"settings.section.map":"Map","settings.tile_server":"Tile-Server","settings.tile_opacity":"Tiles Opacity","settings.tile_opacity_expl":"transparency of background tiles: 0=transparent … 1=visible","settings.show_crosshairs":"Show crosshairs at the map center.","settings.disable_poiomatic":"Don't display small features as POIs.","settings.show_data_stats":"Show some stats about loaded and displayed data.","settings.section.sharing":"Rhannu","settings.include_map_state":"Include current map state in shared links","settings.compression":"Compression","settings.section.export":"Allforio","settings.export_image_scale":"Show scale on exported images.","settings.export_image_attr":"Show attribution on exported images.","save.title":"Cadw","save.enter_name":"Enter a name for this query","load.title":"Llwytho","load.delete_query":"dileu'r ymholiad hwn","load.saved_queries-local":"Ymholiadau wedi'u cadw (lleol)","load.saved_queries-osm":"Ymholiadau wedi'u cadw (osm.org)","load.saved_queries-osm-loading":"Wrthi'n llwytho ymholiadau wedi'u cadw o osm.org...","load.saved_queries-osm-error":"An error occurred while loading saved queries from osm.org :(","load.examples":"Enghreifftiau","load.no_saved_query":"dim ymholiadau wedi'u cadw eto","export.title":"Allforio","export.download-error":"Allforio - Gwall","export.copy_to_clipboard":"Copïo'r testun hwn i'r clipfwrdd","export.copy_to_clipboard_success":"Export - Successfully copied to clipboard","export.copy_to_clipboard_success-message":'<span class="export-copy_to_clipboard-content"></span> was successfully copied to the clipboard.',"export.section.map":"Map","export.as_png":'fel <a id="export-image" href=""> delwedd png</a>',"export.as_interactive_map":'fel <a id="export-interactive-map" href="">Map Rhyngweithiol</a>',"export.current_map_view":'<a id="export-map-state" href="">golwg map</a> cyfredol',"export.map_view_expl":"bbox, canol, ayb.","export.section.data":"Data","export.generic_download_copy":'<div class="field-label is-normal"><span class="format"></span></div><div class="field-body"><span class="buttons has-addons"><a class="export button is-small is-link is-outlined" title="saves the exported data as a file">lawrlwytho</a><a class="copy button is-small is-link is-outlined" title="copies export output to clipboard">copi</a></span></div>',"export.raw_data":"data crai OSM","export.raw_interpreter":'raw data directly from <a id="export-overpass-api" href="" target="_blank" class="external">Overpass API</a>',"export.save_geoJSON_gist":'cadw GeoJSON i <a id="export-geoJSON-gist" href="" class="external">gist</a>',"export.section.query":"Ymholiad","export.format_text":`<abbr title="For direct use with the Overpass API, has expanded shortcuts and doesn't include additional overpass turbo features such as MapCSS.">standalone query</abbr>`,"export.format_text_raw":'<abbr title="Unaltered overpass turbo query – just as in the code editor">ymholiad crai</abbr>',"export.format_text_wiki":'<abbr title="For usage in the OSM wiki as a OverpassTurboExample-Template">wici osm</abbr>',"export.format_text_umap":'<abbr title="For usage with umap.openstreetmap.fr">umap</abbr> remote data url',"export.to_xml":'trosi i <a id="export-convert-xml" href="" target="_blank" class="external">Overpass-XML</a>',"export.to_ql":'convert to (<a id="export-convert-compact" href="" target="_blank" class="external">compact</a>) <a id="export-convert-ql" href="" target="_blank" class="external">OverpassQL</a>',"export.editors":"llwytho data mewn golygydd OSM:","export.geoJSON.title":"Allforio - GeoJSON","export.geoJSON.expl":"The currently shown data as GeoJSON:","export.geoJSON.no_data":"No GeoJSON data available! Please run a query first.","export.geoJSON_gist.title":"Cadwyd fel gist","export.geoJSON_gist.gist":"Gist:","export.geoJSON_gist.geojsonio":"Golygu gyda geojson.io:","export.geoJSON_gist.geojsonio_link":"geojson.io","export.GPX.title":"Allforio - GPX","export.GPX.expl":"The currently shown data as GPX:","export.GPX.no_data":"No GPX data available! Please run a query first.","export.KML.title":"Allforio - KML","export.KML.expl":"The currently shown data as KML:","export.KML.no_data":"No KML data available! Please run a query first.","export.raw.title":"Allforio - crai","export.raw.no_data":"No raw data available! Please run a query first.","export.map_view.title":"Current Map View","export.map_view.permalink":"Dolen barhaol","export.map_view.permalink_osm":"i osm.org","export.map_view.center":"Canol","export.map_view.center_expl":"lat, lon","export.map_view.bounds":"Bounds","export.map_view.bounds_selection":"Bounds (manually selected bbox)","export.map_view.bounds_expl":"de, gorllewin, gogledd, dwyrain","export.map_view.zoom":"Chwyddo","export.image.title":"Allforio - Delwedd","export.image.alt":"y map wedi'i allforio","export.image.download":"Lawrlwytho","export.image.attribution_missing":"Make sure to include proper attributions when distributing this image!","share.title":"Rhannu","share.header":"Dolen barhaol","share.copy_this_link":'Copy this <a href="" id="share_link_a">link</a> to share the current code:',"share.options":"Gosodiadau","share.incl_map_state":"include current map state","share.run_immediately":"run this query immediately after loading","help.title":"Cymorth","help.section.introduction":"Cyflwyniad","help.intro.0":'This is <i>overpass turbo</i>, a web-based data filtering tool for <a href="https://www.openstreetmap.org">OpenStreetMap</a>.',"help.intro.1":'With overpass turbo you can run <a href="https://wiki.openstreetmap.org/wiki/Overpass_API">Overpass API</a> queries and analyse the resulting OSM data interactively on a map.',"help.intro.1b":'There is an integrated <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard">Wizard</a> which makes creating queries super easy.',"help.intro.2":'More information about <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo">overpass turbo</a> and how to write <a href="https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">Overpass queries</a> can be found in the OSM wiki.',"help.section.queries":"Ymholiadau Overpass","help.queries.expl":'Overpass API allows to query for OSM data by your own search criteria. For this purpose, it has a specifically crafted <a href="https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">query language</a>.',"help.intro.shortcuts":"In addition to regular Overpass API queries one can use the following handy shortcuts in overpass turbo:","help.intro.shortcuts.bbox":"bounding box coordinates of the current map view","help.intro.shortcuts.center":"map center coordinates","help.intro.shortcuts.date":"ISO 8601 date-time-string a certain time interval ago (e.g. “24 hours”)","help.intro.shortcuts.style":'defines a <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/MapCSS">MapCSS stylesheet</a>',"help.intro.shortcuts.custom":"Arbitrary shortcuts can be defined by putting <i>{{shortcut=value}}</i> somewhere in the script.","help.intro.shortcuts.more":'More overpass-turbo shortcuts, additional information about the above and usage examples can be found in the <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Extended_Overpass_Queries">OSM wiki</a>.',"help.section.ide":"IDE","help.ide.share.title":"Rhannu","help.ide.share.expl":"It is possible to send a permalink with the query you are currently working on to someone else. This is found in the <i>Share</i> tool and shows you a link which you can send to a friend or post online. (Note that others will work on their own copy of the query.)","help.ide.save_load.title":"Cadw a Llwytho","help.ide.save_load.expl":"You can also save and load your queries. For a start, there are a few example queries preloaded. Take a look at them for a short glimpse of what overpass can do.","help.ide.keyboard.title":"Bysellau brys:","help.ide.keyboard.run":"Run the current query.","help.ide.keyboard.wizard":"Start the query wizard.","help.ide.keyboard.load_save":"Llwytho (agor) / Cadw ymholiad.","help.ide.keyboard.help":"Open this help dialog.","help.section.key":"Allwedd Map","help.key.example":"various map features","help.key.description":"Ways are shown as bold blue lines, Polygons as yellow areas with a thin blue outline, POIs (nodes with tags) as yellow circles with a thin blue outline. Circles with a red filling stand for polygons or ways that are too small to be displayed normally. Pink lines or outlines mean, that an object is part of at least one (loaded) relation. Dashed lines mean that a way or polygon has incomplete geometry (most likely because some of its nodes have not been loaded).","help.section.export":"Allforio","help.export":'The <i>Export</i> tool holds a variety of options to do with the query and/or data loaded by the query.<br />Options with this symbol:<span class="ui-icon ui-icon-extlink" style="display:inline-block;"></span> rely on or refer to external (online) tools.',"help.export.query_data.title":"Ymholiad / Data","help.export.query_data.expl":"This holds some things you can do with the raw query or data, like converting the query between the various query languages or exporting the data as geoJSON. A very useful option is the possibility to send the query to JOSM.","help.export.map.title":"Map","help.export.map.expl":"Convert the current map-with-data view to a static png image, or a (fullscreen) interactive map, etc.","help.section.about":"Ynghylch","help.about.maintained":"Cynhelir <i>overpass turbo</i>gan Martin Raifer (tyr.asd at gmail.com).","help.about.feedback.title":"Adborth, Adroddiadau Namau, Ceisiadau Nodweddion","help.about.feedback":`Os hoffech chi roi adborth, adrodd gwall neu ofyn am nodwedd penodol, defnyddiwch y tracwr materion ar <a href="https://github.com/tyrasd/overpass-turbo/issues">github</a> neu'r <a href="https://wiki.openstreetmap.org/wiki/Talk:Overpass_turbo">dudalen sgwrs</a> ar wici OSM.`,"help.about.source.title":"Cod Ffynhonnell","help.about.source":'The <a href="https://github.com/tyrasd/overpass-turbo">source code</a> of this application is released under the MIT <a href="LICENSE">license</a>.',"help.section.attribution":"Cydnabyddiaeth","help.attr.data_sources":"Ffynonellau Data","help.attr.data":'Data &copy;<a href="https://openstreetmap.org/">Cyfranwyr</a>OpenStreetMap, <span style="font-size:smaller;"><a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL</a>(<a href="https://www.openstreetmap.org/copyright">Telerau</a>)</span>',"help.attr.mining":"Data mining by","help.attr.tiles":'Teiliau map &copy; Cyfranwyr<a href="https://openstreetmap.org/">OpenStreetMap</a>',"help.attr.search":"Search provided by","help.attr.software":"Software & Libraries","help.attr.leaflet":"Map powered by","help.attr.codemirror":"Editor powered by","help.attr.other_libs":"Other libraries:","ffs.title":"Dewin Ymholiadau","ffs.comments":"add query comments","ffs.placeholder":"chwilio","ffs.expl":'The <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">wizard</a> assists you with creating Overpass queries. Here are some usage examples:',"ffs.parse_error":"Sorry, this search cannot be understood.","ffs.parse_error_expl":'Note that you must use quotation marks with strings containing spaces or special characters and that multiple search filters must be separated by appropriate boolean operators (<i>and</i> or <i>or</i>). Read the <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">documentation</a> for more information.',"ffs.typo":"Oeddech chi'n golygu:","styler.title":"Auto Styler","styler.expl":"Style the query result based on the values of the specified tag","styler.placeholder":"Select a tag key","styler.palette":"Choose a palette:","styler.palette.sequential":"sequential","styler.palette.qualitative":"qualitative","dialog.dismiss":"cau","dialog.cancel":"canslo","dialog.save":"cadw","dialog.save-local":"cadw (lleol)","dialog.save-osm":"cadw ar osm.org","dialog.delete":"dileu","dialog.close":"cau","dialog.done":"wedi gorffen","dialog.abort":"canslo","dialog.reset":"ailosod","dialog.repair_query":"repair query","dialog.continue_anyway":"parhau beth bynnag","dialog.show_data":"dangos data","dialog.wizard_build":"adeiladu ymholiad","dialog.wizard_run":"adeiladu a gweithredu ymholiad","dialog.styler_run":"apply style","dialog.delete_query.title":"Dileu'r Ymholiad?","dialog.delete_query.expl":"Do you really want to delete the following query","dialog.delete_query.expl-osm":"Do you really want to delete the following synchronized query","error.query.title":"Gwall Ymholiad","error.query.expl":"An error occurred during the execution of the overpass query! This is what overpass API returned:","error.ajax.title":"Gwall Ajax","error.ajax.expl":"An error occurred during the execution of the overpass query!","error.mapcss.title":"Gwall MapCSS","error.mapcss.expl":"Invalid MapCSS stylesheet:","error.remote.title":"Remote Control Error","error.remote.incompat":"Error: incompatible JOSM remote control version","error.remote.not_found":"Remote control not found. :( Make sure JOSM is already running and properly configured.","error.nominatim.title":"Gwall Nominatim","error.nominatim.expl":"Could not find anything with the following name:","warning.browser.title":"Ni chefnogir eich porwr :(","warning.browser.expl.1":'The browser you are currently using, is (most likely) not capable of running (significant parts of) this Application. <small>It must support <a href="https://en.wikipedia.org/wiki/Web_storage#localStorage">Web Storage API</a> and <a href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing">cross origin resource sharing (CORS)</a>.</small>',"warning.browser.expl.2":'Note that you may have to enable cookies and/or "local Data" for this site on some browsers (such as Firefox and Chrome).',"warning.browser.expl.3":'Please upgrade to a more up-to-date version of your browser or switch to a more capable one! Recent versions of <a href="https://www.opera.com">Opera</a>, <a href="https://www.google.com/intl/de/chrome/browser/">Chrome</a> and <a href="https://www.mozilla.org/de/firefox/">Firefox</a> have been tested to work. Alternatively, you can still use the <a href="https://overpass-api.de/query_form.html">Overpass_API query form</a>.',"warning.incomplete.title":"Data Anghyflawn","warning.incomplete.expl.1":"This query returned no nodes. In OSM, only nodes contain coordinates. For example, a way cannot be displayed without its nodes.","warning.incomplete.expl.2":'If this is not what you meant to get, <i>overpass turbo</i> can help you to repair (auto-complete) the query by choosing "repair query" below. Otherwise you can continue to the data.',"warning.incomplete.not_again":"peidiwch â dangos y neges hwn eto.","warning.incomplete.remote.expl.1":"It looks like if this query will not return OSM data in XML format with metadata. Editors like JOSM require the data to be in that format, though.","warning.incomplete.remote.expl.2":'<i>overpass turbo</i> can help you to correct the query by choosing "repair query" below.',"warning.share.long":"Warning: This share-link is quite long. It may not work under certain circumstances","warning.share.very_long":"Warning: This share-link is very long. It is likely to fail under normal circumstances (browsers, webservers). Use with caution!","warning.huge_data.title":"Large amounts of data","warning.huge_data.expl.1":"This query returned quite a lot of data (approx. {{amount_txt}}).","warning.huge_data.expl.2":"Your browser may have a hard time trying to render this. Do you really want to continue?","waiter.processing_query":"wrthi'n brosesu ymholiad...","waiter.export_as_image":"wrthi'n allforio fel delwedd...","data_stats.loaded":"Llwythwyd","data_stats.displayed":"Dangosir","data_stats.nodes":"nodau","data_stats.ways":"llwybrau","data_stats.relations":"perthnasoedd","data_stats.areas":"ardaloedd","data_stats.pois":"nodau","data_stats.lines":"llinellau","data_stats.polygons":"amlbolygonau","data_stats.request_duration":"Overpass request took","data_stats.lag":"Currentness of data","data_stats.lag_areas":"Currentness of areas","data_stats.lag.expl":"behind main OSM db","popup.tags":"Tagiau","popup.metadata":"Metadata","popup.coordinates":"Cyfesurynnau","popup.node":"Nod","popup.nodes":"Nodau","popup.way":"Llwybr","popup.ways":"Llwybrau","popup.relation":"Perthynas","popup.relations":"Perthnasoedd","popup.incomplete_geometry":"Attention: incomplete geometry (e.g. some nodes missing)","map.intentionally_blank":"Mae'r map hwn yn fwriadol wag."};export{e as default};
//# sourceMappingURL=cy-DXZmmd5s.js.map
