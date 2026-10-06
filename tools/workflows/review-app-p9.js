export const meta = {
  name: 'review-app-p9',
  description: 'Адверсарная проверка исправлений приложения: два места для сохранения, резервная копия, работа над ошибками из меню и мелкие правки',
  phases: [
    { title: 'Рецензия', detail: 'сохранение, копия и данные / интерфейс, тексты и доступность' },
    { title: 'Перепроверка', detail: 'скептик пытается опровергнуть каждую находку' },
  ],
}

const DIFF = '<рабочая папка>/p9-app.diff'
const CTX = `Контекст: одностраничный тренажёр по биологии <репозиторий>/index.html (весь JS в одном IIFE), банк <репозиторий>/quiz-data.js (служебные тексты в конце). Цель — помочь научиться. Уже есть: повтор ошибки в сессии, интервальное повторение (коробки 1/3/7/21 день, dueAt/isDue), отметка уверенности, сохранение прохождения и «Продолжить», работа над ошибками (сессия __fix, ответы не в зачёт), история браузера (pushState/popstate), синхронизация вкладок через storage, типографика при выводе.

Только что сделано (diff — ${DIFF}, прочитай целиком, затем нужные места index.html):
1) два места для сохранённого прохождения: main — главы (bio_session_<имя>), side — повторение, смешанный тест, работа над ошибками (bio_session_<имя>_side); slotOf(key), sessKey(slot), okToReplace(key), resumeSession(slot), две кнопки «Продолжить» в меню, обработчик storage по слоту;
2) список работы над ошибками последнего прохождения хранится сутки в bio_fix_<имя> (loadFix/clearFix), кнопка fixMenuBtn в меню; ключ перезаписывает/удаляет finish; кнопка скрыта, пока работа над ошибками сохранена в side;
3) резервная копия: backupData (JSON с history, srs, best, sessions, fix) и восстановление restoreFromFile → mergeBackup (история объединяется по (t,id), очередь — по большей коробке, при равенстве — по более позднему set; сессии — только в пустые слоты); navigator.storage.persist();
4) обрезка истории >3000: сначала повторы, затем старые дубли ответов на один вопрос (последний по id не трогаем), потом slice;
5) итог «Повторения» без оценки (нейтральное кольцо и текст), у смешанного «Материал» вместо «Тема»; font-size 16px у select на тач-экранах; addSr для match/order; aria-disabled у кнопки повторения вместо pointer-events; местное время в CSV и имени файлов; тексты серий, вех, retry и зацепки гл. 7.`

const LENSES = [
  { key: 'данные', prompt: 'Проверь СОХРАНЕНИЕ, КОПИЮ И ДАННЫЕ: все пути, где раньше был один слот (persistSession/clearSavedSession/loadSavedSession/resumeSession/okToReplace/beginSession/finish/storage/clearHist/switchBtn/popstate/quitBtn/sessionSaved), — не осталось ли вызова без слота или с неверным слотом; resume в обоих слотах, в том числе после перезагрузки, с изменившимся банком; bio_fix: срок, повторные работы над ошибками, смена пользователя, две вкладки; mergeBackup: корректность слияния (дубли, сортировка, обрезка 3000 после слияния, srs без коробки или с due=null, чужое имя в копии, битый файл, очень большой файл), что будет с latestByQ/освоением; обрезка истории — не удаляет ли последний ответ по вопросу и не ломает retry/mode.' },
  { key: 'интерфейс', prompt: 'Проверь ИНТЕРФЕЙС, ТЕКСТЫ И ДОСТУПНОСТЬ: порядок и надписи кнопок в меню (две «Продолжить», работа над ошибками, повторение) и на итогах во всех видах сессий; понятны ли тексты кабинета про резервную копию и входа; фокус и клавиатура для новых кнопок и скрытого input file; aria-disabled у кнопки повторения (клик с клавиатуры и мышью); sr-тексты в match/order (не дублируются ли, не мешают ли повторному рендеру); тексты серий/вех/retry — не противоречат ли логике кода и редполитике (без оценок сверху вниз, без додумывания чувств, без мужского рода).' },
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