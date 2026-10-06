// node tools/show.js file.json [id1,id2|префикс] — показать вопросы для чтения глазами:
// верный вариант помечен ✔, у двухъярусного — вопрос второго шага и обоснования, в конце пояснение.
const { readResult } = require('./lib');
const r = readResult(process.argv[2]); const Q = r.questions || r;
const only = process.argv[3] ? process.argv[3].split(',') : null;
for (const q of Q) { const key = q.id || q._n || '';
  // «ch1» — вся глава 1 (но не ch10), «ch1-00» — номера ch1-001…ch1-009, «ch1-005» — один вопрос
  if (only && !only.some((p) => key === p || (/^ch\d+$/.test(p) ? key.startsWith(p + '-') : key.startsWith(p)))) continue;
  let s = `\n${key} [${q.type} ${q.topic} d${q.difficulty} ${q.level}${q.misconception ? ' MISC' : ''}] ${q.q}`;
  if (q.options) s += '\n  ' + q.options.map((o, i) => ((Array.isArray(q.correct) ? q.correct.includes(i) : q.correct === i) ? '✔' : '·') + o).join('\n  ');
  if (q.reasons) s += '\n  ? ' + q.reasonQ + '\n  ' + q.reasons.map((o, i) => (q.reasonCorrect === i ? '✔' : '·') + o).join('\n  ');
  if (q.left) s += '\n  ' + q.left.map((l, i) => l + ' → ' + q.right[i]).join('\n  ');
  if (q.items) s += '\n  ' + q.items.join(' → ');
  if (q.type === 'truefalse') s += '\n  answer=' + q.answer;
  s += '\n  WHY (' + q.why.length + '): ' + q.why; console.log(s); }
