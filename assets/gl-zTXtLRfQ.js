const a={"nav.run":"Executar","nav.run_tt":"executar esta consulta no Overpass API","nav.rerender_tt":"parse the MapCSS and rerender the map","nav.share":"Compartir","nav.share_tt":"obter unha ligazón para esta consulta","nav.export":"Exportar","nav.export_tt":"varias ferramentas de exportación","nav.save":"Gardar","nav.save_tt":"gardar esta consulta","nav.load":"Cargar","nav.load_tt":"cargar consultas gardadas ou exemplos","nav.wizard":"Axudante","nav.wizard_tt":"un construtor de consultas","nav.styler":"Style","nav.styler_tt":"style the result based on a given tag","nav.settings":"Axustes","nav.settings_tt":"varias configuracións","nav.help":"Axuda","nav.help_tt":"axuda, sobre e atribucións","nav.logout":"Pechar a sesión","nav.logout_tt":"pechar a sesión da conta do osm actualmente sincronizada","tabs.map":"Mapa","tabs.map_tt":"vista do mapa","tabs.data":"Datos","tabs.data_tt":"vista dos datos","map_controlls.zoom_to_data":"achegar ós datos","map_controlls.localize_user":"localízame!","map_controlls.localize_user_disabled":"deshabilitado porque o overpass turbo non se cargou a través de https://","map_controlls.select_bbox":"seleccionar de xeito manual o bbox","map_controlls.select_bbox_disabled":"inhabilitado coma a consulta actual que non require un bbox","map_controlls.toggle_wide_map":"alternar achegamento do mapa","map_controlls.toggle_data":"alternar a sobreposición dos datos","map_controlls.suggest_zoom_to_data":"preme aquí para amosar os datos","settings.title":"Axustes","settings.section.general":"Axustes xerais","settings.ui_lang":"Lingua da interface","settings.server":"Servidor","settings.disable_autorepair":"Desactivar o aviso ou mensaxe de autoarranxo cando o Overpass API non devolva datos visíbeis","settings.section.editor":"Editor","settings.enable_rich_editor":"Habilitar o editor de código arrequecido","settings.enable_rich_editor_expl":"inhabilitar isto en dispositivos móbiles; require recargar a páxina para ter efecto","settings.editor_width":"Largura do editor","settings.editor_width_expl":'ex. "400px", deixar en branco para predefinidos',"settings.section.map":"Mapa","settings.tile_server":"Servidor de teselas","settings.tile_opacity":"Opacidade das teselas","settings.tile_opacity_expl":"transparencia das teselas do fondo: 0=transparente ... 1=visíbel","settings.show_crosshairs":"Amosar a mira no centro do mapa","settings.disable_poiomatic":"Non amosar pequenos elementos coma PDI","settings.show_data_stats":"Amosar algunhas estatísticas sobre os datos cargados e amosados.","settings.section.sharing":"Compartir","settings.include_map_state":"Engadir o estado actual do mapa nas ligazóns compartidas","settings.compression":"Compresión","settings.section.export":"Exportar","settings.export_image_scale":"Amosar a escala nas imaxes exportadas.","settings.export_image_attr":"Amosar a atribución nas imaxes exportadas","save.title":"Gardar","save.enter_name":"Insire un nome para esta consulta","load.title":"Cargar","load.delete_query":"eliminar esta consulta","load.saved_queries-local":"Consultas gardadas (local)","load.saved_queries-osm":"Consultas gardadas (osm.org)","load.saved_queries-osm-loading":"Estasen a cargar as consultas gardadas dende o osm.org...","load.saved_queries-osm-error":"An error occurred while loading saved queries from osm.org :(","load.examples":"Exemplos","load.no_saved_query":"aínda sen consultas gardadas","export.title":"Exportar","export.download-error":"Exportar - Erro","export.copy_to_clipboard":"Copy this text to clipboard","export.copy_to_clipboard_success":"Exportar - Copiado con éxito ó portapapeis","export.copy_to_clipboard_success-message":'<span class="export-copy_to_clipboard-content"></span> copiouse con éxito ó portapapeis.',"export.section.map":"Mapa","export.as_png":'coma <a id="export-image" href="">imaxe png</a>',"export.as_interactive_map":'coma <a id="export-interactive-map" href="">mapa interactivo</a>',"export.current_map_view":'actual <a id="export-map-state" href="">vista do mapa</a>',"export.map_view_expl":"bbox, centrar, etc.","export.section.data":"Datos","export.generic_download_copy":'<div class="field-label is-normal"><span class="format"></span></div><div class="field-body"><span class="buttons has-addons"><a class="export button is-small is-link is-outlined" title="saves the exported data as a file">baixar</a><a class="copy button is-small is-link is-outlined" title="copies export output to clipboard">copiar</a></span></div>',"export.raw_data":"datos do OSM sen procesar","export.raw_interpreter":'datos sen procesar directamente dende o <a id="export-overpass-api" href="" target="_blank" class="external">Overpass API</a>',"export.save_geoJSON_gist":'gardar o GeoJSON en <a id="export-geoJSON-gist" href="" class="external">gist</a>',"export.section.query":"Consulta","export.format_text":`<abbr title="For direct use with the Overpass API, has expanded shortcuts and doesn't include additional overpass turbo features such as MapCSS.">consulta independente</abbr>`,"export.format_text_raw":'<abbr title="Unaltered overpass turbo query – just as in the code editor">consulta sen procesar</abbr>',"export.format_text_wiki":'<abbr title="For usage in the OSM wiki as a OverpassTurboExample-Template">wiki do osm</abbr>',"export.format_text_umap":'<abbr title="For usage with umap.openstreetmap.fr">umap</abbr> url de datos remotos',"export.to_xml":'converter en <a id="export-convert-xml" href="" target="_blank" class="external">Overpass-XML</a>',"export.to_ql":'converter en (<a id="export-convert-compact" href="" target="_blank" class="external">compacto</a>) <a id="export-convert-ql" href="" target="_blank" class="external">OverpassQL</a>',"export.editors":"carga os datos nun editor do OSM:","export.geoJSON.title":"Exportar - GeoJSON","export.geoJSON.expl":"Os datos actualmente amosados coma GeoJSON:","export.geoJSON.no_data":"Non hai datos GeoJSON dispoñíbeis! Executa unha consulta primeiro.","export.geoJSON_gist.title":"Gardado coma gist","export.geoJSON_gist.gist":"Gist:","export.geoJSON_gist.geojsonio":"Editar co geojson.io:","export.geoJSON_gist.geojsonio_link":"geojson.io","export.GPX.title":"Exportar - GPX","export.GPX.expl":"Os datos actualmente amosados coma GPX:","export.GPX.no_data":"Non hai datos GPX dispoñíbeis! Executa unha consulta primeiro.","export.KML.title":"Exportar - KML","export.KML.expl":"Os datos actualmente amosados coma KML:","export.KML.no_data":"Non hai datos KML dispoñíbeis! Executa unha consulta primeiro.","export.raw.title":"Exportar - sen procesar","export.raw.no_data":"Non hai datos sen procesar dispoñíbeis! Executa unha consulta primeiro.","export.map_view.title":"Vista do mapa actual","export.map_view.permalink":"Ligazón permanente","export.map_view.permalink_osm":"ó osm.org","export.map_view.center":"Centrar","export.map_view.center_expl":"lat, lon","export.map_view.bounds":"Límites","export.map_view.bounds_selection":"Límites (seleccionar de xeito manual o bbox)","export.map_view.bounds_expl":"sur, oeste, norte, leste","export.map_view.zoom":"Achegar","export.image.title":"Exportar - Imaxe","export.image.alt":"o mapa exportado","export.image.download":"Baixar","export.image.attribution_missing":"Decátate de que tes engadir as atribucións necesarias cando distribúas esta imaxe!","share.title":"Compartir","share.header":"Ligazón permanente","share.copy_this_link":'Copia esta <a href="" id="share_link_a">ligazón</a> para compartir o código actual:',"share.options":"Opcións","share.incl_map_state":"engadir o estado actual do mapa","share.run_immediately":"executar esta consulta decontado após cargar","help.title":"Axuda","help.section.introduction":"Introdución","help.intro.0":'Este é o <i>overpass turbo</i>, unha ferramenta de filtraxe de datos baseado na web para o <a href="https://www.openstreetmap.org">OpenStreetMap</a>.',"help.intro.1":'Co overpass turbo podes executar consultas do <a href="https://wiki.openstreetmap.org/wiki/Overpass_API">Overpass API</a> e analizar os datos resultantes do OSM de xeito interactivo nun mapa.',"help.intro.1b":'Hai un <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard">axudante</a> integrado que fai que a creación de consultas sexa doada.',"help.intro.2":'Máis información sobre o <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo">overpass turbo</a> e de que xeito escribir as <a href="https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">consultas do Overpass</a> na wiki do OSM.',"help.section.queries":"Consultas do Overpass","help.queries.expl":'O Overpass API permite consultar os datos do OSM cos teus propios criterios de procura. Para este obxectivo, tes deseñada de xeito específico unha <a href="https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">linguaxe de consulta</a>.',"help.intro.shortcuts":"Amais das consultas regulares ó Overpass API, pódense empregar os seguintes atallos útis no overpass turbo:","help.intro.shortcuts.bbox":"coordenadas que delimitan a caixa da vista do mapa actual","help.intro.shortcuts.center":"coordenadas do centro do mapa","help.intro.shortcuts.date":"Expresión-hora-data en ISO 8601 dun determinado intre de tempo que xa aconteceu (p. ex. “24 horas”)","help.intro.shortcuts.style":'define unha <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/MapCSS">folla de estilos MapCSS</a>',"help.intro.shortcuts.custom":"Os atallos personalizados poden definirse pondo <i>{{atallo=valor}}</i> nalgunha parte do script.","help.intro.shortcuts.more":'Máis atallos do overpass-turbo, información adicional sobre o visto e exemplos de emprego na <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Extended_Overpass_Queries">wiki do OSM</a>.',"help.section.ide":"IDE","help.ide.share.title":"Compartindo","help.ide.share.expl":"É posíbel enviar unha ligazón permanente ca consulta na que estás a traballar actualmente a outra persoa. Isto está na ferramenta de <i>Compartir</i> e amosa unha ligazón que podes enviar a unha amizade ou publicar en liña. (Decátate de que os demais van traballar na súa propia copia da consulta.)","help.ide.save_load.title":"Gardar e cargar","help.ide.save_load.expl":"Tamén podes gardar e cargar as túas consultas. Para comezar, hai algunhas consultas de exemplo precargadas. Bota unha ollada a estas para ver axiña o que o overpass pode facer.","help.ide.keyboard.title":"Atallos do teclado:","help.ide.keyboard.run":"Executa a consulta actual.","help.ide.keyboard.wizard":"Comezar o axudante de consultas.","help.ide.keyboard.load_save":"Cargar (abrir) / Gardar unha consulta.","help.ide.keyboard.help":"Abrir este diálogo de axuda.","help.section.key":"Chaves do mapa","help.key.example":"varios elementos do mapa","help.key.description":`As vías amósanse coma liñas azuis resaltadas, os polígonos coma áreas amarelas cunha contorna delgada azul, os PDI (nós con etiquetas) coma círculos amarelos cunha contorna delgada azul. Os círculos cun recheo vermello representan os polígonos ou vías que son moi pequenos para ser amosados de xeito normal.
As liñas ou contornas de cor rosa significan que un obxecto é parte de polo menos unha relación (cargada). As liñas punteadas significan que unha vía ou un polígono ten xeometría incompleta (o máis probábel debido a que algúns dos seus nós non foran cargados).`,"help.section.export":"Exportar","help.export":'A ferramenta de <i>exportación</i> ten unha variedade de opcións por facer ca consulta e/ou datos cargados pola consulta.<br />Opcións con este símbolo:<span class="ui-icon ui-icon-extlink" style="display:inline-block;"></span> depende de ou fan referencia a ferramentas externas (en liña).',"help.export.query_data.title":"Consulta / Datos","help.export.query_data.expl":"This holds some things you can do with the raw query or data, like converting the query between the various query languages or exporting the data as geoJSON. A very useful option is the possibility to send the query to JOSM.","help.export.map.title":"Mapa","help.export.map.expl":"Converter a vista do mapa con datos actual nunha imaxe png estática, ou un mapa interactivo (en pantalla completa), etc.","help.section.about":"Sobre","help.about.maintained":"O <i>overpass turbo</i> é mantido por Martin Raifer (tyr.asd en gmail.com).","help.about.feedback.title":"Opinións, informes de erros, pregar novas funcións","help.about.feedback":'Se desexas dar a túa opinión, informar de erros ou solicitar unha funcionalidade en particular, emprega o <a href="https://github.com/tyrasd/overpass-turbo/issues">seguimento de incidencias</a> (issue tracker) no github ou a <a href="https://wiki.openstreetmap.org/wiki/Talk:Overpass_turbo">páxina de conversa</a> (ou discusión) na wiki do OSM.',"help.about.source.title":"Código fonte","help.about.source":'O <a href="https://github.com/tyrasd/overpass-turbo">código fonte</a> desta aplicación está liberado baixo a <a href="LICENSE">licenza</a> MIT.',"help.section.attribution":"Atribución","help.attr.data_sources":"Fontes dos datos","help.attr.data":'Datos &copy; contribuíntes do <a href="https://openstreetmap.org/">OpenStreetMap</a>, <span style="font-size:smaller;"><a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL</a> (<a href="https://www.openstreetmap.org/copyright">Termos</a>)</span>',"help.attr.mining":"Minaría de datos por","help.attr.tiles":'Map tiles &copy; <a href="https://openstreetmap.org/">OpenStreetMap</a> contributors',"help.attr.search":"Procura fornecida por","help.attr.software":"Software e bibliotecas","help.attr.leaflet":"Mapa desenvolvido por","help.attr.codemirror":"Editor desenvolvido por","help.attr.other_libs":"Outras bibliotecas:","ffs.title":"Axudante de consultas","ffs.comments":"add query comments","ffs.placeholder":"procurar","ffs.expl":'O <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">axudante</a> axúdache ca creación de consultas do Overpass. Velaquí algúns exemplos de emprego:',"ffs.parse_error":"Sentímolo, esta procura non se entende.","ffs.parse_error_expl":'Decátate de que tes empregar as comiñas nas cadeas que conteñan espazos ou caracteres especiais e múltiples filtros de procura teñen que estar separados por operadores booleáns correspondentes (<i>and</i> [e] ou <i>or</i> [ou]). Le a <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">documentación</a> para máis información.',"ffs.typo":"Quixeches dicir:","styler.title":"Auto Styler","styler.expl":"Style the query result based on the values of the specified tag","styler.placeholder":"Select a tag key","styler.palette":"Choose a palette:","styler.palette.sequential":"sequential","styler.palette.qualitative":"qualitative","dialog.dismiss":"rexeitar","dialog.cancel":"desbotar","dialog.save":"gardar","dialog.save-local":"gardar (local)","dialog.save-osm":"gardar no osm.org","dialog.delete":"eliminar","dialog.close":"pechar","dialog.done":"feito","dialog.abort":"abortar","dialog.reset":"reset","dialog.repair_query":"arranxar consulta","dialog.continue_anyway":"continuar de todos xeitos","dialog.show_data":"amosar os datos","dialog.wizard_build":"construír consulta","dialog.wizard_run":"construír e executar a consulta","dialog.styler_run":"apply style","dialog.delete_query.title":"Eliminar consulta?","dialog.delete_query.expl":"Verdadeiramente desexas eliminar a seguinte consulta?","dialog.delete_query.expl-osm":"Verdadeiramente desexas eliminar a seguinte consulta sincronizada?","error.query.title":"Erro na consulta","error.query.expl":"An error occurred during the execution of the overpass query! This is what overpass API returned:","error.ajax.title":"Erro no ajax","error.ajax.expl":"An error occurred during the execution of the overpass query!","error.mapcss.title":"Erro no MapCSS","error.mapcss.expl":"Folla de estilos MapCSS non válida:","error.remote.title":"Erro no control remoto","error.remote.incompat":"Erro: incompatíbel ca versión do control remoto do JOSM","error.remote.not_found":"Control remoto non atopado. :( Asegúrate de que o JOSM estea en execución e configurado de xeito correcto.","error.nominatim.title":"Erro no Nominatim","error.nominatim.expl":"Non se atopou ren co seguinte nome:","warning.browser.title":"O teu navegador non é compatíbel :(","warning.browser.expl.1":'O navegador que estás a empregar, non é capaz (o máis probábel) de executar (anacos significativos de) esta aplicación. <small>Esta ten que soportar o <a href="https://en.wikipedia.org/wiki/Web_storage#localStorage">Web Storage API</a> e o <a href="https://en.wikipedia.org/wiki/Cross-origin_resource_sharing">cross origin resource sharing (CORS)</a>.</small>',"warning.browser.expl.2":'Decátate de que é posíbel que teñas que habilitar as cookies e/ou os "datos locais" neste sitio nalgúns navegadores (coma o Firefox e o Chrome).',"warning.browser.expl.3":'Actualiza a unha versión máis recente do teu navegador ou múdao por outro con máis capacidades! As versións recentes do <a href="https://www.opera.com">Opera</a>, o <a href="https://www.google.com/intl/de/chrome/browser/">Chrome</a> e o <a href="https://www.mozilla.org/de/firefox/">Firefox</a> foron probadas para traballar. De xeito alternativo, podes empregar o <a href="https://overpass-api.de/query_form.html">formulario de consulta do Overpass API</a>.',"warning.incomplete.title":"Datos non completos","warning.incomplete.expl.1":"Esta consulta non devolveu ningún nó. No OSM, só os nós conteñen coordenadas. Por exemplo, unha vía non se pode amosar sen os seus nós.","warning.incomplete.expl.2":'Se isto non é o que desexabas obter, o <i>overpass turbo</i> pode axudarche a arranxar (autocompletar) a consulta escollendo deseguido "arranxar consulta". Pola contra, podes continuar cos datos.',"warning.incomplete.not_again":"non amosar esta mensaxe de novo.","warning.incomplete.remote.expl.1":"Semella como se esta consulta non devolvera os datos do OSM no formato XML cos metadatos. Porén, os editores coma o JOSM requiren que os datos estean nese formato.","warning.incomplete.remote.expl.2":'O <i>overpass turbo</i> pódeche axudar a corrixir a consulta escollendo "arranxar consulta" deseguido.',"warning.share.long":"Aviso: Esta ligazón compartida é moi longa. Pode non funcionar nunhas circunstancias determinadas","warning.share.very_long":"Aviso: Esta ligazón compartida é moi longa. Probábelmente falle en circunstancias normais (navegadores, servidores web). Empregaa con coidado!","warning.huge_data.title":"Grandes moreas de datos","warning.huge_data.expl.1":"Esta consulta devolve unha boa morea de datos (aprox. {{amount_txt}}).","warning.huge_data.expl.2":"O teu navegador pode ter dificultades tratando de renderizar isto. Estás na certeza de querer continuar?","waiter.processing_query":"estase a procesar a consulta...","waiter.export_as_image":"estase a exportar coma imaxe...","data_stats.loaded":"Cargado","data_stats.displayed":"Amosado","data_stats.nodes":"nós","data_stats.ways":"vías","data_stats.relations":"relacións","data_stats.areas":"áreas","data_stats.pois":"pdi","data_stats.lines":"liñas","data_stats.polygons":"polígonos","data_stats.request_duration":"Overpass request took","data_stats.lag":"Actualidade dos datos","data_stats.lag_areas":"Actualidade das áreas","data_stats.lag.expl":"detrás da principal base de datos do OSM","popup.tags":"Tags","popup.metadata":"Metadata","popup.coordinates":"Coordinates","popup.node":"Node","popup.nodes":"Nodes","popup.way":"Way","popup.ways":"Ways","popup.relation":"Relation","popup.relations":"Relations","popup.incomplete_geometry":"Attention: incomplete geometry (e.g. some nodes missing)","map.intentionally_blank":"Este mapa deixouse en branco de xeito intencional."};export{a as default};
//# sourceMappingURL=gl-zTXtLRfQ.js.map
