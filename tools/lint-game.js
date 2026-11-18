// node tools/lint-game.js [пакет.json ...] — проверка текстов героев игрового слоя (game.js).
// Без аргументов проверяет своих героев (gameOwn в quiz-data.js); с аргументами — ещё и пакеты из файлов,
// например private/dafna-pack.json (папка private/ в репозиторий не попадает).
// Правила — концепция plan/gamification-dafna.md, 4.9 и 4.10: на «ты» и на равных, без восклицаний,
// без похвалы сверху, вины и давления; не длиннее двух предложений.
const fs = require('fs');
const { BANK, loadTopics } = require('./lib');

const NAMES = ['guide', 'guideDat', 'cat', 'catGen'];
const TERMS = ['sign', 'note', 'melody', 'bar', 'day', 'dayDone', 'doneShort', 'lesson', 'lessonDone', 'played', 'later',
  'light', 'lightSign', 'lightW', 'lightS', 'book', 'bookItem'];
const LINES = ['hub_nolesson', 'topic_start', 'hub_lessonday', 'hub_review', 'hub_done', 'hub_myth', 'hub_back',
  'step_pre', 'step_read', 'step_q', 'step_draw', 'step_part2', 'light_w', 'light_s', 'day_done', 'lesson_end', 'surprise',
  'ai_first', 'echo_d7', 'echo_d21', 'echo_done', 'explain_ask', 'explain_done', 'view_guide',
  'prey', 'fixed', 'catch_tail', 'catch_empty', 'myth_intro', 'myth_yes', 'myth_partial', 'myth_no'];
// слова, которых нет ни в одном тексте (4.9)
const BANNED = [/скучает/i, /грустит/i, /ждёт тебя/i, /слабеет/i, /не подведи/i, /потерял[аи]? серию/i, /ещё немного,? а то/i,
  /молод(ец|чина)/i, /умни(ца|чка)/i, /ты справишься/i, /устал[аи]?/i, /лучший ученик/i, /побей рекорд/i];

const topics = loadTopics(BANK);
const ids = new Set(); Object.values(topics).forEach((t) => t.questions.forEach((q) => ids.add(q.id)));
const sentences = (t) => t.split(/(?<=[.?…])\s+(?=[А-ЯЁA-Z«])/).filter(Boolean).length;

function lint(p, label) {
  const err = [], warn = [];
  if (p.app !== 'bio-quiz-game-pack' || p.v !== 1) err.push('app/v: нужен "bio-quiz-game-pack" и 1');
  NAMES.forEach((k) => { if (!p.names || typeof p.names[k] !== 'string') err.push('names.' + k + ' — нет'); });
  TERMS.forEach((k) => { if (!p.terms || p.terms[k] == null) err.push('terms.' + k + ' — нет'); });
  ['note', 'melody', 'bar'].forEach((k) => { if (p.terms && !(Array.isArray(p.terms[k]) && p.terms[k].length === 3)) err.push('terms.' + k + ' — три формы: 1, 2, 5'); });
  const all = {}; ['guide', 'cat'].forEach((who) => Object.keys(p[who] || {}).forEach((k) => {
    if (all[k]) err.push(k + ' — и у guide, и у cat'); all[k] = { who, v: p[who][k] }; }));
  LINES.forEach((k) => { if (!all[k]) err.push('реплика ' + k + ' — нет'); });
  Object.keys(all).forEach((k) => {
    const m = /^after_(.+?)(_ok|_no)?$/.exec(k); if (m && !ids.has(m[1])) err.push(k + ' — нет такого вопроса в темах');
    if (!m && !LINES.includes(k)) warn.push(k + ' — ключ не используется в game.js');
    [].concat(all[k].v).forEach((t) => {
      if (typeof t !== 'string') { err.push(k + ' — не строка'); return; }
      if (t.includes('!')) err.push(k + ' — восклицание: ' + t);
      BANNED.forEach((r) => { if (r.test(t)) err.push(k + ' — запрещённое слово (4.9): ' + t); });
      if (sentences(t) > 2) err.push(k + ' — больше двух предложений: ' + t);
      if (t.length > 200) warn.push(k + ' — длинно (' + t.length + '): ' + t);
      (t.match(/\{[^}]*\}/g) || []).forEach((ph) => { if (!/^\{(\w+)(:[^|}]*\|[^|}]*\|[^}]*)?\}$/.test(ph)) err.push(k + ' — подстановка ' + ph); });
    });
  });
  ['light', 'cat'].forEach((k) => { const a = p.levels && p.levels[k];
    if (!Array.isArray(a) || !a.length) err.push('levels.' + k + ' — нет');
    else a.forEach((x) => { if (!Array.isArray(x) || typeof x[0] !== 'number' || typeof x[1] !== 'string') err.push('levels.' + k + ' — [число, строка]');
      else { if (x[1].includes('!')) err.push('levels.' + k + ' — восклицание'); BANNED.forEach((r) => { if (r.test(x[1])) err.push('levels.' + k + ' — запрещённое слово: ' + x[1]); }); } }); });
  console.log((err.length ? '✗ ' : '✓ ') + label + ': реплик ' + Object.keys(all).length + ', ошибок ' + err.length + ', замечаний ' + warn.length);
  err.forEach((e) => console.log('  ошибка: ' + e)); warn.forEach((w) => console.log('  замечание: ' + w));
  return err.length;
}

let bad = 0;
const own = new Function(fs.readFileSync(BANK, 'utf8') + ';return typeof gameOwn !== "undefined" ? gameOwn : null')();
if (!own) { console.log('✗ gameOwn в quiz-data.js не найден'); bad++; } else bad += lint(own, 'свои герои (quiz-data.js)');
// заблуждения тем: ссылка на вопрос своей темы, текст без точки в конце
Object.entries(topics).forEach(([k, t]) => (t.myths || []).forEach((m) => {
  const e = [];
  if (!/^t\d+-m\d+$/.test(m.id || '')) e.push('id ' + m.id);
  if (!t.questions.some((q) => q.id === m.q)) e.push('q ' + m.q + ' — не из этой темы');
  if (typeof m.text !== 'string' || /[.!]$/.test(m.text)) e.push('text — строка без точки в конце');
  if (e.length) { bad++; console.log('✗ ' + k + ' заблуждение ' + m.id + ': ' + e.join('; ')); }
}));
process.argv.slice(2).forEach((f) => { let p = null; try { p = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log('✗ ' + f + ': не JSON — ' + e.message); bad++; return; } bad += lint(p, f); });
process.exit(bad ? 1 : 0);
