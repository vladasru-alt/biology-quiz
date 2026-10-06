export const meta = {
  name: 'review-fix-screen',
  description: 'Адверсарная проверка нового экрана итогов (работа над ошибками, освоение на карточках): два рецензента, скептик по находкам',
  phases: [
    { title: 'Рецензия', detail: 'логика и данные / интерфейс и обучение' },
    { title: 'Перепроверка', detail: 'скептик пытается опровергнуть каждую находку' },
  ],
}

const DIFF = '<рабочая папка>/p7.diff'
const CTX = `Контекст: одностраничный тренажёр по биологии <репозиторий>/index.html (весь JS в одном IIFE), банк вопросов <репозиторий>/quiz-data.js (служебные тексты в конце). Цель — помочь научиться. Уже есть: повтор ошибки в сессии (оценка по первым попыткам), интервальное повторение (коробки 1/3/7/21 день, dueAt/isDue, поле set), отметка уверенности, сохранение прохождения в localStorage и «Продолжить», masteredBy(h) — верно, не угадано и не box 0 в очереди.

Только что сделано (diff — ${DIFF}, прочитай его целиком, затем нужные места index.html):
1) на экране итогов главная кнопка «🎯 Повторить ошибки/угаданные (N)» (fixBtn) — новая сессия '__fix' (startFix) только из ошибок и угаданных первых попыток; session.practice=true: ответы пишутся с rec.retry=true и mode:'practice', поэтому не входят в точность и освоение и не продвигают очередь повторения (ошибка по-прежнему ставит вопрос на завтра); «Пройти главу заново» стал второстепенным; для '__review' главной остаётся «Ещё N на сегодня», для '__fix' «Пройти заново» скрыта; для смешанного — «Новый смешанный тест»;
2) на карточках глав вместо «Лучший: X%» — «Освоено X из N» по latestByQ и masteredBy;
3) новые реплики fixStart, CSV различает «работа над ошибками».`

const LENSES = [
  { key: 'логика', prompt: 'Проверь ЛОГИКУ И ДАННЫЕ: правильность fixIds (первые попытки, ошибки + угаданные, дубли, удалённые из банка вопросы), поведение startFix из итогов главы/смешанного/повторения/самой работы над ошибками, okToReplace, сохранение и восстановление сессии «__fix» (SESS_FIELDS, base, practice), retryBtn/fixBtn после восстановления и после второй работы над ошибками, запись истории и srsUpdate (retry-флаг, conf guess, ошибки), latestByQ/masteredBy/renderMenu/renderDash/экспорт — согласованы ли числа между карточкой, кабинетом и экспортом, не ломается ли что-то у пользователей со старыми данными (user.best, записи без mode).' },
  { key: 'обучение', prompt: 'Проверь ИНТЕРФЕЙС И ОБУЧЕНИЕ: понятны ли ученику надписи и порядок кнопок во всех видах сессий (глава, смешанный, повторение, работа над ошибками, без ошибок, все ошибки), не противоречат ли тексты (кнопки, footer, реплики fixStart/chapterComplete, подсказки «Освоено X из N») тому, что делает код; не вводит ли карточка «Освоено» в заблуждение (например, после первого прохождения без ошибок, после ошибок), доступность новых элементов (фокус, aria), вид на узком экране.' },
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

Ты придирчивый фронтенд-разработчик и методист. ${l.prompt}

Ищи РЕАЛЬНЫЕ проблемы этих изменений, с номером строки и конкретным сценарием. Проследи код до конца. Без вкусовщины и без того, что к изменениям не относится. Для каждой находки — конкретное исправление.`, { label: `рецензент: ${l.key}`, phase: 'Рецензия', schema: FIND, effort: 'high' }),
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