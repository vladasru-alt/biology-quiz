// node tools/diff-chapter.js result.json chN — сколько вопросов и какие поля изменены против банка.
// Видно, например, что редактор языка трогал только why и не задел correct.
const { readResult, loadQuiz } = require('./lib');
const [file, ch] = process.argv.slice(2);
if (!file || !ch) { console.log('использование: node tools/diff-chapter.js result.json chN'); process.exit(1); }
const byId = Object.fromEntries(loadQuiz()[ch].questions.map((q) => [q.id, q]));
const r = readResult(file); let n = 0, fresh = 0; const fc = {};
for (const q of r.questions) { const o = byId[q.id]; if (!o) { fresh++; continue; }
  const f = Object.keys({ ...o, ...q }).filter((k) => !k.startsWith('_') && JSON.stringify(o[k]) !== JSON.stringify(q[k]));
  if (f.length) { n++; f.forEach((k) => { fc[k] = (fc[k] || 0) + 1; }); } }
console.log(ch, 'изменено вопросов', n, 'новых', fresh, 'из', r.questions.length, JSON.stringify(fc));
