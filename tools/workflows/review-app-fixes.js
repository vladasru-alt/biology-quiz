export const meta = {
  name: 'review-app-fixes',
  description: 'Адверсарная проверка исправлений приложения: три рецензента с разных сторон, скептик перепроверяет каждую находку',
  phases: [
    { title: 'Рецензия', detail: 'сохранение и навигация / интервальное повторение и подсчёты / доступность и мобильный интерфейс' },
    { title: 'Перепроверка', detail: 'скептик пытается опровергнуть каждую находку' },
  ],
}

const DIFF = '<рабочая папка>/p6-app.diff'
const CTX = `Контекст: одностраничный тренажёр по биологии <репозиторий>/index.html (весь JS внутри одного IIFE) с банком вопросов <репозиторий>/quiz-data.js (служебные тексты — в конце файла, со строки ~12509). Главная задача приложения — помочь научиться: повтор ошибки в той же сессии (оценка по первым попыткам), интервальное повторение (коробки 1/3/7/21 день), отметка уверенности, разбор с ответом ученика.

Только что внесены исправления (diff — ${DIFF}, прочитай его целиком, затем нужные места в index.html):
1) прохождение сохраняется в localStorage (bio_session_<имя>) после каждого ответа и после «Далее»; в меню кнопка «▶ Продолжить»; resumeSession восстанавливает сессию (pool по id, later, questions, answers, idx, total пересчитывается); новое прохождение при сохранённом с ответами спрашивает confirm; finish и «Очистить историю» удаляют сохранённое; quitBtn больше не спрашивает, если сохранение удалось;
2) history.pushState при переходе в тест/итоги/кабинет и popstate → меню, чтобы «назад» на телефоне не уводил с сайта;
3) сроки повторения: вопрос доступен с календарного дня срока, но не раньше чем через 8 ч после постановки (поле set), функции dueAt/isDue/fmtWhen; srsDue/srsNextDate/продвижение по коробкам и надписи используют их;
4) ответы из сессии «Повторение» помечаются mode:'review' и не входят в точность кабинета; угаданные верные (conf 'guess') не считаются освоенными в полосе главы и экспорте;
5) стартовая реплика ставится до первого вопроса (beginSession), чтобы не затирать настройку перед темой; новые наборы реплик guessedRight и reviewStart;
6) доступность: карточки глав с tabindex/role/клавишами, aria-pressed у multi, подписи «не отмечен» и sr-only у вариантов после проверки, aria-label у select и кнопок ▲▼, возврат фокуса после перестановки, live-регион qLive, фокус и прокрутка к условию после «Далее», hover только для устройств с мышью, полный текст выбранного варианта под select;
7) событие storage: вторая вкладка перечитывает данные пользователя.`

const LENSES = [
  { key: 'сохранение', prompt: 'Проверь СОХРАНЕНИЕ ПРОХОЖДЕНИЯ И НАВИГАЦИЮ: restore после перезагрузки на любом шаге (до ответа, после ответа до «Далее», на повторе, на последнем вопросе, при изменившемся банке), целостность total/idx/later/pool, повторное восстановление, взаимодействие с finish/retryBtn/startReview/смешанным тестом, confirm при замене, смена пользователя, две вкладки (storage + сохранённая сессия), history.pushState/popstate/history.back (в том числе после перезагрузки, при входе/выходе, из итогов, из кабинета, при смене пользователя) — не может ли «назад» увести с сайта или зациклиться, не теряется ли прогресс.' },
  { key: 'повторение', prompt: 'Проверь ИНТЕРВАЛЬНОЕ ПОВТОРЕНИЕ И ПОДСЧЁТЫ: dueAt/isDue/MIN_GAP/fmtWhen на границах суток, перевод часов, старые записи без set и с due=null, продвижение по коробкам (ровно четыре верных ответа в срок), угадывание, повтор в сессии, согласованность меню/кабинета/алерта/экспорта, точность без mode:review, освоение без угаданных, latestByQ, exportJSON/CSV.' },
  { key: 'доступность', prompt: 'Проверь ДОСТУПНОСТЬ И МОБИЛЬНЫЙ ИНТЕРФЕЙС: клавиатурная навигация по всем экранам и типам вопросов, фокус после «Далее»/перестановки/проверки, live-регион (не зачитывается ли лишнее или дважды), aria-атрибуты (валидность, актуальность после проверки), hover на тач-экранах, отображение подписи «не отмечен» и mpicked на узком экране, прокрутка к условию, регрессии для мыши и касаний.' },
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

Ищи РЕАЛЬНЫЕ ошибки, внесённые или не закрытые этими исправлениями, с номером строки и конкретным сценарием воспроизведения. Проследи код до конца, прежде чем утверждать. Не пиши о вкусовых вещах и о том, что не относится к этим изменениям. Для каждой находки — конкретное исправление кода.`, { label: `рецензент: ${l.key}`, phase: 'Рецензия', schema: FIND, effort: 'high' }),
  (r, l) => {
    if (!r || !r.findings.length) return { l, findings: r ? r.findings : [], verdicts: [] }
    return agent(`${CTX}

Ты скептик-разработчик. Рецензент (${l.key}) нашёл ${r.findings.length} проблем. Попробуй ОПРОВЕРГНУТЬ каждую: открой index.html и проследи код по сценарию до конца. "refuted" — не воспроизводится или вкусовщина; "partly" — есть, но слабее/иначе; "confirmed" — реально. Для confirmed/partly проверь исправление: оно не должно ломать другие сценарии; если плохое — дай своё. Для refuted fix — пустая строка.

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