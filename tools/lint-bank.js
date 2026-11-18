// node tools/lint-bank.js [quiz-data.js] — сводный линтер всего банка: статистика по главам,
// ОШИБКИ (нарушения стандарта, код выхода 1) и предупреждения (известные отклонения, которые стоит
// просмотреть), межглавные почти-дубли условий. Правила — общие с lint-result.js, они в lib.js.
const { BANK, loadQuiz, loadTopics, loadFigures, spread, sentences, MAX_SPREAD, MAX_WHY_SENT, WHY_SOFT_LIMIT, VERDICT_START, MULTI_TAIL, bannedTerms, structure } = require('./lib');
const FILE = process.argv[2] || BANK;
// главы (QUIZ) и тренажёр по теме (TOPICS) проверяются по одному стандарту; у тем есть шаги read/draw/part2
const QUIZ = Object.assign({}, loadQuiz(FILE), loadTopics(FILE));
const FIG = loadFigures(FILE);
const rankT = (arr, c) => { const L = arr.map((s) => s.length), lc = L[c], mx = Math.max(...L), mn = Math.min(...L);
  if (lc === mx && L.filter((x) => x === mx).length === 1) return 'L'; if (lc === mn && L.filter((x) => x === mn).length === 1) return 'S';
  return (lc === mx || lc === mn) ? 'T' : 'M'; };
const stems = {}, ids = new Set(); let totalErr = 0, totalWarn = 0; const total = { n: 0, rank: {}, whyLong: 0 };
for (const k in QUIZ) {
  const qs = QUIZ[k].questions; const err = [], warn = [];
  const st = { type: {}, diff: {}, rank: {}, misc: 0, uch: 0, why3: 0, whyLen: [], spread5: 0, lower: 0 };
  const c = (o, x) => { o[x] = (o[x] || 0) + 1; };
  qs.forEach((q) => { const id = q.id, e = (m) => err.push(id + ' ' + m), w = (m) => warn.push(id + ' ' + m);
    c(st.type, q.type); c(st.diff, q.difficulty); total.n++;
    if (!new RegExp('^' + k + '-\\d{3}$').test(id)) e('id не вида ' + k + '-NNN'); if (ids.has(id)) e('повтор id'); ids.add(id);
    structure(q).forEach(e);
    if (q.fig && !FIG[q.fig]) e('нет схемы ' + q.fig); if (q.ref && !FIG[q.ref]) e('нет схемы для сверки ' + q.ref);
    if (q.type === 'draw' && Array.isArray(q.elements)) q.elements.forEach((x) => { if (x && x.q && !qs.some((o) => o.id === x.q)) e('draw: часть ссылается на чужой или несуществующий вопрос ' + x.q); });
    if (q.type === 'read') return;
    if (q.misconception) st.misc++; if (/Ученик/.test(q.q)) st.uch++;
    if (/^В опыте/.test(q.q)) e('условие начинается с «В опыте»');
    if (q.type === 'truefalse' && !/^Верно ли/.test(q.q)) e('truefalse без «Верно ли»');
    if (q.type === 'multi' && !MULTI_TAIL.test(q.q)) w('multi не кончается на «Отметьте все верные.»');
    if (VERDICT_START.test(q.why)) e('why начинается с «Верно/Неверно»');
    const sn = sentences(q.why); if (sn >= 3) st.why3++; if (sn > MAX_WHY_SENT) w('why ' + sn + ' предложений');
    st.whyLen.push(q.why.length); if (q.why.length > WHY_SOFT_LIMIT) total.whyLong++;
    const key = q.q.trim().toLowerCase(); if (stems[key]) e('условие совпадает с ' + stems[key]); stems[key] = id;
    if (/\?\s*$/.test(q.q)) [...(q.options || []), ...(q.reasons || [])].forEach((o) => { if (/^[а-яёa-z]/.test(o)) { st.lower++; w('строчная после «?»: ' + o.slice(0, 40)); } });
    if (q.options && spread(q.options) > MAX_SPREAD) { if (q.type === 'multi') w('разброс вариантов multi ' + spread(q.options)); else { st.spread5++; e('разброс options ' + spread(q.options)); } }
    if (q.reasons && spread(q.reasons) > MAX_SPREAD) e('разброс reasons ' + spread(q.reasons));
    if (q.type === 'match' && Array.isArray(q.right) && spread(q.right) > MAX_SPREAD) w('разброс правой колонки match ' + spread(q.right));
    bannedTerms(q).forEach((t) => e('термин ' + t));
    if ((q.type === 'single' || q.type === 'twotier') && Array.isArray(q.options)) { const r = rankT(q.options, q.correct); c(st.rank, r); c(total.rank, r); }
  });
  const wl = st.whyLen.sort((a, b) => a - b);
  console.log(k, JSON.stringify({ n: qs.length, type: st.type, diff: st.diff, rank: st.rank, misc: st.misc, uch: st.uch, why3sent: st.why3, whyMed: wl[wl.length >> 1], whyMax: wl[wl.length - 1], spread5: st.spread5, lower: st.lower }));
  err.forEach((x) => console.log('   ОШИБКА', x)); warn.slice(0, 6).forEach((x) => console.log('   предупр.', x)); if (warn.length > 6) console.log('   … ещё предупреждений: ' + (warn.length - 6));
  totalErr += err.length; totalWarn += warn.length;
}
console.log('\nВсего вопросов', total.n, '| место правильного по длине (single/twotier)', JSON.stringify(total.rank), '| why длиннее', WHY_SOFT_LIMIT, 'знаков:', total.whyLong);
console.log('ОШИБОК', totalErr, '| предупреждений', totalWarn);
// межглавные почти-дубли условий: коэффициент Жаккара по словам длиннее 4 букв
const words = (s) => new Set(s.toLowerCase().replace(/[^а-яёa-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 4));
const all = []; for (const k in QUIZ) QUIZ[k].questions.forEach((q) => all.push({ id: q.id, k, w: words(q.q), q: q.q }));
const pairs = [];
for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) { if (all[a].k === all[b].k) continue;
  const A = all[a].w, B = all[b].w; let inter = 0; A.forEach((x) => { if (B.has(x)) inter++; }); const j = inter / (A.size + B.size - inter);
  if (j > 0.4 && inter >= 4) pairs.push([j.toFixed(2), all[a].id, all[b].id, all[a].q.slice(0, 70), all[b].q.slice(0, 70)]); }
console.log('\nМежглавные похожие условия (для глаз человека):', pairs.length); pairs.sort((x, y) => y[0] - x[0]).slice(0, 15).forEach((p) => console.log('  ' + p.join(' | ')));
process.exitCode = totalErr ? 1 : 0;
