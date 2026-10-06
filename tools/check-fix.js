// node tools/check-fix.js result.json — сверить исправления рецензии ({questions}) с текущим банком:
// разброс длины, сохранилось ли место правильного по длине, тип, why, форматы, термины, служебные поля.
const { readResult, loadQuiz, byId, rank, spread, sentences, MAX_SPREAD, MAX_WHY_SENT, WHY_SOFT_LIMIT, VERDICT_START, MULTI_TAIL, bannedTerms, structure } = require('./lib');
const file = process.argv[2]; if (!file) { console.log('использование: node tools/check-fix.js result.json'); process.exit(1); }
const cur = byId(loadQuiz()); const r = readResult(file);
const bad = [];
for (const q of r.questions) { const o = cur[q.id]; const p = (m) => bad.push(q.id + ': ' + m);
  if (!o) { p('нет в банке'); continue; }
  structure(q).forEach(p);
  if (q.options) { const s = spread(q.options); if (s > MAX_SPREAD && q.type !== 'multi') p('разброс options ' + s);
    if (!Array.isArray(q.correct) && o.options && !Array.isArray(o.correct) && o.type === q.type) { const a = rank(o.options, o.correct), b = rank(q.options, q.correct); if (a !== b) p('место options ' + a + '→' + b + ' ' + q.options.map((x) => x.length).join('/')); } }
  if (q.reasons) { const s = spread(q.reasons); if (s > MAX_SPREAD) p('разброс reasons ' + s);
    if (o.reasons) { const a = rank(o.reasons, o.reasonCorrect), b = rank(q.reasons, q.reasonCorrect); if (a !== b) p('место reasons ' + a + '→' + b + ' ' + q.reasons.map((x) => x.length).join('/')); } }
  if (q.type === 'match' && spread(q.right) > MAX_SPREAD && spread(q.right) > spread(o.right || q.right)) p('разброс правой колонки вырос до ' + spread(q.right));
  if (q.type !== o.type) p('тип ' + o.type + '→' + q.type);
  const sn = sentences(q.why); if (sn > MAX_WHY_SENT) p('why ~' + sn + ' предложений (' + q.why.length + ')');
  if (q.why.length > WHY_SOFT_LIMIT && q.why.length > o.why.length) p('why ' + o.why.length + '→' + q.why.length + ' знаков');
  if (VERDICT_START.test(q.why)) p('why начинается с Верно/Неверно');
  if (q.type === 'multi' && !MULTI_TAIL.test(q.q) && q.q !== o.q) p('multi без «Отметьте все верные.»');
  if (q.type === 'truefalse' && !/^Верно ли/.test(q.q)) p('truefalse не «Верно ли»');
  if (/^В опыте/.test(q.q)) p('«В опыте»');
  if (Object.keys(q).some((k) => k.startsWith('_'))) p('служебное поле');
  bannedTerms(q).forEach((t) => p('термин ' + t));
}
console.log('проверено', r.questions.length, 'замечаний', bad.length); bad.forEach((x) => console.log(' ', x));
process.exitCode = bad.length ? 1 : 0;
