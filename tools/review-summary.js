// node tools/review-summary.js result.json имя — сохранить итог полной рецензии (процесс review-quiz)
// в tools/work/review/res-<имя>.json и вывести сводку: находок, опровергнуто скептиком,
// осталось по серьёзности, главные находки, пробелы, общий вывод рецензента.
// Части одного круга рецензии потом сводятся: node tools/review-summary.js --merge A B C APP
// (без имён — все res-*.json в tools/work/review; перед новым кругом старые файлы лучше убрать).
// Находка на несколько вопросов («ch2-005, ch2-006») делится на отдельные записи.
const { fs, path, readResult, readJSON, writeJSON, work, WORK } = require('./lib');
const dir = path.dirname(work('review', 'x'));
if (process.argv[2] === '--merge') {
  const names = process.argv.slice(3);
  const files = names.length ? names.map((n) => 'res-' + n + '.json') : fs.readdirSync(dir).filter((x) => /^res-.+\.json$/.test(x));
  if (!files.length) { console.log('в', dir, 'нет res-*.json — сначала сохраните части рецензии'); process.exit(1); }
  console.log('сводятся:', files.join(', '));
  const all = [], gaps = [];
  for (const f of files) for (const t of readJSON(path.join(dir, f)).results) {
    (t.findings || []).forEach((x) => String(x.id || '').split(/,\s*/).forEach((id) => all.push({ ...x, id: id.trim(), task: t.task })));
    (t.gaps || []).forEach((g) => gaps.push({ task: t.task, ...g })); }
  const live = all.filter((f) => f.verdict !== 'refuted'); const by = (a, k) => a.reduce((m, f) => (m[f[k]] = (m[f[k]] || 0) + 1, m), {});
  console.log('всего', all.length, 'опровергнуто', all.length - live.length, 'осталось', live.length, '| вопросов', new Set(live.filter((f) => /^ch/.test(f.id || '')).map((f) => f.id)).size);
  console.log('серьёзность', JSON.stringify(by(live, 'vSeverity')), '\nкатегории', JSON.stringify(by(live, 'category')), '\nпробелов', gaps.length);
  // вход для процесса исправлений: находки по главам, исправление — вариант скептика
  const fix = {}; for (const f of live.filter((f) => /^ch\d+-/.test(f.id || ''))) { const ch = f.id.split('-')[0];
    (fix[ch] = fix[ch] || []).push({ id: f.id, src: f.task, severity: f.vSeverity, category: f.category, problem: f.problem, fix: f.vFix && f.vFix.trim() ? f.vFix : f.fix, skeptic: f.vReason }); }
  writeJSON(path.join(dir, 'fix-input.json'), fix); writeJSON(path.join(dir, 'gaps.json'), gaps);
  console.log('записано: review/fix-input.json (', Object.entries(fix).map(([k, v]) => k + ':' + v.length).join(' '), ') и review/gaps.json');
  process.exit(0);
}
const [file, name] = process.argv.slice(2);
if (!file || !name) { console.log('использование: node tools/review-summary.js result.json имя | --merge'); process.exit(1); }
const r = readResult(file); writeJSON(work('review', 'res-' + name + '.json'), r);
if (r.missing && r.missing.length) console.log('НЕ ВЫПОЛНЕНЫ', r.missing);
for (const t of r.results) { const live = t.findings.filter((f) => f.verdict !== 'refuted'); const c = (s) => live.filter((f) => f.vSeverity === s).length;
  console.log(`\n== ${t.task}: находок ${t.findings.length}, опровергнуто ${t.findings.length - live.length}, осталось crit ${c('critical')} major ${c('major')} minor ${c('minor')}`);
  for (const f of live.filter((f) => f.vSeverity !== 'minor')) console.log(` [${f.vSeverity}/${f.verdict}] ${f.id} (${f.category}): ${f.problem.slice(0, 260)}`);
  if ((t.gaps || []).length) console.log(' пробелы:', t.gaps.map((g) => g.gap.slice(0, 120)).join(' | '));
  console.log(' итог:', (t.overall || '').slice(0, 400)); }
