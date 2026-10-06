// node tools/splice.js result.json chN [--dry] — применить редактуру главы к quiz-data.js.
// result.json: {questions:[...], deleted:[{id, reason}]} или файл вывода процесса. Вопрос с существующим id
// заменяет свой блок, вопрос с временным id NEW-… встаёт в конец главы со следующим свободным номером:
// max(есть в банке ∪ удалённые) + 1. Удалённые id дописываются в tools/retired.json.
// Перед записью итоговый файл разбирается и проверяется на дубли id. Повторный запуск того же файла
// снова добавит его новые вопросы — запускать один раз.
const { fs, BANK, RETIRED, loadQuiz, readJSON, readResult, stripService } = require('./lib');
const ser = require('./serq');
const [file, ch] = process.argv.slice(2); const dry = process.argv.includes('--dry');
if (!file || !ch) { console.log('использование: node tools/splice.js result.json chN [--dry]'); process.exit(1); }
const R = readResult(file);
let src = fs.readFileSync(BANK, 'utf8'); const QUIZ = loadQuiz();
if (!QUIZ[ch]) throw new Error('нет главы ' + ch);
const exist = new Set(QUIZ[ch].questions.map((q) => q.id));
if (!fs.existsSync(RETIRED)) throw new Error('нет ' + RETIRED + ' — без него новый вопрос может получить номер удалённого');
const retired = readJSON(RETIRED);
const num = (id) => +id.split('-')[1];
let next = Math.max(0, ...[...exist, ...retired.filter((x) => x.startsWith(ch + '-'))].map(num)) + 1;
// незнакомый «настоящий» id у нового вопроса — скорее опечатка: вставка сделала бы копию вопроса под новым номером
const odd = R.questions.filter((q) => !exist.has(q.id) && !/^NEW-/.test(q.id)).map((q) => q.id);
if (odd.length) throw new Error('в главе ' + ch + ' нет id ' + odd.join(', ') + ' — новым вопросам нужны временные id вида NEW-…');
const strayDel = (R.deleted || []).map((d) => d.id).filter((id) => !exist.has(id));
if (strayDel.length) console.log('⚠ в deleted есть id не из главы ' + ch + ', они пропущены: ' + strayDel.join(', '));
const blockRange = (id) => { const at = src.indexOf('        id: ' + JSON.stringify(id) + ','); if (at < 0) throw new Error('нет блока ' + id);
  const start = src.lastIndexOf('\n      {\n', at) + 1; const end = src.indexOf('\n      }', at) + 8; return [start, end]; };
// 1) правки существующих
let edited = 0;
for (const q of R.questions) { if (!exist.has(q.id)) continue; const [a, b] = blockRange(q.id); src = src.slice(0, a) + ser(stripService(q)) + src.slice(b); edited++; }
// 2) удаления
const dels = (R.deleted || []).map((d) => d.id).filter((id) => exist.has(id));
for (const id of dels) { const [a, b] = blockRange(id);
  if (src.slice(b, b + 2) === ',\n') src = src.slice(0, a) + src.slice(b + 2); else { const p = src.lastIndexOf(',\n', a); src = src.slice(0, p) + '\n' + src.slice(b + 1); }
  retired.push(id); }
// 3) новые — в конец главы
const fresh = R.questions.filter((q) => !exist.has(q.id)); const map = {};
const blocks = fresh.map((q) => { const id = ch + '-' + String(next++).padStart(3, '0'); map[q.id] = id; return ser(stripService(Object.assign({}, q, { id }))); });
if (blocks.length) { const cs = src.indexOf('\n  ' + ch + ': {'); const ce = src.indexOf('\n    ]\n  }', cs);
  const empty = /\[\s*$/.test(src.slice(cs, ce)); // пустая глава нового предмета: без запятой перед первым блоком
  src = src.slice(0, ce).replace(/\s*$/, '') + (empty ? '\n' : ',\n') + blocks.join(',\n') + src.slice(ce); }
// проверка: файл разбирается, id не повторяются
const after = new Function(src + ';return QUIZ')(); let n = 0; const ids = new Set();
for (const k in after) after[k].questions.forEach((q) => { n++; if (ids.has(q.id)) throw new Error('дубль id ' + q.id); ids.add(q.id); });
console.log(ch + ': правок', edited, 'удалено', dels.length, 'новых', blocks.length, '→ в главе', after[ch].questions.length, '| всего', n, dry ? '(пробный прогон)' : '— записано');
if (blocks.length) console.log('новые id:', JSON.stringify(map));
if (!dry) { fs.writeFileSync(BANK, src); fs.writeFileSync(RETIRED, JSON.stringify([...new Set(retired)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), null, 1) + '\n'); }
