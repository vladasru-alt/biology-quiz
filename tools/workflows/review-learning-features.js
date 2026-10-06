export const meta = {
  name: 'review-learning-features',
  description: 'Перекрёстная проверка новых функций приложения (повтор в сессии, разбор с ответом ученика, интервальное повторение, уверенность): три линзы и скептики',
  phases: [
    { title: 'Рецензия', detail: '3 рецензента с разных сторон' },
    { title: 'Перепроверка', detail: 'скептик пытается опровергнуть каждую находку' },
  ],
}

const FILE = '<репозиторий>/index.html'
const DIFF = '<рабочая папка>/p4.diff'

const CONTEXT = `Приложение — одностраничный тренажёр по биологии (${FILE}, данные вопросов в <репозиторий>/quiz-data.js, у каждого вопроса постоянный id). Главная цель — помочь ученику научиться, а не поставить оценку. Только что добавлены четыре функции (дифф — ${DIFF}):
1. Повтор в сессии: ошибочный или угаданный вопрос возвращается через ~4 вопроса один раз (scheduleRetry/takeRetry, s.later, s.total растёт); в процент идёт только первая попытка (firstTries, liveScore, finish).
2. Разбор: ошибки первой попытки первыми с «Ваш ответ» (item.pick, pickReason, yourAnswerHTML), верные свёрнуты, метка «Разбор заблуждения» (item.misc), строка «При повторе».
3. Интервальное повторение: user.srs[id]={box,due}; ошибка → box 0, срок завтра; верный ответ в срок → box+1, интервалы 3/7/21 день, box 4 — усвоено; верный при повторе в сессии или раньше срока не продвигает; угаданный верный → в очередь; миграция старых пользователей: последние неверные ответы → srs со сроком «сейчас»; «Повторение на сегодня» (startReview, REVIEW_MAX=20), кнопка в меню (reviewTodayBtn), кабинет (статистика, reviewNote, список под спойлером); latestByQ игнорирует записи retry.
4. Уверенность: необязательные кнопки «Уверен/Сомневаюсь/Угадываю» (renderConf, lockConf, curItem.conf) до ответа; уверенная ошибка и угаданный ответ получают свои подсказки; в итогах — сводка калибровки.
Прочитай дифф и затем нужные места index.html целиком (Read), чтобы видеть контекст. Каждое утверждение подкрепляй номером строки в текущем index.html и сценарием воспроизведения. Не выдумывай проблем; вкусовщину не пиши.`

const LENSES = [
  { key: 'logic', prompt: `Линза: КОРРЕКТНОСТЬ И ГРАНИЧНЫЕ СЛУЧАИ. Проверь: очередь повторов (последний вопрос главы, повтор на последнем вопросе, пустой пул, смешанный тест из 15, сессия повторения, двойная постановка, счётчик «Вопрос N из M», кнопка «Показать результат», прогресс-бар); счёт по первым попыткам во всех местах (liveScore, finish, best, кабинет); запись pick для всех типов вопросов; блокировку уверенности; даты srs (dayStart, переход через полночь, летнее время, due=null у усвоенных, сравнения с Date.now()); srsUpdate во всех ветках; взаимодействие с достижениями, адаптивной сложностью и старым кодом (retryBtn, clearHist, экспорт). Ищи реальные баги.` },
  { key: 'learning', prompt: `Линза: ПОЛЬЗА ДЛЯ ОБУЧЕНИЯ И ИНТЕРФЕЙС. Проверь, действительно ли функции помогают учиться (retrieval practice, интервальное повторение, исправление ошибок, метапознание), нет ли анти-паттернов (давление оценкой, подсказки, раскрывающие ответ до попытки, путаница в формулировках, лишнее трение), понятны ли сообщения ученику, согласованы ли тексты (кнопки, подписи, сводки) между собой и со старыми текстами supportText в quiz-data.js, удобно ли на телефоне (ширина 375 px, размер кнопок, переносы), доступность (type у кнопок, aria-pressed для переключателей, фокус). Предлагай конкретные правки текста и кода.` },
  { key: 'data', prompt: `Линза: ДАННЫЕ И СОВМЕСТИМОСТЬ. Проверь: схему localStorage (best, history, srs) и миграцию старых пользователей (нет srs, есть история с id или без id, повреждённые данные); что будет с srs-записями вопросов, которых больше нет в банке (удалённые id); рост данных (history до 3000 записей с полями retry/conf, srs); несколько пользователей на одном устройстве; экспорт JSON/CSV и «Запрос для ИИ» (что теперь считается ошибкой — очередь повторения); очистку истории; повторный вход и смену пользователя; поведение при недоступном localStorage.` },
]

const FIND = {
  type: 'object',
  properties: {
    findings: { type: 'array', items: { type: 'object', properties: {
      title: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
      line: { type: 'string' }, scenario: { type: 'string' }, fix: { type: 'string' },
    }, required: ['title', 'severity', 'line', 'scenario', 'fix'] } },
  },
  required: ['findings'],
}
const VERD = {
  type: 'object',
  properties: { verdicts: { type: 'array', items: { type: 'object', properties: {
    title: { type: 'string' }, verdict: { type: 'string', enum: ['confirmed', 'refuted', 'partly'] },
    severity: { type: 'string', enum: ['critical', 'major', 'minor'] }, reason: { type: 'string' }, fix: { type: 'string' },
  }, required: ['title', 'verdict', 'severity', 'reason', 'fix'] } } },
  required: ['verdicts'],
}

phase('Рецензия')
const res = await pipeline(
  LENSES,
  (l) => agent(`${CONTEXT}\n\n${l.prompt}\n\nВерни findings (title, severity, line, scenario — как воспроизвести, fix — конкретная правка кода или текста).`,
    { label: `рецензент: ${l.key}`, phase: 'Рецензия', schema: FIND, effort: 'high' }),
  (r, l) => {
    if (!r || !r.findings.length) return { l, r, v: { verdicts: [] } }
    return agent(`${CONTEXT}\n\nТы скептик. Другой рецензент (линза «${l.key}») нашёл ${r.findings.length} проблем. Для каждой открой код (Read ${FILE}) и попробуй ОПРОВЕРГНУТЬ: действительно ли сценарий воспроизводится, верен ли номер строки, не преувеличена ли серьёзность, не сломает ли предложенная правка что-то другое. verdict: confirmed / partly / refuted; уточни severity; для confirmed и partly дай правильную правку в fix (можно повторить предложенную, если она верна), для refuted — пустую строку.\n\nНАХОДКИ:\n${JSON.stringify(r.findings, null, 1)}`,
      { label: `скептик: ${l.key}`, phase: 'Перепроверка', schema: VERD, effort: 'high' }).then((v) => ({ l, r, v }))
  }
)
const out = []
for (const x of res.filter(Boolean)) {
  const vs = (x.v && x.v.verdicts) || []
  x.r.findings.forEach((f, i) => {
    const v = vs.find((y) => y.title === f.title) || vs[i] || null
    out.push(Object.assign({ lens: x.l.key }, f, { verdict: v ? v.verdict : 'unverified', vSeverity: v ? v.severity : f.severity, vReason: v ? v.reason : '', vFix: v ? v.fix : '' }))
  })
}
log(`Находок: ${out.length}; подтверждено/частично: ${out.filter((f) => f.verdict !== 'refuted').length}`)
return { findings: out }