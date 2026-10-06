// node tools/lint-result.js result.json chN [исходник.json] — проверка результата агента до вставки.
// result.json: {questions, deleted} или файл вывода процесса. Исходник — выгрузка главы, которую получал
// агент (tools/prep-chapter.js с целями _цель_options/_цель_reasons или tools/dump.js); по умолчанию — глава
// из банка. ОШИБКИ блокируют вставку (код выхода 1), ПРЕДУПРЕЖДЕНИЯ читает человек.
const { readJSON, readResult, loadQuiz, rank, RANK_RU, spread, sentences, MAX_SPREAD, MAX_WHY_SENT, WHY_SOFT_LIMIT, VERDICT_START, MULTI_TAIL, bannedTerms, structure } = require('./lib');
const [file, ch, origFile] = process.argv.slice(2);
if (!file || !ch) { console.log('использование: node tools/lint-result.js result.json chN [исходник.json]'); process.exit(1); }
const R = readResult(file); const Q = R.questions;
const QUIZ = loadQuiz(); if (!QUIZ[ch]) throw new Error('нет главы ' + ch);
const pk = {}; (origFile ? readResult(origFile).questions : QUIZ[ch].questions).forEach((q) => { pk[q.id] = q; });
const topics = new Set(QUIZ[ch].questions.map((q) => q.topic));
const other = new Set(); for (const k in QUIZ) if (k !== ch) QUIZ[k].questions.forEach((q) => other.add(q.q.trim().toLowerCase()));
const ru = (a, c) => RANK_RU[rank(a, c)];
const err = [], warn = []; const dist = { o: {}, r: {} }; let uch = 0, misc = 0, service = 0; const stems = {};
for (const q of Q) { const id = q.id; const e = (m) => err.push(id + ': ' + m), w = (m) => warn.push(id + ': ' + m); const o = pk[id];
  const isNew = !o;
  // новый вопрос — только с временным id NEW-…; незнакомый «настоящий» id — скорее опечатка, и вставка сделала бы копию вопроса
  if (isNew && !/^NEW-/.test(id)) e('неизвестный id (новым вопросам — id вида NEW-…)');
  structure(q).forEach(e);
  if (!topics.has(q.topic)) w('новая тема «' + q.topic + '»');
  if (q.misconception) misc++;
  if (/Ученик/.test(q.q)) uch++; if (/^В опыте/.test(q.q)) e('«В опыте»');
  if (VERDICT_START.test(q.why)) e('why начинается с Верно/Неверно');
  const sn = sentences(q.why); if (sn > MAX_WHY_SENT) w('why ' + sn + ' предложений (' + q.why.length + ' симв.)'); if (q.why.length > WHY_SOFT_LIMIT) w('why ' + q.why.length + ' знаков');
  const k = q.q.trim().toLowerCase(); if (stems[k]) e('дубль условия с ' + stems[k]); stems[k] = id; if (other.has(k)) e('дубль условия с другой главой');
  bannedTerms(q).forEach((t) => e('термин ' + t));
  if (Object.keys(q).some((x) => x.startsWith('_'))) service++;
  const cap = (a) => { if (/\?\s*$/.test(q.q)) a.forEach((x) => { if (/^[а-яёa-z]/.test(x)) w('строчная после «?»: ' + x); }); };
  if (o && o.type !== q.type) w('тип сменён ' + o.type + '→' + q.type);
  if ((q.type === 'single' || q.type === 'twotier') && Array.isArray(q.options) && q.options.length === 4) {
    cap(q.options); const s = spread(q.options), rk = ru(q.options, q.correct); dist.o[rk] = (dist.o[rk] || 0) + 1;
    if (s > MAX_SPREAD) e('разброс options ' + s + ' ' + q.options.map((x) => x.length).join('/'));
    const t = o && o._цель_options; const want = isNew ? 'середина' : t && t !== 'оставить' ? t : (o.options && o.type === q.type ? ru(o.options, o.correct) : null);
    if (want && want !== rk) w('options: правильный должен быть «' + want + '», сейчас «' + rk + '»'); }
  if (q.type === 'twotier' && Array.isArray(q.reasons) && q.reasons.length === 4) {
    cap(q.reasons); const s = spread(q.reasons), rk = ru(q.reasons, q.reasonCorrect); dist.r[rk] = (dist.r[rk] || 0) + 1;
    if (s > MAX_SPREAD) e('разброс reasons ' + s + ' ' + q.reasons.map((x) => x.length).join('/'));
    const t = o && o._цель_reasons; const want = isNew ? 'середина' : t && t !== 'оставить' ? t : (o.reasons ? ru(o.reasons, o.reasonCorrect) : null);
    if (want && want !== rk) w('reasons: правильное должно быть «' + want + '», сейчас «' + rk + '»'); }
  if (q.type === 'multi' && Array.isArray(q.options)) { cap(q.options); if (spread(q.options) > MAX_SPREAD) w('разброс вариантов multi ' + spread(q.options));
    // у известных исключений банка условие не меняли — ошибка только для нового или переписанного условия
    if (!MULTI_TAIL.test(q.q)) (isNew || o.q !== q.q ? e : w)('multi без «Отметьте все верные.»'); }
  if (q.type === 'truefalse' && !/^Верно ли/.test(q.q)) e('truefalse без «Верно ли»');
  if (q.type === 'match' && Array.isArray(q.right) && spread(q.right) > MAX_SPREAD) w('разброс правой колонки ' + spread(q.right));
}
// потери: каждый исходный вопрос либо вернулся, либо удалён (только если передан исходник блока)
const ids = new Set(Q.map((q) => q.id)); const del = new Set((R.deleted || []).map((d) => d.id));
if (origFile) Object.keys(pk).forEach((id) => { if (!ids.has(id) && !del.has(id)) err.push(id + ': пропал без записи в deleted'); });
del.forEach((id) => { if (ids.has(id)) err.push(id + ': и удалён, и оставлен'); if (!pk[id]) warn.push(id + ': в deleted, но его нет в исходнике'); });
const cnt = (a) => a.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});
console.log('вопросов', Q.length, '| в исходнике', Object.keys(pk).length, '| удалено', del.size, '| новых', Q.filter((q) => !pk[q.id]).length, '| Ученик', uch, '| misconception', misc);
console.log('типы', JSON.stringify(cnt(Q.map((q) => q.type))), 'сложность', JSON.stringify(cnt(Q.map((q) => q.difficulty))));
console.log('место правильного: options', JSON.stringify(dist.o), 'reasons', JSON.stringify(dist.r));
if (service) console.log('служебные поля «_» у', service, 'вопросов — вставка их вычистит');
console.log('\nОШИБКИ', err.length); err.forEach((x) => console.log(' ', x)); console.log('ПРЕДУПРЕЖДЕНИЯ', warn.length); warn.forEach((x) => console.log(' ', x));
process.exitCode = err.length ? 1 : 0;
