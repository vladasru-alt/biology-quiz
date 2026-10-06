export const meta = {
  name: 'review-app-r5',
  description: 'Адверсарная проверка исправлений приложения после четвёртой рецензии: обновление меню, список работы над ошибками, перенос старой записи, мелкие правки',
  phases: [
    { title: 'Рецензия', detail: 'меню и сроки / список ошибок и мелкие правки' },
    { title: 'Перепроверка', detail: 'скептик пытается опровергнуть каждую находку' },
  ],
}

const DIFF = '<рабочая папка>/r5-app.diff'
const CTX = `Контекст: одностраничный тренажёр по биологии <репозиторий>/index.html (весь JS в одном IIFE), банк <репозиторий>/quiz-data.js (служебные тексты в конце). Цель — помочь научиться. Уже есть: повтор ошибки в сессии, интервальное повторение (коробки 1/3/7/21 день, dueAt/isDue, MIN_GAP 8 ч), отметка уверенности, сохранение прохождения в двух местах (main — главы, side — повторение/смешанный/работа над ошибками), «Продолжить», работа над ошибками (сессия __fix, ответы не в зачёт) со списком bio_fix_<имя> до конца дня, история браузера (pushState/popstate), синхронизация вкладок через storage, резервная копия.

Только что сделано (diff — ${DIFF}, прочитай целиком, затем нужные места index.html):
1) меню перерисовывается само: refreshMenu (если вкладка видна, пользователь есть и открыто меню; сохраняет фокус на карточке главы) по visibilitychange, по pageshow с persisted и по таймеру menuTimer, который renderMenu ставит к ближайшему из двух моментов — srsNextDate() или началу следующего дня (чтобы появилась кнопка «Повторение на сегодня» и исчезла устаревшая кнопка работы над ошибками);
2) finish(): глава по-прежнему начинает список работы над ошибками заново; короткая сессия (__review, __mixed, __fix) теперь обновляет список: убирает из старого списка свои заданные вопросы и добавляет свои ошибки и угаданные; подпись главы (base) остаётся, только если все вопросы списка из неё;
3) перенос старой записи короткой сессии из места для глав вызывается в loadUser (loadSavedSession('main')), а не при первом чтении в renderMenu;
4) userSaveOk — результат последнего saveUser; текст подтверждения выхода зависит от него;
5) aria-disabled у кнопки «Далее» до ответа;
6) в шаблонах тем quiz-data.js «активн\\w*» заменено на «активн[а-яё]*» (без флага u \\w не ловит кириллицу).`

const LENSES = [
  { key: 'меню и сроки', prompt: 'Проверь ОБНОВЛЕНИЕ МЕНЮ И ПЕРЕНОС ЗАПИСИ (пункты 1 и 3): порядок объявления переменных и функций в IIFE (menu, grid, user, refreshMenu, menuTimer — не будет ли ReferenceError/TDZ при первом renderMenu из init или из loadUser); таймер — переполнение, частые перезапуски, вызов при скрытом меню, при смене пользователя (switchBtn), при открытом тесте/итогах/кабинете; может ли refreshMenu перерисовать меню в неподходящий момент (открыт confirm, фокус на кнопке «Продолжить» или «Повторение», которая пропадёт), нужно ли что-то ещё для кабинета (renderDash) и экрана итогов; pageshow/visibilitychange в Safari; loadSavedSession(\'main\') в loadUser — вызывается ли loadUser из storage-обработчика и не сломает ли это открытое в этой вкладке прохождение (перенос записи, sessionSaved, две вкладки), что будет при старом формате записи и при пустом хранилище.' },
  { key: 'список ошибок и мелкие правки', prompt: 'Проверь СПИСОК РАБОТЫ НАД ОШИБКАМИ И МЕЛКИЕ ПРАВКИ (пункты 2, 4, 5, 6): пройди все сценарии finish() для глав, __review, __mixed, __fix (из меню и с экрана итогов, после главы и после повторения), с пустым, устаревшим (вчерашним) и текущим списком; правильно ли считаются ids и base (подпись «Глава N» не должна врать, вопросы других глав не должны молча пропадать); как это согласуется с startFix (fromMenu и с итогов, prev.fixIds, prev.base), с кнопкой fixMenuBtn, с текстами rFoot/fixBtn и с комментариями в коде; не может ли список расти бесконечно или содержать вопросы, уже верно отвеченные; userSaveOk — во всех ли путях он верен (loadUser, mergeBackup, clearHist); aria-disabled у qNext — снимается ли во всех путях, где кнопка становится активной (twotier с пропуском второго яруса, последний вопрос, продолжение сохранённого прохождения, повтор в сессии), и не ломает ли обработчик Enter/клик; регулярные выражения тем — работают ли с флагом i для заглавных букв.' },
]

const FIND = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: {
  line: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'major', 'minor'] }, problem: { type: 'string' }, scenario: { type: 'string' }, fix: { type: 'string' } },
  required: ['line', 'severity', 'problem', 'scenario', 'fix'] } } }, required: ['findings'] }
const VER = { type: 'object', properties: { verdicts: { type: 'array', items: { type: 'object', properties: {
  n: { type: 'number' }, verdict: { type: 'string', enum: ['confirmed', 'refuted', 'partly'] }, severity: { type: 'string', enum: ['critical', 'major', 'minor'] }, reason: { type: 'string' }, fix: { type: 'string' } },
  required: ['n', 'verdict', 'severity', 'reason', 'fix'] } } }, required: ['verdicts'] }

phase('Рецензия')
const results = await pipeline(
  LENSES,
  (l) => agent(`${CTX}

Ты придирчивый фронтенд-разработчик. ${l.prompt}

Ищи РЕАЛЬНЫЕ ошибки этих изменений, с номером строки и конкретным сценарием. Проследи код до конца. Без вкусовщины и без того, что к изменениям не относится. Для каждой находки — конкретное исправление.`, { label: `рецензент: ${l.key}`, phase: 'Рецензия', schema: FIND, effort: 'high' }),
  (r, l) => {
    if (!r || !r.findings.length) return { l, findings: r ? r.findings : [], verdicts: [] }
    return agent(`${CTX}

Ты скептик-разработчик. Рецензент (${l.key}) нашёл ${r.findings.length} проблем. Попробуй ОПРОВЕРГНУТЬ каждую: открой index.html и проследи код по сценарию до конца. "refuted" — не воспроизводится или вкусовщина; "partly" — есть, но слабее/иначе; "confirmed" — реально. Для confirmed/partly проверь исправление: не должно ломать другие сценарии; если плохое — дай своё. Для refuted fix — пустая строка.

НАХОДКИ:
${JSON.stringify(r.findings.map((f, n) => Object.assign({ n }, f)), null, 1)}`, { label: `скептик: ${l.key}`, phase: 'Перепроверка', schema: VER, effort: 'high' })
      .then((v) => ({ l, findings: r.findings, verdicts: v ? v.verdicts : null }))
  }
)
const out = []
for (const r of results.filter(Boolean)) {
  const byN = {}; (r.verdicts || []).forEach((v) => { byN[v.n] = v })
  r.findings.forEach((f, n) => { const v = byN[n]; out.push(Object.assign({ lens: r.l.key }, f, { verdict: v ? v.verdict : 'unverified', vSeverity: v ? v.severity : f.severity, vReason: v ? v.reason : '', vFix: v ? v.fix : '' })) })
}
const live = out.filter((f) => f.verdict !== 'refuted')
log(`Находок ${out.length}, осталось ${live.length}: critical ${live.filter((f) => f.vSeverity === 'critical').length}, major ${live.filter((f) => f.vSeverity === 'major').length}`)
return { findings: out }
