// node tools/lang-check.js result.json — разобрать итог языковой редактуры (процесс redpolitika-pass)
// и сверить каждое изменение с банком: смысл и метаданные не меняются, длина и место правильного
// сохраняются, why не растёт. Главы сохраняются в tools/work/lang/chN.json (для tools/splice.js),
// замены в интерфейсе — в tools/work/lang/app.json.
const { readResult, loadQuiz, byId, rank, spread, writeJSON, work, MAX_SPREAD, VERDICT_START, MULTI_TAIL, bannedTerms } = require('./lib');
let issues = 0;
const file = process.argv[2]; if (!file) { console.log('использование: node tools/lang-check.js result.json'); process.exit(1); }
const r = readResult(file);
if (r.missing && r.missing.length) console.log('НЕ ВЫПОЛНЕНЫ', r.missing);
const cur = byId(loadQuiz()); const J = (x) => JSON.stringify(x);
for (const k in r.results) { const t = r.results[k];
  if (k === 'интерфейс') { writeJSON(work('lang', 'app.json'), t); console.log('интерфейс: замен', t.replacements.length, 'проверено', t.verified); continue; }
  writeJSON(work('lang', k + '.json'), { questions: t.questions, deleted: [], patterns: t.patterns, notes: t.notes });
  const bad = []; let whyDelta = 0; const changedFields = {};
  for (const q of t.questions) { const o = cur[q.id]; if (!o) { bad.push(q.id + ': нет в банке'); continue; } const p = (m) => bad.push(q.id + ': ' + m);
    for (const f of ['type', 'topic', 'skill', 'difficulty', 'level', 'steps', 'misconception', 'correct', 'answer', 'reasonCorrect']) if (J(o[f]) !== J(q[f])) p('изменено поле ' + f);
    if (o.left && o.left.length !== q.left.length) p('match: число пар');
    if (o.items && o.items.length !== q.items.length) p('order: число пунктов');
    if (q.options) { if (spread(q.options) > MAX_SPREAD && spread(q.options) > spread(o.options)) p('разброс options ' + spread(q.options));
      if (!Array.isArray(q.correct) && rank(o.options, o.correct) !== rank(q.options, q.correct)) p('место options ' + rank(o.options, o.correct) + '→' + rank(q.options, q.correct)); }
    if (q.reasons) { if (spread(q.reasons) > MAX_SPREAD && spread(q.reasons) > spread(o.reasons)) p('разброс reasons');
      if (rank(o.reasons, o.reasonCorrect) !== rank(q.reasons, q.reasonCorrect)) p('место reasons'); }
    if (q.why.length > o.why.length + 10) p('why длиннее: ' + o.why.length + '→' + q.why.length);
    whyDelta += q.why.length - o.why.length;
    if (VERDICT_START.test(q.why)) p('why с Верно/Неверно');
    bannedTerms(q).forEach((t) => p('термин ' + t));
    if (q.type === 'multi' && !MULTI_TAIL.test(q.q) && q.q !== o.q) p('multi формат');
    if (q.type === 'truefalse' && !/^Верно ли/.test(q.q)) p('truefalse формат');
    if (Object.keys(q).some((x) => x.startsWith('_'))) p('служебное поле');
    for (const f of Object.keys({ ...o, ...q })) if (J(o[f]) !== J(q[f])) changedFields[f] = (changedFields[f] || 0) + 1;
  }
  console.log(`\n== ${k}: изменено ${t.questions.length}, проверено ${t.verified}, why Δ ${whyDelta} зн., поля ${J(changedFields)}`);
  (t.patterns || []).forEach((p) => console.log(`  • ${p.pattern} — ${p.count}`));
  bad.forEach((b) => console.log('  ⚠ ' + b)); issues += bad.length;
  (t.notes || []).filter((n) => /ФАКТ/.test(n)).forEach((n) => console.log('  ФАКТ: ' + n.slice(0, 260)));
}
process.exitCode = issues ? 1 : 0;
