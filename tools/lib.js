// Общие пути, справочники и правила инструментов. Пути считаются от папки репозитория,
// рабочие файлы (выгрузки, результаты агентов) — в tools/work или в папке из QUIZ_WORK.
const fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BANK = path.join(ROOT, 'quiz-data.js');
const INDEX = path.join(ROOT, 'index.html');
const WORK = process.env.QUIZ_WORK ? path.resolve(process.env.QUIZ_WORK) : path.join(__dirname, 'work');
// номера удалённых вопросов: новым вопросам их не выдают, иначе история ученика припишется чужому вопросу
const RETIRED = path.join(__dirname, 'retired.json');

const loadQuiz = (file = BANK) => new Function(fs.readFileSync(file, 'utf8') + ';return QUIZ')();
const byId = (QUIZ) => { const m = {}; for (const k in QUIZ) QUIZ[k].questions.forEach((q) => { m[q.id] = q; }); return m; };
const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJSON = (f, o, ind = 1) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, ind)); };
const work = (...p) => { const f = path.join(WORK, ...p); fs.mkdirSync(path.dirname(f), { recursive: true }); return f; };
// результат многоагентного процесса: файл вывода задачи ({result: "…"} или {result: {...}}) или уже готовый JSON
const readResult = (f) => { const o = readJSON(f); if (o && !Array.isArray(o) && 'result' in o) return typeof o.result === 'string' ? JSON.parse(o.result) : o.result; return o; };

// место правильного варианта по длине: L — строго самый длинный, S — строго самый короткий, M — середина или ничья
const rank = (a, c) => { const L = a.map((s) => s.length), v = L[c], mx = Math.max(...L), mn = Math.min(...L);
  return v === mx && L.filter((x) => x === mx).length === 1 ? 'L' : v === mn && L.filter((x) => x === mn).length === 1 ? 'S' : 'M'; };
const RANK_RU = { L: 'самый длинный', S: 'самый короткий', M: 'середина' };
const spread = (a) => { const L = a.map((s) => s.length); return Math.max(...L) - Math.min(...L); };
const sentences = (t) => (t.match(/[.!?](\s|$)/g) || []).length;

// ---- правила стандарта (одни на все линтеры) ----
const MAX_SPREAD = 5;        // разброс длины вариантов, символов
const MAX_WHY_SENT = 3;      // предложений в пояснении (после редполитики — 1–3 коротких)
const WHY_SOFT_LIMIT = 330;  // ориентир длины пояснения, знаков (не ошибка)
const VERDICT_START = /^(Верно|Неверно)/; // приложение само пишет «✓ Верно.» / «✗ Неверно.» перед пояснением
const MULTI_TAIL = /Отметьте все верные\.$/;

// справочники и единые термины — свои для каждого предмета
const SKILLS = ['понимание понятия', 'объяснение механизма', 'предсказание', 'диагностика ошибки', 'последовательность', 'сравнение', 'вывод по признакам'];
// analyze есть у 2 вопросов, написанных на пробелы (ch2-085, ch9-061)
const LEVELS = ['understand', 'apply', 'analyze'];
const W = '(?<![А-Яа-яЁё])', E = '(?![А-Яа-яЁё])'; // границы слова для кириллицы: \b в JS её не видит
const BANNED_TERMS = [
  { bad: 'глицерин', good: 'глицерол', re: /(?<!фосфо)глицерин/i },        // ловит и «триацилглицерин», но не «фосфоглицериновая»
  { bad: 'йод', good: 'иод', re: new RegExp(W + 'йод', 'i') },
  { bad: 'ЭПС', good: 'ЭР', re: new RegExp(W + 'ЭПС' + E) },               // с учётом регистра: не «эпсилон», не «ЭПСП»
  { bad: 'протеиназ', good: 'протеаз', re: new RegExp(W + 'протеиназ', 'i') },
];
const bannedTerms = (q) => { const t = JSON.stringify(q); return BANNED_TERMS.filter((b) => b.re.test(t)).map((b) => b.bad + ' → ' + b.good); };
const stripService = (q) => { const o = {}; for (const k of Object.keys(q)) if (!k.startsWith('_')) o[k] = q[k]; if (o.misconception !== true) delete o.misconception; return o; };

// структура вопроса по типу и метаданные: список ошибок (пустой — всё в порядке)
function structure(q) {
  const e = []; const isIdx = (i, n) => Number.isInteger(i) && i >= 0 && i < n;
  if (!SKILLS.includes(q.skill)) e.push('skill «' + q.skill + '»');
  if (!LEVELS.includes(q.level)) e.push('level «' + q.level + '»');
  if (![1, 2, 3].includes(q.difficulty)) e.push('difficulty ' + q.difficulty);
  if (![2, 3, 4].includes(q.steps)) e.push('steps ' + q.steps);
  if (!q.topic) e.push('нет topic');
  if ('misconception' in q && q.misconception !== true) e.push('misconception не true');
  if (typeof q.q !== 'string' || !q.q.trim()) e.push('нет условия');
  if (typeof q.why !== 'string' || !q.why.trim()) e.push('нет пояснения');
  switch (q.type) {
    case 'single': case 'twotier':
      if (!Array.isArray(q.options) || q.options.length !== 4 || !isIdx(q.correct, 4)) e.push(q.type + ': 4 варианта и correct 0–3');
      if (q.type === 'twotier' && (!q.reasonQ || !Array.isArray(q.reasons) || q.reasons.length !== 4 || !isIdx(q.reasonCorrect, 4))) e.push('twotier: reasonQ, 4 обоснования, reasonCorrect 0–3');
      break;
    case 'multi':
      if (!Array.isArray(q.options) || q.options.length !== 5 || !Array.isArray(q.correct) || q.correct.length < 2 || q.correct.length > 3
        || q.correct.some((i) => !isIdx(i, 5)) || new Set(q.correct).size !== q.correct.length) e.push('multi: 5 вариантов, 2–3 разных верных');
      break;
    case 'truefalse': if (typeof q.answer !== 'boolean') e.push('truefalse: answer true/false'); break;
    case 'match':
      if (!Array.isArray(q.left) || !Array.isArray(q.right) || q.left.length !== q.right.length || q.left.length < 3 || q.left.length > 4
        || new Set(q.right).size !== q.right.length) e.push('match: 3–4 пары, правая колонка без повторов');
      break;
    case 'order': if (!Array.isArray(q.items) || q.items.length < 3 || q.items.length > 5 || new Set(q.items).size !== q.items.length) e.push('order: 3–5 разных пунктов'); break;
    default: e.push('неизвестный type «' + q.type + '»');
  }
  return e;
}

module.exports = { fs, path, ROOT, BANK, INDEX, WORK, RETIRED, loadQuiz, byId, readJSON, writeJSON, work, readResult,
  rank, RANK_RU, spread, sentences, MAX_SPREAD, MAX_WHY_SENT, WHY_SOFT_LIMIT, VERDICT_START, MULTI_TAIL,
  SKILLS, LEVELS, W, E, BANNED_TERMS, bannedTerms, stripService, structure };
