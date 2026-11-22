// Контрольный набор для рецензентов (tools/control-set.json): вопросы с заранее известными дефектами
// и корректные вопросы, к которым придираться не надо.
//   node tools/control-score.js --questions          — вопросы без разметки: подмешать в выгрузку для рецензента
//   node tools/control-score.js findings.json        — оценить находки рецензента или скептика
// findings.json — массив находок с полем id (или questionId) либо объект {findings: [...]}; находки к вопросам
// не из набора игнорируются. Отчёт: найдено дефектов из N, пропущено, ложные замечания к корректным вопросам.
const fs = require('fs'), path = require('path');
const set = JSON.parse(fs.readFileSync(path.join(__dirname, 'control-set.json'), 'utf8')).items;
const arg = process.argv[2];
if (!arg) { console.error('укажите --questions или файл с находками'); process.exit(2); }
if (arg === '--questions') { console.log(JSON.stringify(set.map((x) => x.question), null, 1)); process.exit(0); }
let f = JSON.parse(fs.readFileSync(arg, 'utf8')); if (!Array.isArray(f)) f = f.findings || [];
const hit = new Set(f.map((x) => x.id || x.questionId).filter(Boolean));
const def = set.filter((x) => x.defect), clean = set.filter((x) => !x.defect);
const found = def.filter((x) => hit.has(x.id)), missed = def.filter((x) => !hit.has(x.id)), falsePos = clean.filter((x) => hit.has(x.id));
console.log('Дефектов найдено: ' + found.length + ' из ' + def.length + ' (' + Math.round(found.length / def.length * 100) + ' %)');
console.log('Ложных замечаний к корректным вопросам: ' + falsePos.length + ' из ' + clean.length);
const byKind = {}; def.forEach((x) => { const k = byKind[x.kind] = byKind[x.kind] || [0, 0]; k[1]++; if (hit.has(x.id)) k[0]++; });
console.log('По видам дефектов: ' + Object.keys(byKind).map((k) => k + ' ' + byKind[k][0] + '/' + byKind[k][1]).join(', '));
if (missed.length) console.log('Пропущено:\n' + missed.map((x) => '  ' + x.id + ' — ' + x.note).join('\n'));
if (falsePos.length) console.log('Ложные замечания: ' + falsePos.map((x) => x.id).join(', '));
