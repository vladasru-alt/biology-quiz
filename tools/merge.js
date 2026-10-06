// node tools/merge.js v1.json правка.json out.json — свести первую редактуру главы и правку по отчёту критика:
// changed заменяет вопрос по id, deleted удаляет; удалённые NEW- в итоговый deleted не попадают.
const { readResult, writeJSON } = require('./lib');
const [a, b, out] = process.argv.slice(2);
if (!a || !b || !out) { console.log('использование: node tools/merge.js v1.json правка.json out.json'); process.exit(1); }
const v1 = readResult(a), rv = readResult(b);
const byId = {}; v1.questions.forEach((q) => { byId[q.id] = q; }); const order = v1.questions.map((q) => q.id);
(rv.changed || []).forEach((q) => { if (!byId[q.id]) order.push(q.id); byId[q.id] = q; });
const del = new Set((rv.deleted || []).map((d) => d.id));
const questions = order.filter((id) => !del.has(id)).map((id) => byId[id]);
const deleted = [...(v1.deleted || []), ...(rv.deleted || []).filter((d) => !/^NEW-/.test(d.id))];
writeJSON(out, { questions, deleted });
console.log('итог', questions.length, 'вопросов; изменено правкой', (rv.changed || []).length, '; удалено всего', deleted.length);
