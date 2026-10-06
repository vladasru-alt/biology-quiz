// node tools/check-new.js chN new.json — проверить новые вопросы (например, на пробелы) по стандарту банка.
// У нового вопроса правильный вариант и правильное обоснование — «середина» по длине.
const { readResult, loadQuiz, rank, spread, sentences, MAX_SPREAD, MAX_WHY_SENT, WHY_SOFT_LIMIT, VERDICT_START, MULTI_TAIL, bannedTerms, structure } = require('./lib');
const [ch, file] = process.argv.slice(2);
if (!ch || !file) { console.log('использование: node tools/check-new.js chN new.json'); process.exit(1); }
const QUIZ = loadQuiz(); if (!QUIZ[ch]) throw new Error('нет главы ' + ch);
const topics = new Set(QUIZ[ch].questions.map((q) => q.topic));
const stems = new Set(); for (const k in QUIZ) QUIZ[k].questions.forEach((q) => stems.add(q.q.trim().toLowerCase()));
let total = 0, withIssues = 0;
for (const q of readResult(file).questions) { total++; const bad = structure(q); const p = (m) => bad.push(m);
  if (Array.isArray(q.options) && spread(q.options) > MAX_SPREAD) p('разброс вариантов ' + spread(q.options));
  if ((q.type === 'single' || q.type === 'twotier') && Array.isArray(q.options) && rank(q.options, q.correct) !== 'M') p('правильный ' + rank(q.options, q.correct) + ' ' + q.options.map((x) => x.length).join('/'));
  if (q.type === 'twotier' && Array.isArray(q.reasons)) { if (spread(q.reasons) > MAX_SPREAD) p('разброс reasons'); if (rank(q.reasons, q.reasonCorrect) !== 'M') p('обоснование ' + rank(q.reasons, q.reasonCorrect)); }
  if (q.type === 'multi' && !MULTI_TAIL.test(q.q)) p('multi без «Отметьте все верные.»');
  if (q.type === 'truefalse' && !/^Верно ли/.test(q.q)) p('truefalse без «Верно ли»');
  if (q.type === 'match' && Array.isArray(q.right) && spread(q.right) > MAX_SPREAD) p('разброс правой колонки ' + spread(q.right));
  const sn = sentences(q.why || ''); if (sn > MAX_WHY_SENT) p('why ~' + sn + ' предл.'); if ((q.why || '').length > WHY_SOFT_LIMIT) p('why ' + q.why.length + ' знаков');
  if (VERDICT_START.test(q.why || '')) p('why с Верно/Неверно');
  if (/^В опыте/.test(q.q || '')) p('В опыте');
  if (!topics.has(q.topic)) p('новая тема «' + q.topic + '»');
  if (stems.has((q.q || '').trim().toLowerCase())) p('условие уже есть в банке');
  bannedTerms(q).forEach((t) => p('термин ' + t));
  if (Object.keys(q).some((k) => k.startsWith('_'))) p('служебное поле');
  if (bad.length) withIssues++;
  console.log(ch, q.id, q.type, bad.length ? '⚠ ' + bad.join('; ') : 'ok'); }
console.log('всего новых', total, '| с замечаниями', withIssues);
process.exitCode = withIssues ? 1 : 0;
