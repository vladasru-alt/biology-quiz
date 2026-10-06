export const meta = {
  name: 'rework-chapter-1to5',
  description: 'Глубокая редактура одной из глав 1-5 теста по биологии по стандарту глав 6-10: редакторы по блокам, проверка изменённого, сводный критик',
  phases: [
    { title: 'Редактура', detail: 'редактор на каждый блок темы главы' },
    { title: 'Проверка', detail: 'скептик проверяет изменённые и новые вопросы блока' },
    { title: 'Сводный критик', detail: 'дубли, утечки, противоречия по всей главе' },
  ],
}

const A = args
const PURPOSE = `Контекст: русскоязычный тренажёр по биологии, учебник Д. Тейлор, Н. Грин, У. Стаут «Биология», том 1. ${A.title}. ГЛАВНАЯ ЗАДАЧА ТЕСТА — ПОМОЧЬ НАУЧИТЬСЯ, а не поставить оценку: вопрос должен заставлять вспоминать и рассуждать, а пояснение why (ученик видит его после ответа — и верного, и неверного) должно учить механизму и снимать заблуждение. Вопросы идут по одному в СЛУЧАЙНОМ порядке, варианты перемешиваются. Главы 6-10 уже доведены до стандарта ниже; эта глава делалась раньше и мягче — её надо довести до того же стандарта, сохранив всё хорошее.

ФОРМАТ ВОПРОСА (объект): id (СТРОКА, НЕ МЕНЯТЬ у существующих; у новых — "NEW-<блок>-<n>"), type ("single"|"twotier"|"multi"|"truefalse"|"match"|"order"), level ("understand"|"apply"), steps (2|3|4), topic (из списка тем главы), skill ("понимание понятия"|"объяснение механизма"|"предсказание"|"диагностика ошибки"|"последовательность"|"сравнение"|"вывод по признакам"), difficulty (1|2|3), misconception (ТОЛЬКО true и только у разборов заблуждения; иначе поля нет), q, why.
single: options (4), correct (индекс). twotier: options (4), correct, reasonQ, reasons (4), reasonCorrect. multi: options (5), correct (массив, 2-3 верных). truefalse: answer. match: left и right одной длины (3-4), right[i] ↔ left[i]. order: items (4-5) в ПРАВИЛЬНОМ порядке.
Служебные поля в исходных данных (начинаются с «_»): _длины, _цель_options, _цель_reasons, _находки — в ответ их НЕ включай.

СТАНДАРТ (строго):
1. Ровно один защитимый верный ответ; для multi — ровно верные отмечены; для order — однозначный порядок; для match — однозначное соответствие.
2. ДЛИНА: разброс длины вариантов внутри вопроса ≤5 символов (и у options, и у reasons, и у multi). Место правильного по длине — по полю _цель_*: «самый длинный», «самый короткий», «середина» (ни то, ни другое), «оставить» (сейчас уже в норме: не ухудшай, место правильного не меняй). Считай символы.
3. Дистракторы правдоподобны — это реальные заблуждения ученика, а не абсурд («вообще не нуждается в энергии», «жизнь изучена полностью»); никаких «только/всегда/никогда/вообще» лишь в неверных; зеркальные варианты грамматически одинаковы; правильный не повторяет слова условия и не единственный с оговоркой.
4. why — 1-2 предложения, учит механизму (почему так), снимает заблуждение самого привлекательного дистрактора; НЕ начинается с «Верно»/«Неверно» (приложение само пишет «✓ Верно.»/«✗ Неверно.»); не раскрывает ответ другого вопроса главы; не пересказывает ответ.
5. Если вопрос оканчивается на «?», варианты с заглавной буквы. truefalse — только «Верно ли, что …?» или «Верно ли утверждение: «…»?». multi — «Отметьте все верные». Ни один вопрос не начинается с «В опыте». Рамка «Ученик говорит/считает» — не чаще 1-2 раз на блок.
6. Вопросы-мелочи (даты, фамилии, латинские названия ради названий) переделывай в вопросы на понимание той же идеи или удаляй.
7. Кавычки-ёлочки «», спокойный учительский тон.`

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
    changes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, scope: { type: 'string', enum: ['none', 'why', 'content', 'new'] }, what: { type: 'string' } }, required: ['id', 'scope', 'what'] } },
  },
  required: ['questions', 'deleted', 'changes'],
}

phase('Редактура')

const results = await pipeline(
  A.chunks,
  (c) => agent(
    `${PURPOSE}

Темы главы (поле topic — только из них): ${A.topics.map((t) => '«' + t + '»').join(', ')}.
НЕ ДУБЛИРОВАТЬ ДРУГИЕ ГЛАВЫ: ${A.cross}

Прочитай инструментом Read файл ${c.file} — это блок ${c.key} главы (${c.n} вопросов, темы: ${c.topics.join(', ')}), с полями _находки (проверенные замечания рецензентов; поле fix — исправление, одобренное скептиком: бери за основу, но сверь со стандартом) и целями по длине. Для контекста прочитай ${A.stems} — условия всех вопросов главы, чтобы не создать дублей и утечек.

ЗАДАЧА — пройти КАЖДЫЙ вопрос блока:
а) исправить всё по _находки;
б) довести до стандарта (длина по _цель_*, правдоподобные дистракторы, why по правилу 4, стиль);
в) если находка называет вопрос дублем другого или мелочью без ценности — удали его (в deleted, с причиной) либо переделай в вопрос на понимание; если переделка меняет проверяемую идею — это НОВЫЙ вопрос (id "NEW-${c.key}-n"), а старый id — в deleted;
г) если вопрос хорош и укладывается в стандарт — не трогай его (scope "none").
Кроме того, напиши по одному НОВОМУ вопросу на каждый пробел из поля gaps файла (id "NEW-${c.key}-n", topic из пробела; для single/twotier правильный — «середина» по длине). Предпочитай задания на применение: ситуация, предсказание, вывод по данным.
Сохраняй тип и метаданные существующих вопросов (можно поправить явно неверные skill/difficulty; у разбора заблуждения поставь misconception: true).

Верни: questions — ВСЕ итоговые вопросы блока (и неизменённые, и новые), без удалённых и без служебных полей «_»; deleted; changes — по записи на КАЖДЫЙ вопрос блока и каждый новый (scope: "none" — без изменений, "why" — только пояснение/условие без вариантов, "content" — варианты или ключ, "new" — новый).`,
    { label: `редактор ${A.ch}-${c.key}`, phase: 'Редактура', schema: EDIT, effort: 'high' }
  ),
  (ed, c) => {
    if (!ed) return null
    const touched = new Set((ed.changes || []).filter((x) => x.scope !== 'none').map((x) => x.id))
    const payload = (ed.questions || []).filter((q) => touched.has(q.id))
    if (!payload.length) return { c, ed, v: null }
    return agent(
      `${PURPOSE}

Темы главы: ${A.topics.map((t) => '«' + t + '»').join(', ')}.
НЕ ДУБЛИРОВАТЬ ДРУГИЕ ГЛАВЫ: ${A.cross}

Ты придирчивый биолог-рецензент. ИСХОДИ ИЗ ТОГО, ЧТО ОШИБКИ ЕСТЬ. Редактор переработал блок ${c.key}. Исходные версии вопросов, их находки и цели по длине — в файле ${c.file} (прочитай Read); условия всех вопросов главы — в ${A.stems}.
Ниже ${payload.length} изменённых и новых вопросов. Проверь каждый:
1. ФАКТЫ строго (ошибка факта хуже любой подсказки); ключ верен; второго защитимого ответа нет; match/order/multi однозначны.
2. Находки из _находки действительно устранены, а смысл вопроса не испорчен.
3. ДЛИНА: разброс ≤5 символов у options, reasons и multi; место правильного — по _цель_* исходного вопроса («оставить» — место как в исходнике); у новых single/twotier — «середина». ПОСЧИТАЙ символы и исправь сам, содержательной переформулировкой.
4. Дистракторы правдоподобны, без «только/всегда/вообще» лишь в неверных, грамматически зеркальны.
5. why: 1-2 предложения, механизм, не начинается с «Верно»/«Неверно», не раскрывает ответ другого вопроса главы.
6. Стиль по стандарту; id и метаданные сохранены (у новых — id "NEW-…").
Исправь всё найденное сам. Верни notes (что исправил, с id; фактические ошибки — словом ФАКТ) и questions — ПОЛНЫЕ итоговые объекты всех ${payload.length} вопросов.

ИЗМЕНЕНИЯ РЕДАКТОРА:
${JSON.stringify((ed.changes || []).filter((x) => x.scope !== 'none'), null, 1)}

УДАЛЕНО РЕДАКТОРОМ:
${JSON.stringify(ed.deleted || [], null, 1)}

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
log(`Блоков: ${ok.length}/${A.chunks.length}; вопросов: ${all.length}; удалено: ${deleted.length}; изменено: ${changes.filter((x) => x.scope === 'content' || x.scope === 'why').length}; новых: ${changes.filter((x) => x.scope === 'new').length}`)

phase('Сводный критик')

const critic = await agent(
  `${PURPOSE}

НЕ ДУБЛИРОВАТЬ ДРУГИЕ ГЛАВЫ: ${A.cross}

Ты финальный редактор главы. Перед тобой ${all.length} вопросов после редактуры по блокам (каждый блок проверен отдельно). Найди проблемы, видные ТОЛЬКО на уровне всей главы:
1. ДУБЛИ: два вопроса проверяют одну идею одним способом, или правильный ответ одного стоит вариантом в другом.
2. УТЕЧКИ: why или условие одного вопроса раскрывает ответ другого (порядок случайный).
3. ПРОТИВОРЕЧИЯ между вопросами (числа, термины, определения).
4. ОСТАВШИЕСЯ ОШИБКИ ФАКТОВ, если заметишь.
5. СТИЛЬ по главе: рамка «Ученик» (норма 2-5 на главу), why, начинающиеся с «Верно»/«Неверно», truefalse без «Верно ли», строчные варианты после «?», грамматические подсказки.
Ссылайся на id. Для каждого дубля — какой вопрос оставить и что конкретно сделать с другим.

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
        style: { type: 'array', items: { type: 'string' } },
        verdict: { type: 'string' },
      },
      required: ['duplicates', 'leaks', 'contradictions', 'facts', 'style', 'verdict'],
    },
  }
)

return { questions: all, deleted, changes, notes, critic, missingChunks: A.chunks.filter((c) => !ok.some((r) => r.c.key === c.key)).map((c) => c.key) }