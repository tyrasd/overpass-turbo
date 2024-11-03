const a={"nav.run":"Executar","nav.run_tt":"execute esta consulta na API do Overpass","nav.rerender_tt":"analisar o MapCSS e renderizar novamente o mapa","nav.share":"Compartilhar","nav.share_tt":"pegue um link permanente para essa consulta","nav.export":"Exportar","nav.export_tt":"várias ferramentas de exportação","nav.save":"Salvar","nav.save_tt":"Salvar esta consulta","nav.load":"Carregar","nav.load_tt":"Carregar consulta ou exemplo salvo","nav.wizard":"Assistente","nav.wizard_tt":"Um construtor de consultas","nav.settings":"Configurações","nav.settings_tt":"Várias configurações","nav.help":"Ajuda","nav.help_tt":"ajuda, sobre e atribuições","nav.logout":"Sair","nav.logout_tt":"sair da conta osm atual sincronizada","tabs.map":"Mapa","tabs.map_tt":"vista de mapa","tabs.data":"Dados","tabs.data_tt":"vista de dados","map_controlls.zoom_to_data":"ampliar para dados","map_controlls.localize_user":"me localize!","map_controlls.localize_user_disabled":"desativado porque o overpass turbo não foi carregado via https://","map_controlls.select_bbox":"selecionar bbox manualmente","map_controlls.select_bbox_disabled":"desabilitado porque a consulta atual não requer um bbox","map_controlls.toggle_wide_map":"mudar para mapa amplo","map_controlls.toggle_data":"ativar/desativar camada de dados","map_controlls.suggest_zoom_to_data":"clique aqui para exibir os dados","settings.title":"Configurações","settings.section.general":"Configurações gerais","settings.ui_lang":"Idioma da interface","settings.server":"Servidor","settings.disable_autorepair":"Desabilitar mensagem de aviso/autoreparo quando a API do Overpass não retornar dados visíveis. ","settings.section.editor":"Editor","settings.enable_rich_editor":"Habilitar editor de código enriquecido","settings.enable_rich_editor_expl":"desabilitar isto em dispositivos móveis; é necessário recarregar a página","settings.editor_width":"Largura de editor","settings.editor_width_expl":'ex. "400px", deixar em branco para padrão',"settings.section.map":"Mapa","settings.tile_server":"Servidor de blocos","settings.tile_opacity":"Opacidade dos blocos","settings.tile_opacity_expl":"transparência dos blocos de fundo: 0=transparente ... 1=visível","settings.show_crosshairs":"Mostra mira no centro do mapa.","settings.disable_poiomatic":"Não mostre pequenos recursos como POIs.","settings.show_data_stats":"Mostrar algumas estatísticas sobre dados carregados e exibidos.","settings.section.sharing":"Compartilhamento","settings.include_map_state":"Incluir o estado atual do mapa nos links compartilhados","settings.compression":"Compressão","settings.section.export":"Exportar","settings.export_image_scale":"Mostrar escala em imagens exportadas.","settings.export_image_attr":"Mostrar atribuição em imagens exportadas.","save.title":"Salvar","save.enter_name":"Insira um nome para a consulta","load.title":"Carregar","load.delete_query":"delete esta consulta","load.saved_queries-local":"Salvar consultas (local)","load.saved_queries-osm":"Salvar consultas (osm.org)","load.saved_queries-osm-loading":"Carregando consultas salvas do osm.org ...","load.saved_queries-osm-error":"Ocorreu um erro ao carregar as consultas salvas de osm.org :(","load.examples":"Exemplos","load.no_saved_query":"consulta ainda não foi salva","export.title":"Exportar","export.download-error":"Exportar - Erro","export.copy_to_clipboard":"Copie este texto para a área de transferência","export.copy_to_clipboard_success":"Exportar - Copiado com sucesso para a área de transferência","export.copy_to_clipboard_success-message":'<span class="export-copy_to_clipboard-content"></span> foi copiado com sucesso para a área de transferência.',"export.section.map":"Mapa","export.as_png":'como <a id="export-image" href="">imagem png </a>',"export.as_interactive_map":'como <a id="export-interactive-map" href="">mapa interativo</a>',"export.current_map_view":'<a id="export-map-state" href="">vista do mapa</a> atual',"export.map_view_expl":"bbox, centro, etc.","export.section.data":"Dados","export.generic_download_copy":'<div class="field-label is-normal"><span class="format"></span></div><div class="field-body"><span class="buttons has-addons"><a class="export button is-small is-link is-outlined" title="salva os dados exportados como um arquivo">baixar</a><a class="copy button is-small is-link is-outlined" title="copia a saída de exportação para a área de transferência">copiar</a></span></div>',"export.raw_data":"dados OSM brutos","export.raw_interpreter":'dados brutos diretamente de <a id="export-overpass-api" href="" target="_blank" class="external">API do Overpass</a>',"export.save_geoJSON_gist":'salvar dados GeoJSON para um <a id="export-geoJSON-gist" href="" class="external">gist</a>',"export.section.query":"Consulta","export.format_text":'<abbr title="Para uso direto com a API do Overpass, possui atalhos expandidos e não inclui recursos adicionais de turbo do Overpass, como o MapCSS.">consulta autônoma</abbr>',"export.format_text_raw":'<abbr title="Consulta de overpass turbo inalterada - exatamente como no editor de código">consulta bruta</abbr>',"export.format_text_wiki":'<abbr title="Para uso no wiki do OSM como um OverpassTurboExample-Template">osm wiki</abbr>',"export.format_text_umap":'URL de dados remoto <abbr title="Para uso no umap.openstreetmap.fr">uMap</abbr>',"export.to_xml":'converter para <a id="export-convert-xml" href="" target="_blank" class="external">XML-Overpass</a>',"export.to_ql":'converter para <a id="export-convert-ql" href="" target="_blank" class="external">OverpassQL</a> (<a id="export-convert-compact" href="" target="_blank" class="external">compactado</a>) ',"export.editors":"carregar dados em um editor do OSM:","export.geoJSON.title":"Exportar - GeoJSON","export.geoJSON.expl":"Os dados exibidos atualmente como GeoJSON:","export.geoJSON.no_data":"Dados GeoJSON não disponíveis! Executar consulta antes.","export.geoJSON_gist.title":"Salvar como um gist","export.geoJSON_gist.gist":"Gist:","export.geoJSON_gist.geojsonio":"Editar com geojson.io:","export.geoJSON_gist.geojsonio_link":"geojson.io","export.GPX.title":"Exportar - GPX","export.GPX.expl":"Dados atuais exibidos como GPX:","export.GPX.no_data":"Nenhum arquivo GPX disponível! Por favor execute a consulta primeiro.","export.KML.title":"Exportar - KML","export.KML.expl":"Dados atuais exibidos como KML:","export.KML.no_data":"Dados KML não disponívels! Execute consulta antes.","export.raw.title":"Exportar - raw","export.raw.no_data":"Não há dados brutos! Por favor, rode a consulta primeiro.","export.map_view.title":"Visão atual do mapa","export.map_view.permalink":"Link permanente","export.map_view.permalink_osm":"para osm.org","export.map_view.center":"Centralizar","export.map_view.center_expl":"lat, lon","export.map_view.bounds":"Fronteira","export.map_view.bounds_selection":"Limites (selecionar bbox manualmente)","export.map_view.bounds_expl":"sul, oeste, norte, leste","export.map_view.zoom":"Zoom","export.image.title":"Exportar - Imagem","export.image.alt":"o mapa exportado","export.image.download":"Baixar","export.image.attribution_missing":"Certifique-se de incluir adequadamente atribuições ao distribuir estas imagens!","share.title":"Compartilhar","share.header":"Link permanente","share.copy_this_link":'Copie este <a href="" id="share_link_a">link</a> para compartilhar o código a seguir: ',"share.options":"Opiniões ","share.incl_map_state":"incluir o estado atual do mapa","share.run_immediately":"executar esta consulta imediatamente após carregar","help.title":"Ajuda","help.section.introduction":"Introduction","help.intro.0":'Este é o <i>overpass turbo</i>, uma ferramenta web para filtrar dados do <a href="http://www.openstreetmap.org">OpenStreetMap</a>.',"help.intro.1":'Com o overpass turbo é possível executar consultas à <a href="http://wiki.openstreetmap.org/wiki/Overpass_API">API do Overpass</a> e analisar os resultados de maneira interativamente no mapa.',"help.intro.1b":'Essa é uma integração <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard">Wizard</a> que cria consultas facilmente.',"help.intro.2":'Mais informações sobre o <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo">overpass turbo</a> e como escrever <a href="http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">consultas Overpass</a> pode ser encontrado no OSM wiki.',"help.section.queries":"Consultas Overpass","help.queries.expl":'API do Overpass permite consultar dados OSM por seus próprios critérios de pesquisa. Para isso, possui uma estrutura e <a href="http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">linguagem de consulta</a> específica.',"help.intro.shortcuts":"Além de consultas regulares da API do Overpass, pode-se usar os seguintes atalhos úteis no overpass turbo:","help.intro.shortcuts.bbox":"coordenadas da caixa de visualização do mapa atual","help.intro.shortcuts.center":"coordenadas do centro do mapa","help.intro.shortcuts.date":"ISO 8601 date-time-string de um determinado intervalo temporal retroativo (e.g. “24 hours”)","help.intro.shortcuts.style":'definir uma <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/MapCSS">folha de estilos MapCSS</a>',"help.intro.shortcuts.custom":"Atalhos arbitrários podem ser definidos inserindo <i>{{shortcut=value}}</i> em algum local do código.","help.intro.shortcuts.more":'Mais atalhos de overpass-turbo, informações adicionais sobre os exemplos acima e de uso podem ser encontrados no <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/Extended_Overpass_Queries">OSM wiki</a>',"help.section.ide":"IDE","help.ide.share.title":"Compartilhando","help.ide.share.expl":"É possível enviar para alguém um link permanente para uma consulta que você está trabalhando. Para tanto, use a ferramenta <i>Compartilhar</i>, que exibe um link para enviar para um amigo ou postar na rede. (Terceiros irão trabalhar em uma cópia própria da consulta.)","help.ide.save_load.title":"Carregar e salvar","help.ide.save_load.expl":"Você também pode salver e carregar suas consultas. ","help.ide.keyboard.title":"Atalhos do teclado:","help.ide.keyboard.run":"Execute a consulta atual.","help.ide.keyboard.wizard":"Iniciar o assistente de criação de consultas","help.ide.keyboard.load_save":"Carregar (abrir) / salvar uma consulta","help.ide.keyboard.help":"Abrir este diálogo de ajuda.","help.section.key":"Legenda do mapa","help.key.example":"diversos recursos do mapa","help.key.description":"Os caminhos são mostrados como linhas azuis em negrito, Polígonos como áreas amarelas com um contorno azul fino, POIs (nós com marcas) como círculos amarelos com um contorno azul fino. Círculos com preenchimento vermelho representam polígonos ou formas muito pequenas para serem exibidas normalmente. Linhas ou contornos rosa significam que um objeto faz parte de pelo menos uma relação (carregada). As linhas tracejadas significam que uma via ou polígono tem geometria incompleta (provavelmente porque alguns de seus nós não foram carregados).","help.section.export":"Exportar","help.export":'A ferramenta <i>Exportar</i> possui uma série de opções de ação com a consulta e/ou com os dados carregados pela consulta.<br />Opções com o símbolo:<span class="ui-icon ui-icon-extlink" style="display:inline-block;"></span> referem-se a ferramentas online externas.',"help.export.query_data.title":"Consulta / dados","help.export.query_data.expl":"Isso contém algumas coisas que você pode fazer com a consulta ou dados brutos, como converter a consulta entre as várias linguagens de consulta ou exportar os dados como geoJSON. Uma opção muito útil é a possibilidade de enviar a consulta ao JOSM.","help.export.map.title":"Mapa","help.export.map.expl":"Converta a visualização do mapa com dados atual em uma imagem PNG estática ou em um mapa interativo (tela inteira) etc.","help.section.about":"Sobre","help.about.maintained":"<i>overpass turbo</i> é mantido por Martin Reifer (tyr.asd arroba gmail.com).","help.about.feedback.title":"Feedback, relatórios de erros e pedidos de funcionalidades","help.about.feedback":'Se você gostaria de dar feedback, relatar problemas ou solicitar um recurso específico, use o <a href="https://github.com/tyrasd/overpass-turbo/issues">rastreador de problemas </a> no GitHub ou a <a href="http://wiki.openstreetmap.org/wiki/Talk:Overpass_turbo">página de discussão</a>no wiki OSM.',"help.about.source.title":"Código-fonte","help.about.source":'O <a href="https://github.com/tyrasd/overpass-turbo">código fonte</a> desta aplicação foi lançado sobre a <a href="LICENSE">licença</a> MIT.',"help.section.attribution":"Atribuição","help.attr.data_sources":"Fontes de dados","help.attr.data":'Dados &copy; contribuidores do <a href="http://openstreetmap.org/">OpenStreetMap</a>, <span style="font-size:smaller;"><a href="http://opendatacommons.org/licenses/odbl/1-0/">ODbL</a> (<a href="http://www.openstreetmap.org/copyright">Termos</a>)</span>',"help.attr.mining":"Dados produzidos por","help.attr.tiles":'Blocos de mapa &copy; contribuidores do <a href="http://openstreetmap.org/">OpenStreetMap</a>',"help.attr.search":"Busca oferecida por","help.attr.software":"Software e bibliotecas","help.attr.leaflet":"Mapa desenvolvido por","help.attr.codemirror":"Editor desenvolvido por","help.attr.other_libs":"Outras bibliotecas:","ffs.title":"Assistente de criação de consultas","ffs.comments":"adicionar comentários de consulta","ffs.placeholder":"pesquisar","ffs.expl":'O <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">assistente de criação de consultas</a> o auxilia na criação de consultas no Overpass. Veja alguns exemplos de uso:',"ffs.parse_error":"Desculpe, esta consulta não foi entendida.","ffs.parse_error_expl":'Note que você precisa utilizar aspas duplas ao adicionar palavras/frases que possuem espaços ou caracteres especiais, e múltiplos critérios de busca devem ser separados por operadores booleanos apropriados (<i>and</i> ou <i>or</i>). Leia a <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">documentação</a> (em inglês) para mais informações.',"ffs.typo":"Você quis dizer:","dialog.dismiss":"descartar","dialog.cancel":"cancelar","dialog.save":"salvar","dialog.save-local":"salvar (local)","dialog.save-osm":"salvar em osm.org","dialog.delete":"apagar","dialog.close":"fechar","dialog.done":"feito","dialog.abort":"abortar","dialog.reset":"redefinir","dialog.repair_query":"reparar consulta","dialog.continue_anyway":"continuar assim mesmo","dialog.show_data":"mostrar dados","dialog.wizard_build":"construir consulta","dialog.wizard_run":"construir e executar consulta","dialog.delete_query.title":"Apagar consulta?","dialog.delete_query.expl":"Você tem certeza que deseja excluir a consulta a seguir","dialog.delete_query.expl-osm":"Tem certeza de que deseja excluir a seguinte consulta sincronizada","error.query.title":"Erro de consulta","error.query.expl":"Ocorreu um erro durante a execução da consulta overpass! Isto é o que a API do Overpass retornou:","error.ajax.title":"Erro Ajax","error.ajax.expl":"Ocorreu um erro durante a execução da consulta overpass!","error.mapcss.title":"Erro no MapCSS","error.mapcss.expl":"A folha de estilos MapCSS é inválida:","error.remote.title":"Erro do controle remoto","error.remote.incompat":"Erro: versão incompatível do controle remoto do JOSM","error.remote.not_found":"Controle remoto não encontrado. :( Verivique se o JOSM está rodando e configurado apropriadamente.","error.nominatim.title":"Erro no Nominatim","error.nominatim.expl":"Não pode encontrar nada com o seguinte nome:","warning.browser.title":"O seu navegador não é suportado :(","warning.browser.expl.1":'O navegador que você está usando no momento (provavelmente) não é capaz de executar (partes significativas) deste aplicativo. <small>Deve suportar <a href="http://en.wikipedia.org/wiki/Web_storage#localStorage">Web Storage API</a> e <a href="http://en.wikipedia.org/wiki/Cross-origin_resource_sharing">compartilhamento de recursos de origem cruzada (CORS)</a>.</small>',"warning.browser.expl.2":'Observe que pode ser necessário habilitar cookies e/ou "Dados locais" para este site em alguns navegadores (como Firefox e Chrome).',"warning.browser.expl.3":'Atualize seu navegador ou utilize um melhor! Versões recentes do <a href="http://www.opera.com">Opera</a>, <a href="http://www.google.com/intl/de/chrome/browser/">Chrome</a> e <a href="http://www.mozilla.org/de/firefox/">Firefox</a> foram testadas no overpass. Como alternativa, você pode continuar a utilizar o <a href="http://overpass-api.de/query_form.html">formulario de consulta Overpass_API</a>.',"warning.incomplete.title":"Dados incompletos","warning.incomplete.expl.1":"A consulta não retornou nenhum ponto. No OSM, somente pontos possuem coordenadas. Por exemplo, uma linha não pode ser exibida sem os seus pontos.","warning.incomplete.expl.2":'Se não é isso que você pretende obter, <i>overpass turbo</i> pode ajudá-lo a reparar (preencher automaticamente) a consulta, escolhendo "reparar consulta" abaixo. Caso contrário, você pode continuar com os dados.',"warning.incomplete.not_again":"não mostre essa menssagem novamente","warning.incomplete.remote.expl.1":"Parece que essa consulta não retornará dados do OSM em formato XML com metadados. Editores como JOSM requerem que os dados estejam nesse formato.","warning.incomplete.remote.expl.2":'<i>overpass turbo</i> pode ajudar você a consertar a consultar selecionando "reparar consulta" abaixo.',"warning.share.long":"Aviso: este link de compartilhamento é bastante longo. Pode não funcionar em certas circunstâncias","warning.share.very_long":"Aviso: este link de compartilhamento é muito longo. É provável que falhe em circunstâncias normais (navegadores, servidores da web). Use com cautela!","warning.huge_data.title":"Grande quantidade de dados","warning.huge_data.expl.1":"Esta consulta retornou uma grande quantidade de dados (aproximadamente {{amount_txt}}).","warning.huge_data.expl.2":"Seu navegador pode levar muito tempo tentando exibir isso. Você deseja realmente continuar?","waiter.processing_query":"processando consulta...","waiter.export_as_image":"exportar como imagem...","data_stats.loaded":"Carregado","data_stats.displayed":"Exibido","data_stats.nodes":"nós","data_stats.ways":"caminhos","data_stats.relations":"relações","data_stats.areas":"áreas","data_stats.pois":"pois","data_stats.lines":"linhas","data_stats.polygons":"poligonos","data_stats.request_duration":"A solicitação overpass levou","data_stats.lag":"Atualidade dos dados","data_stats.lag_areas":"Atualidade das áreas","data_stats.lag.expl":"por trás do banco de dados OSM principal","popup.tags":"Tags","popup.metadata":"Metadados","popup.coordinates":"Coordenadas","popup.node":"Nó","popup.nodes":"Nós","popup.way":"Caminho","popup.ways":"Caminhos","popup.relation":"Relação","popup.relations":"Relações","popup.incomplete_geometry":"Atenção: geometria incompleta (por exemplo, faltam alguns nós)","map.intentionally_blank":"Este mapa está intencionalmente em branco."};export{a as default};
//# sourceMappingURL=pt_BR-GmEzFbha.js.map
