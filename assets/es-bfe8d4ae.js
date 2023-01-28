const e={"nav.run":"Ejecutar","nav.run_tt":"ejecutar esta consulta en Overpass API","nav.rerender_tt":"analizar el MapCSS y volver a renderizar el mapa","nav.share":"Compartir","nav.share_tt":"obtener un enlace para esta consulta","nav.export":"Exportar","nav.export_tt":"diversas herramientas de exportación","nav.save":"Guardar","nav.save_tt":"guardar esta consulta","nav.load":"Cargar","nav.load_tt":"cargar consultas guardadas o ejemplos","nav.wizard":"Asistente","nav.wizard_tt":"un constructor de consultas","nav.settings":"Configuraciones","nav.settings_tt":"diversas configuraciones","nav.help":"Ayuda","nav.help_tt":"ayuda, acerca de y atribuciones","nav.logout":"Cerrar sesión","nav.logout_tt":"cerrar sesión de la cuenta osm actualmente sincronizada","tabs.map":"Mapa","tabs.map_tt":"vista del mapa","tabs.data":"Datos","tabs.data_tt":"vista de datos","map_controlls.zoom_to_data":"acercar a los datos","map_controlls.localize_user":"¡localízame!","map_controlls.localize_user_disabled":"deshabilitado porque overpass turbo no se ha ejecutado a través de https://","map_controlls.select_bbox":"seleccionar manualmente el bbox","map_controlls.select_bbox_disabled":"inhabilitado como la consulta actual que no requiere un bbox","map_controlls.toggle_wide_map":"Alternar ampliar mapa","map_controlls.toggle_data":"intercambiar la superposición de datos","map_controlls.suggest_zoom_to_data":"haz clic aquí para ver los datos","settings.title":"Configuraciones","settings.section.general":"Configuraciones generales","settings.ui_lang":"Idioma de la IU","settings.server":"Servidor","settings.disable_autorepair":"Desactivar la advertencia o mensaje de autoreparar cuando Overpass API no devuelva datos visibles","settings.section.editor":"Editor","settings.enable_rich_editor":"Habilitar el editor de código enriquecido","settings.enable_rich_editor_expl":"inhabilitar esto en dispositivos móviles; requiere recargar la página para tener efecto","settings.editor_width":"Ancho del editor","settings.editor_width_expl":"ej. «400px», dejar en blanco para predefinido","settings.section.map":"Mapa","settings.tile_server":"Servidor de teselas","settings.tile_opacity":"Opacidad de las teselas","settings.tile_opacity_expl":"transparencia de las teselas de fondo: 0=transparente ... 1=visible","settings.show_crosshairs":"Mostrar la mira en el centro del mapa","settings.disable_poiomatic":"No mostrar pequeñas características como PDI","settings.show_data_stats":"Mostrar algunas estadísticas sobre datos cargados y mostrados","settings.section.sharing":"Compartir","settings.include_map_state":"Incluir el estado actual del mapa en los enlaces compartidos","settings.compression":"Compresión","settings.section.export":"Exportar","settings.export_image_scale":"Mostrar la escala en las imágenes exportadas","settings.export_image_attr":"Mostrar la atribución en las imágenes exportadas","save.title":"Guardar","save.enter_name":"Introduzca un nombre para esta consulta","load.title":"Cargar","load.delete_query":"eliminar esta consulta","load.saved_queries-local":"Consultas guardadas (local)","load.saved_queries-osm":"Consultas guardadas (osm.org)","load.saved_queries-osm-loading":"Cargando consultas guardadas desde osm.org...","load.saved_queries-osm-error":"Se produjo un error al cargar consultas guardadas desde osm.org :(","load.examples":"Ejemplos","load.no_saved_query":"aún sin consultas guardadas","export.title":"Exportar","export.download-error":"Exportar - Error","export.copy_to_clipboard":"Copiar este texto al portapapeles","export.copy_to_clipboard_success":"Exportar - Copiado con éxito al portapapeles","export.copy_to_clipboard_success-message":'<span class="export-copy_to_clipboard-content"></span> se copió con éxito al portapapeles.',"export.section.map":"Mapa","export.as_png":'como <a id="export-image" href="">imagen png</a>',"export.as_interactive_map":'como <a id="export-interactive-map" href="">mapa interactivo</a>',"export.current_map_view":'actual <a id="export-map-state" href="">vista del mapa</a>',"export.map_view_expl":"bbox, centrar, etc.","export.section.data":"Datos","export.generic_download_copy":'<div class="field-label is-normal"><span class="format"></span></div><div class="field-body"><span class="buttons has-addons"><a class="export button is-small is-link is-outlined" title="saves the exported data as a file">descargar</a><a class="copy button is-small is-link is-outlined" title="copies export output to clipboard">copiar</a></span></div>',"export.raw_data":"datos OSM sin procesar","export.raw_interpreter":'datos sin procesar directamente desde <a id="export-overpass-api" href="" target="_blank" class="external">Overpass API</a>',"export.save_geoJSON_gist":'guardar GeoJSON a <a id="export-geoJSON-gist" href="" class="external">gist</a>',"export.section.query":"Consulta","export.format_text":`<abbr title="For direct use with the Overpass API, has expanded shortcuts and doesn't include additional overpass turbo features such as MapCSS.">consulta independiente</abbr>`,"export.format_text_raw":'<abbr title="Unaltered overpass turbo query – just as in the code editor">consulta sin procesar</abbr>',"export.format_text_wiki":'<abbr title="For usage in the OSM wiki as a OverpassTurboExample-Template">wiki osm</abbr>',"export.format_text_umap":'<abbr title="For usage with umap.openstreetmap.fr">umap</abbr> url de datos remotos',"export.to_xml":'convertir a <a id="export-convert-xml" href="" target="_blank" class="external">Overpass-XML</a>',"export.to_ql":'convertir a (<a id="export-convert-compact" href="" target="_blank" class="external">compact</a>) <a id="export-convert-ql" href="" target="_blank" class="external">OverpassQL</a>',"export.editors":"carga los datos en un editor OSM:","export.geoJSON.title":"Exportar - GeoJSON","export.geoJSON.expl":"Los datos actualmente mostrados como GeoJSON:","export.geoJSON.no_data":"¡Sin datos GeoJSON disponibles! Ejecuta una consulta primero.","export.geoJSON_gist.title":"Guardado como gist","export.geoJSON_gist.gist":"Gist:","export.geoJSON_gist.geojsonio":"Editar con geojson.io:","export.geoJSON_gist.geojsonio_link":"geojson.io","export.GPX.title":"Exportar - GPX","export.GPX.expl":"Los datos actualmente mostrados como GPX:","export.GPX.no_data":"¡Sin datos GPX disponibles! Ejecuta una consulta primero.","export.KML.title":"Exportar - KML","export.KML.expl":"Los datos actualmente mostrados como KML:","export.KML.no_data":"¡Sin datos KML disponibles! Ejecuta una consulta primero.","export.raw.title":"Exportar - sin procesar","export.raw.no_data":"¡Sin datos no procesados disponibles! Ejecuta una consulta primero.","export.map_view.title":"Vista del mapa actual","export.map_view.permalink":"Enlace permanente","export.map_view.permalink_osm":"a osm.org","export.map_view.center":"Centrar","export.map_view.center_expl":"lat, lon","export.map_view.bounds":"Límites","export.map_view.bounds_selection":"Límites (seleccione manualmente el bbox)","export.map_view.bounds_expl":"sur, oeste, norte, este","export.map_view.zoom":"Ampliar","export.image.title":"Exportar - Imagen","export.image.alt":"el mapa exportado","export.image.download":"Descargar","export.image.attribution_missing":"¡Asegúrate de incluir las atribuciones necesarias cuando distribuyas esta imagen!","share.title":"Compartir","share.header":"Enlace permanente","share.copy_this_link":'Copie este <a href="" id="share_link_a">enlace</a> para compartir el código actual:',"share.options":"Opciones","share.incl_map_state":"incluir el estado actual del mapa","share.run_immediately":"ejecutar esta consulta inmediatamente después de cargar","help.title":"Ayuda","help.section.introduction":"Introducción","help.intro.0":'Este es <i>overpass turbo</i>, una herramienta de filtrado de datos basado en la web para <a href="http://www.openstreetmap.org">OpenStreetMap</a>.',"help.intro.1":'Con overpass turbo puede ejecutar consultas <a href="http://wiki.openstreetmap.org/wiki/Overpass_API">Overpass API</a> y analizar los datos resultantes de OSM de forma interactiva en un mapa.',"help.intro.1b":'Hay un <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard">ayudante</a> integrado que hace que la creación de consultas sea fácil.',"help.intro.2":'Más información sobre <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo">overpass turbo</a> y cómo escribir <a href="http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">consultas Overpass</a> se puede encontrar en la wiki OSM.',"help.section.queries":"Consultas Overpass","help.queries.expl":'Overpass API permite consultar los datos OSM con sus propios criterios de búsqueda. Para este propósito, tiene específicamente un <a href="http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">lenguaje de consulta</a> diseñado.',"help.intro.shortcuts":"Además de las consultas regulares a Overpass API se pueden usar los siguientes atajos útiles en overpass turbo:","help.intro.shortcuts.bbox":"coordenadas que delimitan la caja de la vista del mapa actual","help.intro.shortcuts.center":"coordenadas del centro del mapa","help.intro.shortcuts.date":"cadena de fecha-hora bajo ISO 8601 de un intérvalo de tiempo hacia atrás (ej. «24 hours»)","help.intro.shortcuts.style":'define una <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/MapCSS">hoja de estilo MapCSS</a>',"help.intro.shortcuts.custom":"Atajos arbitrarios pueden definirse poniendo <i>{{atajo=valor}}</i> en alguna parte del script.","help.intro.shortcuts.more":'Más accesos directos overpass-turbo, información adicional sobre los ejemplos anteriores y uso se pueden encontrar en la <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/Extended_Overpass_Queries">wiki OSM</a>.',"help.section.ide":"IDE","help.ide.share.title":"Compartiendo","help.ide.share.expl":"Es posible enviar un enlace permanente con la consulta que está trabajando actualmente a otra persona. Esto se encuentra en la herramienta <i>Compartir</i> y muestra un enlace que puede enviar a un amigo o publicar en línea. (Tenga en cuenta que los demás van a trabajar en su propia copia de la consulta.)","help.ide.save_load.title":"Guardar y cargar","help.ide.save_load.expl":"También puede guardar y cargar sus consultas. Para empezar, hay algunas consultas de ejemplo precargadas. Eche un vistazo a estas para ver un pantallazo de lo que overpass puede hacer.","help.ide.keyboard.title":"Atajos de teclado:","help.ide.keyboard.run":"Ejecuta la consulta actual.","help.ide.keyboard.wizard":"Inicia el asistente de consultas.","help.ide.keyboard.load_save":"Carga (abre) / Guarda una consulta.","help.ide.keyboard.help":"Abre este diálogo de ayuda.","help.section.key":"Claves del mapa","help.key.example":"diversas características del mapa","help.key.description":`Las vías se muestran como líneas azules resaltadas, los polígonos como áreas amarillas con un contorno azul fino, los DPI (nodos con etiquetas) como círculos amarillos con un contorno azul fino. Los círculos con un relleno rojo representan los polígonos o vías que son demasiado pequeños para ser mostrados normalmente.

Las líneas o contornos rosados significan que un objeto es parte de al menos una relación (cargada). Las líneas punteadas significan que una vía o un polígono tiene geometría incompleta (lo más probable debido a que algunos de sus nodos no han sido cargados).`,"help.section.export":"Exportar","help.export":'La herramienta de <i>exportación</i> tiene una variedad de opciones por hacer con la consulta y/o datos cargados por la consulta.<br />Opciones con este símbolo:<span class="ui-icon ui-icon-extlink" style="display:inline-block;"></span> invocan o hacen referencia a herramientas externas (en línea).',"help.export.query_data.title":"Consulta / Datos","help.export.query_data.expl":"Estas son algunas de las cosas que puede hacer con la consulta o datos sin procesar, como convertir la consulta entre los diversos lenguajes de consulta o exportar los datos como geoJSON. Una opción muy útil es la posibilidad de enviar la consulta a JOSM.","help.export.map.title":"Mapa","help.export.map.expl":"Convertir la vista del mapa con datos actual a una imagen png estática, o un mapa interactivo (a pantalla completa), etc.","help.section.about":"Acerca de","help.about.maintained":"<i>overpass turbo</i> es mantenido por Martin Raifer (tyr.asd at gmail.com).","help.about.feedback.title":"Comentarios, informes de errores, peticiones de características","help.about.feedback":'Si desea dar un comentario, reportar problemas o solicitar una característica particular, utilice el <a href="https://github.com/tyrasd/overpass-turbo/issues">seguimiento de incidencias</a> en github o la <a href="http://wiki.openstreetmap.org/wiki/Talk:Overpass_turbo">página de discusión</a> en la wiki OSM.',"help.about.source.title":"Código fuente","help.about.source":'El <a href="https://github.com/tyrasd/overpass-turbo">código fuente</a> de esta aplicación está liberada bajo la <a href="LICENSE">licencia</a> MIT.',"help.section.attribution":"Atribución","help.attr.data_sources":"Fuentes de datos","help.attr.data":'Datos &copy; contribuidores <a href="http://openstreetmap.org/">OpenStreetMap</a>, <span style="font-size:smaller;"><a href="http://opendatacommons.org/licenses/odbl/1-0/">ODbL</a> (<a href="http://www.openstreetmap.org/copyright">términos</a>)</span>',"help.attr.mining":"Minería de datos por","help.attr.tiles":'Mapa de teselas &copy; contribuidores <a href="http://openstreetmap.org/">OpenStreetMap</a>',"help.attr.search":"Búsqueda provista por","help.attr.software":"Software y bibliotecas","help.attr.leaflet":"Mapa provisto por","help.attr.codemirror":"Editor provisto por","help.attr.other_libs":"Otras bibliotecas:","ffs.title":"Asistente para consultas","ffs.comments":"add query comments","ffs.placeholder":"buscar","ffs.expl":'El <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">asistente</a> le ayuda con la creación de consultas Overpass. He aquí algunos ejemplos de uso:',"ffs.parse_error":"Lo sentimos, la búsqueda no se entiende.","ffs.parse_error_expl":'Tenga en cuenta que debe utilizar comillas en cadenas que contengan espacios o caracteres especiales y múltiples filtros de búsqueda deben estar separados por operadores booleanos correspondientes (<i>and</i> u <i>or</i>). Lea la <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">documentación</a> para más información.',"ffs.typo":"Quisiste decir:","dialog.dismiss":"desechar","dialog.cancel":"cancelar","dialog.save":"guardar","dialog.save-local":"guardar (local)","dialog.save-osm":"guardar en osm.org","dialog.delete":"borrar","dialog.close":"cerrar","dialog.done":"hecho","dialog.abort":"abortar","dialog.reset":"reiniciar","dialog.repair_query":"reparar consulta","dialog.continue_anyway":"continuar de todos modos","dialog.show_data":"mostrar los datos","dialog.wizard_build":"construir consulta","dialog.wizard_run":"construir y ejecutar la consulta","dialog.delete_query.title":"¿Eliminar consulta?","dialog.delete_query.expl":"¿Realmente quiere eliminar la siguiente consulta","dialog.delete_query.expl-osm":"Realmente quiere eliminar la siguiente consulta sincronizada","error.query.title":"Error en la consulta","error.query.expl":"¡Ocurrió un error durante la ejecución de la consulta overpass! Esto es lo que overpass API devolvió:","error.ajax.title":"Error ajax","error.ajax.expl":"¡Ocurrió un error durante la ejecución de la consulta overpass!","error.mapcss.title":"Error en MapCSS","error.mapcss.expl":"Estilo MapCSS no válido:","error.remote.title":"Error en el control remoto","error.remote.incompat":"Error: incompatible con la versión del control remoto de JOSM","error.remote.not_found":"Control remoto no encontrado. :( Asegúrate que JOSM esté en ejecución y configurado correctamente.","error.nominatim.title":"Error en Nominatim","error.nominatim.expl":"No se encontró nada con el siguiente nombre:","warning.browser.title":"Su navegador no está soportado :(","warning.browser.expl.1":'El navegador que estás utilizando, no es capaz (lo más probable) de ejecutar (partes significativas de) esta aplicación. <small>Este debe soportar <a href="http://en.wikipedia.org/wiki/Web_storage#localStorage">Web Storage API</a> y <a href="http://en.wikipedia.org/wiki/Cross-origin_resource_sharing">cross origin resource sharing (CORS)</a>.</small>',"warning.browser.expl.2":"Tenga en cuenta que es posible que deba habilitar las cookies y/o «datos locales» en este sitio en algunos navegadores (como Firefox y Chrome).","warning.browser.expl.3":'¡Actualice a una versión más reciente de su navegador o cambie a otro con más capacidades! Las versiones recientes de <a href="http://www.opera.com">Opera</a>, <a href="http://www.google.com/intl/de/chrome/browser/">Chrome</a> y <a href="http://www.mozilla.org/de/firefox/">Firefox</a> han sido probados para trabajar. Alternativamente, puede utilizar el <a href="http://overpass-api.de/query_form.html">formulario de consulta Overpass API</a>.',"warning.incomplete.title":"Datos incompletos","warning.incomplete.expl.1":"Esta consulta no devolvió ningún nodo. En OSM, sólo los nodos contienen coordenadas. Por ejemplo, una vía no se puede visualizar sin sus nodos.","warning.incomplete.expl.2":"Si esto no es lo que quería obtener, <i>overpass turbo</ i> puede ayudarle a reparar (auto-completar) la consulta eligiendo a continuación «reparar consulta». De lo contrario, puede continuar a los datos.","warning.incomplete.not_again":"no mostrar este mensaje de nuevo.","warning.incomplete.remote.expl.1":"Parece como si esta consulta no devolviera los datos de OSM en formato XML con los metadatos. Sin embargo, editores como JOSM requieren que los datos estén en ese formato.","warning.incomplete.remote.expl.2":"<i>overpass turbo</i> te puede ayudar a corregir la consulta seleccionando «reparar consulta» a continuación.","warning.share.long":"Advertencia: Este enlace compartido es bastante largo. Puede no funcionar en determinadas circunstancias","warning.share.very_long":"Advertencia: ¡Este enlace compartido es muy largo. Probablemente falle en circunstancias normales (navegadores, servidores web). Utilice con precaución!","warning.huge_data.title":"Grandes cantidades de datos","warning.huge_data.expl.1":"Esta consulta devuelve un buen montón de datos (aprox. {{amount_txt}}).","warning.huge_data.expl.2":"Su navegador puede tener dificultades tratando de renderizar esto. ¿Está seguro que quiere continuar?","waiter.processing_query":"procesando consulta...","waiter.export_as_image":"exportando como imagen...","data_stats.loaded":"Cargado","data_stats.displayed":"Mostrado","data_stats.nodes":"nodos","data_stats.ways":"vías","data_stats.relations":"relaciones","data_stats.areas":"áreas","data_stats.pois":"pdis","data_stats.lines":"líneas","data_stats.polygons":"polígonos","data_stats.request_duration":"La petición de Overpass ha tardado","data_stats.lag":"Actualidad de los datos","data_stats.lag_areas":"Actualidad de las áreas","data_stats.lag.expl":"detrás de la principal base de datos OSM","map.intentionally_blank":"Este mapa se dejó en blanco intencionalmente."};export{e as default};
