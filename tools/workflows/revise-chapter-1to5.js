export const meta = {
  name: 'revise-chapter-1to5',
  description: 'Правка главы по отчёту сводного критика: дубли, утечки, противоречия; перепроверка изменённого',
  phases: [
    { title: 'Правка', detail: 'редактор на каждый блок: только свои вопросы' },
    { title: 'Проверка', detail: 'скептик по изменённым вопросам' },
  ],
}

const A = args
const RULES = `Контекст: русскоязычный тренажёр по биологии, учебник Д. Тейлор, Н. Грин, У. Стаут «Биология», том 1. ${A.title}. Главная задача — помочь научиться: вопрос заставляет вспоминать и рассуждать, пояснение why (его видят после любого ответа) учит механизму. Вопросы идут в СЛУЧАЙНОМ порядке, варианты перемешиваются.

Формат вопроса (JSON): id (НЕ менять; у новых — "NEW-…"), type, level, steps, topic (из тем главы: ${A.topics.map((t) => '«' + t + '»').join(', ')}), skill, difficulty, misconception (только true), q, why; single/twotier — options(4)+correct; twotier — reasonQ, reasons(4), reasonCorrect; multi — options(5)+correct(массив 2-3); truefalse — answer; match — left/right; order — items в верном порядке.
СТАНДАРТ: один защитимый верный ответ; разброс длины вариантов ≤5 символов (options, reasons, multi); если меняешь варианты single/twotier — место правильного по длине сохрани таким, как сейчас (самый длинный / самый короткий / середина), у новых — середина; дистракторы правдоподобны, без «только/всегда/вообще» лишь в неверных, грамматически зеркальны; why 1-2 предложения, учит механизму, НЕ начинается с «Верно»/«Неверно», не раскрывает ответ другого вопроса главы; после «?» варианты с заглавной; truefalse — «Верно ли…»; multi — «… Отметьте все верные.» в конце; ни одного «В опыте».
НЕ ДУБЛИРОВАТЬ ДРУГИЕ ГЛАВЫ: ${A.cross}`

const QITEM = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
const EDIT = {
  type: 'object',
  properties: {
    questions: { type: 'array', items: QITEM },
    deleted: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id', 'reason'] } },
    changes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, what: { type: 'string' } }, required: ['id', 'what'] } },
  },
  required: ['questions', 'deleted', 'changes'],
}

phase('Правка')

const results = await pipeline(
  A.owners,
  (o) => agent(
    `${RULES}

Прочитай инструментом Read файл ${A.file} — это вся глава после первой редактуры (поле questions). Ниже отчёт сводного критика по главе. ТВОИ вопросы (менять можешь только их): ${o.ids.join(', ')}.

Выполни ВСЕ пункты отчёта, где нужно изменить текст ТВОЕГО вопроса (дубли — поле change и action; утечки — меняй тот вопрос, чей текст раскрывает ответ, как предлагает критик; противоречия, факты, стиль). Если пункт требует менять чужой вопрос — пропусти его (им займётся другой редактор). Если критик предлагает вариант «удалить или переделать» — переделай в вопрос на другую идею главы.
${A.extra ? 'ДОПОЛНИТЕЛЬНЫЕ УКАЗАНИЯ: ' + A.extra : ''}

Верни questions — ПОЛНЫЕ объекты только изменённых вопросов (с прежним id), deleted (если что-то удаляешь) и changes (id и что сделано).

${A.critic ? 'ОТЧЁТ КРИТИКА:\n' + JSON.stringify(A.critic, null, 1) : 'ОТЧЁТ КРИТИКА — поле critic в том же файле ' + A.file + ' (прочитай его целиком).'}`,
    { label: `правка ${A.ch}-${o.key}`, phase: 'Правка', schema: EDIT, effort: 'high' }
  ),
  (ed, o) => {
    if (!ed || !(ed.questions || []).length) return ed ? { o, ed, v: null } : null
    return agent(
      `${RULES}

Ты придирчивый биолог-рецензент. ИСХОДИ ИЗ ТОГО, ЧТО ОШИБКИ ЕСТЬ. Редактор переделал ${ed.questions.length} вопросов главы по отчёту критика. Прежние версии и вся глава — в ${A.file} (прочитай Read).
Проверь каждый изменённый вопрос: факты строго; ключ и единственность верного ответа; пункт критика устранён и не создал новой утечки или дубля с другими вопросами главы (сверь с файлом); разброс длины ≤5 и место правильного по длине как в прежней версии (у новых — середина) — ПОСЧИТАЙ символы; why по стандарту. Исправь сам всё найденное.
Верни notes (что исправил, с id; фактические ошибки — словом ФАКТ) и questions — ПОЛНЫЕ итоговые объекты всех ${ed.questions.length} вопросов.

ИЗМЕНЕНИЯ РЕДАКТОРА:
${JSON.stringify(ed.changes, null, 1)}

ВОПРОСЫ:
${JSON.stringify(ed.questions, null, 1)}`,
      {
        label: `проверка ${A.ch}-${o.key}`, phase: 'Проверка', effort: 'high',
        schema: { type: 'object', properties: { notes: { type: 'array', items: { type: 'string' } }, questions: { type: 'array', items: QITEM } }, required: ['notes', 'questions'] },
      }
    ).then((v) => ({ o, ed, v }))
  }
)

const ok = results.filter(Boolean)
const changed = {}
const deleted = []
ok.forEach((r) => {
  ;(r.ed.questions || []).forEach((q) => { changed[q.id] = q })
  if (r.v) (r.v.questions || []).forEach((q) => { changed[q.id] = q })
  deleted.push(...(r.ed.deleted || []))
})
log(`Изменено: ${Object.keys(changed).length}, удалено: ${deleted.length}`)
return {
  changed: Object.values(changed),
  deleted,
  changes: ok.flatMap((r) => r.ed.changes || []),
  notes: ok.flatMap((r) => (r.v && r.v.notes) || []),
  missing: A.owners.filter((o) => !ok.some((r) => r.o.key === o.key)).map((o) => o.key),
}