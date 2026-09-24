# Трек `seo_serp`: SEO, выдача и контент-поле

*Срез на 24.09.2026. Обозначения: **[Ф]** — факт со ссылкой, **[О]** — оценка, **[В]** — вывод для маркетинга.*

> **Статус и ограничения, прочитать до выводов.**
> 1. **Perplexity.** Коннектора в сессии нет (ToolSearch «perplexity» ничего не нашёл), perplexity.ai отдаёт 403. Трек сделан без него.
> 2. **Реальная выдача Яндекса** (yandex.ru / ya.ru, регион Москва `lr=213`) снималась через Playwright + Chromium, каждый запрос в новом контексте браузера. Яндекс быстро включил капчу и начал рвать соединения (`ERR_TOO_MANY_RETRIES`). Капчу мы не обходили, только делали паузы. **Итог: полная выдача собрана по 14 из 44 запросов** (13 — в основном скрейпе, 1 — «платежный агент» в пробном прогоне). Ещё 8 вопросных запросов снял агент трека [`geo_audit`](geo_audit.md). По остальным запросам данные взяты из WebSearch: это американский индекс, ближе к Google/Bing, чем к Яндексу, и помечено как «WS». Позиции в таблицах — это номер среди органических результатов, без рекламы и колдунщиков.
> 3. **Google.** Выдача google.com закрыта капчей («подозрительный трафик»), DuckDuckGo, Brave, Startpage и Rambler тоже. Поэтому Google-сторону заменяют WebSearch и досье [`united_stream.md`](united_stream.md) §6: там 21 запрос по тому же индексу, здесь он не повторяется.
> 4. **Частотности Wordstat здесь не приводятся**, их собирает отдельная сессия ([`wordstat-keywords.txt`](../wordstat-keywords.txt)). Спрос оценён относительно: высокий, средний, низкий.
> 5. **Бюджет WebSearch.** Этот трек израсходовал 21 запрос. По сессии в целом: `paid_partners` — 44, `geo_audit` — 1.
> 6. **Сайт unitedstream.ru в этой сессии открывается напрямую** (HTTP 200, нормальный title) и для обычного браузера, и для UA YandexBot/Googlebot. Заглушку KillBot с нашего IP воспроизвести не удалось, подробности в §2.1.

---

## 1. Главное

1. **[Ф] В Яндексе United Stream виден лучше, чем следовало из досье.** В органике он на 3-м месте по «оплата в Турцию для юрлиц» и «платежи в Германию для юрлиц в евро», на 2-м — по «оплата в США для юрлиц в долларах», на 3-м — по «экспортная выручка через платежного агента», на 5-м — по «агентский договор платежный агент ВЭД». Страница Турции, которую досье считало «сломанной KillBot», стоит в топ-3. На широких запросах («платежный агент», «международные платежи для бизнеса», «платежный агент вэд») сайта в органическом топ-10 нет.
2. **[Ф] United Stream уже крупный рекламодатель Директа.** Он был в рекламе в 7 из 14 снятых выдач: 6 из 13 в основном скрейпе и в пробном прогоне по «платежный агент». Чаще в тех же 13 выдачах показывается только **a7.ru (7)**. Рядом Сбер (digital.sber.ru — 6, sberbank.ru — 4), **platejka.com (6)**, Точка (bank-tochka.ru — 5), vedmaster.ru (4), salaryhub.com (4). В объявлении United Stream показаны рейтинг **4,8 из 54 отзывов** Яндекс Бизнеса и адрес (м. Динамо). Значит, отзывы на площадках есть, и досье нужно поправить: там написано «ни одного отзыва».
3. **[Ф] Широкие запросы забирают банки.** По «международные платежи для бизнеса» 7 из 10 органических мест у банков (Сбер, ПСБ, Совкомбанк, Точка, Альфа, Контур.Банк) и у a7.ru. По страновым запросам в Яндексе первым стоит **tochka.com** (Турция, Казахстан) или **platejka.com** (Германия, 2 места подряд). Т-Банк держится на 3–5 местах со страницами `/corporate/currency/agents/{страна}/`.
4. **[Ф] Главный органический конкурент среди агентов — platejka.com.** Он в органике по «международные платежи…», Турции, Германии, США и Казахстану, а в рекламе по большинству запросов с оффером «Комиссия 0,2%. Лицензия». Следом идут raketapay.ru (**835 URL в sitemap**, из них 443 страницы «оплата [сервис]»), neoved.io, vedmaster.ru (308 URL: глоссарий на 113 терминов, матрица «оплата инвойса в {страна}»), dalistragroup.com, payforved.pro (матрица «страна × город»). У United Stream в sitemap **около 57 URL**: 20 страниц стран и услуг, 15 статей, 12 кейсов.
5. **[Ф] Паразитное SEO — это конвейер одних и тех же 3–4 заказчиков.** Прочитано 26 статей-подборок на vc.ru, DTF, Sostav, Хабре, spark.ru, altcoinlog, resize-web и top-agents. 17 из 22 рейтинговых подборок ведут на **Exnode** (мониторинг и «гарант сделки»). Их публикуют аккаунты «КриптоГрадусник», «Exnode», «Владимир Князев», «Владимир Комаровский», часто в нерелевантных рубриках DTF («Музыка», «Железо», «Барахолка», «Скриншоты»). Аккаунт «КриптоГрадусник» на vc.ru выпустил **не меньше 480 постов за 28.05–23.09.2026, то есть около 4 в день**. В топах подборок чаще всего **Global Finance VED и NNEX (по 11), Onex, Доверка, RSI Capital (по 7), А7 и EastPay (по 6)**. **United Stream не упомянут ни в одной подборке.**
6. **[Ф] Нейропоиск (Алиса AI) пересказывает именно эти подборки.** Больше всего источников дают блог Exnode на drive2.ru и sostav.ru, United Stream в небрендовых ответах не появляется (см. [geo_audit](geo_audit.md)). **[В]** Попадание в подборки — это одновременно SEO и GEO.
7. **[Ф] Отдельные рейтинговые сайты тоже заказные.** Например, top-agents.ru («Рейтинг платёжных агентов — 2026»): на 1-м месте «Культура платежей» (KulturaPay), на 2-м А7, на 3-м Точка ВЭД, редакция от 11.09.2026. Есть resize-web.ru («ТОП-10»), paybeam.ru/ved, tornadogate.com. Входной билет в такой сайт — договорённость с его владельцем.
8. **[О] Форматы, которые выигрывают.** В коммерческих запросах — лендинг «Платежи в {страна} для юрлиц и ИП» с комиссией и сроком в title. В «проблемных» и информационных запросах — статья-инструкция в блоге банка (Точка, Т-Банк Секреты) или на Клерке. В «рейтинг / альтернативы / отзывы» — подборки на vc.ru, DTF, Sostav, drive2 и Дзене плюс banki.ru. Калькуляторов и таблиц сравнения в топе почти нет, это свободная ниша.
9. **[В] Три шага с наибольшей отдачей.** (а) Масштабировать то, что уже работает: матрица стран, валют и задач, от 20 страниц к 80–120. (б) Страницы под интенты, где United Stream уже в топ-5 без специальной оптимизации: экспорт, агентский договор, валютный контроль. (в) Войти во внешние подборки и на площадки, которые цитирует Алиса. Хабы по SaaS (AWS, OpenAI, Figma) — низкий приоритет: там малые чеки, физлица и сотни мелких «оплатильщиков».

---

## 2. Подробное досье

### 2.1. Состояние сайта unitedstream.ru на 24.09.2026 (прямая проверка)

| Параметр | Что видно | Источник |
|---|---|---|
| Доступность | HTTP 200, title «Международные платежи для бизнеса \| ЮНАЙТЕД СТРИМ» при UA браузера, YandexBot и Googlebot. Заглушки KillBot в HTML нет | [unitedstream.ru](https://unitedstream.ru/), curl 24.09.2026 |
| Турция | title «Платежи в Турцию для юридических лиц и ИП \| ЮНАЙТЕД СТРИМ», 842 слова, **3-е место в органике Яндекса** | [/pay-to-turkey/](https://unitedstream.ru/pay-to-turkey/) |
| sitemap | Индекс из 4 карт: post (15 статей), page (29 страниц), cases (12 кейсов + листинг), local (KML) | [sitemap_index.xml](https://unitedstream.ru/sitemap_index.xml) |
| Страны | Китай, Гонконг, ОАЭ, Турция, Индия, Корея, Япония, США, Великобритания, Европа, Германия, Италия, Испания, Польша, Франция и «Платежи в Россию» (экспорт), итого 16 | page-sitemap |
| Услуги | /invoice/ (4,2 тыс. слов), /ved-platezhi/, /oplata-postavshikam/, /import/, /oplata-uslug/, /vykup-tovarov/, /oplata-avtomobilej/ | page-sitemap |
| Блог | 15 статей, 9 из них обновлены 16.09.2026: выбор агента, комиссия, закрывающие документы, курс, агентский договор, «платёж завис», валютный контроль (Китай), оплата инвойса в юанях | [post-sitemap](https://unitedstream.ru/post-sitemap.xml) |
| Микроразметка | Organization, BreadcrumbList, Article/BlogPosting, PostalAddress. FAQPage и Service нет | HTML страниц |
| Дефекты | H1 на /pay-to-japan/ и /pay-to-korea/ — «Оплата инвойсов», а не страна. Кейсы озаглавлены капсом. /pay-to-russia/ называется «Платежи в Россию», хотя ищут «приём платежей из-за рубежа». Страницы «Оплата инвойса в {страна}» нет | HTML |
| Промостраницы | В рекламной выдаче виден `unitedstream.promo.page` (Яндекс ПромоСтраницы, «Страница бренда») | выдача «united stream unitedstream.ru» в [geo_audit](geo_audit.md) |

**[О]** С нашего (нероссийского) IP KillBot не срабатывает. Мусорный title в индексе, о котором писало досье, либо уже исправлен (страница Турции в топ-3 это подтверждает), либо KillBot срабатывает только на российские IP и роботов по IP. **Проверка подтверждения:** «Проверить URL» в Яндекс.Вебмастере и Search Console. Статус: *одиночный источник*.

### 2.2. Кластерная карта спроса (54 кластера)

Спрос оценён относительно, по трём признакам: сколько разных сайтов оптимизируется под запрос, есть ли реклама в Директе, есть ли массовые статьи на vc.ru и DTF. Частотности даст сессия Wordstat.

| # | Кластер | Примеры запросов | Интент | Спрос [О] | Страница United Stream сейчас | Действие |
|---|---|---|---|---|---|---|
| **A. Общие / head** |||||||
| 1 | Платёжный агент (общее) | платежный агент, услуги платежного агента, что такое платежный агент | смешанный, ≈70% инфо (54-ФЗ, ЖКХ, эквайринг) | высокая, но «грязная» | нет (главная и /o-nas/ косвенно) | не штурмовать органикой; Директ с минус-словами; гайд «платёжный агент ВЭД ≠ агент 103-ФЗ» |
| 2 | Платёжный агент для юрлиц / ИП | платежный агент для юрлиц, для ип | коммерческий | средняя | /o-nas/ (title «Платёжный агент для юридических лиц и ИП») | отдельный лендинг + блок «для ИП» |
| 3 | Платёжный агент ВЭД | платежный агент вэд, агент по оплате вэд | коммерческий | средняя | /ved-platezhi/ | усилить; сравнение «банк vs агент vs свой счёт» |
| 4 | Международные платежи для бизнеса | международные платежи для бизнеса / юрлиц, платежи за границу для юрлиц, перевод денег за границу юрлицу | коммерческий | средняя | главная (title совпадает) | главная как хаб; перелинковка на страны |
| 5 | Оплата иностранному поставщику | оплата зарубежному/иностранному поставщику, как оплатить иностранному поставщику | коммерч.+инфо | средняя | /oplata-postavshikam/, блог | ок; добавить FAQ-схему |
| 6 | Оплата инвойса (общее) | оплата инвойса, оплатить инвойс, оплата инвойса юрлицо, иностранной компании | коммерческий | средняя–высокая | /invoice/ (4,2 тыс. слов) | ок; матрица «оплата инвойса в {страна}» |
| 7 | Импорт: оплата импортного контракта | оплата импорта, оплата импортных товаров, оплата валютного контракта | коммерческий | средняя | /import/ | ок |
| 8 | Комиссия / выбор / рейтинг агента | комиссия платежного агента, как выбрать платежного агента, надежный, рейтинг, лучший | коммерч.-исследовательский | средняя | 3 статьи блога | калькулятор + «рейтинг-чеклист»; внешние подборки |
| **B. Страны** |||||||
| 9 | Китай (ядро) | оплата в Китай юрлицо, платежи в Китай, перевод в Китай юрлицу, платежный агент Китай | коммерческий | **высокая** (самый большой спрос) | /pay-to-china/ + 6 статей | хаб Китая: юани, Гонконг, 1688/Alibaba, провинции, отказы банков |
| 10 | Китай: оплата инвойса / поставщику | оплата инвойса в Китай, оплата поставщику в Китае | коммерческий | высокая | статья «Оплата инвойса в Китай в юанях» | отдельный лендинг «оплата инвойса в Китай» |
| 11 | Китай: юани | оплата в юанях юрлицо, перевод в юанях | коммерческий | средняя | нет | посадочная CNY |
| 12 | Китай: площадки | оплата 1688 для юрлиц, оплата Alibaba юрлицо, оплата Taobao ИП | коммерческий | средняя | нет | 3 посадочные + связка с выкупом |
| 13 | Китай: выкуп | выкуп товара из Китая | коммерческий, конкуренты — карго | высокая, но чужой интент (карго) | /vykup-tovarov/ | только «выкуп для юрлиц с документами» |
| 14 | Китай: проблемы | почему банк не пропускает платеж в Китай, возврат платежа из Китая, отказ китайского банка, платеж завис | инфо-«боль» | средняя, растущая при новостях | 2 статьи | хаб «проблемы платежей в Китай» — лучший вход для лида |
| 15 | Гонконг | платежи в Гонконг юрлица, оплата в HKD | коммерческий | низкая–средняя | /pay-to-hongkong/ | ок |
| 16 | ОАЭ | оплата в ОАЭ юрлицо, в дирхамах, Дубай | коммерческий | средняя | /pay-to-uae/ | ок; + «оплата в дирхамах» |
| 17 | Турция | оплата в Турцию юрлицо, в лирах | коммерческий | средняя | /pay-to-turkey/ | проверить индексацию после KillBot |
| 18 | Индия | оплата в Индию юрлицо, в рупиях | коммерческий | низкая–средняя, растёт | /pay-to-india/ | + «в рупиях», IFSC-гайд |
| 19 | Казахстан / ЕАЭС / СНГ | оплата в Казахстан/Узбекистан/Армению юрлицо | коммерческий | средняя (но банки справляются сами) | нет | низкий приоритет: банки РФ проводят напрямую |
| 20 | Корея | платежи в Корею, в Южную Корею юрлицо | коммерческий | низкая–средняя | /pay-to-korea/ | ок; авто и косметика |
| 21 | Вьетнам | оплата во Вьетнам юрлицо, донги | коммерческий | низкая | нет | посадочная |
| 22 | Таиланд / Индонезия / Малайзия / ЮВА | оплата в Таиланд юрлицо | коммерческий | низкая | нет | посадочные «ЮВА» (одна + дочерние) |
| 23 | Европа (евро) | оплата в Европу юрлицо, в евро юрлицо, SEPA | коммерческий | средняя | /pay-to-europe/ | ок — главное УТП против А7 |
| 24 | Германия / Италия / Испания / Польша / Франция | платежи в Германию/Италию… | коммерческий | низкая–средняя каждая | 5 страниц | ок; добавить Нидерланды, Чехию, Австрию, Швейцарию |
| 25 | США (доллары) | оплата в США юрлицо, в долларах юрлицо | коммерческий | средняя | /pay-to-usa/ | ок; + сервисы |
| 26 | Великобритания | платежи в Великобританию, в фунтах | коммерческий | низкая | /pay-to-uk/ | ок |
| 27 | Япония | платежи в Японию юрлицо, иены | коммерческий | низкая | /pay-to-japan/ (H1 «Оплата инвойсов» — дефект) | поправить H1 |
| **C. Задачи** |||||||
| 28 | Оплата услуг за рубежом | оплата услуг за границей юрлицо | коммерческий | средняя | /oplata-uslug/ | ок |
| 29 | Оплата обучения за рубежом (юрлицо) | оплата обучения за границей юрлицо, оплата учебы сотрудника | коммерческий | низкая | нет | посадочная; конкуренты — Доверка, Raketa |
| 30 | Оплата выставки / мероприятия | оплата выставки за рубежом, оплата участия в выставке, Canton Fair стенд | коммерческий | низкая, сезонная (перед Кантонской ярмаркой) | нет | посадочная + календарь выставок |
| 31 | Патентные пошлины / WIPO / товарные знаки | оплата WIPO из России, патентная пошлина за рубежом, регистрация ТЗ за рубежом оплата | коммерческий нишевый | низкая, высокая ценность | кейс WIPO | посадочная + партнёрство с патентными поверенными |
| 32 | Оплата отелей/командировок/аренды за рубежом | оплата отеля за границей юрлицо | коммерческий | низкая | кейс «отель в Конго» | посадочная «командировочные расходы» |
| 33 | Оплата автомобилей | оплата автомобиля из Кореи/Китая/ОАЭ/Европы юрлицо | коммерческий | средняя (авто-импорт) | /oplata-avtomobilej/ | + страны × авто |
| 34 | Оплата логистики / фрахта | оплата фрахта иностранному перевозчику, оплата грузоперевозок за рубеж | коммерческий | низкая | нет | посадочная (у vedmaster есть) |
| **D. Сервисы (SaaS, реклама)** |||||||
| 35 | Зарубежные сервисы для юрлиц (общее) | оплата зарубежных/иностранных сервисов юрлицо, оплата зарубежного ПО, подписки | коммерческий | средняя | /oplata-uslug/ частично | хаб «Оплата сервисов для юрлиц с закрывающими» |
| 36 | Облака: AWS, Google Cloud, Azure | оплатить AWS из России, Google Cloud юрлицо | коммерческий | средняя (AWS не обслуживает РФ-юрлица с 2024 — выдача про карты для физлиц) | кейс VDS UK | осторожно: юр. риски; страница «облака для бизнеса» |
| 37 | AI API: OpenAI, Anthropic, Gemini | оплатить OpenAI API юрлицо, ChatGPT юрлицо | коммерческий | средняя, растущая | нет | низкий фит для B2B-агента (мелкие чеки), только в хабе |
| 38 | Дизайн/коллаборация: Figma, Adobe, Canva, Miro, Zoom, Atlassian, GitHub, HubSpot | оплатить Figma юрлицу, Zoom, Adobe, Jira | коммерческий | низкая каждая, в сумме средняя | нет | хаб + 10–15 карточек только если есть продукт для чеков $100–5000 |
| 39 | Зарубежная реклама: Google Ads, Meta, TikTok | оплатить Google Ads из России | коммерческий | средняя | нет | низкий фит (нужны агентские MCC), не приоритет |
| 40 | Хостинг/серверы | оплата хостинга за рубежом юрлицо, VDS | коммерческий | низкая | кейс VDS UK | в хаб сервисов |
| **E. Экспорт / входящие** |||||||
| 41 | Получить оплату из-за рубежа | получить оплату из-за границы, прием платежей от иностранных клиентов | коммерческий | средняя | /pay-to-russia/ | переименовать/расширить: «приём платежей из-за рубежа» (сейчас «Платежи в Россию») |
| 42 | Экспортная выручка | возврат экспортной выручки, экспортная выручка через агента | коммерческий/инфо | низкая–средняя | /pay-to-russia/ (title «Возврат экспортной выручки») | гайд + лендинг |
| **F. Информационные (хаб знаний)** |||||||
| 43 | Валютный контроль через агента | валютный контроль при оплате через агента, СПД код 13_4, постановка контракта на учёт | инфо | средняя | статья про Китай | хаб «Валютный контроль» (5–8 статей) |
| 44 | Агентский договор ВЭД | агентский договор вэд, на оплату, образец | инфо + шаблон | средняя | статья «Агентский договор… по пунктам» | шаблон/образец для скачивания (лид-магнит) |
| 45 | НДС и налоги при оплате через агента | ндс платежного агента, налоговый агент по НДС импорт услуг | инфо (бухгалтеры) | низкая–средняя | частично (шаг 4 в статье) | статья + колонка на Клерке |
| 46 | Закрывающие документы / учёт | отчет агента, проводки 76, закрывающие документы агента | инфо (бухгалтеры) | низкая | статья | + образцы документов |
| 47 | Как оплатить инвойс из России (гайд) | как оплатить инвойс из России, как оплатить иностранному поставщику | инфо-коммерч. | средняя | статья «способы расчётов» | гайд-пиллар |
| 48 | Санкции / вторичные санкции / отказы | вторичные санкции платежи, отказ банка платеж, оплата через третьих лиц | инфо-«боль» | средняя, всплески | «платёж завис» | новостной формат + Telegram |
| 49 | ВЭД под ключ / аутсорсинг | ведение вэд под ключ, вэд аутсорсинг | коммерческий смежный | низкая–средняя | нет | партнёрство, не своя услуга |
| **G. Бренды и сравнения** |||||||
| 50 | А7 бренд | а7 агент, а7 платежи, а7 платежный агент | навигационный | высокая (оценка из досье а7.md: 10–30 тыс./мес) | нет | не трогать органикой; только Директ-перехват нельзя по бренду в тексте |
| 51 | А7 отзывы / альтернативы / санкции | а7 отзывы, а7 альтернативы, а7 санкции | коммерч.-исследовательский | средняя (1–4 тыс./мес по оценке а7.md) | нет | статья «альтернативы А7» на vc.ru/своём блоге без очернения; попадание в чужие подборки |
| 52 | Рейтинги / ТОП агентов | рейтинг платежных агентов, топ платежных агентов 2026, лучший платежный агент | коммерч.-исследовательский | средняя | нет | войти в 3–5 подборок; свой «чек-лист проверки» |
| 53 | Бренд United Stream | юнайтед стрим, united stream, юнайтед стрим отзывы | навигационный | очень низкая | главная, /o-nas/ | защита: отзывы, FAQ «не Юнистрим», брендовая РК |
| 54 | Другие агенты (перехват) | exnode, vedhonest, raketa pay отзывы, платежка отзывы | навигационный | низкая | нет | не приоритет |

**[О] Логика оценки спроса.**
- «Высокая»: 10+ коммерческих сайтов в топе, 5+ рекламодателей, десятки статей на vc.ru и DTF. Таков Китай.
- «Средняя»: 5–9 специализированных сайтов, реклама есть (ОАЭ, Турция, США, Германия, общие запросы).
- «Низкая»: в топе в основном статьи и справочники, рекламы мало (Вьетнам, WIPO, выставки).

### 2.3. SERP-анализ: реальная выдача Яндекса (Москва, 24.09.2026)

Органика — первые 10 доменов по порядку, без рекламы и колдунщиков. Реклама — все рекламодатели на странице, верхний и нижний блоки. Полужирным выделен United Stream.

| Запрос | Органика Яндекса (топ-10) | Реклама Директа |
|---|---|---|
| платежный агент *(пробный прогон, ya.ru)* | 1. pay.yandex.ru (блог), 2. companies.rbc.ru, 3. robokassa.com, 4. brace-lf.com, 5. astral.ru, 6. moedelo.org, 7. mosdigitals.ru, 8. consultant.ru, 9. klerk.ru (блог Exnode), 10. tochka.com | **unitedstream.ru**, a7.ru, pay.yandex.ru, alfabank.sale, bitox.global, rshb.ru, m3logistics.ru, cloudpayments.ru, vedmaster.ru |
| международные платежи для бизнеса | 1. sberbank.ru, 2. psbank.ru, 3. klerk.ru, 4. kontur.ru, 5. a7.ru, 6. banki.ru, 7. sovcombank.ru, 8. companies.rbc.ru, 9. tochka.com, 10. alfabank.ru | sberbank.ru, a7.ru, platejka.com, bank-tochka.ru, inv.spark.family, **unitedstream.ru**, alfabank.sale, digital.sber.ru, finstarbank.ru |
| платежный агент вэд | 1. tochka.com, 2. avangard-direct.ru, 3. klerk.ru, 4. nbr.ru, 5. rterminal.ru, 6. cleverence.ru, 7. secrets.tbank.ru, 8. bcaun.com, 9. vedmaster.ru, 10. kavetervostoka.ru | logistic-service.biz, bank-tochka.ru, platejka.com, f2b-logistics.ru, **unitedstream.ru**, a7.ru, turkeylogistic.com, pvbridge.ru, startt.ru |
| оплата в Турцию для юрлиц | 1. tochka.com, 2. platejka.com, 3. **unitedstream.ru**, 4. ved-platezhi.ru, 5. tbank.ru, 6. neoved.io, 7. sostav.ru, 8. gxfinance.ru, 9. dalistragroup.com, 10. abr.ru | a7.ru, platejka.com, bank-tochka.ru, salaryhub.com, **unitedstream.ru**, sberbank.ru, direct.yandex.ru, digital.sber.ru, vedmaster.ru |
| оплата в Казахстан для юрлиц | 1. tochka.com, 2. sberbank.ru, 3. norvikbank.ru, 4. sostav.ru, 5. tbank.ru, 6. klerk.ru, 7. alfabank.ru, 8. platejka.com, 9. raketapay.ru, 10. blog.nebopro.ru | a7.ru, finstarbank.ru, digital.sber.ru, salaryhub.com, bitox.global, direct.yandex.ru, bank-tochka.ru, finambank.ru, finix.ru |
| платежи в Германию для юрлиц в евро | 1. platejka.com, 2. platejka.com, 3. **unitedstream.ru**, 4. tbank.ru, 5. tochka.com, 6. rgpexchange.com, 7. neoved.io, 8. psbank.ru, 9. gxfinance.ru, 10. vedmaster.ru | **unitedstream.ru**, a7.ru, platejka.com, vedmaster.ru, tbank-online.com, sberbank.ru, digital.sber.ru, salaryhub.com |
| оплата в США для юрлиц в долларах | 1. raketapay.ru, 2. **unitedstream.ru**, 3. tbank.ru, 4. platejka.com, 5. lcmg.ru, 6. drive2.ru, 7. klerk.ru, 8. raiffeisen.ru, 9. gba.business.ru, 10. dalistragroup.com | platejka.com, **unitedstream.ru**, vedmaster.ru, tbank-online.com, a7.ru, sberbank.ru, digital.sber.ru, finambank.ru |
| оплатить Figma юрлицу | 1. osno-va.com, 2. duc-technologies.ru, 3. bpay.agency, 4. raketapay.ru, 5. vc.ru, 6. dolphinpay.ru, 7. klerk.ru, 8. migsoft.ru, 9. global-payments.ru, 10. payment.mts.ru | promo.platipomiru.com, wanttopay.net, getcard.one, direct.yandex.ru, дизайн.официальный.рус, syssoft.ru, softms.ru, playerok.com, ggsel.net |
| получить оплату из-за рубежа юрлицо | 1. e-kontur.ru, 2. tochka.com, 3. sravni.ru, 4. tbank.ru, 5. , 6. prodamus.ru, 7. planfact.io, 8. cloudpayments.ru, 9. easystaff.io, 10. bxb.delivery | platejka.com, **unitedstream.ru**, salaryhub.com, vedmaster.ru, rgpexchange.com, growex-group.ru, mellow.io, digital.sber.ru, trust-on.ru |
| экспортная выручка через платежного агента | 1. turkeylogistic.com, 2. growex-group.ru, 3. **unitedstream.ru**, 4. lencapitals.ru, 5. bitox.global, 6. buhexpert8.ru, 7. mfk.pro, 8. tenet.llc, 9. glavbukh.ru, 10. vc.ru | — |
| агентский договор платежный агент ВЭД | 1. tochka.com, 2. changebox.io, 3. globalpo.ru, 4. avangard-direct.ru, 5. **unitedstream.ru**, 6. mnp.ru, 7. cleverence.ru, 8. predprinimatel.ru, 9. brace-lf.com, 10. klerk.ru | f2b-logistics.ru, bank-tochka.ru, a7.ru, novikov-import.ru, pay.yandex.ru, growex-group.ru, info-tt.ru, datadoc.ru |
| а7 альтернативы | 1. vc.ru, 2. vc.ru, 3. dzen.ru, 4. dtf.ru, 5. guitar.samesound.ru, 6. partnerkin.com, 7. youtube, 8. rutube.ru, 9. spark.ru, 10. sostav.ru | — |
| а7 агент отзывы | 1. banki.ru, 2. hh.ru, 3. 2gis.ru, 4. otzovik.com, 5. dreamjob.ru, 6. exnode.ru, 7. a7-agent.ru, 8. cryptorussia.ru, 9. club.klerk.ru, 10. vc.ru | yandex.ru |
| юнайтед стрим отзывы | 1. yandex.ru, 2. yandex.ru, 3. united-stream.clients.site, 4. **unitedstream.ru**, 5. checko.ru, 6. 2gis.ru, 7. otzovik.com, 8. banki.ru, 9. vbankcenter.ru, 10. inforegister.ee | playerok.com |

**Выдача, которую снял агент geo_audit** (запросы — формулировки вопросов, подробности в [geo_audit.md](geo_audit.md)):

| Запрос | Что в топе | United Stream |
|---|---|---|
| «Составь рейтинг надёжных платёжных агентов для юрлиц…» | klerk.ru, exnode.ru, altcoinlog.com, resize-web.ru (ТОП-10), habr.com/Exnode, drive2 (Exnode), vc.ru, platejka.com, investing.com (Exnode), dtf.ru, sravni.ru, top-agents.ru, cossa.ru, paybeam.ru | нет. В рекламе tornadogate.com («Рейтинг платёжных агентов») и tbank-online.com |
| «Какие есть альтернативы А7 после санкций ЕС?» | spark.ru (Exnode), vc.ru, bcaun.com, exnode.ru, dtf.ru, advolaw.ru, partnerkin.com (Exnode), sostav.ru, rbc.ru, dzen.ru, thebell.io | нет |
| «Как проверить платёжного агента перед первой оплатой…» | sostav.ru, klerk.ru (MoneyRoo), brace-lf.com, fd.ru, buhexpert8.ru, companies.rbc.ru, kad-autoconsult.ru, getexpo.ru, **unitedstream.ru/blog (≈9)** | органика ≈9, в рекламе a7.ru |
| «Как проходит валютный контроль… через агента» | nbr.ru, nskbl.ru, ppt.ru, buhexpert8.ru, bspb.ru (памятка), drive2, **unitedstream.ru/blog (≈7)**, klerk.ru, globalpo.ru | органика ≈7, в рекламе тоже есть |
| «Как юрлицу оплатить AWS / Google Cloud / OpenAI API» | raketapay.ru, klerk.ru (Raketa Pay), habr.com, neoved.io, a5pay.online, platipomiru.com, sostav.ru, kosareva.cloud, saikyo.exchange, upayment.ru | нет |
| «Юнайтед Стрим: отзывы…» / «юнайтед стрим отзывы» | Яндекс Карты (карточка United Stream с отзывами), yandex.ru, united-stream.clients.site, unitedstream.ru (4), checko.ru, 2gis.ru, otzovik (Юнистрим), banki.ru, inforegister.ee (эстонский однофамилец), t.me/unitedstream, zoon.ru | карточка №1, сайт №4 |

**Выдача WebSearch (американский индекс, ≈Google/Bing) по запросам, которые не охватило досье:**

| Запрос (WS) | Кто в топе | United Stream |
|---|---|---|
| оплатить AWS юрлицу из России | vc.ru ×2, dtf.ru ×2, gruzdevv.ru, pipl.io, **raketapay.ru**, klerk.ru (Raketa Pay), platipomiru.com | нет |
| как юрлицу оплатить OpenAI API | vc.ru ×3 (в т. ч. блог Raketa Pay), dtf.ru ×3, raketapay.ru, pyyplbot.com, aitunnel.ru | нет |
| оплата Google Ads из России юрлицо | adpass.ru, vc.ru ×3, finepromo.ru ×2, avo.cards, spark.ru, easypay.world | нет |
| оплатить Figma юрлицу | habr.com, vc.ru ×2, dtf.ru, startpack.ru, migsoft.ru, klerk.ru, pyyplbot.com, oplata.guru | нет |
| оплата обучения за рубежом юрлицом | habr.com, companies.rbc.ru ×2, vc.ru ×2, studythere.ru, doverka.com, studyu.org, 1tab.co | нет |
| оплата участия в зарубежной выставке | its.1c.ru, consultant.ru, delo-press.ru, ascon-spb.ru, vc.ru, **raketapay.ru ×2** | нет |
| валютный контроль при оплате через агента | nskbl.ru, planfact.io, allo.tochka.com, vc.ru ×2 (Exnode), brace-lf.com, noboring-finance.ru, klerk.ru (MoneyRoo), nbr.ru | нет |
| НДС при оплате импорта через агента | garant.ru, consultant.ru, buhexpert8.ru ×2, pravovest-audit.ru, brace-lf.com, probusiness.news ×2, ps-audit.ru | нет |
| платежи в Индию для юрлиц | tbank.ru, tochka.com, uralprombank.ru, dtf.ru ×3, vc.ru, flowpaysolutions.ru, neoved.io | нет |
| оплата поставщику во Вьетнам | sostav.ru, vc.ru ×2, flowpaysolutions.ru, platejka.com, neoved.io ×2, vostokpay.com, only-pays.com | нет (страницы нет) |
| оплата инвойса в Таиланд | sostav.ru, smapse.ru, dalistragroup.com, doverka.com, rezident-pay.com, oplata-invoice.ru, vedmaster.ru, payforved.pro, center-bereg.ru | нет (страницы нет) |
| платеж в Казахстан юрлицу | sostav.ru, tbank.ru, tochka.com ×2, dtf.ru, brace-lf.com, agentpayout.ru, neoved.io, migron.kz | нет (страницы нет) |
| получить оплату из-за рубежа юрлицу | tochka.com, t-j.ru, sravni.ru, dtf.ru, vc.ru, mnp.ru ×2, bpay.agency, klerk.ru | нет |
| оплата в юанях для юрлиц | tbank.ru, vc.ru ×3, dtf.ru ×2, platejka.com ×3 | нет |
| платежи в США для юрлиц | tbank.ru, rshb.ru, cossa.ru, vc.ru ×2, drive2 (Exnode), neoved.io, klerk.ru, easypayments.online | нет (в Яндексе 2-е место) |
| как выбрать платежного агента | sostav.ru ×2, finstarbank.ru, allo.tochka.com, dtf.ru, vc.ru, drive2 (Exnode), klerk.ru | нет |
| А7 агент отзывы | banki.ru ×3, dtf.ru, vc.ru, drive2 (Exnode), dreamjob.ru, klerk.ru, cryptorussia.ru | нет |

Источники WS-строк: [vc.ru AWS](https://vc.ru/services/2748277-oplata-aws-iz-rossii-v-2026-godu), [Raketa Pay AWS](https://raketapay.ru/blog/kak-rossiyskoy-kompanii-oplatit-aws-v-2026-godu-korporativnyy-akkaunt-i-zakryvay), [vc.ru OpenAI](https://vc.ru/services/2966723-kak-oplatit-openai-api-iz-rossii), [ADPASS Google Ads](https://adpass.ru/google-ads-iz-rossii-v-2026-kak-platit-ne-blokirovatsya-i-poluchat-klientov-za-granitsej/), [Хабр Figma](https://habr.com/ru/articles/1084698/), [Хабр обучение](https://habr.com/ru/articles/1040728/), [Raketa Pay выставки](https://raketapay.ru/business/oplata-uchastiya-v-mezhdunarodnyh-vystavkah), [Левобережный](https://www.nskbl.ru/press-center/platezhi-cherez-agenta-kak-soblyudat-pravila-valyutnogo-kontrolya/), [Гарант НДС](https://www.garant.ru/consult/nalog/1770901/), [Т-Банк INR](https://www.tbank.ru/business/blog/inr/), [Sostav Вьетнам](https://www.sostav.ru/blogs/288583/87444), [Dalistra Таиланд](https://dalistragroup.com/payments/thailand/), [Sostav Казахстан](https://www.sostav.ru/blogs/288076/81466), [Точка экспорт](https://tochka.com/rko/platezhi-iz-za-granicy/), [Т-Банк Китай](https://www.tbank.ru/corporate/currency/agents/china/), [Т-Банк США](https://www.tbank.ru/corporate/currency/agents/usa/), [Sostav выбор](https://www.sostav.ru/blogs/288076/80993), [banki.ru А7](https://www.banki.ru/services/responses/bank/response/13058536/).

**Где United Stream есть в Яндексе и где нет (сводка по 14 + 8 запросам) [Ф]:**
- **Органика, топ-5:** Турция (3), Германия (3), США (2), экспорт через агента (3), агентский договор (5), бренд «отзывы» (4).
- **Органика, 6–10:** валютный контроль через агента (≈7), проверка агента (≈9), по данным geo_audit.
- **Нет в топ-10:** «платежный агент», «международные платежи для бизнеса», «платежный агент вэд», Казахстан (страницы нет), «получить оплату из-за рубежа» (страница /pay-to-russia/ называется «Платежи в Россию»), Figma и SaaS, «а7 альтернативы», «а7 отзывы», рейтинги.
- **Нет данных по Яндексу (капча):** весь Китай (5 запросов), Гонконг, ОАЭ, Индия, Корея, Вьетнам, Таиланд, Италия, Великобритания, «оплата инвойса в евро», выкуп, услуги, обучение, выставки, WIPO, AWS/OpenAI/Google Ads, НДС, рейтинги. **Это главный пробел трека**, закрывается выгрузкой из Топвизора или Яндекс.Вебмастера (§5).

### 2.4. Кто забирает выдачу: типы игроков [Ф/О]

| Тип | Кто | Где силён | Формат |
|---|---|---|---|
| Банки | Точка (tochka.com, allo.tochka.com), Т-Банк (/corporate/currency/agents/, secrets.tbank.ru), Сбер, Альфа, ПСБ, Совкомбанк, Контур.Банк, Райффайзен | широкие запросы, страны, «как…» | лендинг страны + база знаний; у Т-Банка ещё подбор агента по заявке |
| Агенты с программным SEO | platejka.com, raketapay.ru (835 URL), vedmaster.ru (308), neoved.io (185), dalistragroup.com, payforved.pro, agentpayout.ru, flowpaysolutions.ru, doverka.com | страны, сервисы, задачи | матрицы «страна», «сервис», «страна × город»; глоссарий |
| А7 | a7.ru (28 URL в sitemap), a7-agent.ru | широкие запросы (a7.ru на 5-м месте по «международные платежи…»), бренд | лендинг + PR; органику почти не строит, опирается на Директ и бренд |
| Контент-фермы и агрегаторы | Exnode (drive2, habr, klerk, spark, vc, dtf, investing), КриптоГрадусник, VedHonest (sostav 288076 и 288583), top-agents.ru, resize-web.ru, altcoinlog | рейтинги, «А7 альтернативы / отзывы», «как выбрать», Китай | листиклы «ТОП-3/ТОП-10» |
| Справочные и медиа | klerk.ru, consultant.ru, garant.ru, buhexpert8.ru, nbr.ru, ppt.ru, companies.rbc.ru, t-j.ru, sravni.ru, banki.ru | НДС, валютный контроль, «что такое», отзывы | статьи, вопросы-ответы |
| Логисты с агентской услугой | turkeylogistic.com, f2b-logistics.ru, growex-group.ru, m3logistics.ru, logistic-service.biz, bxb.delivery | экспорт, агентский договор, реклама по «платежный агент вэд» | лендинг «платёжный агент для юрлиц» |

### 2.5. Паразитное SEO и рейтинги

**Выборка:** 26 статей и страниц, прочитаны напрямую (curl и vc/DTF API), 24.09.2026.

| # | Площадка / рубрика | Автор | Дата | Кто в топе подборки (по порядку) | Кого продвигает |
|---|---|---|---|---|---|
| 1 | [vc.ru / Деньги](https://vc.ru/money/2980387-reestr-platezhnykh-agentov) «Реестр платёжных агентов 2026» | КриптоГрадусник | 15.06.2026 | EastPay, А7 Платежи, Onex | Exnode |
| 2 | [DTF / Железо](https://dtf.ru/hard/4537724-top-platezhnykh-agentov-2026-goda) «ТОП платёжных агентов 2026» | КриптоГрадусник | 16.12.2025 | Global Finance VED, Доверка, RSI Capital | Exnode («гарант сделки») |
| 3 | [vc.ru / Будущее](https://vc.ru/future/2982163-oplata-importnyh-tovarov-kak-vybrat-platezhnogo-agenta-dlya-biznesa) «Оплата импортных товаров» | Exnode | 16.06.2026 | EastPay, A7, Onex | Exnode |
| 4 | [vc.ru / Сервисы](https://vc.ru/services/2953248-platezhnyy-agent-mezhdunarodnye-platezhi) | КриптоГрадусник | 28.05.2026 | EastPay, А7, Onex | Exnode |
| 5 | [vc.ru / Техника](https://vc.ru/tech/2927727-uslugi-platezhnogo-agenta-dlya-biznesa) | В. Комаровский | 19.06.2026 | East Pay, А7, Onex | Exnode |
| 6 | [DTF / Барахолка](https://dtf.ru/barter/5129362-platezhnyy-agent-dlya-yuridicheskikh-lits-ved) | Exnode | 15.06.2026 | А7 (обзор) | Exnode |
| 7 | [vc.ru / AI](https://vc.ru/ai/2877674-a7-agent-kak-rabotayet-servis-i-alternativy-na-rynke-ved) «А7 и альтернативы» | В. Комаровский | 20.04.2026 | RSI Capital, Global Finance VED, Доверка, NNEX | Exnode |
| 8 | [DTF / Музыка](https://dtf.ru/music/5053220-a7-platezhnyy-agent-uslugi-i-preimushchestva-dlya-biznesa) «А7: обзор и альтернативы» | В. Князев | 11.05.2026 | RSI Capital, Global Unitex, NNEX, Global Finance VED, Доверка | Exnode |
| 9 | [DTF / Офтоп](https://dtf.ru/flood/5008965-a7-agent-osobennosti-i-alternativy) | КриптоГрадусник | 20.04.2026 | RSI Capital, Global Finance VED, Доверка, NNEX | Exnode |
| 10 | [DTF / Гайды](https://dtf.ru/howto/3902565-a7-agent-pod-sanktsiyami-alternativy) «А7 и санкции» | В. Князев | 16.07.2025 | Insight, BitOkk (+Win Win) | Exnode |
| 11 | [vc.ru / КриптоГрадусник](https://vc.ru/id4843980/2087534-a7-agent-ili-alternativy-dlya-mezhdunarodnykh-platezhey) | КриптоГрадусник | 08.07.2025 | Win Win, Insight, BitOkk | Exnode |
| 12 | [spark.ru / Exnode](https://spark.ru/startup/exnode/blog/265224/a7-agent-popal-pod-sanktsii-kakie-est-alternativi-sredi-platezhnih-agentov) | Exnode | 2025 | Win Win, Insight, BitOkk | Exnode |
| 13 | [vc.ru / Сервисы](https://vc.ru/services/2790581-oplata-v-kitay-luchshie-platezhnye-agenty-dlya-biznesa) «Оплата в Китай: рейтинг» | КриптоГрадусник | 11.03.2026 | Global Finance VED, NNEX, VedHonest | Exnode |
| 14 | [DTF / Вопросы](https://dtf.ru/ask/5059116-platezhnyy-agent-dlya-oplaty-v-kitay-postavshchikam) | Exnode | 13.05.2026 | RSI Capital, Global Unitex, NNEX, Global Finance VED, Доверка | Exnode |
| 15 | [vc.ru / Маркетинг](https://vc.ru/marketing/2762963-platezhi-v-kitay-2026) | Exnode | 04.03.2026 | Global Finance VED, NNEX, VedHonest | Exnode |
| 16 | [DTF / Гайды](https://dtf.ru/howto/4819895-oplata-v-kitae-luchshie-platezhnye-agenty) | В. Князев | 02.03.2026 | Global Finance VED, NNEX, VedHonest | Exnode |
| 17 | [DTF / Гайды](https://dtf.ru/howto/4839030-oplata-v-kitay-osobennosti-perevodov-i-top-3-servisa-v-2026-godu) | КриптоГрадусник | 12.03.2026 | Global Finance VED, NNEX, VedHonest | Exnode |
| 18 | [DTF / Скриншоты](https://dtf.ru/screenshots/5069914-platezhi-v-kitaj-cherez-agenta) | КриптоГрадусник | 31.05.2026 | East Pay, A7 Агент, Onex | Exnode |
| 19 | [Хабр / блог Exnode](https://habr.com/ru/companies/Exnode/articles/1084134/) «Топ-3 платёжных агентов 2026» | Exnode | 19.09.2026 | Directla, Win Win, SpectrePay | Exnode |
| 20 | [altcoinlog.com](https://altcoinlog.com/reiting-agentov-mezhdunarodnyh-platezhei/) «Топ-10 агентов» | И. Вайнер | 07.03.2026 | Onex, Доверка, Global Finance VED, RSI Capital, NNEX, Collect & Exchange, SwiftOK… | — (реклама: sales@altcoinlog.com) |
| 21 | [resize-web.ru](https://resize-web.ru/blog/platezhnye-agenty/) «ТОП-10 сервисов 2026» | «Редакция ИзмерьВеб» | 14.09.2025 | RSI Capital, Insight, BitOkk, Win-Win, Доверка, Global Finance VED, NNEX, ВЭД Мастер | — (Алиса цитирует почти дословно) |
| 22 | [top-agents.ru](https://top-agents.ru/) «Рейтинг — 2026: методология» | «Топ-Агенты» | ред. 11.09.2026 | «Культура платежей» (KulturaPay), А7 4,0, Точка ВЭД 3,9 | KulturaPay (сравнения «KulturaPay или А7») |
| 23 | [Sostav / блог 288076](https://www.sostav.ru/blogs/288076/86703) «Платежи A7 и альтернативные маршруты» | блог компании | 2026 | — | VedHonest |
| 24 | [Sostav / блог 288583](https://www.sostav.ru/blogs/288583/89115) «Платёжные агенты для юрлиц» | Е. Семенов | 02.06.2026 | — | VedHonest |
| 25 | [Клерк / блог MoneyRoo](https://www.klerk.ru/blogs/moneyroo/648834/) «10 вопросов о платёжных агентах» | MoneyRoo | 27.05.2025 | — | MoneyRoo |
| 26 | [paybeam.ru/ved](https://paybeam.ru/ved) «ВЭД-платежи — рейтинг сервисов» | Paybeam | — | EastPay, Onex, NNEX, Directla | Paybeam |

**Частота брендов в топах 22 подборок с рейтингом (строки 1–5, 7–22, 26) [Ф]:** Exnode продвигается как «инструмент подбора» или «гарант» в 17. Global Finance VED — 11. NNEX — 11. Onex — 7. Доверка — 7. RSI Capital — 7. А7 — 6 (в реестрах в топ-3; в «альтернативах» — объект сравнения, не в счёте). EastPay — 6. Win-Win — 5. Insight / BitOkk — 4. VedHonest — 4. Directla — 2. **United Stream — 0.**

**Масштаб и механика [Ф/О]:**
- **[Ф]** Лента аккаунта «КриптоГрадусник» на vc.ru (subsite 4843980, через API vc.ru): 480 постов за 28.05–23.09.2026, 72 из них по теме платежей, агентов и Китая. На DTF аккаунты 2668001 и 2490151 («Владимир Князев»): по 480 постов с марта 2026, по 50 с лишним о платежах. Пагинация API упиралась в предел, так что реальный объём больше.
- **[Ф]** У всех прочитанных статей на vc.ru 0 комментариев и 0 лайков (API vc.ru). Публикации рассчитаны на поисковый трафик, а не на аудиторию площадки.
- **[Ф]** Явной маркировки «Реклама» и erid в HTML статей не нашлось. Досье А7 указывало, что часть статей КриптоГрадусника помечена «Реклама»; эта проверка не подтвердила и не опровергла. Статус: *не подтверждено*.
- **[О] Как агенты попадают в подборки.** В каждой статье встречается один и тот же пул брендов (Global Finance VED, NNEX, Доверка, RSI Capital, EastPay, Onex), и все ведут на Exnode. Значит, в подборку, по-видимому, попадают через размещение карточки или оплату в мониторинге Exnode, а КриптоГрадусник — его контент-подрядчик. Косвенный признак: в рейтинге на altcoinlog есть контакт для рекламы. Прайс Exnode в открытом доступе не найден.
- **[О] Кто заказывает.** Exnode (мониторинг ВЭД-агентов, «гарант сделки»), VedHonest (агрегатор), KulturaPay (свой рейтинговый сайт), Raketa Pay (свой корпоративный блог на vc.ru, Клерке и DTF), MoneyRoo (Клерк).

**Стоит ли United Stream туда заходить [В]:**
- **Да, выборочно.** (1) Карточка в мониторинге Exnode и попадание в 2–3 подборки на vc.ru и drive2: это даст и выдачу, и цитирование в Алисе (drive2 — источник №1 в geo_audit). (2) Собственный корпоративный блог на vc.ru, Клерке и Sostav с экспертными текстами под своим именем, как у Raketa Pay и MoneyRoo. Это легальнее и надёжнее анонимных ферм.
- **Нет:** анонимные посты в нерелевантных рубриках DTF и пикабу. Риски: модерация (такие посты чистят), репутация («мусорный» фон рядом с брендом), нарушение закона о рекламе без erid. Статьи «А7 плохой» тоже нет: у А7 ресурсы на юридический ответ, а клиенты United Stream — финдиректора, которым важна респектабельность.
- **Своя страница «Альтернативы А7» и сравнение «United Stream vs А7»** на собственном сайте и в корпоративном блоге. По данным geo_audit Алиса отвечает на вопрос 9 без источников, так что первый, кто даст фактологическое сравнение, будет определять этот ответ. Писать фактами (маршруты в ЕС, минимальная сумма, документы), без оценочных слов о санкциях.

### 2.6. Какие форматы выигрывают [О]

| Интент | Формат-победитель | Пример в топе | Есть ли у United Stream |
|---|---|---|---|
| «платежи в {страна} для юрлиц» | лендинг: комиссия, срок, валюта в title; схема; документы; FAQ | tochka.com/rko/platezhi-v-turciyu/, platejka.com, unitedstream.ru/pay-to-turkey/ | да, 16 стран |
| «оплата инвойса в {страна}» | лендинг или статья «оплата инвойса в X: документы, валюта, способы» | vedmaster.ru/import/oplata-invoice/thailand, dalistragroup.com/payments/thailand/, vc.ru | только /invoice/ общий |
| «оплатить {сервис} юрлицу» | карточка сервиса: цена, документы, «как оплатить» | raketapay.ru/oplata/*, pyyplbot.com, platipomiru.com | нет |
| «как…» / валютный контроль / НДС / договор | длинная инструкция с шагами, проводками, кодами СПД | nbr.ru, buhexpert8.ru, allo.tochka.com, klerk.ru | частично, 15 статей |
| «рейтинг / топ / альтернативы / отзывы» | листикл на внешней платформе; отзовик | vc.ru, dtf.ru, drive2, sostav, banki.ru | нет |
| бренд + «отзывы» | карточка Яндекс Карт / 2ГИС, отзовики | yandex.ru/maps, 2gis.ru, zoon.ru | есть (карты 4,8★) |
| калькулятор комиссии / сроков | почти не встречается в топе | — | нет (**свободная ниша**) |

### 2.7. Возможности для United Stream и приоритизация

| # | Инициатива | Потенциал | Сложность | Приоритет | Комментарий |
|---|---|---|---|---|---|
| 1 | Подтвердить индексацию: Вебмастер и GSC, «Проверить URL» для главной и /pay-to-turkey/; снять позиции в Топвизоре по 150 фразам из wordstat-keywords.txt | высокий (без этого всё остальное вслепую) | низкая | **P0** | закрывает главный пробел трека |
| 2 | Хаб Китая: лендинги «оплата инвойса в Китай», «оплата в юанях», «оплата 1688 / Alibaba для юрлиц», «платёж в Китай завис / отказ банка», «Гонконг vs материк» + перелинковка с 6 статьями | высокий | средняя | **P0** | самый большой спрос; позиции в Яндексе не проверены |
| 3 | Матрица «оплата инвойса в {страна}» (16 существующих + Вьетнам, Таиланд, Индонезия, Малайзия, Сингапур, Казахстан, Узбекистан, Армения, Нидерланды, Чехия, Швейцария, Австрия, Израиль, Бразилия) — 30+ страниц; шаблон с уникальными блоками (валюта, банки, типичные товары, сроки, кейс) | высокий | средняя | **P0** | формат уже приносит топ-3 |
| 4 | Переупаковать /pay-to-russia/ под «приём платежей из-за рубежа / экспортная выручка» (title, H1, FAQ) | средний | низкая | **P0** | по «экспортная выручка» уже №3 |
| 5 | Калькулятор комиссии и сроков (страна, валюта, сумма → диапазон комиссии и дней), таблица тарифов по диапазонам сумм | высокий (конверсия + уникальный формат + ссылки) | средняя | **P1** | в топе калькуляторов нет |
| 6 | Хаб знаний для бухгалтера: валютный контроль (СПД 13_4, постановка на учёт, сроки), НДС и налоговый агент, проводки по 76 счёту, закрывающие документы, агентский договор + **шаблоны для скачивания** (договор, поручение, отчёт агента) | средний–высокий | средняя | **P1** | уже №5–7 по этим темам; шаблоны — лид-магнит |
| 7 | Сравнительные страницы: «United Stream vs А7», «Альтернативы А7», «Банк или агент: сравнение», «Как проверить агента» (есть — усилить) | средний | низкая | **P1** | geo: ответы Алисы без источников |
| 8 | Нишевые задачи: WIPO / патентные пошлины, обучение сотрудников, выставки (к Кантонской ярмарке 15.10–04.11.2026), отели и командировки, авто (страны × авто), фрахт | средний (мало спроса, высокий чек и нет конкуренции) | низкая | **P1** | есть кейсы; конкуренты — Raketa Pay и Доверка |
| 9 | Кейсы: каждый кейс — отдельная оптимизированная страница с цифрами (сумма, срок, маршрут), нормальный регистр заголовков, ссылки со страниц стран | средний | низкая | **P1** | 12 кейсов уже есть |
| 10 | Внешние площадки: корпоративный блог на vc.ru и Клерке (2 текста в месяц), Хабр-блог компании (1 в месяц), Sostav, TenChat, Дзен; карточка в Exnode; попадание в 3–5 подборок | высокий (SEO + GEO) | средняя | **P1** | цены блогов — в [paid_partners](paid_partners.md) |
| 11 | Отзывы и локальное: Яндекс Бизнес (есть 4,8/54 — поддерживать), 2ГИС, zoon, otzovik, banki.ru; страница «Отзывы» на сайте; FAQ «не путать с Юнистрим» | высокий для брендового спроса | низкая | **P1** | Алиса путает с Юнистримом |
| 12 | Глоссарий ВЭД-платежей (80–120 терминов: SWIFT, MT103, CIPS, СПД, УНК, инвойс, проформа…) | низкий–средний | средняя | **P2** | у vedmaster 113 терминов |
| 13 | Программные «оплата {сервис} для юрлица» (AWS, Google Cloud, OpenAI, Figma, Adobe, Zoom, GitHub, Atlassian, HubSpot, Canva) | низкий для B2B-агента | средняя | **P2** | поле занято Raketa Pay (443 страницы) и картами для физлиц; делать 1 хаб + 5–10 карточек, только если есть продукт для чеков $100–5000 |
| 14 | YouTube / RuTube / VK Видео: «как проходит платёж», «валютный контроль за 5 минут» | средний (видео попадают в выдачу по вопросам) | средняя | **P2** | в выдаче по «проверить агента» есть VK Видео |
| 15 | Хабр Q&A, Клерк-форум, pikabu — ответы от эксперта с подписью | низкий–средний | низкая | **P2** | точечно на вопросы «как оплатить…» |

---

## 3. Ключевые утверждения

| # | Утверждение | Источники | Статус |
|---|---|---|---|
| 1 | В органике Яндекса (Москва) United Stream на 3-м месте по «оплата в Турцию для юрлиц», 3-м — по «платежи в Германию для юрлиц в евро», 2-м — по «оплата в США для юрлиц в долларах», 3-м — по «экспортная выручка через платежного агента», 5-м — по «агентский договор платежный агент ВЭД» | снимки yandex.ru 24.09.2026 ([Турция](https://yandex.ru/search/?text=%D0%BE%D0%BF%D0%BB%D0%B0%D1%82%D0%B0%20%D0%B2%20%D0%A2%D1%83%D1%80%D1%86%D0%B8%D1%8E%20%D0%B4%D0%BB%D1%8F%20%D1%8E%D1%80%D0%BB%D0%B8%D1%86&lr=213)), [/pay-to-turkey/](https://unitedstream.ru/pay-to-turkey/) | одиночный источник (один снимок; выдача персонализирована и меняется). Проверить в Топвизоре |
| 2 | Страница Турции отдаётся с нормальным title; заглушка KillBot с нашего IP не воспроизводится | curl с UA браузера, YandexBot и Googlebot; выдача Яндекса (Турция в топ-3) | подтверждено (2 независимых признака). Противоречит §1.3 досье — возможно, уже исправлено |
| 3 | United Stream был в рекламе Директа в 7 из 14 снятых выдач; a7.ru — в 7 из 13 выдач основного скрейпа, это самый частый рекламодатель | снимки yandex.ru, ya.ru; [paid_partners](paid_partners.md) §2.1.4 (независимый подсчёт по части выдач) | подтверждено |
| 4 | В объявлении United Stream рейтинг 4,8 и 54 отзыва (Яндекс Бизнес); по «юнайтед стрим отзывы» №1 — карточка в Яндекс Картах | выдача ya.ru «платежный агент»; [geo_audit](geo_audit.md) (выдача Q8) | подтверждено. Опровергает «отзывов нет» в досье |
| 5 | Широкие запросы («международные платежи для бизнеса», «платежный агент вэд», «платежный агент») заняты банками, справочниками и a7.ru; United Stream только в рекламе | снимки yandex.ru; WebSearch в досье §6 (US-индекс) | подтверждено (2 индекса) |
| 6 | platejka.com — самый частый специализированный агент в органике Яндекса по страновым запросам и одновременно рекламодатель («Комиссия 0,2%. Лицензия») | снимки yandex.ru (Турция, Германия, США, Казахстан, «международные платежи»); [paid_partners](paid_partners.md) | подтверждено |
| 7 | Объём сайтов конкурентов по sitemap: raketapay.ru 835 URL (443 «oplata/*»), vedmaster.ru 308 (113 глоссарий), neoved.io 185, platejka.com 153, doverka.com 94, dalistragroup.com 49, a7.ru 28; unitedstream.ru около 57 | sitemap.xml каждого сайта, 24.09.2026 | одиночный источник (sitemap может быть неполным) |
| 8 | Подборки «ТОП платёжных агентов» и «А7 альтернативы» на vc.ru, DTF, spark и Хабре в основном ведут на Exnode (17 из 22); авторы — КриптоГрадусник, Exnode, В. Князев, В. Комаровский | 18 прочитанных статей (§2.5); досье [a7.md](a7.md) §5.3 | подтверждено |
| 9 | Аккаунт КриптоГрадусник на vc.ru опубликовал не меньше 480 постов с 28.05 по 23.09.2026 (около 4 в день), из них 72 о платежах, агентах и Китае | API vc.ru timeline, subsite 4843980 | одиночный источник |
| 10 | United Stream не упомянут ни в одной из 26 прочитанных подборок и рейтингов | §2.5; досье [united_stream.md](united_stream.md) §4 | подтверждено |
| 11 | Самые частые бренды в 22 подборках: Exnode (продвигается в 17), Global Finance VED (11), NNEX (11), Onex, Доверка, RSI Capital (по 7), А7, EastPay (по 6) | подсчёт по 22 подборкам | одиночный источник (наш подсчёт; выборка неслучайная) |
| 12 | top-agents.ru ставит на 1-е место «Культура платежей» (KulturaPay), на 2-е А7 (4,0), на 3-е Точку ВЭД (3,9); редакция от 11.09.2026 | [top-agents.ru](https://top-agents.ru/); выдача Q2 в geo_audit (сайт в топе) | подтверждено (что это, по-видимому, сайт KulturaPay, — оценка) |
| 13 | Нишу «оплатить AWS / OpenAI / Figma / Google Ads» занимают Raketa Pay, сервисы карт (pyyplbot, platipomiru, getcard) и vc/DTF; AWS не обслуживает российских юрлиц с 2024 | WebSearch ×4; выдача Q6 в geo_audit; [vc.ru](https://vc.ru/services/2748277-oplata-aws-iz-rossii-v-2026-godu) | подтверждено (2 индекса) |
| 14 | Статьи блога United Stream уже ранжируются в Яндексе по информационным темам: валютный контроль через агента (≈7), проверка агента (≈9), агентский договор (5) | geo_audit (выдача Q11, Q12); наш снимок (агентский договор) | подтверждено |
| 15 | Калькуляторов комиссии и сроков в топе по изученным запросам нет | снимки yandex.ru, WebSearch | не подтверждено (видели только заголовки; калькулятор может быть внутри страниц конкурентов) |

---

## 4. Выводы для маркетинга United Stream

1. **Начать с измерений, а не с контента.** Подключить Топвизор или Key Collector с регионами Москва и СПб, снять 150 фраз из [wordstat-keywords.txt](../wordstat-keywords.txt), выгрузить запросы из Вебмастера. Наш снимок показывает: сайт на странах в Яндексе сильнее, чем думали, а про Китай данных нет совсем.
2. **Масштабировать то, что работает: страновые лендинги.** Формат «Платежи в {страна} для юрлиц и ИП | комиссия | срок» уже даёт топ-3 без внешних ссылок. Следующий шаг — 30–40 страниц «оплата инвойса в {страна}» и «оплата в {валюта}» по одному шаблону с уникальными блоками. Этим путём уже идут vedmaster, payforved, neoved.
3. **Китай — главный спрос, и его пока никто за United Stream не взял.** Хаб из 8–12 страниц с перелинковкой на 6 уже написанных статей. Отдельно — «проблемы»: платёж завис, отказ китайского банка, возврат. Это самый «горячий» информационный вход.
4. **Отстраиваться форматом, а не ценой.** У всех «0,3%», у Platejka уже «0,2%». Свободная ниша — открытый калькулятор и таблица тарифов по диапазонам сумм, плюс шаблоны документов для бухгалтера. Это даёт ссылки, конверсию и цитирование нейросетями.
5. **Внешний контур нужен и для SEO, и для нейропоиска.** Широкие запросы и все «рейтинг / альтернативы / отзывы» решаются вне сайта. Минимальный пакет: корпоративные блоги на vc.ru и Клерке, блог на Хабре, карточка в Exnode, 3–5 подборок на vc.ru и drive2, отзывы в 2ГИС и на banki.ru. Анонимные фермы в рубриках DTF — нет.
6. **Защитить бренд.** По «юнайтед стрим отзывы» №1 уже своя карточка в Картах, это хорошо. Но Алиса путает бренд с Юнистримом. Нужны FAQ «United Stream ≠ Юнистрим», страница «Юридическая структура» (ООО «ЮНАЙТЕД СТРИМ», ИНН 9701326060, и договорная сторона АЗИЗОГЛУ ЛИМИТЕД — одна формулировка) и страница отзывов.
7. **SaaS-хабы — не первым делом.** Поле «оплатить {сервис}» — это сотни страниц Raketa Pay и сервисы виртуальных карт для физлиц. Средний чек там мал, а у AWS и Google есть прямые запреты для российских юрлиц. Оставить один хаб «зарубежные сервисы для бизнеса с закрывающими документами» и 5–10 карточек (Figma, Adobe, Atlassian, HubSpot, Zoom), если бизнес готов брать такие платежи.
8. **Исправить мелкие дефекты сайта**: H1 на Японии и Корее, заголовки кейсов капсом, FAQPage-разметка на страницах стран, переименование /pay-to-russia/. Это дёшево и быстро.

---

## 5. Пробелы

- **Яндекс по 29 запросам не снят** из-за капчи и обрывов соединения: весь Китай (5 запросов), Гонконг, ОАЭ, Индия, Корея, Вьетнам, Таиланд, Италия, Великобритания, евро-инвойс, выкуп, услуги, обучение, выставки, WIPO, AWS/OpenAI/Google Ads, софт, НДС, рейтинги, «юнайтед стрим». Нужен Топвизор, Вебмастер или ручной просмотр.
- **Реальная выдача Google (google.ru) не снята**: google.com отдаёт капчу. Вместо неё WebSearch (американский индекс) — ориентир, не позиции в РФ.
- **Частотности** — за сессией Wordstat. Здесь относительные оценки.
- **KillBot:** с нашего IP не воспроизводится. Нужна проверка из Вебмастера и GSC; возможно, российские IP ведут себя иначе.
- **Условия попадания в Exnode и подборки КриптоГрадусника** (прайс, модель оплаты) публично не найдены. Нужен запрос от имени компании.
- **Трафик статей-подборок:** vc.ru и DTF API не отдают просмотры (counters.views = 0), так что охват паразитного SEO не измерен.
- **Пикабу и Дзен** специально не сканировались: в выдаче по «а7 альтернативы» есть dzen.ru, но состав авторов на Дзене не изучен.
- **Позиции по брендовым и конкурентным запросам в динамике** (после санкционных новостей 22.09.2026) не отслеживались.
- **Повторные проходы скрейпера** по недостающим запросам ещё шли в момент фиксации файла. Если данные появятся, их можно добавить в §2.3 отдельным коммитом.
