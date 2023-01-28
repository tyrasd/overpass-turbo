const e={"nav.run":"Старт","nav.run_tt":"виконати цей запит в Overpass API","nav.rerender_tt":"опрацювати MapCSS та показати  дані на мапі","nav.share":"Поділитися","nav.share_tt":"отримати постійне посилання на цей запит","nav.export":"Експорт","nav.export_tt":"різні інструменти експорту","nav.save":"Зберегти","nav.save_tt":"зберегти запит","nav.load":"Завантажити","nav.load_tt":"відкрити збережений запит або приклад","nav.wizard":"Помічник","nav.wizard_tt":"конструктор запитів","nav.settings":"Налаштування","nav.settings_tt":"різноманітні налаштування","nav.help":"Довідка","nav.help_tt":"довідка, автори і про програму","nav.logout":"Вийти","nav.logout_tt":"від'єднатись від обліковки OSM","tabs.map":"Мапа","tabs.map_tt":"вид мапи","tabs.data":"Дані","tabs.data_tt":"дані","map_controlls.zoom_to_data":"перейти до даних","map_controlls.localize_user":"знайди мене!","map_controlls.localize_user_disabled":"вимкнено, бо overpass turbo не був завантажений через https://","map_controlls.select_bbox":"вибрати прямокутник вручну","map_controlls.select_bbox_disabled":"вимкнено, оскільки поточний запит не потребує BBOX","map_controlls.toggle_wide_map":"мапа на всю ширину","map_controlls.toggle_data":"показати/сховати шар даних","map_controlls.suggest_zoom_to_data":"натисніть сюди для перегляду даних","settings.title":"Налаштування","settings.section.general":"Загальні налаштування","settings.ui_lang":"Мова інтерфейсу","settings.server":"Сервер","settings.disable_autorepair":"Вимкнути попередження, повідомлення про автоматичне виправлення коду, якщо Overpass API повертає дані, які неможливо візуалізувати.","settings.section.editor":"Редактор","settings.enable_rich_editor":"Розширений редактор коду","settings.enable_rich_editor_expl":"вимикати на мобільних пристроях;  вимагає перезавантаження сторінки","settings.editor_width":"Ширина вікна редактора","settings.editor_width_expl":'наприклад, "400px", або нічого для використання типових налаштувань',"settings.section.map":"Мапа","settings.tile_server":" Сервер тайлів ","settings.tile_opacity":"Прозорість тайлів","settings.tile_opacity_expl":"коефіцієнт прозорості фонових тайлів: 0 - прозорі … 1 - непрозорі","settings.show_crosshairs":"Показувати хрестик в центрі мапи.","settings.disable_poiomatic":"Не показувати невеликі об'єкти як точки інтересу (POI).","settings.show_data_stats":"Показувати інформацію про завантажені та дані на екрані.","settings.section.sharing":"Поширення","settings.include_map_state":"Включити стан мапи в посилання","settings.compression":"Стиснення","settings.section.export":"Експорт","settings.export_image_scale":"Масштабна лінійка на експортованих зображеннях.","settings.export_image_attr":"Зазначення авторства на експортованих зображеннях.","save.title":"Зберегти","save.enter_name":"Введіть назву для цього запиту","load.title":"Завантажити","load.delete_query":"вилучити цей запит","load.saved_queries-local":"Збережені запити (локальні)","load.saved_queries-osm":"Збережені запити  (osm.org)","load.saved_queries-osm-loading":"Завантаження збережених запитів з osm.org…","load.saved_queries-osm-error":"Під час завантаження збережених запитів з osm.org виникла помилка :(","load.examples":"Приклади","load.no_saved_query":"немає збережених запитів","export.title":"Експорт","export.download-error":"Експорт - помилка","export.copy_to_clipboard":"Копіювати цей текст в буфер обміну","export.copy_to_clipboard_success":"Експорт - скопійовано у буфер обміну","export.copy_to_clipboard_success-message":'<span class="export-copy_to_clipboard-content"></span> скопійовано до буфера обміну',"export.section.map":"Мапа","export.as_png":' як <a id="export-image" href="">png-зображення</a> ',"export.as_interactive_map":' як <a id="export-interactive-map" href="">інтерактивну мапу</a> ',"export.current_map_view":' поточний <a id="export-map-state" href="">вид мапи</a> ',"export.map_view_expl":"область, центр і т.п.","export.section.data":"Дані","export.generic_download_copy":'<div class="field-label is-normal"><span class="format"></span></div><div class="field-body"><span class="buttons has-addons"><a class="export button is-small is-link is-outlined" title="saves the exported data as a file">завантажити</a><a class="copy button is-small is-link is-outlined" title="copies export output to clipboard">копіювати</a></span></div>',"export.raw_data":"сирцеві дані OSM","export.raw_interpreter":'сирцеві дані з <a id="export-overpass-api" href="" target="_blank" class="external">Overpass API</a> ',"export.save_geoJSON_gist":' зберегти GeoJSON у <a id="export-geoJSON-gist" href="" class="external">gist</a> ',"export.section.query":"Запит","export.format_text":`<abbr title="For direct use with the Overpass API, has expanded shortcuts and doesn't include additional overpass turbo features such as MapCSS.">самостійний запит</abbr>`,"export.format_text_raw":'<abbr title="Unaltered overpass turbo query – just as in the code editor">сирці запиту</abbr>',"export.format_text_wiki":'<abbr title="For usage in the OSM wiki as a OverpassTurboExample-Template">вікі osm</abbr>',"export.format_text_umap":'url для <abbr title="For usage with umap.openstreetmap.fr">umap ',"export.to_xml":' перетворити в <a id="export-convert-xml" href="" target="_blank" class="external">Overpass-XML</a> ',"export.to_ql":' перетворити в (<a id="export-convert-compact" href="" target="_blank" class="external">компактний</a>) <a id="export-convert-ql" href="" target="_blank" class="external">OverpassQL</a> ',"export.editors":"завантажити дані в OSM-редактор: ","export.geoJSON.title":" Экспорт — GeoJSON ","export.geoJSON.expl":"Поточні завантажені дані у форматі GeoJSON: ","export.geoJSON.no_data":"Дані в форматі GeoJSON недоступні! Спочатку виконайте запит.","export.geoJSON_gist.title":"Збережено в gist","export.geoJSON_gist.gist":"Gist: ","export.geoJSON_gist.geojsonio":"Відкрити в geojson.io: ","export.geoJSON_gist.geojsonio_link":" geojson.io ","export.GPX.title":"Експорт — GPX","export.GPX.expl":"Поточні завантажені дані у форматі GPX: ","export.GPX.no_data":"Дані в форматі GPX недоступні! Спочатку виконайте запит.","export.KML.title":"Експорт — KML","export.KML.expl":"Поточні завантажені дані у форматі KML:","export.KML.no_data":"Дані в форматі KML недоступні! Спочатку виконайте запит.","export.raw.title":"Експорт — сирцеві дані OSM","export.raw.no_data":"Дані в форматі OSM XML недоступні! Спочатку виконайте запит.","export.map_view.title":"Поточний вид мапи","export.map_view.permalink":"Посилання","export.map_view.permalink_osm":"на osm.org","export.map_view.center":"Центр","export.map_view.center_expl":"широта, довгота","export.map_view.bounds":"Межі","export.map_view.bounds_selection":"Межі (вибрати область вручну)","export.map_view.bounds_expl":"південь, захід, північ, схід","export.map_view.zoom":"Масштаб","export.image.title":"Експорт — зображення","export.image.alt":"отримана мапа","export.image.download":"Звантажити","export.image.attribution_missing":"Обов'язково зазначте джерело походження тайлів та даних при поширенні цього зображення!","share.title":"Поділитися","share.header":"Посилання","share.copy_this_link":' Скопіюйте <a href="" id="share_link_a">це посилання</a>, щоб поділитися кодом: ',"share.options":"Параметри","share.incl_map_state":"додати положення поточної мапи","share.run_immediately":"виконати запит одразу після завантаження","help.title":"Довідка","help.section.introduction":"Вступ","help.intro.0":'Це <i>overpass turbo</i> — вебінструмент отримання даних <a href="http://www.openstreetmap.org">OpenStreetMap</a> за потрібними критеріями.',"help.intro.1":'З overpass turbo Ви можете надсилати запити до <a href="http://wiki.openstreetmap.org/wiki/Overpass_API">Overpass API</a> та аналізувати дані OSM, отримані у відповідь, на мапі.',"help.intro.1b":'Доступний вбудований <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard">Помічник</a>, який значно полегшує складання запитів.',"help.intro.2":'Докладніше про <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo">overpass turbo</a> та про складання <a href="http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">запитів Overpass</a> йдеться у Вікі OSM.',"help.section.queries":"Запити Overpass","help.queries.expl":'Overpass API дозволяє отримувати дані OSM відповідно до ваших власних потреб.  Для цих цілей існує спеціальна <a href="http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL">мова запитів</a>.',"help.intro.shortcuts":"На доданок до звичайних запитів Overpass API можна використовувати такі зручні скорочення в overpass turbo: ","help.intro.shortcuts.bbox":"координати поточної видимої ділянки мапи","help.intro.shortcuts.center":"координати центру мапи","help.intro.shortcuts.date":'час у форматі ISO 8601, дозволяє обчислювати також проміжки часу між двома значеннями (наприклад, "24 години")',"help.intro.shortcuts.style":'для використання  <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/MapCSS">MapCSS-стилів</a>',"help.intro.shortcuts.custom":"Довільні скорочення можна додавати, помістивши  <i>{{shortcut=value}}</i> будь-де у тексті запиту.","help.intro.shortcuts.more":'Додаткові скорочення OverPass-Turbo, інші подробиці про зазначене вище та приклади використання можна знайти у <a href="http://wiki.openstreetmap.org/wiki/Overpass_turbo/Extended_Overpass_Queries">Вікі OSM</a>.',"help.section.ide":"IDE","help.ide.share.title":"Поширення","help.ide.share.expl":"Ви можете поділитись вашим запитом будь з ким. В меню <i>Поділитися</i> ви знайдете посилання, яке можна надіслати другу або опублікувати в мережі. Зауважимо, що вони будуть працювати з власними копіями запиту.","help.ide.save_load.title":"Збереження та завантаження","help.ide.save_load.expl":"Ви можете зберігати та завантажувати запити. Для початку, ми завантажили кілька демонстраційних запитів. Ознайомтесь з ними, щоб зрозуміти можливості overpass.","help.ide.keyboard.title":"Клавіатурні скорочення: ","help.ide.keyboard.run":"Виконати поточний запит.","help.ide.keyboard.wizard":"Виклик Помічника складання запитів.","help.ide.keyboard.load_save":"Завантажити (відкрити) або зберегти запит.","help.ide.keyboard.help":"Відкрити довідку.","help.section.key":"Легенда","help.key.example":"різні об’єкти мапи","help.key.description":"Лінії (ways) показуються жирними синіми лініями, полігони — жовтими областями з тонкою синьою облямівкою, точки інтересу (точки з теґами, POI) — жовтими колами з синьою облямівкою. Червоні круги позначають полігони або лінії, занадто малі для нормального показу. Рожеві лінії або контури позначають об'єкти-члени завантажених зв'язків. Пунктирні лінії свідчать про неповну геометрію: швидше за все, були завантажені не всі точки об'єкта.","help.section.export":"Експорт","help.export":'Інструменти <i>експорту</i> містять безліч варіантів того, що можна зробити із запитом чи отриманими за ним даними.<br />Пункти, позначені символом <span class="ui-icon ui-icon-extlink" style="display:inline-block;"></span>, відкривають зовнішні онлайн-інструменти.',"help.export.query_data.title":"Запит / дані","help.export.query_data.expl":"Тут перераховані варіанти того, що можна зробити із запитом або отриманими даними, наприклад, перетворення між мовами запиту, або експорт даних в GeoJSON.  Дуже корисна можливість надіслати результат запиту в JOSM.","help.export.map.title":"Мапа","help.export.map.expl":"Перетворити поточний вид мапи з даними в растрове зображення, (повноекранну) інтерактивну мапу й таке інше.","help.section.about":"Про застосунок","help.about.maintained":"<i>overpass turbo</i> підтримується Мартіном Райфером (tyr.asd на gmail.com). ","help.about.feedback.title":"Зворотній зв'язок, помилки, побажання","help.about.feedback":'Якщо ви хотіли б висловити свою думку, повідомити про проблеми чи запросити додаткову функціональність, будь ласка, використовуйте <a href="https://github.com/tyrasd/overpass-turbo/issues">трекер питань</a> на GitHub або <a href="http://wiki.openstreetmap.org/wiki/Talk:Overpass_turbo">сторінку обговорення</a> у Вікі OSM.',"help.about.source.title":"Сирці","help.about.source":'<a href="https://github.com/tyrasd/overpass-turbo">Сирці</a> цього застосунку ліцензуються на умовах <a href="LICENSE">ліцензії</a> MIT.',"help.section.attribution":"За допомоги","help.attr.data_sources":"Джерела даних","help.attr.data":' Дані &copy; учасники <a href="http://openstreetmap.org/">OpenStreetMap</a>, <span style="font-size:smaller;"><a href="http://opendatacommons.org/licenses/odbl/1-0/">ODbL</a> (<a href="http://www.openstreetmap.org/copyright">умови</a>)</span> ',"help.attr.mining":"Обробка даних","help.attr.tiles":'Тайли мапи &copy; учасники <a href="http://openstreetmap.org/">OpenStreetMap</a>, <a href="http://creativecommons.org/licenses/by-sa/2.0/" style="font-size:smaller;">ODbL</a> ',"help.attr.search":"Пошук за підтримки","help.attr.software":"Програми та бібліотеки","help.attr.leaflet":"Бібліотека для показу мапи – ","help.attr.codemirror":"Сирці редактора – ","help.attr.other_libs":"Інші бібліотеки: ","ffs.title":"Помічник по складанню запитів","ffs.comments":"add query comments","ffs.placeholder":"пошук","ffs.expl":'<a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">Помічник</a> допоможе Вам створювати Overpass-запити. Ось кілька прикладів: ',"ffs.parse_error":"На жаль цей запит не розпізнано.","ffs.parse_error_expl":'Зверніть увагу, що ви повинні використовувати лапки для рядків, в яких є пробіли або спеціальні символи, а множинні пошукові фільтри повинні бути розділені правильними операторами (<i>and</i> або <i>or</i>). Зверніться до <a href="https://wiki.openstreetmap.org/wiki/Overpass_turbo/Wizard" target="_blank">документації</a> за більш детальною інформацією.',"ffs.typo":"Можливо, Ви мали на увазі:","dialog.dismiss":"закрити","dialog.cancel":"скасувати","dialog.save":"зберегти","dialog.save-local":"зберегти (локально)","dialog.save-osm":"зберегти на osm.org","dialog.delete":"вилучити","dialog.close":"закрити","dialog.done":"готово","dialog.abort":"перервати","dialog.reset":"скинути","dialog.repair_query":"полагодити запит","dialog.continue_anyway":"продовжити тим не менше","dialog.show_data":"показати дані","dialog.wizard_build":"скласти запит","dialog.wizard_run":"скласти та виконати запит","dialog.delete_query.title":"Вилучити запит?","dialog.delete_query.expl":"Дійсно вилучити цей запит","dialog.delete_query.expl-osm":"Дійсно вилучити цей запит","error.query.title":"Помилка запиту","error.query.expl":"Під час виконання запиту overpass сталася помилка! Ось відповідь Overpass API: ","error.ajax.title":"Помилка Ajax","error.ajax.expl":"Помилка виникла під час виконання запиту overpass!","error.mapcss.title":"Помилка MapCSS","error.mapcss.expl":"Хиба в стилі MapCSS: ","error.remote.title":"Помилка віддаленого керування","error.remote.incompat":"Помилка: непідтримувана версія сервісу віддаленого керування JOSM","error.remote.not_found":"Сервіс віддаленого керування не знайдено.  Переконайтеся, що JOSM запущено та налаштовано.","error.nominatim.title":"Помилка в Nominatim","error.nominatim.expl":"Не знайдено нічого з наступною назвою:","warning.browser.title":"Ваш оглядач не підтримується :(","warning.browser.expl.1":'Ваш оглядач, швидше за все, не зможе запустити важливі елементи цього застосунку.  <small>Він повинен підтримувати <a href="http://en.wikipedia.org/wiki/Web_storage#localStorage">Web Storage API</a> та <a href="http://en.wikipedia.org/wiki/Cross-origin_resource_sharing">cross origin resource sharing (CORS)</a>.</small> ',"warning.browser.expl.2":'Зверніть увагу, що вам може знадобитися увімкнути "куки" та/або "локальні дані" у деяких оглядачах (наприклад, у Firefox та Chrome).',"warning.browser.expl.3":'Будь ласка, оновіть ваш оглядач до актуальної версії, або встановіть інший.  Сайт перевірено на роботу з останніми версіями <a href="http://www.opera.com">Opera</a>, <a href="http://www.google.com/intl/uk/chrome/browser/">Chrome</a> та <a href="http://www.mozilla.org/uk/firefox/">Firefox</a>. Крім того, Ви можете скористатися <a href="http://overpass-api.de/query_form.html">формою запиту до Overpass_API</a>. ',"warning.incomplete.title":"Неповні дані","warning.incomplete.expl.1":"Відповідь на цей запит не містить точок.  У OSM лише точки містять координати.  Наприклад, без інформації про точки лінію не можна показати на мапі.","warning.incomplete.expl.2":'Якщо це не те, що ви хотіли отримати, <i>OverPass-Turbo</i> може допомогти полагодити запит (через автодоповнення), вибравши для цього нижче "полагодити запит". В іншому випадку ви можете перейти до даних.',"warning.incomplete.not_again":"більше не показувати це повідомлення.","warning.incomplete.remote.expl.1":"Схоже, цей запит не повертатиме дані OSM у форматі XML з метаданими.  Редактори на кшталт JOSM вимагають даних саме в такому форматі.","warning.incomplete.remote.expl.2":'<i>overpass turbo</i> може допомогти у виправлені запиту — натисніть "полагодити запит" нижче. ',"warning.share.long":"Увага: це посилання задовге.  Воно може не спрацювати в деяких оглядачах.","warning.share.very_long":"Увага: це посилання задовге, і з великою ймовірністю не спрацює у звичайних умовах (в оглядачах чи вебсерверах).  Використовуйте обережно!","warning.huge_data.title":"Великий обсяг даних","warning.huge_data.expl.1":"Відповідь на запит містить багато даних (близько {{amount_txt}}). ","warning.huge_data.expl.2":"Вашому оглядачу доведеться напружитись, щоб все показати.  Дійсно продовжити?","waiter.processing_query":"обробка запиту…","waiter.export_as_image":"збереження зображення…","data_stats.loaded":"Завантажено","data_stats.displayed":"Показано","data_stats.nodes":"точки","data_stats.ways":"лінії","data_stats.relations":"зв'язки","data_stats.areas":"ділянки","data_stats.pois":"точки інтересу","data_stats.lines":"лінії","data_stats.polygons":"полігони","data_stats.request_duration":"Час виконання запиту Overpass","data_stats.lag":"Актуальність даних","data_stats.lag_areas":"Актуальність ділянок","data_stats.lag.expl":"відстає від основної бази OSM","map.intentionally_blank":"Мапа навмисно не містить даних."};export{e as default};
