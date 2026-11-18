// node tools/lang-scan.js [quiz-data.js] — механический скан языка банка по редполитике:
// точки с запятой, скобки со словами, канцелярит, скопления сокращений, длинные предложения,
// условия из отглагольных существительных, длинные why, числа без разрядов, рамки «Ученик».
// Канцелярит подробнее (частоты и примеры) — tools/lang-kanc.js.
const { BANK, loadQuiz, loadTopics, W, E } = require('./lib');
// главы и тренажёр по теме сканируются вместе
const QUIZ = Object.assign({}, loadQuiz(process.argv[2] || BANK), loadTopics(process.argv[2] || BANK));
// границы слова — через W/E: \b в JS не работает с кириллицей (в старой версии из-за этого kanc и verbalNounQ всегда давали 0)
const KANC = ['явля(?:ется|ются|ющ[а-яё]*)', 'осуществля[а-яё]*', 'данн(?:ый|ая|ое|ые|ого|ой|ом|ых|ую)', 'производ(?:ится|ятся)', 'в целях', 'в связи с',
  'посредством', 'в процессе', 'имеет место', 'в результате чего', 'вышеуказ[а-яё]*', 'нижеследующ[а-яё]*', 'вышеперечисл[а-яё]*', 'при наличии', 'в случае',
  'вследствие', 'в ходе', 'происход(?:ит|ят)', 'обусловлен[а-яё]*', 'наблюда(?:ется|ются)', 'имеющ(?:ий|ая|ееся|иеся)', 'с целью', 'выполня(?:ет|ют) функци[а-яё]*',
  'в качестве', 'по причине'].map((k) => new RegExp(W + k + E, 'i'));
const ABBR = /(?<![А-ЯЁA-Za-zа-яё])[А-ЯЁ]{2,}[А-ЯЁа-яё]*(?![а-яё])/g;
const ABBR_OK = /^(ДНК|РНК)$/; // общеизвестные сокращения предмета — свои для каждого учебника
const fields = (q) => [['q', q.q], ...(q.options || []).map((o) => ['opt', o]), ...(q.reasons || []).map((o) => ['rsn', o]), ['reasonQ', q.reasonQ || ''],
  ...(q.left || []).map((o) => ['left', o]), ...(q.right || []).map((o) => ['right', o]), ...(q.items || []).map((o) => ['item', o]), ['why', q.why || ''],
  // шаги занятия по теме: что прочитать, части рисунка, элементы ответа и эталон
  ...(q.points || []).map((o) => ['point', o]), ...(q.look || []).map((o) => ['look', o]), ...(q.elements || []).map((o) => ['elem', o.text]),
  ...(q.criteria || []).map((o) => ['crit', o]), ['model', q.model || ''], ['note', q.note || '']];
const sents = (t) => t.split(/(?<=[.!?])\s+(?=[А-ЯЁA-Z«])/).filter(Boolean);
const words = (t) => (t.match(/[А-Яа-яЁёA-Za-z0-9₂₃⁺⁻-]+/g) || []);
const VN = new RegExp('[а-яё]+(?:ние|ния|нию|нием|нии|ция|ции|цию|цией)' + E, 'gi');
const st = { q: 0, semi: 0, paren: 0, kanc: 0, abbr3: 0, longSent: 0, uch: 0, verbalNounQ: 0, longWhy: 0, nbspNum: 0 }, ex = {};
const add = (k, id, t) => { st[k]++; (ex[k] = ex[k] || []).length < 6 && ex[k].push(id + ': ' + t.slice(0, 140)); };
const kancCount = {};
for (const ch in QUIZ) for (const q of QUIZ[ch].questions) { st.q++;
  for (const [f, t] of fields(q)) { if (!t) continue;
    if (t.includes(';')) add('semi', q.id + ' ' + f, t);
    const par = (t.match(/\([^)]*[а-яё]{3,}[^)]*\)/g) || []); if (par.length) add('paren', q.id + ' ' + f, par.join(' '));
    for (const r of KANC) { const m = t.match(r); if (m) { const w = m[0].toLowerCase(); kancCount[w] = (kancCount[w] || 0) + 1; add('kanc', q.id + ' ' + f, t); } }
    for (const s of sents(t)) { const ab = (s.match(ABBR) || []).filter((a) => !ABBR_OK.test(a)); if (new Set(ab).size >= 3) add('abbr3', q.id + ' ' + f, s);
      if (words(s).length > 32) add('longSent', q.id + ' ' + f, s); }
    if (/\d\d\d\d\d/.test(t)) add('nbspNum', q.id + ' ' + f, t);
  }
  if (/^Ученик/.test(q.q)) st.uch++;
  if ((q.q.match(VN) || []).length >= 3) add('verbalNounQ', q.id, q.q);
  if ((q.why || '').length > 330) add('longWhy', q.id + ' (' + q.why.length + ')', q.why);
}
console.log(JSON.stringify(st)); console.log('канцелярит:', JSON.stringify(Object.entries(kancCount).sort((a, b) => b[1] - a[1])));
for (const k in ex) { console.log('\n## ' + k); ex[k].forEach((x) => console.log('  ' + x)); }
