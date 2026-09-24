# GEO-аудит: как United Stream выглядит в нейропоиске (трек `geo_audit`)

*Дата среза: 24.09.2026. Обозначения: **[Ф]** — факт со ссылкой, **[О]** — оценка, **[В]** — вывод для маркетинга. Сырые ответы целиком лежат в [`geo_audit_raw.md`](geo_audit_raw.md).*

## Метод и ограничения

**Что планировали.** Задать 12 вопросов из [`perplexity-geo-prompts.md`](../perplexity-geo-prompts.md) в Perplexity и ещё в одном-двух нейропоисках, каждый раз в новом чате.

**Что оказалось недоступно**
- **Perplexity.** Коннектора в сессии нет. perplexity.ai отвечает 403 и через curl, и через браузер (Playwright): прокси организации не пускает на этот хост (`ERR_TOO_MANY_RETRIES`).
- **Другие публичные нейропоиски** (пробовали около 20 минут):
  - duck.ai: страница открылась, но чат падает на `duckchat/v1/status 502`;
  - Copilot: кнопка отправки неактивна;
  - you.com: требует входа;
  - Brave «Answer with AI»: капча;
  - iAsk: «We can't find the internet»;
  - Felo: капча «проверка безопасности»;
  - phind.com: 403.
- **Быстрый ответ Алисы в обычной выдаче yandex.ru** для этого IP без авторизации не появился ни на одном из пробных запросов. В HTML есть только `misspell`, `legal` и видео, блока нейроответа нет.

**Что сработало.** Чат **Алиса AI** (Яндекс) без логина открывается по ссылке `https://yandex.ru/alice?alice_deeplink={"text":"<вопрос>"}`. Это та же ссылка, что стоит на вкладке «Алиса AI» в выдаче Яндекса. Браузерный WebSocket к `uniproxy.alice.yandex.ru` через прокси получал 400, поэтому его пришлось пробросить через node-клиент `ws`. Ответ и список источников брали из служебного блока `sources_card`: там те же ссылки, что Алиса показывает под кнопкой «Источники».
- **Прогон A:** все 12 вопросов, каждый в новом браузерном контексте, то есть в новом чате.
- **Прогон B:** повтор вопросов 1, 2, 3, 7, 8, 9, чтобы проверить устойчивость ответов.
- **Итого 18 ответов** и 70 позиций в списках источников.
- **[Ф] В 12 из 18 ответов** интерфейс пометил: «Это ответ менее мощной модели. Из-за высокой нагрузки последняя версия Alice AI будет доступна позже». Выводы поэтому относятся к тому, что Алиса отвечала анонимному пользователю 24.09.2026 около 12:00 МСК. Пользователь с логином и на полной модели может получить другой ответ.

**Контрольная проверка по выдаче (вариант «c»).** Для сверки «нейроответ + выдача» собрана органическая выдача yandex.ru (lr=213) по вопросам **1, 2, 3, 6, 10, 11 и 12**. По брендовым вопросам собрана выдача Q8 и дополнительного запроса «united stream unitedstream.ru». По остальным (4, 5, 7, 9) выдача не собралась: на IP шёл параллельный скрейп, была капча и обрывы `ERR_TOO_MANY_RETRIES`. Этот пробел описан в §5.

**WebSearch:** 1 запрос, про форматы Алисы AI в поиске.

---

## 1. Главное

1. **[Ф] В 12 небрендовых ответах Алисы United Stream не упоминается ни разу.** Это вопросы 1–6 и 10–12 плюс повторы 1–3. Сайт не попал ни в один список источников по этим вопросам. В выдаче по вопросу 1 United Stream стоит **только в рекламе** (1-я и 20-я позиции, «промо»), а в органическом топ-19 его нет ([выдача Q1](https://yandex.ru/search/?text=%D0%9A%D0%B0%D0%BA%D0%BE%D0%B9%20%D0%BF%D0%BB%D0%B0%D1%82%D1%91%D0%B6%D0%BD%D1%8B%D0%B9%20%D0%B0%D0%B3%D0%B5%D0%BD%D1%82%20%D0%BB%D1%83%D1%87%D1%88%D0%B5%20%D0%B2%D1%8B%D0%B1%D1%80%D0%B0%D1%82%D1%8C%20%D0%B4%D0%BB%D1%8F%20%D0%BE%D0%BF%D0%BB%D0%B0%D1%82%D1%8B%20%D0%B8%D0%BD%D0%B2%D0%BE%D0%B9%D1%81%D0%B0%20%D0%BF%D0%BE%D1%81%D1%82%D0%B0%D0%B2%D1%89%D0%B8%D0%BA%D1%83%20%D0%B2%20%D0%9A%D0%B8%D1%82%D0%B0%D0%B5%20%D0%B2%202026%20%D0%B3%D0%BE%D0%B4%D1%83%3F%20%D0%A1%D1%80%D0%B0%D0%B2%D0%BD%D0%B8%20%D0%BF%D0%BE%20%D0%BA%D0%BE%D0%BC%D0%B8%D1%81%D1%81%D0%B8%D0%B8%2C%20%D1%81%D1%80%D0%BE%D0%BA%D0%B0%D0%BC%20%D0%B8%20%D0%BD%D0%B0%D0%B4%D1%91%D0%B6%D0%BD%D0%BE%D1%81%D1%82%D0%B8.&lr=213)). **[В]** Для нейропоиска бренд пока не существует вне брендовых запросов.
2. **[Ф] Чаще всего Алиса называет А7: 6 ответов из 18.** В вопросе 1 (прогон A) она прямо советует «выбирайте A7» как самый дешёвый вариант (0,36%). Ни в одном ответе нет ни слова о санкциях против А7-Агента или о расследовании FT, хотя это есть в [досье А7](a7.md). Дальше идут Win-Win (4), RSI Capital (3), Directla, NNEX, ВЭД Мастер, Доверка и Insight (по 2).
3. **[Ф] Главный поставщик источников — контент Exnode.** Это блог на [drive2.ru](https://www.drive2.ru/o/b/734477891596731281/) (6 ответов), статьи на [habr.com](https://habr.com/ru/companies/Exnode/articles/1062690/) (3), [klerk.ru](https://www.klerk.ru/blogs/exnode/653676/) (1) и [exnode.ru](https://exnode.ru/b2b) (1). Всего 11 из 70 позиций в источниках, около 16%. Следом идут sostav.ru (5 ответов), banki.ru (4), resize-web.ru (3; из его «ТОП-10» Алиса берёт рейтинг агентов).
4. **[Ф] На брендовый вопрос 8 «Юнайтед Стрим: отзывы…» Алиса в обоих прогонах подставляет Юнистрим.** В органической выдаче по этому запросу Юнистрим тоже стоит 4-м и 9-м ([otzovik](https://otzovik.com/reviews/mezhdunarodnaya_sistema_denezhnih_perevodov_yunistrim/), [unistream.ru](https://unistream.ru/)). При этом 1-е место занимает собственная [карточка United Stream с отзывами в Яндекс Картах](https://yandex.ru/maps/org/united_stream/83728548080/reviews/), но Алиса её не использует. Источники: [otzovik](https://otzovik.com/reviews/mezhdunarodnaya_sistema_denezhnih_perevodov_yunistrim/), [irecommend](https://irecommend.ru/content/denezhnye-perevody-yunistrim), [banki.ru/unistream](https://www.banki.ru/services/responses/bank/unistream/). В прогоне A она смешала сайт United Stream с жалобами на Юнистрим: «потеря денежных средств», «высокие комиссии». Прогон B целиком про Юнистрим. С United Traders путаницы не замечено.
5. **[Ф] На вопрос 7 «Можно ли доверять?» Алиса отвечает «надёжный», но аргументы опасные.** В прогоне A она отождествляет бренд с **ООО «ЮНАЙТЕД СТРИМ»** (ИНН 9701326060, регистрация 11.03.2026, УК 10 000 ₽, директор Гуменюк С. И.) по [checko.ru](https://checko.ru/company/yunayted-strim-1267700083529). Юрлицо подтверждается по [saby.ru](https://saby.ru/profile/9701326060-970101001). Дальше она пишет, что компания подходит, «когда требуется… **работа с санкционными товарами**». В прогоне B она пересказывает маркетинговые цифры с [/o-nas/](https://unitedstream.ru/o-nas/) («100% успешность», «риски отказа менее 0,01%», «отсутствие российского следа») и примешивает отзывы о Юнистриме с [hf.ru](https://hf.ru/services/unistream) и [banki.ru](https://www.banki.ru/services/responses/bank/unistream_mt/).
6. **[Ф] На вопрос 9 «Сравни United Stream и А7» Алиса оба раза отвечает без источников.** Это общие фразы-галлюцинации: «международная платёжная система», «шифрование и двухфакторная аутентификация». **[В]** Сравнительной страницы United Stream против А7 в индексе нет. Кто её создаст, тот и будет определять этот ответ.
7. **[Ф] На вопрос 3 «Альтернативы А7 после санкций ЕС» Алиса оба раза отвечает без источников и советует SWIFT, СБП, криптовалюту, Wise и PayPal.** При этом в органической выдаче по тому же вопросу 6 из 14 результатов — статьи вида «А7 под санкциями: где искать альтернативу». Три из них написал Exnode ([spark.ru/exnode](https://spark.ru/startup/exnode/blog/265224/a7-agent-popal-pod-sanktsii-kakie-est-alternativi-sredi-platezhnih-agentov), [exnode.ru](https://exnode.ru/community/articles/a7-agent-pod-sanktsiyami-chto-delat-i-gde-iskat-al-ternativu), [partnerkin / Exnode](https://partnerkin.com/tribuna/blog-exnoderu/a7-agent-pod-sankciyami-chto-d)), остальные — [vc.ru](https://vc.ru/services/2103230-a7-pod-sanktsiyami-alternativy-dlya-mezhdunarodnykh-platezhey), [dtf.ru](https://dtf.ru/howto/3902565-a7-agent-pod-sanktsiyami-alternativy) и [sostav](https://www.sostav.ru/blogs/288076/86703). **[В]** Это окно возможностей: нишу займёт первый, кто даст короткий, цитируемый ответ.
8. **[Ф] Ответы нестабильны.** В вопросе 1 два прогона называют почти разные списки агентов: A7, RSI Capital, Win-Win против EastPay, Directla, Insight, Bitokk, Win-Win. Общий только Win-Win. Рейтинг в вопросе 2 устойчивее: 5 брендов совпали, все взяты из одной подборки [resize-web.ru](https://resize-web.ru/blog/platezhnye-agenty/). **[В]** Попасть в 2–3 ключевые подборки или рейтинга надёжнее, чем бороться за одну позицию.
9. **[Ф] Свои каналы United Stream нейропоиск уже видит, но только по брендовым вопросам.** В источниках есть [unitedstream.ru/](https://unitedstream.ru/) с корректным title «Международные платежи для бизнеса | ЮНАЙТЕД СТРИМ», [/o-nas/](https://unitedstream.ru/o-nas/) и [ПромоСтраница бренда](https://unitedstream.promo.page/) в Яндексе. Блог United Stream по темам вопросов 10–12 (валютный контроль, зависший платёж) Алиса **не цитирует ни разу**, хотя по Q11 и Q12 статьи блога стоят в органическом топ-10 ([9-я](https://unitedstream.ru/blog/kak-yurlicu-vybrat-platezhnogo-agenta/) и [7-я](https://unitedstream.ru/blog/platezhnyj-agent-oplata-postavshchiku-za-rubezhom/)). **[В]** Одного топ-10 мало. Алиса берёт документы с первых позиций и тексты со структурой «шаги / чек-лист / таблица». Вместо него она берёт банк «Левобережный», globalpo, legalwording, klerk, sostav и Exnode.

---

## 2. Подробное досье

### 2.1. Карточки по вопросам

Формат карточки: кого назвала Алиса (в порядке появления) → источники → есть ли United Stream → комментарий. Прогон A и прогон B разделены знаком «/».

**Вопрос 1. Какой платёжный агент лучше для инвойса в Китай в 2026? (A и B)**
- *Бренды:* A: **A7** («0,36%, без минимального порога… выбирайте A7»), RSI Capital (0,49%), Win-Win (0,5%). / B: EastPay, Directla, **Insight** («лидер по версии Exnode», 0,3% + НДС, рекомендован), Bitokk, Win-Win.
- *Источники:* A: [ppt.ru](https://ppt.ru/art/plateji/invoysy-v-kitay), [drive2 / Exnode](https://www.drive2.ru/o/b/734477891596731281/), [banki.ru/knr](https://www.banki.ru/products/currency/transfers/knr/), [sostav](https://www.sostav.ru/blogs/286884/84377), [cleverence](https://www.cleverence.ru/articles/finansy/-kak-vybrat-bank-dlya-vedplatezhey-v-kitay/). / B: [habr / Exnode](https://habr.com/ru/companies/Exnode/articles/1062690/), [klerk / Exnode](https://www.klerk.ru/blogs/exnode/653676/), тот же drive2, sostav, cleverence.
- *United Stream:* нет.
- *Выдача Яндекса:* United Stream — реклама №1 и №20. Органика: sostav, icustoms, **habr / Exnode 1062690**, **drive2**, tochka, psbank, rcfincenter, klerk, **cleverence**, tnlgroup, impostrade, globalpo, kp, spi-grupp. **[О]** Три домена из пяти источников Алисы стоят в органическом топ-14 выдачи. Нейроответ собирается из верхушки выдачи.

**Вопрос 2. Рейтинг надёжных платёжных агентов для юрлиц (A и B)**
- *Бренды:* A: Directla, Win-Win, SpectrePay, A7, NNEX, RSI Capital, ВЭД Мастер, Доверка. / B: RSI Capital, Win-Win Swift, ВЭД Мастер, Insight, NNEX, Доверка, BSPAY PRO.
- *Источники:* [resize-web.ru «ТОП-10»](https://resize-web.ru/blog/platezhnye-agenty/) (в обоих прогонах), [habr / Exnode 1084134](https://habr.com/ru/companies/Exnode/articles/1084134/), [drive2 / Exnode](https://www.drive2.ru/o/b/716109175465183650/), [exnode.ru/b2b](https://exnode.ru/b2b), [cossa](https://www.cossa.ru/special/paysystem/277473/). / B: [habr / Exnode 1064124](https://habr.com/ru/companies/Exnode/articles/1064124/), [vc.ru «ТОП-5 для Китая»](https://vc.ru/money/1369674-platezhnyi-agent-dlya-oplaty-v-kitai-top-5-kompanii-dlya-bezopasnoi-oplaty-inostrannomu-postavshiku-v-2026-godu), [digitalkassa](https://digitalkassa.ru/blog/top-7-servisov-dlya-priema-platezhej-iz-za-rubezha/).
- *United Stream:* нет.
- *Выдача Яндекса ([запрос](https://yandex.ru/search/?text=%D0%A1%D0%BE%D1%81%D1%82%D0%B0%D0%B2%D1%8C%20%D1%80%D0%B5%D0%B9%D1%82%D0%B8%D0%BD%D0%B3%20%D0%BD%D0%B0%D0%B4%D1%91%D0%B6%D0%BD%D1%8B%D1%85%20%D0%BF%D0%BB%D0%B0%D1%82%D1%91%D0%B6%D0%BD%D1%8B%D1%85%20%D0%B0%D0%B3%D0%B5%D0%BD%D1%82%D0%BE%D0%B2%20%D0%B4%D0%BB%D1%8F%20%D1%8E%D1%80%D0%BB%D0%B8%D1%86%20%D0%B2%20%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D0%B8%20%D0%B4%D0%BB%D1%8F%20%D0%BC%D0%B5%D0%B6%D0%B4%D1%83%D0%BD%D0%B0%D1%80%D0%BE%D0%B4%D0%BD%D1%8B%D1%85%20%D0%BF%D0%BB%D0%B0%D1%82%D0%B5%D0%B6%D0%B5%D0%B9.&lr=213)):* органика — [klerk / Raketa Pay](https://www.klerk.ru/blogs/raketa-pay/699662/), **[exnode.ru/b2b](https://exnode.ru/b2b)**, [altcoinlog](https://altcoinlog.com/reiting-agentov-mezhdunarodnyh-platezhei/), **[resize-web.ru](https://resize-web.ru/blog/platezhnye-agenty/)**, **[habr / Exnode 1084134](https://habr.com/ru/companies/Exnode/articles/1084134/)**, [drive2 / Exnode](https://www.drive2.ru/o/b/712855170802779542/), [vc.ru](https://vc.ru/life/2181712-ved-agent-luchshie-platezhnye-resheniya-2025), platejka.com, [investing.com / «Мониторинг платёжных агентов Exnode»](https://ru.investing.com/studios/article-90433), dtf.ru, [sravni.ru/biznes-ved](https://www.sravni.ru/biznes-ved/), [top-agents.ru](https://top-agents.ru/), **cossa**, [paybeam.ru](https://paybeam.ru/ved). United Stream нет. Четыре источника Алисы (выделены) стоят в органическом топ-14.
- *Комментарий:* **[В]** Рейтинг Алиса почти целиком переписывает из resize-web.ru. Попадание в такие «ТОП-N» — прямой путь в ответ. Кроме подборок из ответа, в выдаче есть ещё рейтинги altcoinlog, top-agents.ru, sravni.ru, paybeam: кандидаты для включения.

**Вопрос 3. Альтернативы А7 после санкций ЕС (A и B)**
- *Бренды:* A7 (как объект вопроса), SWIFT, СБП/НСПК, криптовалюта, «TransferWise, PayPal». Агентов-конкурентов не названо.
- *Источники:* **нет** в обоих прогонах.
- *United Stream:* нет.
- *Выдача Яндекса ([запрос](https://yandex.ru/search/?text=%D0%9A%D0%B0%D0%BA%D0%B8%D0%B5%20%D0%B5%D1%81%D1%82%D1%8C%20%D0%B0%D0%BB%D1%8C%D1%82%D0%B5%D1%80%D0%BD%D0%B0%D1%82%D0%B8%D0%B2%D1%8B%20%D0%BF%D0%BB%D0%B0%D1%82%D1%91%D0%B6%D0%BD%D0%BE%D0%BC%D1%83%20%D0%B0%D0%B3%D0%B5%D0%BD%D1%82%D1%83%20%D0%907%20%D0%BF%D0%BE%D1%81%D0%BB%D0%B5%20%D1%81%D0%B0%D0%BD%D0%BA%D1%86%D0%B8%D0%B9%20%D0%95%D0%A1%3F&lr=213)):* органика по порядку — [spark.ru / Exnode](https://spark.ru/startup/exnode/blog/265224/a7-agent-popal-pod-sanktsii-kakie-est-alternativi-sredi-platezhnih-agentov), [vc.ru](https://vc.ru/services/2103230-a7-pod-sanktsiyami-alternativy-dlya-mezhdunarodnykh-platezhey), [bcaun.com](https://www.bcaun.com/insights/a7_network), [exnode.ru](https://exnode.ru/community/articles/a7-agent-pod-sanktsiyami-chto-delat-i-gde-iskat-al-ternativu), [dtf.ru](https://dtf.ru/howto/3902565-a7-agent-pod-sanktsiyami-alternativy), advolaw, [partnerkin / Exnode](https://partnerkin.com/tribuna/blog-exnoderu/a7-agent-pod-sankciyami-chto-d), [sostav](https://www.sostav.ru/blogs/288076/86703), [rbc.ru](https://www.rbc.ru/finances/10/08/2026/6a79b8e560f847fae7773081), dzen, thebell, caliber.az, [finance.mail.ru](https://finance.mail.ru/article/finteh-kompaniya-a7-provela-tranzaktsii-na-69-mlrd-v-obhod-sanktsij-protiv-rossii-69228945/), bfm.ru. Реклама: Т-Банк, optimalog, kk.ru и др. United Stream нет ни в органике, ни в рекламе.
- *Комментарий:* **[О]** Нейроответ расходится с выдачей. Алиса не опирается на документы и советует сервисы, недоступные российскому юрлицу (Wise, PayPal). **[В]** Точная FAQ-страница «Альтернативы А7» с датой и таблицей имеет шанс стать источником.

**Вопрос 4. Как оплатить поставщику в Германии в евро (A)**
- *Бренды:* нет. Описаны схемы: платёжный агент (2–5%, 1–3 дня), логистический оператор, третья страна, бартер.
- *Источники:* [raketapay.ru](https://raketapay.ru/blog/oplata-evropeyskih-kontragentov-iz-rossii-kakie-strany-es-prinimayut-platezhi-i-), [global-alians.com](https://global-alians.com/blog/kak-oplatit-postavshiku-v-evropu/), [drive2 / Exnode](https://www.drive2.ru/o/b/736902864491783139/), [rterminal.ru](https://rterminal.ru/blog/oplata_postavwikam_v_evropu_v_2026_godu_rabochie_shemy_raschetov_dlya_importerov/), [sostav](https://www.sostav.ru/blogs/284589/101709).
- *United Stream:* нет, хотя у него есть страница [/pay-to-germany/](https://unitedstream.ru/pay-to-germany/).
- *Комментарий:* **[В]** Все пять источников — блоги агентов со схемами в заголовке («4 рабочих схемы…»). Цитируются статьи блога, а не посадочные страницы.

**Вопрос 5. Через кого ИП может оплатить товар в ОАЭ или Турции (A)**
- *Бренды:* нет. Общая схема через агента: 1 рабочий день, пошаговая инструкция.
- *Источники:* [drive2 / Exnode](https://www.drive2.ru/o/b/710102268564735879/), [globalpo.ru](https://globalpo.ru/blog/oplata-invoisa-v-oae), [sostav](https://www.sostav.ru/blogs/282919/63850), [tochka.com](https://tochka.com/rko/platezhi-iz-za-granicy/), [1tab.co](https://1tab.co/ru/receive-payment-worldwide/).
- *United Stream:* нет. Страницы [/pay-to-uae/](https://unitedstream.ru/pay-to-uae/) и [/pay-to-turkey/](https://unitedstream.ru/pay-to-turkey/) не процитированы.

**Вопрос 6. Как юрлицу оплатить AWS, Google Cloud, OpenAI API (A)**
- *Бренды:* нет. Три способа: агент (2–4%), иностранная карта, своё зарубежное юрлицо.
- *Источники:* [upayment.ru](https://upayment.ru/blog/kak-oplatit-aws-gcp-azure-openai-iz-rossii/), [kosareva.cloud](https://kosareva.cloud/news/kak-platit-za-openai-api-iz-rossii-2026), [pikabu](https://pikabu.ru/story/kak_oplatit_open_ai_v_rossii_obzor_sposobov_oplatyi_v_2026_godu_13768477), [vc.ru](https://vc.ru/services/2966723-kak-oplatit-openai-api-iz-rossii), [dtf.ru](https://dtf.ru/bestrate/4416987-kak-oplatit-openai-v-rossii-v-2025-godu).
- *United Stream:* нет. **[О]** Страница [/oplata-uslug/](https://unitedstream.ru/oplata-uslug/) — про приём платежей и роялти, а не про оплату SaaS. Отдельной статьи под этот вопрос нет.
- *Выдача Яндекса ([запрос](https://yandex.ru/search/?text=%D0%9A%D0%B0%D0%BA%20%D1%8E%D1%80%D0%BB%D0%B8%D1%86%D1%83%20%D0%B8%D0%B7%20%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D0%B8%20%D0%BE%D0%BF%D0%BB%D0%B0%D1%82%D0%B8%D1%82%D1%8C%20%D0%BF%D0%BE%D0%B4%D0%BF%D0%B8%D1%81%D0%BA%D1%83%20%D0%BD%D0%B0%20AWS%20/%20Google%20Cloud%20/%20OpenAI%20API%3F&lr=213)):* органика — raketapay (AWS), klerk / Raketa Pay, habr, neoved.io, a5pay, platipomiru, sostav, kosareva.cloud, saikyo, **upayment**, oplatym-card, vc.ru, companies.rbc. United Stream нет. Тема плотно занята блогами агентов (Raketa Pay — 2 позиции сверху).

**Вопрос 7. Что известно о United Stream? Можно ли доверять? (A и B)** — выводы в §1 (п. 4–6) и §4.2
- *Источники:* A: [unitedstream.ru/](https://unitedstream.ru/), [unitedstream.promo.page](https://unitedstream.promo.page/), [checko.ru / ООО «ЮНАЙТЕД СТРИМ»](https://checko.ru/company/yunayted-strim-1267700083529), [resize-web.ru](https://resize-web.ru/blog/platezhnye-agenty/), [platejka.com](https://platejka.com/). / B: [/o-nas/](https://unitedstream.ru/o-nas/), [hf.ru / Юнистрим](https://hf.ru/services/unistream), [banki.ru / Юнистрим](https://www.banki.ru/services/responses/bank/unistream_mt/), [dtf.ru / А7 отзывы](https://dtf.ru/id2490151/3883324-platezhnyy-agent-a7-otzyvy-i-usloviya), platejka.com.
- *Вердикт Алисы:* оба раза «надёжный».

**Вопрос 8. Юнайтед Стрим: отзывы, комиссии, условия (A и B)** — выводы в §1 (п. 4–6) и §4.2
- *Выдача Яндекса ([запрос](https://yandex.ru/search/?text=%D0%AE%D0%BD%D0%B0%D0%B9%D1%82%D0%B5%D0%B4%20%D0%A1%D1%82%D1%80%D0%B8%D0%BC%3A%20%D0%BE%D1%82%D0%B7%D1%8B%D0%B2%D1%8B%2C%20%D0%BA%D0%BE%D0%BC%D0%B8%D1%81%D1%81%D0%B8%D0%B8%2C%20%D1%83%D1%81%D0%BB%D0%BE%D0%B2%D0%B8%D1%8F.&lr=213)):* органика по порядку —
  1. [карточка «United Stream» в Яндекс Картах с отзывами (СПб, Горьковская)](https://yandex.ru/maps/org/united_stream/83728548080/reviews/);
  2. ссылка на чат Алисы;
  3. [unitedstream.ru](https://unitedstream.ru/);
  4. **[otzovik / Юнистрим](https://otzovik.com/reviews/mezhdunarodnaya_sistema_denezhnih_perevodov_yunistrim/)**;
  5. [t.me/unitedstream](https://t.me/unitedstream);
  6. [united-stream.clients.site](https://united-stream.clients.site/);
  7. [unitedstreamtr.com](https://unitedstreamtr.com/) (карго Турция–Европа, однофамилец);
  8. [zoon.ru](https://zoon.ru/msk/business/yunajted_strim/);
  9. **[unistream.ru](https://unistream.ru/)**;
  10. [checko / ООО «ЮНАЙТЕД СТРИМ»](https://checko.ru/company/yunayted-strim-1267700083529);
  11. [inforegister.ee / UNITED STREAM OÜ](https://www.inforegister.ee/ru/12380232-UNITED-STREAM-OU/);
  12. [2gis](https://2gis.ru/moscow/firm/70000001113023077);
  13. [unitedstream.eu](https://unitedstream.eu/about_us).

  Реклама: ПромоСтраница бренда.
- *Вывод по выдаче:* **[Ф]** Юнистрим занимает 2 из 13 органических позиций по брендовому запросу, так что путаница видна и в выдаче. **[О]** Собственные отзывы (Яндекс Карты — 1-я позиция, zoon, 2ГИС) Алиса в ответ не взяла, а отзывы о Юнистриме взяла.
- *Источники Алисы:* A: [/o-nas/](https://unitedstream.ru/o-nas/), [otzovik / Юнистрим](https://otzovik.com/reviews/mezhdunarodnaya_sistema_denezhnih_perevodov_yunistrim/), [irecommend / Юнистрим](https://irecommend.ru/content/denezhnye-perevody-yunistrim), [hf.ru / Юнистрим](https://hf.ru/services/unistream), [banki.ru / Юнистрим](https://www.banki.ru/services/responses/bank/unistream/). / B: otzovik, irecommend, banki.ru (всё Юнистрим), [ppc.world](https://ppc.world/articles/top-8-servisov-dlya-priema-donatov-v-20252026-godu-obzor-sravnenie/), [habr / tehrevizor](https://habr.com/ru/companies/tehrevizor/articles/1011674/).

**Вопрос 9. Сравни United Stream и А7 для платежей в Китай (A и B)** — выводы в §1 (п. 4–6) и §4.2
- *Источники:* **нет** в обоих прогонах.
- *Содержание:* A: сроки United Stream 1–3 дня против А7 1–5 дней, «обе системы надёжны». B: А7 «быстрее, иногда в течение 24 часов», интерфейс «интуитивнее».
- *Санкции А7:* не упомянуты ни разу.

**Вопрос 10. Почему банк не проводит платёж в Китай и что делать (A)**
- *Бренды:* нет. Совет — использовать «платёжных агентов или компании в третьих странах (ОАЭ, Гонконг)», тестовые суммы, юани или дирхамы.
- *Источники:* [kitau.ru](https://kitau.ru/stati/proizvodstvo/kitayskie-banki-otkazyvayutsya-prinimat-platezhi-iz-rossii-naskolko-vse-serezno/), [companies.rbc.ru](https://companies.rbc.ru/news/IPXdn4h74U/rossiya---kitaj-kak-izmenilis-pravila-igryi-po-platezham-i-logistike/), [forbes.ru](https://www.forbes.ru/finansy/520437-banki-rossii-stali-otkazyvat-sa-perevodit-den-gi-v-kitaj-bez-garantij-priema-plateza), [meduza.io](https://meduza.io/cards/kitayskie-banki-vse-chasche-otkazyvayutsya-rabotat-s-rossiey-oni-chto-prisoedinilis-k-sanktsiyam-i-chem-eto-grozit-rossiyskoy-ekonomike), [intellectpro.ru](https://www.intellectpro.ru/press/works/kitay_ostanovil_priem_platezhey_fors_mazhor/).
- *United Stream:* нет. Статья [«Платёж в Китай завис: что делать»](https://unitedstream.ru/blog/platezh-v-kitaj-zavis-chto-delat/) не процитирована.
- *Выдача Яндекса:* реклама — Точка, Солидарность, bezebee, moneyport. Органика: klerk, rcfincenter, weline, VK Видео, **forbes**, secrets.tbank, **intellectpro**, rclaw, etalon-cons, iz.ru, in-smart-logistics, kp, dzen, psbank. Два источника Алисы стоят в органическом топ-12.

**Вопрос 11. Как проверить платёжного агента перед первой оплатой (A)**
- *Бренды:* **VedHonest** как «агрегатор проверенных агентов».
- *Советы:* счёт 40821, тестовый платёж, проверка по ФНС, отзывы.
- *Источники:* [sostav](https://www.sostav.ru/blogs/288076/80993), [drive2 / Exnode](https://www.drive2.ru/o/b/741599978165644201/), [bcaun.com](https://www.bcaun.com/insights/payment_agents_map), [klerk.ru](https://www.klerk.ru/user/2664563/691607/), [technokam.com](https://technokam.com/blog/platezhnyy-agent-kak-proverit-i-kakie-komissii-norma).
- *United Stream:* в ответе и источниках Алисы нет.
- *Выдача Яндекса ([запрос](https://yandex.ru/search/?text=%D0%9A%D0%B0%D0%BA%20%D0%BF%D1%80%D0%BE%D0%B2%D0%B5%D1%80%D0%B8%D1%82%D1%8C%20%D0%BF%D0%BB%D0%B0%D1%82%D1%91%D0%B6%D0%BD%D0%BE%D0%B3%D0%BE%20%D0%B0%D0%B3%D0%B5%D0%BD%D1%82%D0%B0%20%D0%BF%D0%B5%D1%80%D0%B5%D0%B4%20%D0%BF%D0%B5%D1%80%D0%B2%D0%BE%D0%B9%20%D0%BE%D0%BF%D0%BB%D0%B0%D1%82%D0%BE%D0%B9%2C%20%D1%87%D1%82%D0%BE%D0%B1%D1%8B%20%D0%BD%D0%B5%20%D0%BF%D0%BE%D1%82%D0%B5%D1%80%D1%8F%D1%82%D1%8C%20%D0%B4%D0%B5%D0%BD%D1%8C%D0%B3%D0%B8%3F&lr=213)):* сверху ссылка на чат Алисы. Органика: **[sostav 288076/80993](https://www.sostav.ru/blogs/288076/80993)** (это источник №1 Алисы), klerk / moneyroo, brace-lf, fd.ru, buhexpert8, companies.rbc, kad-autoconsult, getexpo, **[unitedstream.ru/blog/kak-yurlicu-vybrat-platezhnogo-agenta/](https://unitedstream.ru/blog/kak-yurlicu-vybrat-platezhnogo-agenta/) — 9-й органический документ**, is1c, allo.tochka, cleverence.
- *Комментарий:* **[О]** Статья United Stream стоит в органике, но Алиса взяла только sostav, drive2 / Exnode, bcaun, klerk и technokam. Одного попадания в топ-10 мало. Алиса берёт первые 3–5 документов или тексты с более «цитируемой» структурой: чек-лист, нумерованные шаги, счёт 40821. Совет Алисы «проверьте регистрацию на сайте ФНС» при нынешней путанице с юрлицом работает против United Stream (§4.2).

**Вопрос 12. Валютный контроль при платеже через агента (A)**
- *Бренды:* нет. Разбор по главе 52 ГК, порог 3 млн ₽, коды видов операций, отчёт агента.
- *Источники:* [nskbl.ru, банк «Левобережный»](https://www.nskbl.ru/press-center/platezhi-cherez-agenta-kak-soblyudat-pravila-valyutnogo-kontrolya/), [globalpo.ru](https://globalpo.ru/blog/platezhnyj-agent-dlya-ved), [legalwording.ru](https://legalwording.ru/ru/articles/oplata-cherez-platezhnyh-agentov-ved), [nbr.ru](https://nbr.ru/free/valyutnyy-kontrol/svedeniya-o-valyutnykh-operatsiyakh.php), [tochka.com](https://tochka.com/knowledge/ved/platyozhnyy-agent-ved/).
- *United Stream:* в ответе нет. Статья [«Валютный контроль при платежах в Китай»](https://unitedstream.ru/blog/valyutnyj-kontrol-pri-platezhah-v-kitaj/) не процитирована.
- *Выдача Яндекса ([запрос](https://yandex.ru/search/?text=%D0%9A%D0%B0%D0%BA%20%D0%BF%D1%80%D0%BE%D1%85%D0%BE%D0%B4%D0%B8%D1%82%20%D0%B2%D0%B0%D0%BB%D1%8E%D1%82%D0%BD%D1%8B%D0%B9%20%D0%BA%D0%BE%D0%BD%D1%82%D1%80%D0%BE%D0%BB%D1%8C%2C%20%D0%B5%D1%81%D0%BB%D0%B8%20%D0%BF%D0%BB%D0%B0%D1%82%D1%91%D0%B6%20%D0%B8%D0%B4%D1%91%D1%82%20%D1%87%D0%B5%D1%80%D0%B5%D0%B7%20%D0%BF%D0%BB%D0%B0%D1%82%D1%91%D0%B6%D0%BD%D0%BE%D0%B3%D0%BE%20%D0%B0%D0%B3%D0%B5%D0%BD%D1%82%D0%B0%20%D0%BF%D0%BE%20%D0%B0%D0%B3%D0%B5%D0%BD%D1%82%D1%81%D0%BA%D0%BE%D0%BC%D1%83%20%D0%B4%D0%BE%D0%B3%D0%BE%D0%B2%D0%BE%D1%80%D1%83%3F&lr=213)):* сверху ссылка на чат Алисы. Органика: **nbr.ru**, **nskbl.ru**, ppt.ru, buhexpert8, [памятка Банка «Санкт-Петербург», PDF](https://cdn.bspb.ru/Pamyatka_pri_agentskih_platezhah_b4837cfff7.pdf), drive2, **[unitedstream.ru/blog/platezhnyj-agent-oplata-postavshchiku-za-rubezhom/](https://unitedstream.ru/blog/platezhnyj-agent-oplata-postavshchiku-za-rubezhom/) — 7-й органический документ**, klerk / moneyroo, **globalpo**, glavbuhok, buhcontact, avangard-direct, allo.tochka. Первые два источника Алисы — первые два документа органики.
- *Комментарий:* **[О]** Второй случай после Q11: United Stream есть в органическом топ-10, но в нейроответ не попадает. Алиса берёт документы с позиций 1–2 и тексты с чёткой структурой (банк «Левобережный» — пошаговые правила).

### 2.2. Таблица «кого рекомендуют» (18 ответов Алисы)

Считается число ответов, где бренд назван хотя бы раз. В скобках — вопросы: A — первый прогон, B — повтор.

| Бренд | Ответов | Где | Как подан |
|---|---|---|---|
| **А7** | 6 | 1A, 2A, 3A, 3B, 9A, 9B | Q1A: №1 и «выбирайте A7»; Q2A: №4; Q9: наравне с United Stream; санкции не упоминаются |
| United Stream / Юнайтед Стрим | 5 | 7A, 7B, 8A, 9A, 9B | только в брендовых вопросах, см. §4.2 |
| Win-Win (Win-Win Swift) | 4 | 1A, 1B, 2A, 2B | единственный бренд, который есть в обоих прогонах Q1 |
| RSI Capital | 3 | 1A, 2A, 2B | №2 в Q1A, №1 в Q2B |
| Directla | 2 | 2A, 1B | №1 в Q2A |
| NNEX | 2 | 2A, 2B | — |
| ВЭД Мастер | 2 | 2A, 2B | — |
| Доверка | 2 | 2A, 2B | — |
| Insight | 2 | 1B, 2B | рекомендован в Q1B, «лидер по версии Exnode» |
| SWIFT / СБП, НСПК | 3 / 2 | 3A, 3B, 1B | как «альтернатива А7» |
| EastPay, Bitokk, SpectrePay, BSPAY PRO | по 1 | 1B, 2A, 2B | — |
| VedHonest | 1 | 11A | как агрегатор агентов |
| Exnode | 1 | 1B | как автор рейтинга; источник №1 по объёму, см. §2.3 |
| Wise (TransferWise), PayPal | 1 | 3A | ошибочная рекомендация |
| Юнистрим | 1 (+ источники в 7B, 8A) | 8B | вместо United Stream |
| Банки (Точка, ПСБ, Сбер и др.) | 0 в тексте | — | Точка есть только как источник (Q5, Q12) |

**[О]** Прямые конкуренты United Stream в нейроответах — не банки, а агенты из подборок: Win-Win, RSI Capital, Directla, NNEX, ВЭД Мастер, Insight, EastPay. Сами подборки пишет в основном Exnode. А7 остаётся «брендом по умолчанию».

### 2.3. Таблица «какие домены цитируют»

«Ответов» — в скольких из 18 ответов домен есть в списке источников. «★» — сколько раз домен попал в первые три ссылки, которые Алиса выводит под ответом.

| Домен | Ответов | ★ | Где | Чей контент |
|---|---|---|---|---|
| drive2.ru | 6 | 6 | 1A, 1B, 2A, 4, 5, 11 | **все 6 — блог Exnode** |
| sostav.ru | 5 | 2 | 1A, 1B, 4, 5, 11 | блоги компаний (платформа sostav.ru/blogs) |
| banki.ru | 4 | 3 | 1A, 7B, 8A, 8B | Q1 — раздел переводов в КНР; 7B и 8 — **отзывы о Юнистриме** |
| habr.com | 4 | 3 | 2A, 1B, 2B, 8B | 3 — **Exnode**, 1 — tehrevizor |
| resize-web.ru | 3 | 2 | 2A, 2B, 7A | подборка «ТОП-10 платёжных агентов» |
| unitedstream.ru | 3 | 3 | 7A, 7B, 8A | главная и /o-nas/ |
| otzovik.com, irecommend.ru | по 2 | по 2 | 8A, 8B | отзывы о **Юнистриме** |
| hf.ru | 2 | 1 | 7B, 8A | обзор **Юнистрима** |
| globalpo.ru | 2 | 2 | 5, 12 | блог агента GPO |
| klerk.ru | 2 | 1 | 1B (Exnode), 11 | блоги |
| vc.ru, dtf.ru | по 2 | 1 / 0 | 2B, 6 / 6, 7B | подборки, «А7 отзывы» |
| tochka.com | 2 | 0 | 5, 12 | база знаний банка |
| cleverence.ru, cossa.ru, platejka.com | по 2 | 0 | 1A, 1B / 2A, 2B / 7A, 7B | статьи, рейтинги, сайт агента |
| ppt.ru, raketapay.ru, global-alians.com, rterminal.ru, upayment.ru, kosareva.cloud, pikabu.ru, kitau.ru, companies.rbc.ru, forbes.ru, meduza.io, intellectpro.ru, bcaun.com, technokam.com, nskbl.ru, legalwording.ru, nbr.ru, 1tab.co, exnode.ru, digitalkassa.ru, ppc.world, checko.ru, unitedstream.promo.page | по 1 | — | см. карточки | — |

**[О] Типы площадок по доле в 70 источниках.**
- Блоги агентов на чужих платформах (drive2, habr, sostav, klerk, vc, dtf): около 40%.
- Собственные блоги агентов (globalpo, raketapay, global-alians, rterminal, upayment, exnode): около 15%.
- Отзовики: около 13%, почти всё про Юнистрим.
- Банки (banki.ru, tochka, Левобережный): около 10%.
- СМИ (forbes, rbc companies, meduza): около 5%.

---

## 3. Ключевые утверждения (для фактчекинга)

Статусы:
- **подтверждено** — видно в нейроответе и в выдаче или в двух независимых источниках;
- **одиночный источник** — только Алиса, хотя бы в одном прогоне;
- **опровергнуто** — противоречит проверяемым данным.

| # | Утверждение | Источник | Статус |
|---|---|---|---|
| 1 | United Stream нет ни в одном небрендовом нейроответе (0 из 12). В органике по Q1, Q2, Q3, Q6, Q10 его тоже нет; по Q1 он есть только в рекламе. По Q11 и Q12 статьи блога стоят 9-й и 7-й в органике, но Алиса их не цитирует | Алиса (§2.1), выдача 7 вопросов | **подтверждено** (нейроответ + выдача) |
| 2 | Контент Exnode — самый частый источник нейроответов: 11 из 70 позиций; его статьи стоят и в органике Q1 (habr, drive2) и Q3 (spark, exnode.ru, partnerkin) | Алиса + выдача | **подтверждено** |
| 3 | Нейроответ Алисы строится из верхушки органической выдачи: в Q1 3 из 5 доменов источников стоят в органическом топ-14, в Q10 — 2 из 5; в Q2 4 из 5 — в органическом топ-14; в Q11 источник №1 Алисы — первый органический документ; в Q12 источники №1–2 — первые два документа органики | Алиса + выдача Q1, Q2, Q10, Q11, Q12 | **подтверждено** |
| 4 | А7 — самый частый бренд (6 из 18); в Q1A Алиса рекомендует его как лучший по комиссии (0,36%) и ни разу не упоминает санкции | Алиса, 2 прогона | одиночный источник (воспроизводится) |
| 5 | На «Юнайтед Стрим: отзывы…» Алиса подставляет отзывы о Юнистриме (otzovik, irecommend, banki.ru), включая «потерю денежных средств». В органической выдаче по тому же запросу Юнистрим занимает 4-ю и 9-ю позиции | Алиса 8A, 8B, след в 7B + [выдача Q8](https://yandex.ru/search/?text=%D0%AE%D0%BD%D0%B0%D0%B9%D1%82%D0%B5%D0%B4%20%D0%A1%D1%82%D1%80%D0%B8%D0%BC%3A%20%D0%BE%D1%82%D0%B7%D1%8B%D0%B2%D1%8B%2C%20%D0%BA%D0%BE%D0%BC%D0%B8%D1%81%D1%81%D0%B8%D0%B8%2C%20%D1%83%D1%81%D0%BB%D0%BE%D0%B2%D0%B8%D1%8F.&lr=213) | **подтверждено** (нейроответ + выдача) |
| 6 | Бренд United Stream связан в нейроответе с ООО «ЮНАЙТЕД СТРИМ»: ИНН 9701326060, ОГРН 1267700083529, регистрация 11.03.2026, УК 10 000 ₽, директор и 100% учредитель Гуменюк С. И., ОКВЭД 64.99, юрадрес Москва, Рубцовская наб., 3 стр. 1 | Алиса 7A → [checko](https://checko.ru/company/yunayted-strim-1267700083529); [saby.ru](https://saby.ru/profile/9701326060-970101001) | **подтверждено** (юрлицо существует). **Опровергает** вывод [досье](united_stream.md), что российского юрлица с брендом нет |
| 7 | Алиса называет адрес компании «Ленинградский пр., 36с31»; по реестру юрадрес другой — Рубцовская наб., 3 стр. 1 | Алиса 7A против saby.ru | **частично опровергнуто**: офисный адрес с сайта смешан с реквизитами юрлица |
| 8 | Алиса пишет, что United Stream подходит для «работы с санкционными товарами» | Алиса 7A | одиночный источник (в 7B фразы нет, но есть «отсутствие российского следа») |
| 9 | Алиса пересказывает с /o-nas/ маркетинговые цифры как доказательство надёжности: 200+ клиентов, 1500+ платежей в год, 79,2% повторных обращений, «успешность 100%», «риски отказа < 0,01%», «компании в 6 странах» | Алиса 7B → [/o-nas/](https://unitedstream.ru/o-nas/) | одиночный источник. «6 стран» расходится с «7» и «9 компаний» на сайте ([досье](united_stream.md), §2.5) |
| 10 | На Q3 и Q9 Алиса отвечает без источников, и ответы фактически ошибочны: советует Wise и PayPal; называет United Stream «международной платёжной системой с 2FA» | Алиса, по 2 прогона | **опровергнуто** по содержанию. United Stream — агент, а не платёжная система ([/o-nas/](https://unitedstream.ru/o-nas/)) |
| 11 | Состав рекомендуемых агентов в Q1 почти полностью меняется между прогонами: общий только Win-Win | Алиса 1A против 1B | одиночный источник (2 прогона) |
| 12 | В индексе Яндекса у unitedstream.ru теперь корректный title («Международные платежи для бизнеса \| ЮНАЙТЕД СТРИМ»), а не страница KillBot | заголовки источников в 7A и 8A | одиночный источник. Нужна проверка в Вебмастере: в [досье](united_stream.md) title был мусорным |
| 13 | ПромоСтраница United Stream в Яндексе ([unitedstream.promo.page](https://unitedstream.promo.page/), статья «4 актуальных способа оплатить инвойс в Китай в 2026 году») попадает в источники Алисы | Алиса 7A + сама страница (HTTP 200) | **подтверждено** |
| 14 | Блог United Stream по темам вопросов 10–12 существует, а по Q11 и Q12 даже стоит в органическом топ-10, но Алиса его не цитирует; вместо него — банк «Левобережный», globalpo, legalwording, sostav, Exnode | Алиса + выдача Q11, Q12 + [URL блога](https://unitedstream.ru/blog/valyutnyj-kontrol-pri-platezhah-v-kitaj/) | **подтверждено** |
| 15 | По брендовому запросу у United Stream есть площадки, которых нет в [досье](united_stream.md): карточка в Яндекс Картах с отзывами (СПб, ул. Чапаева 15, «Горьковская»), Telegram @unitedstream, zoon, 2ГИС, сайт на clients.site. Алиса ни одну из них не цитирует | [выдача Q8](https://yandex.ru/maps/org/united_stream/83728548080/reviews/), [выдача «united stream unitedstream.ru»](https://t.me/unitedstream) | **подтверждено** (выдача по 2 запросам). Досье утверждало обратное по Telegram и 2ГИС, нужно обновить |

---

## 4. Выводы для маркетинга United Stream

**4.1. Где появиться в первую очередь**

Порядок — по тому, как часто Алиса реально берёт площадку в источники.

| Приоритет | Площадка | Почему | Какой контент |
|---|---|---|---|
| 1 | **drive2.ru (блог компании)** | 6 из 18 ответов, все шесть — Exnode; стоит и в органике Q1 | Серия «Как оплатить поставщику в X в 2026: схема, сроки, документы»: Китай, Германия, ОАЭ/Турция, SaaS. Цифры, таблица, дата в заголовке |
| 2 | **sostav.ru/blogs, habr.com (блог компании), klerk.ru/blogs** | вместе 11 появлений; habr и drive2 — в органике Q1 | Экспертные разборы: «Альтернативы А7 после 21-го пакета ЕС» (сейчас Алиса отвечает без источников, окно открыто); «Валютный контроль через агента: пороги, коды ВО, отчёт агента»; «Платёж в Китай завис: что делать» |
| 3 | **Подборки «ТОП-N платёжных агентов»**: resize-web.ru, vc.ru («ТОП-5 для Китая»), altcoinlog, dtf | Рейтинг в Q2 Алиса почти дословно берёт из resize-web.ru | Договориться о включении (PR или нативное размещение с пометкой). Подготовить карточку для подборок: комиссия, сроки, минимум, валюты, юрлицо и ИНН. Одинаковые формулировки на всех площадках |
| 4 | **Отзывы: Яндекс Карты (уже 1-я позиция по брендовому запросу), затем otzovik.com, irecommend.ru, banki.ru, hf.ru** | По брендовому запросу Алиса находит на отзовиках только Юнистрим | Завести карточку «United Stream / Юнайтед Стрим — платёжный агент для бизнеса» и собрать первые реальные отзывы клиентов. Иначе пустое место по «Юнайтед Стрим отзывы» и дальше будут заполнять отзывы о Юнистриме |
| 5 | **Собственный сайт и ПромоСтраницы** | Уже цитируются по брендовым вопросам | На /o-nas/ и /kontakty/ — однозначный блок «Кто мы юридически» (см. 4.2). Страница «United Stream и А7: сравнение для платежей в Китай» с таблицей. FAQ-разметка на страницах направлений. На ПромоСтраницах — те же статьи, что в пункте 2 |
| 6 | **СМИ и деловые медиа** (companies.rbc.ru, forbes.ru) | Цитируются по «болевым» вопросам (Q10) | Колонка или комментарий эксперта «Почему банки не проводят платежи в Китай» в РБК Компании: это платная площадка, туда можно выйти быстро |

**4.2. Брендовые вопросы 7–9: что исправить срочно**
- **[В] Путаница с Юнистримом — главный репутационный риск в нейропоиске.** Пользователь, который спросит Алису «Юнайтед Стрим отзывы», получит жалобы на чужой сервис: «потеря денежных средств», «проблемы с получением переводов». Что делать:
  - на сайте, в ПромоСтраницах и на отзовиках последовательно писать «United Stream (Юнайтед Стрим) — платёжный агент для юрлиц, не путать с системой переводов Юнистрим»;
  - завести собственные карточки на otzovik, irecommend и banki.ru (раздел «Народный рейтинг» или компании).
- **[В] Юрлицо.** В нейроответ уже попало ООО «ЮНАЙТЕД СТРИМ» (ИНН 9701326060, зарегистрировано 6 месяцев назад, УК 10 000 ₽), а договор, по [досье](united_stream.md), подписывает «АЗИЗОГЛУ ЛИМИТЕД» (ОАЭ). Совет Алисы из Q11 «проверьте регистрацию на сайте ФНС» приведёт клиента к этой нестыковке. Нужна одна публичная формулировка: кто бренд, кто агент по договору, как связаны. Затем — одинаково на сайте, в ПромоСтраницах, в карточках подборок.
- **[В] Убрать с сайта формулировки, которые нейросеть превращает в «санкционные товары».** Это «без российского следа», «работа с комплаенс-ограничениями», «100% успешность». Алиса пересказывает их как характеристику компании. Для финдиректора и для модерации это красный флаг. Заменить на проверяемые факты: число сделок, сроки, документы, ИНН.
- **[В] Сравнение с А7 (Q9) пока пустое.** Алиса отвечает без источников. Страница или статья «United Stream vs А7 для Китая» займёт этот ответ: комиссия и минимум, санкционный статус А7-Агента с датами и ссылками на официальные списки, сроки, документы. Тон нейтральный, без атаки: иначе подборки и СМИ её не процитируют.

**4.3. Как мерить**
- Повторять эти 12 вопросов в Алисе AI раз в 2–4 недели, по 2 прогона. Метрики:
  - доля ответов с упоминанием United Stream (сейчас 0 из 12 небрендовых);
  - доля ответов, где unitedstream.ru или его публикации есть в источниках (сейчас 3 из 18, только брендовые);
  - есть ли Юнистрим в брендовых ответах (сейчас в 3 из 4 ответов на Q7 и Q8).
- Скрипт и формат сырого вывода лежат в `/tmp/claude-0/geo/` (`yalice.js`, `parse.py`). Их стоит перенести в репозиторий, если мониторинг будет регулярным.

---

## 5. Пробелы

1. **Perplexity, ChatGPT, GigaChat, Copilot, duck.ai не проверены**: блокировка прокси или требование входа (см. «Метод»). Все выводы — по одному нейропоиску, Алисе AI, в двух прогонах. Сверка «два нейропоиска» не выполнена.
2. **12 из 18 ответов даны «менее мощной моделью»** из-за нагрузки. Полная модель Алисы, особенно для пользователя с логином, может отвечать иначе. Нужен повторный замер в спокойное время или с логином.
3. **Выдача yandex.ru собрана по Q1, Q2, Q3, Q6, Q8, Q10, Q11, Q12** (плюс «united stream unitedstream.ru»). По Q4, Q5, Q7, Q9 сбор сорвали капча и обрывы соединения. Поэтому у утверждений 4, 8, 9, 11 статус «одиночный источник». Число и тон отзывов в карточке Яндекс Карт (СПб) не смотрели.
4. **Быстрый ответ Алисы над выдачей (FuturisSearch) не наблюдался.** Непонятно, почему: так ведёт себя IP вне РФ, нет логина или запросы слишком длинные. В нём источники могут отличаться от чата Алисы.
5. **Связь ООО «ЮНАЙТЕД СТРИМ» (ИНН 9701326060) с сайтом unitedstream.ru и с «АЗИЗОГЛУ ЛИМИТЕД» не установлена.** Мы видим только, что Алиса их связала. Директор Гуменюк С. И. и связанные лица по реестру — в полной выписке, которую не смотрели. saby.ru показывает «Суды: истец 1», содержание дела не проверено. checko.ru для нашего IP закрыт (403).
6. **Происхождение ряда цифр в ответах не проверено**: «фиксированная комиссия 0,3%» и «до 15 000 USD фиксированная комиссия» (7A, 8A), «компании в 6 странах», «79,2%» (7B). Сайт unitedstream.ru из среды не открывается (см. [досье](united_stream.md), §1.3).
7. **Нейроответы вероятностные.** Два прогона — минимальная выборка. Частоты в таблицах §2.2–2.3 показывают порядок величин, а не долю рынка.
