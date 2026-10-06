// node tools/gaps-save.js result.json — разобрать итог процесса пробелов (fill-gaps): новые вопросы
// по главам в tools/work/gaps/new-chN.json (для check-new.js и splice.js), отсеянные пробелы с причиной, заметки ФАКТ.
const { readResult, writeJSON, work } = require('./lib');
const file = process.argv[2]; if (!file) { console.log('использование: node tools/gaps-save.js result.json'); process.exit(1); }
const r = readResult(file);
if (r.missing && r.missing.length) console.log('НЕ ВЫПОЛНЕНЫ', r.missing);
for (const ch in r.chapters) { const c = r.chapters[ch];
  writeJSON(work('gaps', 'new-' + ch + '.json'), { questions: c.questions, deleted: [], skipped: c.skipped, authorNotes: c.authorNotes, reviewNotes: c.reviewNotes });
  console.log(`\n== ${ch}: новых ${c.questions.length}, проверено ${c.verified}`);
  c.questions.forEach((q) => console.log(`  + [${q.type}] ${q.topic} | ${q.q.slice(0, 150)}`));
  (c.skipped || []).forEach((s) => console.log(`  − пропущен: ${s.gap.slice(0, 90)} → ${s.reason.slice(0, 160)}`));
  (c.reviewNotes || []).filter((n) => /ФАКТ/.test(n)).forEach((n) => console.log('  ФАКТ:', n.slice(0, 300))); }
