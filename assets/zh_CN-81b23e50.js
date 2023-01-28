const e={"nav.run":"运行","nav.run_tt":"使用Overpass API执行查询","nav.rerender_tt":"解析MapCSS并渲染地图","nav.share":"分享","nav.share_tt":"获得这次查询的固定链接","nav.export":"导出","nav.export_tt":"多种导出工具","nav.save":"保存","nav.save_tt":"保存这次查询","nav.load":"加载","nav.load_tt":"加载已保存的查询或样例","nav.wizard":"助手精灵","nav.wizard_tt":"查询构建器","nav.settings":"设置","nav.settings_tt":"多种可设置项","nav.help":"帮助","nav.help_tt":"帮助、关于我们与署名","nav.logout":"登出","nav.logout_tt":"从目前同步的OSM账号登出","tabs.map":"地图","tabs.map_tt":"地图视图","tabs.data":"数据","tabs.data_tt":"数据视图","map_controlls.zoom_to_data":"缩放到数据","map_controlls.localize_user":"定位我的位置","map_controlls.localize_user_disabled":"因为没有使用https://载入Overpass Turbo而终止","map_controlls.select_bbox":"手动选择bbox","map_controlls.select_bbox_disabled":"因当前查询不需要bbox而终止","map_controlls.toggle_wide_map":"启动宽地图查询模式","map_controlls.toggle_data":"启动数据叠层视图","map_controlls.suggest_zoom_to_data":"点击这里以展示数据","settings.title":"设置","settings.section.general":"通用设置","settings.ui_lang":"界面语言","settings.server":"服务器","settings.disable_autorepair":"当Overpass API没有传回可展示的数据时关闭警告或自动修正信息","settings.section.editor":"编辑器","settings.enable_rich_editor":"启动编辑器代码高亮","settings.enable_rich_editor_expl":"在移动设备上关闭它。需要重新载入页面方可生效","settings.editor_width":"编辑器宽度","settings.editor_width_expl":"例如：“400px”，默认为空","settings.section.map":"地图","settings.tile_server":"瓦片服务器","settings.tile_opacity":"瓦片透明度","settings.tile_opacity_expl":"背景瓦片透明度：0为完全透明，1为完全可见","settings.show_crosshairs":"在地图中央显示交叉十字","settings.disable_poiomatic":"不要以POI展示过小要素","settings.show_data_stats":"展示已载入和已屏显的数据统计","settings.section.sharing":"分享","settings.include_map_state":"在分享链接中保存当前地图状态","settings.compression":"短网址","settings.section.export":"导出","settings.export_image_scale":"在导出的图片中显示比例","settings.export_image_attr":"在导出的图片中显示署名","save.title":"保存","save.enter_name":"为查询命名","load.title":"加载","load.delete_query":"删除这次查询","load.saved_queries-local":"已保存的查询（本地）","load.saved_queries-osm":"已保存的查询（OSM官网）","load.saved_queries-osm-loading":"从OSM官网载入已保存的查询","load.saved_queries-osm-error":"从OSM官网载入已保存的查询时发生错误","load.examples":"样例","load.no_saved_query":"目前暂无已保存的查询","export.title":"导出","export.download-error":"导出 - 错误","export.copy_to_clipboard":"复制这段文本到剪贴板","export.copy_to_clipboard_success":"导出 - 成功复制到剪贴板","export.copy_to_clipboard_success-message":'<span class="export-copy_to_clipboard-content"></span> 已成功复制到剪贴板',"export.section.map":"地图","export.as_png":'导出为 <a id="export-image" href="">PNG图片</a>',"export.as_interactive_map":'导出为 <a id="export-interactive-map" href="">交互式地图</a>',"export.current_map_view":'当前 <a id="export-map-state" href="">地图视图</a>',"export.map_view_expl":"bbox，中心，等……","export.section.data":"数据","export.generic_download_copy":'<div class="field-label is-normal"><span class="format"></span></div><div class="field-body"><span class="buttons has-addons"><a class="export button is-small is-link is-outlined" title="saves the exported data as a file">下载</a><a class="copy button is-small is-link is-outlined" title="copies export output to clipboard">复制</a></span></div>',"export.raw_data":"原始OSM数据","export.raw_interpreter":'直接从<a id="export-overpass-api" href="" target="_blank" class="external">Overpass API</a>获取原始数据',"export.save_geoJSON_gist":'保存GeoJSON为<a id="export-geoJSON-gist" href="" class="external">Gist</a>',"export.section.query":"查询","export.format_text":`<abbr title="For direct use with the Overpass API, has expanded shortcuts and doesn't include additional overpass turbo features such as MapCSS.">独立查询</abbr>`,"export.format_text_raw":'<abbr title="Unaltered overpass turbo query – just as in the code editor">原始查询</abbr>',"export.format_text_wiki":'<abbr title="For usage in the OSM wiki as a OverpassTurboExample-Template">OSMWiki</abbr>',"export.format_text_umap":'<abbr title="For usage with umap.openstreetmap.fr">Umap</abbr>远端数据URL',"export.to_xml":'转换为<a id="export-convert-xml" href="" target="_blank" class="external">Overpass-XML</a>',"export.to_ql":'转换为（<a id="export-convert-compact" href="" target="_blank" class="external">压缩的</a>）<a id="export-convert-ql" href="" target="_blank" class="external">OverpassQL</a>',"export.editors":"在OSM编辑器中加载数据","export.geoJSON.title":"导出 - GeoJSON","export.geoJSON.expl":"目前显示的数据为GeoJSON格式","export.geoJSON.no_data":"无可用的GeoJSON数据！请先运行一次查询。","export.geoJSON_gist.title":"以Gist保存","export.geoJSON_gist.gist":"Gist","export.geoJSON_gist.geojsonio":"通过geojson.io编辑","export.geoJSON_gist.geojsonio_link":"geojson.io","export.GPX.title":"导出 - GPX","export.GPX.expl":"目前显示的数据为GPX格式","export.GPX.no_data":"无可用的GPX数据！请先运行一次查询。","export.KML.title":"导出 - KML","export.KML.expl":"目前显示的数据为KML格式","export.KML.no_data":"无可用的KML数据！请先运行一次查询。","export.raw.title":"导出 - 原始数据","export.raw.no_data":"无可用的原始数据！请先运行一次查询。","export.map_view.title":"当前地图视图","export.map_view.permalink":"固定链接","export.map_view.permalink_osm":"转到OSM官网","export.map_view.center":"中心","export.map_view.center_expl":"经度，纬度","export.map_view.bounds":"边界","export.map_view.bounds_selection":"边界（手动选择bbox）","export.map_view.bounds_expl":"南、西、北、东","export.map_view.zoom":"缩放","export.image.title":"导出 - 图片","export.image.alt":"导出的地图","export.image.download":"下载","export.image.attribution_missing":"请确认分发图片时已经包含适当的署名","share.title":"分享","share.header":"固定链接","share.copy_this_link":'复制这条<a href="" id="share_link_a">链接</a>以分享当前的源代码：',"share.options":"选项","share.incl_map_state":"包含当前地图状态","share.run_immediately":"载入后立即运行查询","help.title":"帮助","help.section.introduction":"介绍","help.intro.0":'这是<i>Overpass Turbo</i>，一个网页端<a href="http://www.openstreetmap.org">OpenStreetMap</a>数据筛选工具。',"help.intro.1":'通过Overpass Turbo你可以进行<a href="http://wiki.openstreetmap.org/wiki/Overpass_API">Overpass API</a> 查询并在地图上交互式的分析OSM数据的结果。',"help.intro.1b":'这里有一个可以帮你快速构建查询的<a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard">助手精灵</a>。',"help.intro.2":'更多关于<a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo">Overpass Turbo</a>以及如何编写<a href="http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">Overpass查询</a>的信息可以在OSMWiki上找到。',"help.section.queries":"Overpass查询","help.queries.expl":'Overpass API允许你通过自定义条件查询OSM数据，并为此设计了 <a href="http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">Overpass查询语言</a>。',"help.intro.shortcuts":"作为对标准Overpass API查询的补充，你在Overpass Turbo中还可以使用如下快捷键：","help.intro.shortcuts.bbox":"当前地图视图的边界坐标","help.intro.shortcuts.center":"地图中心坐标","help.intro.shortcuts.date":"按ISO 8601日期与时间格式的时间间隔（如“24 hours”）","help.intro.shortcuts.style":'定义<a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/MapCSS">MapCSS样式表</a>',"help.intro.shortcuts.custom":"在脚本中添加<i>{{shortcut=value}}</i>可自由指定快捷键。","help.intro.shortcuts.more":'更多Overpass快捷键，以及其他使用范例等信息可以在<a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/Extended_Overpass_Queries">OSMWiki</a>上找到。',"help.section.ide":"IDE","help.ide.share.title":"分享","help.ide.share.expl":"你可以将你现在正在进行的查询以固定连接的方式分享给其他人。使用<i>分享</i>工具，之后把显示出来的链接告诉别人或者发在网上。（注意，别人打开分享链接后需要自己完成查询工作）","help.ide.save_load.title":"保存并载入","help.ide.save_load.expl":"你也可以保存并载入你的查询。为了让你更好的开始，已经有写好的查询样例。可以简单看看来了解Overpass可以做到什么。","help.ide.keyboard.title":"键盘快捷键","help.ide.keyboard.run":"运行当前的查询","help.ide.keyboard.wizard":"打开助手精灵","help.ide.keyboard.load_save":"载入（打开）或保存查询","help.ide.keyboard.help":"打开这条帮助对话","help.section.key":"地图要素","help.key.example":"多种地图要素","help.key.description":"路径用蓝色粗线条表示，多边形用蓝色细线条表示并以黄色填充，POI（带标签的点）用蓝色细线条圈出并用黄色填充。红圈意味着太小而不能正常显示的多边形或路径。紫色线或边框表示它们至少是一个已加载的关系的部分。虚线则代表路径或多边形并不完整（多半是有些点尚未加载）。","help.section.export":"导出","help.export":'<i>导出</i>工具包含多种关于查询或查询数据处理的选项。 <br />带有这个符号的选项：<span class="ui-icon ui-icon-extlink" style="display:inline-block;"></span>则需要外部（或在线）工具的支持。',"help.export.query_data.title":"查询 / 数据","help.export.query_data.expl":"这里有一些你可以用原始查询或数据做的事情，例如将查询转换为其他多种查询语言或以GeoJSON的形式导出数据。其中一项非常方便的功能是可以直接将查询发送到JOSM。","help.export.map.title":"地图","help.export.map.expl":"将目前地图与数据的视图转化为一张静态PNG图片，或一个全屏的交互式地图。","help.section.about":"关于","help.about.maintained":"<i>Overpass Turbo</i>由Martin Raifer (tyr.asd at gmail.com)维护。","help.about.feedback.title":"反馈、报错、特性请求","help.about.feedback":'如果您想提供反馈、报错或者咨询一个具体的特性，请使用Github上的<a href="https://github.com/tyrasd/overpass-turbo/issues">Issue</a>或者在OSMWiki的<a href="http://wiki.openstreetmap.org/wiki/Talk:Overpass_turbo">讨论页</a>上交流。',"help.about.source.title":"源代码","help.about.source":'本程序的 <a href="https://github.com/tyrasd/overpass-turbo">源代码</a> 以<a href="LICENSE">MIT协议</a>授权。',"help.section.attribution":"署名","help.attr.data_sources":"数据来源","help.attr.data":'数据与版权；<a href="http://openstreetmap.org/">OpenStreetMap</a>贡献者，<span style="font-size:smaller;"><a href="http://opendatacommons.org/licenses/odbl/1-0/">ODbL</a>（<a href="http://www.openstreetmap.org/copyright">条款</a>）</span>',"help.attr.mining":"数据挖掘","help.attr.tiles":'地图瓦片与版权；<a href="http://openstreetmap.org/">OpenStreetMap</a>贡献者',"help.attr.search":"搜索引擎提供方","help.attr.software":"软件与库","help.attr.leaflet":"地图提供方","help.attr.codemirror":"编辑器提供方","help.attr.other_libs":"其他库","ffs.title":"查询助手","ffs.comments":"add query comments","ffs.placeholder":"搜索","ffs.expl":'这个<a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">助手精灵</a>可以帮助您生成Overpass查询，如下是一些使用样例：',"ffs.parse_error":"抱歉，我无法理解您的搜索意图","ffs.parse_error_expl":'需要注意的是当字符串包含空格或特殊符号时，你需要用引号将整体包装起来，并且搭配适当的布尔运算符（<i>and</i>或<i>or</i>）。阅读<a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">文档</a>以了解更多信息。',"ffs.typo":"您是否想问：","dialog.dismiss":"撤回","dialog.cancel":"取消","dialog.save":"保存","dialog.save-local":"保存（本地）","dialog.save-osm":"保存（OSM官网）","dialog.delete":"删除","dialog.close":"关闭","dialog.done":"完成","dialog.abort":"中断","dialog.reset":"重置","dialog.repair_query":"修正查询","dialog.continue_anyway":"无条件继续","dialog.show_data":"展示数据","dialog.wizard_build":"构建查询","dialog.wizard_run":"构建并运行查询","dialog.delete_query.title":"是否删除查询","dialog.delete_query.expl":"您真的想要删除如下查询吗？","dialog.delete_query.expl-osm":"您真的想要删除如下已同步的查询吗？","error.query.title":"查询错误","error.query.expl":"在执行Overpass查询时出错！这是Overpass API的返回内容：","error.ajax.title":"Ajax错误","error.ajax.expl":"在执行Overpass查询时出错！","error.mapcss.title":"MapCSS错误","error.mapcss.expl":"无效的MapCSS样式表","error.remote.title":"远程控制错误","error.remote.incompat":"错误：不受支持的JOSM远程控制版本","error.remote.not_found":"未找到有效的远程控制，请确认JOSM已正确配置且远程控制正在运行。","error.nominatim.title":"Nominatim错误","error.nominatim.expl":"根据这个名称无法找到任何要素：","warning.browser.title":"您的浏览器不受支持","warning.browser.expl.1":'您正使用的浏览器很可能无法运行Overpass Turbo的大部分功能。<small>浏览器必须支持<a href="http://en.wikipedia.org/wiki/Web_storage#localStorage">Web Storage API</a>与<a href="http://en.wikipedia.org/wiki/Cross-origin_resource_sharing">跨域资源共享（CORS）</a>。</small>',"warning.browser.expl.2":"需要注意的是你需要开启Cookies，在如Firefox或Chrome的几款浏览器上可能还需允许本站使用“本地数据”。","warning.browser.expl.3":'请更新你的浏览器或者选择一款更现代的替代品！<a href="http://www.opera.com">Opera</a>、<a href="http://www.google.com/intl/de/chrome/browser/">Chrome</a>或<a href="http://www.mozilla.org/de/firefox/">Firefox</a>已被测试过并能良好运行。当然您也可以选择改用<a href="http://overpass-api.de/query_form.html">Overpass API查询</a>模式。',"warning.incomplete.title":"不完整的数据","warning.incomplete.expl.1":"这次查询未返回任何点。在OSM，只有点才包含坐标信息。举个例子，您无法在没有点的情况下显示一条路径。","warning.incomplete.expl.2":"如果这不是你要的结果，<i>Overpass Turbo</i>可以通过点击下方的“修复查询”按钮帮你自动修正查询。当然你也可以直接使用数据。","warning.incomplete.not_again":"不要再提示这条消息了","warning.incomplete.remote.expl.1":"看上去这次查询并没有以XML格式返回任何带元数据的OSM数据。但JOSM之类的编辑器需要这种格式的数据。","warning.incomplete.remote.expl.2":"点击“修复查询”按钮，<i>Overpass Turbo</i>可以帮你自动修正你的查询。","warning.share.long":"注意：分享链接有点长，在某些场景下可能无法正常工作。","warning.share.very_long":"注意：分享链接非常昌，一般浏览器或网站下很可能无法正常使用，请特别注意！","warning.huge_data.title":"大量数据","warning.huge_data.expl.1":"这次查询返回的数据非常大（估计有 {{amount_txt}}）。","warning.huge_data.expl.2":"您的浏览器要渲染他们可能会有暂时卡顿，您确定要继续吗？","waiter.processing_query":"查询处理中……","waiter.export_as_image":"图片导出中……","data_stats.loaded":"已加载","data_stats.displayed":"已屏显","data_stats.nodes":"点","data_stats.ways":"路径","data_stats.relations":"关系","data_stats.areas":"区域","data_stats.pois":"POI","data_stats.lines":"线","data_stats.polygons":"多边形","data_stats.request_duration":"创建Overpass请求","data_stats.lag":"资料即时性","data_stats.lag_areas":"区域即时性","data_stats.lag.expl":"位于OSM数据库之后","map.intentionally_blank":"地图的确是空的"};export{e as default};
