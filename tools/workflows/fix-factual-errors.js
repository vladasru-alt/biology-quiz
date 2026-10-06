export const meta = {
  name: 'fix-factual-errors',
  description: 'Исправить фактические ошибки и неверные ключи во всех главах теста по биологии: редакторы по группам глав, затем проверка',
  phases: [
    { title: 'Правка', detail: '5 редакторов по группам глав' },
    { title: 'Проверка', detail: 'скептик проверяет каждое исправление' },
  ],
}

const DIR = '<рабочая папка>'

const RULES = `Контекст: русскоязычный тренажёр по биологии по учебнику Д. Тейлор, Н. Грин, У. Стаут «Биология», том 1. Главная задача — помочь научиться: ученик не должен выучить неправду и не должен быть наказан за верное знание. Пояснение why ученик видит ПОСЛЕ ответа — и при верном, и при неверном.

Формат вопроса (JSON): id (НЕ менять!), type (single|twotier|multi|truefalse|match|order), level, steps, topic, skill, difficulty, misconception (только true, иначе поля нет), q, why; single/twotier — options(4) + correct (индекс); twotier — ещё reasonQ, reasons(4), reasonCorrect; multi — options(5) + correct (массив); truefalse — answer; match — left/right одной длины, right[i] соответствует left[i]; order — items в верном порядке. Варианты перемешиваются при показе.

Правила для ИЗМЕНЁННЫХ вопросов:
1. Факты — верные; упрощение учебника допустимо, если оно не ложно.
2. Ровно один защитимый верный ответ (для multi — ровно отмеченные; для order — однозначный порядок).
3. Правильный вариант не выдаёт себя: не самый длинный с отрывом, не единственный подробный или с оговорками; зеркальные варианты грамматически одинаковы; нет «всегда/только/никогда» лишь в неверных. Разброс длины вариантов старайся держать в пределах 5-8 символов.
4. Дистракторы правдоподобны (отражают реальные заблуждения), а не абсурдны.
5. why — 1-2 предложения, учит механизму; не начинается с «Верно»/«Неверно»; не раскрывает ответ другого вопроса главы.
6. Если вопрос оканчивается на «?», варианты с заглавной буквы; truefalse — только «Верно ли…».
7. Метаданные (topic, skill, difficulty, level, steps) не трогай, если не поменялся тип вопроса.`

const GROUPS = [
  { key: 'g1', chapters: ['ch1', 'ch2'] },
  { key: 'g2', chapters: ['ch3'] },
  { key: 'g3', chapters: ['ch4', 'ch7', 'ch8'] },
  { key: 'g4', chapters: ['ch5'] },
  { key: 'g5', chapters: ['ch6', 'ch9', 'ch10'] },
]

const QITEM = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
const EDIT = {
  type: 'object',
  properties: {
    changes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, what: { type: 'string' } }, required: ['id', 'what'] } },
    questions: { type: 'array', items: QITEM },
  },
  required: ['changes', 'questions'],
}

const results = await pipeline(
  GROUPS,
  (g) => agent(
    `${RULES}

Прочитай инструментом Read файл ${DIR}/p2-findings.json — это проверенные находки: фактические ошибки, неверные ключи, два верных ответа. Твои — те, у которых в поле ids главы ${g.chapters.join(', ')}. Вопросы лежат в файлах ${g.chapters.map((c) => DIR + '/p2/' + c + '.json').join(', ')} (ищи по id).

Для КАЖДОЙ своей находки исправь вопрос(ы). Поле fix — исправление, одобренное проверяющим; бери его за основу, но сам сверь с правилами выше: если оно оставляет подсказку длиной, абсурдный дистрактор или новую неточность — улучши. Если находка касается нескольких вопросов (ids через запятую), исправь все. Меняй только то, что нужно для исправления, остальное в вопросе не трогай.

Верни changes (id и что исправлено) и questions — ПОЛНЫЕ объекты всех изменённых вопросов со всеми полями, с прежним id.`,
    { label: `редактор ${g.chapters.join('+')}`, phase: 'Правка', schema: EDIT, effort: 'high' }
  ),
  (ed, g) => {
    if (!ed || !ed.questions || !ed.questions.length) return ed ? { g, ed, v: null } : null
    return agent(
      `${RULES}

Ты придирчивый биолог-рецензент. ИСХОДИ ИЗ ТОГО, ЧТО ОШИБКИ ЕСТЬ. Редактор исправил ${ed.questions.length} вопросов глав ${g.chapters.join(', ')} по находкам из ${DIR}/p2-findings.json (прочитай свои находки там; прежние версии вопросов — в ${g.chapters.map((c) => DIR + '/p2/' + c + '.json').join(', ')}, для сравнения и чтобы не создать дублей с другими вопросами главы).

Проверь каждое исправление:
1. Находка действительно устранена, а не переформулирована с той же ошибкой.
2. Факты верны (строго), ключ верен, второго защитимого ответа нет; для match/order/multi — соответствие, порядок и отметки.
3. Нет подсказок длиной, грамматикой, словами «только/всегда»; дистракторы правдоподобны; посчитай длины вариантов.
4. why 1-2 предложения, учит механизму, не начинается с «Верно»/«Неверно», не раскрывает ответ другого вопроса главы.
5. id и метаданные сохранены.

Исправь всё найденное сам. Верни notes (что ты поменял, с id; фактические ошибки — словом ФАКТ; если всё хорошо — пустой список) и questions — ПОЛНЫЕ итоговые объекты всех ${ed.questions.length} вопросов.

ИЗМЕНЕНИЯ РЕДАКТОРА:
${JSON.stringify(ed.changes, null, 1)}

ИСПРАВЛЕННЫЕ ВОПРОСЫ:
${JSON.stringify(ed.questions, null, 1)}`,
      {
        label: `проверка ${g.chapters.join('+')}`, phase: 'Проверка', effort: 'high',
        schema: { type: 'object', properties: { notes: { type: 'array', items: { type: 'string' } }, questions: { type: 'array', items: QITEM } }, required: ['notes', 'questions'] },
      }
    ).then((v) => ({ g, ed, v }))
  }
)

const ok = results.filter(Boolean)
const final = {}
ok.forEach((r) => {
  ;(r.ed.questions || []).forEach((q) => { final[q.id] = q })
  if (r.v) (r.v.questions || []).forEach((q) => { final[q.id] = q })
})
log(`Исправлено вопросов: ${Object.keys(final).length}`)
return {
  questions: Object.values(final),
  changes: ok.flatMap((r) => r.ed.changes || []),
  notes: ok.flatMap((r) => (r.v && r.v.notes) || []),
  unverified: ok.filter((r) => !r.v).map((r) => r.g.key),
}