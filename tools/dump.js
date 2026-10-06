// node tools/dump.js [папка] — выгрузка для рецензентов и редакторов (по умолчанию tools/work/dump):
//  chN.json — глава с полями _len/_lenReasons («33/35/31/34 правильный: середина»), чтобы агент не считал длины сам;
//  all-compact.txt — весь банк по три строки на вопрос (условие / ОТВЕТ / WHY): по нему ищут дубли и противоречия Grep-ом.
const { path, loadQuiz, writeJSON, work, fs } = require('./lib');
const dir = process.argv[2] ? path.resolve(process.argv[2]) : path.dirname(work('dump', 'x'));
const QUIZ = loadQuiz();
const rank = (arr, c) => { const L = arr.map((s) => s.length), v = L[c], mx = Math.max(...L), mn = Math.min(...L);
  const r = v === mx && L.filter((x) => x === mx).length === 1 ? 'самый длинный' : v === mn && L.filter((x) => x === mn).length === 1 ? 'самый короткий' : 'середина/ничья';
  return L.join('/') + ' правильный: ' + r; };
const ans = (q) => { switch (q.type) {
  case 'single': return q.options[q.correct];
  case 'twotier': return q.options[q.correct] + ' || обоснование: ' + q.reasons[q.reasonCorrect];
  case 'multi': return q.correct.map((i) => q.options[i]).join(' ; ');
  case 'truefalse': return q.answer ? 'верно' : 'неверно';
  case 'match': return q.left.map((l, i) => l + ' → ' + q.right[i]).join(' ; ');
  case 'order': return q.items.join(' → '); } };
let compact = '';
for (const ch of Object.keys(QUIZ)) { const C = QUIZ[ch];
  const qs = C.questions.map((q) => { const o = Object.assign({}, q);
    if (q.options && q.correct !== undefined && !Array.isArray(q.correct)) o._len = rank(q.options, q.correct);
    if (q.reasons) o._lenReasons = rank(q.reasons, q.reasonCorrect); return o; });
  writeJSON(path.join(dir, ch + '.json'), { chapter: ch, title: C.title, desc: C.desc, questions: qs });
  compact += '\n### ' + C.title + '\n';
  for (const q of C.questions) compact += q.id + ' [' + q.type + ', ' + q.topic + '] ' + q.q + '\n   ОТВЕТ: ' + ans(q) + '\n   WHY: ' + q.why + '\n';
}
fs.writeFileSync(path.join(dir, 'all-compact.txt'), compact);
console.log('выгружено в', dir, '|', Object.keys(QUIZ).map((k) => k + ':' + QUIZ[k].questions.length).join(' '), '| сводка', compact.length, 'симв.');
