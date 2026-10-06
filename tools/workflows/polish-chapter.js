export const meta = {
  name: 'polish-chapter',
  description: 'Точечная доводка уже переработанной главы теста: находки ревью, длина вариантов, длинные пояснения, рамка «Ученик»; проверка и сводный критик',
  phases: [
    { title: 'Доводка', detail: 'редактор на блок главы' },
    { title: 'Проверка', detail: 'скептик по изменённым вопросам' },
    { title: 'Сводный критик', detail: 'дубли и утечки по главе' },
  ],
}

const A = args
const PURPOSE = `Контекст: русскоязычный тренажёр по биологии, учебник Д. Тейлор, Н. Грин, У. Стаут «Биология», том 1. ${A.title}. ГЛАВНАЯ ЗАДАЧА ТЕСТА — ПОМОЧЬ НАУЧИТЬСЯ: вопрос заставляет вспоминать и рассуждать, пояснение why (его видят после любого ответа) учит механизму и снимает заблуждение. Вопросы идут в СЛУЧАЙНОМ порядке, варианты перемешиваются.

Глава уже в целом соответствует стандарту. Задача — ТОЧЕЧНАЯ ДОВОДКА, а не переписывание:
1. Исправить вопросы по полю _находки (проверенные замечания рецензентов; поле fix — исправление, одобренное скептиком: бери за основу, но сверь со стандартом).
2. ДЛИНА: где поле _цель_options или _цель_reasons не «оставить», сделай правильный вариант ровно «самым длинным», «самым коротким» или «серединой» (ни то, ни другое) и разброс длины вариантов ≤5 символов. Где «оставить» — длину не ухудшай и место правильного не меняй. Считай символы.
3. why длиннее двух предложений сократи до 1-2 предложений, сохранив механизм и разбор главного заблуждения.
4. Рамка «Ученик говорит/считает/утверждает» — не больше одного вопроса на блок; в остальных замени рамку («Встречается мнение», «Практикант решил», «Распространено утверждение» и т. п.), смысл не меняй.
5. Хороший вопрос, к которому нет замечаний, НЕ ТРОГАЙ.

ФОРМАТ (JSON): id (НЕ менять), type, level, steps, topic, skill, difficulty, misconception (только true), q, why; single/twotier — options(4)+correct; twotier — reasonQ, reasons(4), reasonCorrect; multi — options(5)+correct (массив 2-3); truefalse — answer; match — left/right, right[i] ↔ left[i]; order — items в верном порядке. Служебные поля «_…» в ответ не включай.
СТАНДАРТ: один защитимый верный ответ; дистракторы правдоподобны (реальные заблуждения), без «только/всегда/вообще» лишь в неверных, грамматически зеркальны; why не начинается с «Верно»/«Неверно» и не раскрывает ответ другого вопроса главы; после «?» варианты с заглавной; truefalse — «Верно ли…»; multi — «Отметьте все верные»; ни одного «В опыте».
НЕ ДУБЛИРОВАТЬ ДРУГИЕ ГЛАВЫ: ${A.cross}`

const QITEM = {
  type: 'object',
  properties: {
    id: { type: 'string' }, type: { type: 'string' }, level: { type: 'string' }, steps: { type: 'number' },
    topic: { type: 'string' }, skill: { type: 'string' }, difficulty: { type: 'number' }, misconception: { type: 'boolean' },
    q: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, correct: {}, answer: { type: 'boolean' },
    left: { type: 'array', items: { type: 'string' } }, right: { type: 'array', items: { type: 'string' } }, items: { type: 'array', items: { type: 'string' } },
    reasonQ: { type: 'string' }, reasons: { type: 'array', items: { type: 'string' } }, reasonCorrect: { type: 'number' }, why: { type: 'string' },
  },
  required: ['id', 'type', 'level', 'steps', 'topic', 'skill', 'difficulty', 'q', 'why'],
}
const EDIT = {
  type: 'object',
  properties: {
    questions: { type: 'array', items: QITEM },
    deleted: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id', 'reason'] } },
    changes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, scope: { type: 'string', enum: ['none', 'why', 'content'] }, what: { type: 'string' } }, required: ['id', 'scope', 'what'] } },
  },
  required: ['questions', 'deleted', 'changes'],
}

phase('Доводка')

const results = await pipeline(
  A.chunks,
  (c) => agent(
    `${PURPOSE}

Прочитай инструментом Read файл ${c.file} — блок ${c.key} главы (${c.n} вопросов) с полями _находки и целями по длине. Для контекста прочитай ${A.stems} — условия всех вопросов главы.
Пройди каждый вопрос блока по пунктам 1-5. Удаляй вопрос (в deleted, с причиной) только если находка прямо называет его дублем и его идея есть в другом вопросе главы.
Верни: questions — ВСЕ итоговые вопросы блока (и неизменённые), без удалённых и без служебных полей; deleted; changes — запись на каждый вопрос (scope "none" — без изменений, "why" — только пояснение или условие, "content" — варианты или ключ).`,
    { label: `доводка ${A.ch}-${c.key}`, phase: 'Доводка', schema: EDIT, effort: 'high' }
  ),
  (ed, c) => {
    if (!ed) return null
    const touched = new Set((ed.changes || []).filter((x) => x.scope !== 'none').map((x) => x.id))
    const payload = (ed.questions || []).filter((q) => touched.has(q.id))
    if (!payload.length) return { c, ed, v: null }
    return agent(
      `${PURPOSE}

Ты придирчивый биолог-рецензент. ИСХОДИ ИЗ ТОГО, ЧТО ОШИБКИ ЕСТЬ. Редактор доводил блок ${c.key}; исходные версии, находки и цели по длине — в ${c.file} (прочитай Read), условия всех вопросов главы — в ${A.stems}.
Проверь ${payload.length} изменённых вопросов: факты строго; ключ и единственность верного ответа; находка устранена и не создана новая утечка или дубль; разброс длины ≤5 и место правильного по _цель_* исходника («оставить» — как в исходнике) — ПОСЧИТАЙ символы; why 1-2 предложения, учит механизму; сокращённое why не потеряло смысла; id и метаданные сохранены. Исправь всё найденное сам.
Верни notes (что исправил, с id; фактические ошибки — словом ФАКТ) и questions — ПОЛНЫЕ итоговые объекты всех ${payload.length} вопросов.

ИЗМЕНЕНИЯ РЕДАКТОРА:
${JSON.stringify((ed.changes || []).filter((x) => x.scope !== 'none'), null, 1)}

ВОПРОСЫ:
${JSON.stringify(payload, null, 1)}`,
      {
        label: `проверка ${A.ch}-${c.key}`, phase: 'Проверка', effort: 'high',
        schema: { type: 'object', properties: { notes: { type: 'array', items: { type: 'string' } }, questions: { type: 'array', items: QITEM } }, required: ['notes', 'questions'] },
      }
    ).then((v) => ({ c, ed, v }))
  }
)

const ok = results.filter(Boolean)
const byId = {}
const deleted = []
const changes = []
const notes = []
ok.forEach((r) => {
  ;(r.ed.questions || []).forEach((q) => { byId[q.id] = q })
  if (r.v) (r.v.questions || []).forEach((q) => { byId[q.id] = q })
  deleted.push(...(r.ed.deleted || []))
  changes.push(...(r.ed.changes || []))
  if (r.v) notes.push(...(r.v.notes || []))
})
const all = Object.values(byId)
log(`Вопросов: ${all.length}; удалено: ${deleted.length}; изменено: ${changes.filter((x) => x.scope !== 'none').length}`)

phase('Сводный критик')

const critic = await agent(
  `${PURPOSE}

Ты финальный редактор главы. Перед тобой ${all.length} вопросов после доводки. Найди проблемы, видные ТОЛЬКО на уровне всей главы: дубли (одна идея одним способом), утечки (why или условие одного вопроса раскрывает ответ другого), противоречия, оставшиеся ошибки фактов. Ссылайся на id и для каждого пункта скажи, что конкретно исправить. Не выдумывай: если проблем нет — верни пустые списки.

ВОПРОСЫ:
${JSON.stringify(all, null, 1)}`,
  {
    label: `критик ${A.ch}`, phase: 'Сводный критик', effort: 'high',
    schema: {
      type: 'object',
      properties: {
        duplicates: { type: 'array', items: { type: 'object', properties: { keep: { type: 'string' }, change: { type: 'string' }, action: { type: 'string' } }, required: ['keep', 'change', 'action'] } },
        leaks: { type: 'array', items: { type: 'string' } },
        contradictions: { type: 'array', items: { type: 'string' } },
        facts: { type: 'array', items: { type: 'string' } },
        verdict: { type: 'string' },
      },
      required: ['duplicates', 'leaks', 'contradictions', 'facts', 'verdict'],
    },
  }
)

return { questions: all, deleted, changes, notes, critic, missingChunks: A.chunks.filter((c) => !ok.some((r) => r.c.key === c.key)).map((c) => c.key) }