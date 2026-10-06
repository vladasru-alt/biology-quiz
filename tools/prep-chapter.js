// node tools/prep-chapter.js chN K [fix-input.json] [gaps.json] — пакеты главы для редакторов-агентов.
// Глава делится на K блоков по темам (тема целиком в одном блоке, блоки примерно равны). Каждому вопросу
// single/twotier выдаётся цель по длине правильного варианта (_цель_options) и обоснования (_цель_reasons):
// «оставить», если вопрос уже в норме, иначе «самый длинный» / «самый короткий» / «середина» так, чтобы по главе
// вышло около 25 % / 25 % / 50 %. К вопросам приложены их находки (_находки) из fix-input.json
// (формат tools/review-summary.js --merge), к блокам — пробелы с подходящей темой из gaps.json.
// Результат: tools/work/prep/chN-A.json … и chN-stems.json (условия главы — чтобы правка не создала дубль).
const { readJSON, writeJSON, work, loadQuiz, rank, RANK_RU, spread, MAX_SPREAD } = require('./lib');
const [ch, Karg, fixFile, gapsFile] = process.argv.slice(2); const K = +Karg;
if (!ch || !(K >= 1)) { console.log('использование: node tools/prep-chapter.js chN K [fix-input.json] [gaps.json]'); process.exit(1); }
const QUIZ = loadQuiz(); if (!QUIZ[ch]) throw new Error('нет главы ' + ch);
const qs = QUIZ[ch].questions;
const byId = {}; if (fixFile) (readJSON(fixFile)[ch] || []).forEach((f) => { (byId[f.id] = byId[f.id] || []).push(f); });
const GAPS = gapsFile ? readJSON(gapsFile).filter((g) => (g.chapter || g.task) === ch) : [];
const ru = (a, c) => RANK_RU[rank(a, c)];
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
function assign(items) { // items: {id, arr, c}
  const N = items.length, qL = Math.round(N * 0.25), qS = Math.round(N * 0.25); let L = 0, S = 0; const t = {}; const rest = [];
  items.forEach((it) => { const rk = ru(it.arr, it.c), ok = spread(it.arr) <= MAX_SPREAD;
    if (ok && rk === 'самый длинный' && L < qL) { t[it.id] = 'оставить'; L++; }
    else if (ok && rk === 'самый короткий' && S < qS) { t[it.id] = 'оставить'; S++; }
    else if (ok && rk === 'середина') t[it.id] = 'оставить';
    else rest.push(it); });
  // порядок «неудобных» вопросов — по хешу id: распределение воспроизводимо и не зависит от порядка в банке
  rest.sort((a, b) => hash(a.id) - hash(b.id)).forEach((it) => {
    if (L < qL) { t[it.id] = 'самый длинный'; L++; } else if (S < qS) { t[it.id] = 'самый короткий'; S++; } else t[it.id] = 'середина'; });
  return t; }
const tO = assign(qs.filter((q) => q.type === 'single' || q.type === 'twotier').map((q) => ({ id: q.id, arr: q.options, c: q.correct })));
const tR = assign(qs.filter((q) => q.type === 'twotier').map((q) => ({ id: q.id, arr: q.reasons, c: q.reasonCorrect })));
// блоки: темы целиком, жадная раскладка от крупных тем к мелким
const topics = {}; qs.forEach((q) => { (topics[q.topic] = topics[q.topic] || []).push(q); });
const bins = Array.from({ length: K }, () => ({ topics: [], qs: [] }));
Object.entries(topics).sort((a, b) => b[1].length - a[1].length).forEach(([t, list]) => { const b = bins.reduce((m, x) => (x.qs.length < m.qs.length ? x : m)); b.topics.push(t); b.qs.push(...list); });
const ann = (q) => { const o = Object.assign({}, q);
  if (q.type === 'single' || q.type === 'twotier') { o._длины = 'варианты ' + q.options.map((s) => s.length).join('/') + ', правильный — ' + ru(q.options, q.correct) + ', разброс ' + spread(q.options); o._цель_options = tO[q.id]; }
  if (q.type === 'twotier') { o._длины_reasons = q.reasons.map((s) => s.length).join('/') + ', правильный — ' + ru(q.reasons, q.reasonCorrect) + ', разброс ' + spread(q.reasons); o._цель_reasons = tR[q.id]; }
  if (byId[q.id]) o._находки = byId[q.id];
  return o; };
const used = new Set();
const pkgs = bins.map((b, i) => { const key = String.fromCharCode(65 + i);
  const gaps = GAPS.filter((g) => g.topic && b.topics.includes(g.topic)); gaps.forEach((g) => used.add(g));
  if (i === 0) GAPS.filter((g) => !g.topic || !Object.keys(topics).includes(g.topic)).forEach((g) => { gaps.push(g); used.add(g); }); // без темы — в первый блок
  const file = work('prep', ch + '-' + key + '.json');
  writeJSON(file, { chapter: ch, title: QUIZ[ch].title, chunk: key, topics: b.topics, gaps, questions: b.qs.map(ann) });
  return { key, file, n: b.qs.length, topics: b.topics.length, gaps: gaps.length, findings: b.qs.filter((q) => byId[q.id]).length, targets: b.qs.filter((q) => tO[q.id] && tO[q.id] !== 'оставить').length }; });
writeJSON(work('prep', ch + '-stems.json'), qs.map((q) => ({ id: q.id, topic: q.topic, q: q.q })), 0);
const cnt = (o) => Object.values(o).reduce((a, v) => (a[v] = (a[v] || 0) + 1, a), {});
console.log(JSON.stringify({ ch, n: qs.length, targetsOptions: cnt(tO), targetsReasons: cnt(tR), chunks: pkgs }, null, 1));
