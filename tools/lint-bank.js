// node tools/lint-bank.js [quiz-data.js] — сводный линтер всего банка: статистика по главам,
// ОШИБКИ (нарушения стандарта, код выхода 1) и предупреждения (известные отклонения, которые стоит
// просмотреть), межглавные почти-дубли условий. Правила — общие с lint-result.js, они в lib.js.
const { fs, path, ROOT, BANK, loadQuiz, loadTopics, loadFigures, spread, sentences, MAX_SPREAD, MAX_WHY_SENT, WHY_SOFT_LIMIT, VERDICT_START, MULTI_TAIL, BANNED_TERMS, bannedTerms, structure } = require('./lib');
const FILE = process.argv[2] || BANK;
// главы (QUIZ) и тренажёр по теме (TOPICS) проверяются по одному стандарту; у тем есть шаги read/draw/part2
const QUIZ = Object.assign({}, loadQuiz(FILE), loadTopics(FILE));
const FIG = loadFigures(FILE);
const TOPIC_KEYS = new Set(Object.keys(loadTopics(FILE)));
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
    [].concat(q.whyFig || []).forEach((f) => { if (!FIG[f]) e('нет схемы-пояснения ' + f); });
    if (q.type === 'draw' && Array.isArray(q.elements)) q.elements.forEach((x) => { if (x && x.q && !qs.some((o) => o.id === x.q)) e('draw: часть ссылается на чужой или несуществующий вопрос ' + x.q); });
    // материалы тем к учебнику не привязаны: в шагах занятия нет слов «учебник», «параграф» и знака §
    if (TOPIC_KEYS.has(k) && /учебник|параграф|§/i.test(JSON.stringify(q))) e('в шаге темы есть «учебник» или «параграф»');
    // у шага чтения нет метаданных и пояснения, но термины в его тексте — те же
    if (q.type === 'read') { bannedTerms(q).forEach((t) => e('термин ' + t)); return; }
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
  // схема для сверки рисунка и схемы того же семейства (поле scheme) не показываются раньше самого рисунка:
  // иначе «Нарисуй и сверь» превращается в срисовывание только что увиденного
  const fam = (f) => (FIG[f] && FIG[f].scheme) || f;
  qs.forEach((q, i) => { if (q.type !== 'draw' || !q.ref) return;
    qs.slice(0, i).forEach((p) => [p.fig].concat(p.whyFig || []).filter(Boolean).forEach((f) => {
      if (fam(f) === fam(q.ref)) err.push(q.id + ' схема для сверки уже показана раньше: ' + p.id + ' (' + f + ')'); })); });
  const wl = st.whyLen.sort((a, b) => a - b);
  console.log(k, JSON.stringify({ n: qs.length, type: st.type, diff: st.diff, rank: st.rank, misc: st.misc, uch: st.uch, why3sent: st.why3, whyMed: wl[wl.length >> 1], whyMax: wl[wl.length - 1], spread5: st.spread5, lower: st.lower }));
  err.forEach((x) => console.log('   ОШИБКА', x)); warn.slice(0, 6).forEach((x) => console.log('   предупр.', x)); if (warn.length > 6) console.log('   … ещё предупреждений: ' + (warn.length - 6));
  totalErr += err.length; totalWarn += warn.length;
}
// схемы: описание словами и подпись, сам рисунок или файл фотографии с автором и лицензией; лишние — на просмотр
const usedFig = new Set(); for (const k in QUIZ) QUIZ[k].questions.forEach((q) => [q.fig, q.ref].concat(q.whyFig || []).filter(Boolean).forEach((f) => usedFig.add(f)));
for (const f in FIG) { const d = FIG[f], e = [];
  if (!d.alt || !d.caption) e.push('нет alt или caption');
  if (!!d.svg === !!d.img) e.push('нужен ровно один из svg и img');
  if (d.img) {
    if (!d.credit) e.push('у фотографии нет credit — автора и лицензии');
    // путь относительный и с точным регистром: сайт лежит в подпапке, а GitHub Pages, в отличие от macOS, регистр различает
    if (/^[\/]|^[a-z]+:|\.\./i.test(d.img)) e.push('путь к файлу должен быть относительным: ' + d.img);
    const dir = path.join(ROOT, path.dirname(d.img)), base = path.basename(d.img);
    if (!fs.existsSync(dir) || !fs.readdirSync(dir).includes(base)) e.push('нет файла ' + d.img + ' (имя сверяется с учётом регистра)');
    else if (fs.statSync(path.join(dir, base)).size > 200000) e.push('файл ' + d.img + ' больше 200 КБ');
    if (!(d.w > 0 && d.h > 0)) e.push('у фотографии нет размеров w и h: без них страница прыгает при загрузке');
  }
  if (d.svg && (/<script|<foreignObject|<image|href=/i.test(d.svg) || d.svg.includes("'"))) e.push('в svg скрипт, foreignObject, image, ссылка или одинарная кавычка');
  if (d.svg && !/^<svg [^>]*viewBox=/.test(d.svg)) e.push('svg должен начинаться с <svg и иметь viewBox');
  // одна схема встречается на странице несколько раз (вопрос, разбор, «заблуждение дня»): ссылки по id
  // на маркеры и градиенты в скрытых разделах не работают, и стрелки остаются без наконечников
  if (d.svg && /\sid=|<defs|<marker|url\(#|<use\b/i.test(d.svg)) e.push('в svg есть id, defs, marker, use или url(#…): наконечники стрелок рисуются контуром');
  // рисунок, который виден до ответа, не привязан к учебнику
  if (/учебник|параграф|§/i.test([d.alt, d.caption, d.credit].join(' '))) e.push('в описании или подписи есть «учебник» или «параграф»');
  e.forEach((x) => { totalErr++; console.log('   ОШИБКА схема ' + f + ': ' + x); });
  if (!usedFig.has(f)) { totalWarn++; console.log('   предупр. схема ' + f + ' нигде не используется'); }
  if (BANNED_TERMS.some((b) => b.re.test([d.alt, d.caption, d.svg ? d.svg.replace(/<[^>]+>/g, ' ') : ''].join(' ')))) { totalErr++; console.log('   ОШИБКА схема ' + f + ': запрещённый термин в подписях'); }
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
