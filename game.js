/* Игровой слой тренажёра: свет и герои. Первый этап — занятие по теме «Ферменты и дыхание».
   Концепция — plan/gamification-dafna.md, части 3 и 4.

   Как устроено:
   - игра только слушает события тренажёра: index.html вызывает её методы через G(...) внутри try/catch.
     Очередь повторения, историю, освоение и точность она не меняет;
   - по умолчанию игра включена у всех учеников. Выключается в «Свет и герои → Настройки», и выключенная
     ничего не записывает;
   - данные ученика — ключ bio_game_<имя>, пакет героев — bio_game_pack, один на устройство;
   - тексты героев — данные, а не код: свои герои — gameOwn в quiz-data.js, пакет из файла — JSON,
     который взрослый передаёт ученику. Такой файл в репозиторий не попадает;
   - первый этап охватывает только вопросы тренажёра по теме (TOPICS): ноты, эйдос и кот — за них.
   Герои говорят с учеником на «ты», интерфейс тренажёра — на «вы». */
window.BioGame = function (T) {
  'use strict';
  const $ = T.$, esc = T.esc, txt = T.txt, DAY = T.DAY;
  const KEY = (n) => 'bio_game_' + n, PACK_KEY = 'bio_game_pack';
  // ноты в тактах мелодии занятия: вопросы до чтения, ответ после чтения, свои ответы до вариантов,
  // разбор причин ошибок, рисунок, опыт и объяснение темы (концепция, 3.2). Это верхние пределы: за свой ответ
  // предел в теме — по числу вопросов «Сначала вспомните» (capOf), 9 оставлено для занятий, пройденных раньше
  const CAPS = { pre: 1, read: 1, recall: 9, why: 3, draw: 3, part2: 3, sum: 3 };
  const BARS = ['pre', 'read', 'q', 'part2', 'draw', 'sum'];
  const BAR_NAME = { pre: 'вопросы до чтения', read: 'чтение', q: 'вопросы', draw: 'рисунок', part2: 'опыт', sum: 'объяснение темы' };
  const CHOICE = 1;          // нот на выбор в мелодии дня: в первом этапе одна (3.4)
  const DUE_MAX = 20;        // нот повторения не больше, чем вопросов в «Повторении на сегодня»
  const WEEK_GOAL = 5, RECALL_MIN = 2, EXPLAIN_MIN = 40, MYTH_MIN = 8;
  const LIGHT_STEPS = [10, 25, 50, 100, 200, 400], CAT_STEPS = [3, 10, 25, 50, 100];
  const RES = { yes: 'да', partial: 'частично', no: 'нет' };
  const SELF = { yes: 'совпало', partial: 'частично', no: 'не совпало' };
  const NB = ' ';
  let name = null, st = null, P = null, fileTitle = '';
  let pend = [];                                   // строки под пояснением к текущему вопросу
  let stripSess = null, stripShown = {}, gain = null;
  let panel = 'main', uid = 0;

  // ---- мелочи ----
  const now = () => Date.now();
  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const size = (o) => Object.keys(o).length;
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (t) => { const d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const words = (s) => (String(s || '').match(/[A-Za-zА-Яа-яЁё0-9]+(?:-[A-Za-zА-Яа-яЁё0-9]+)*/g) || []).length;
  // свой ответ засчитывается от двух слов: «биологический катализатор» — точный ответ. Слова через дефис считаются порознь
  const wordsOwn = (x) => words(String(x || '').replace(/[-–—]/g, ' '));
  function plural(n, f) { n = Math.abs(n); const a = n % 100, b = n % 10; return f[a > 10 && a < 20 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2]; }
  const cnt = (n, f) => n + NB + plural(n, f);
  const lcFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  // {n} — число, {n:вопрос|вопроса|вопросов} — число со словом в нужной форме
  function fill(s, v) {
    return String(s).replace(/\{(\w+)(?::([^|}]*)\|([^|}]*)\|([^}]*))?\}/g, (m, k, a, b, c) => {
      const x = v[k]; if (x == null) return ''; return a !== undefined ? cnt(+x, [a, b, c]) : String(x); });
  }

  // ---- пакет героев ----
  const okStr = (s) => typeof s === 'string' && s.length > 0 && s.length <= 400;
  // из файла берутся только строки, списки строк и ступени [число, строка]; на экран тексты идут экранированными
  function clean(p) {
    const o = { title: '', about: '', names: {}, terms: {}, guide: {}, cat: {}, levels: { light: [], cat: [] } };
    if (!isObj(p)) return o;
    ['names', 'terms', 'guide', 'cat'].forEach((sec) => {
      const src = isObj(p[sec]) ? p[sec] : {};
      Object.keys(src).slice(0, 300).forEach((k) => {
        if (!/^[\w-]{1,40}$/.test(k)) return; const v = src[k];
        if (okStr(v)) o[sec][k] = v;
        else if (Array.isArray(v) && v.length && v.length <= 12 && v.every(okStr)) o[sec][k] = v.slice();
      });
    });
    if (isObj(p.levels)) ['light', 'cat'].forEach((k) => {
      const a = p.levels[k];
      if (Array.isArray(a)) o.levels[k] = a.filter((x) => Array.isArray(x) && Number.isFinite(x[0]) && okStr(x[1])).slice(0, 12).map((x) => [x[0], x[1]]);
    });
    if (okStr(p.title)) o.title = p.title.slice(0, 80);
    if (okStr(p.about)) o.about = p.about;
    return o;
  }
  const isPack = (p) => isObj(p) && p.app === 'bio-quiz-game-pack' && p.v === 1 && isObj(p.names) && okStr(p.names.guide) && okStr(p.names.cat);
  function readPackFile() { let f = null; try { f = JSON.parse(localStorage.getItem(PACK_KEY) || 'null'); } catch (e) { f = null; } return isPack(f) ? f : null; }
  // реплики собираются в одну карту «ключ → кто говорит и что»: так пакет сам решает, чья реплика —
  // напарницы или кота. Чего нет в пакете из файла, берётся у своих героев
  function loadPack() {
    const own = clean(T.own || {}), f = readPackFile(), use = st && st.pack === 'file' && f ? clean(f) : null;
    fileTitle = f ? (clean(f).title || 'пакет из файла') : '';
    const lines = {};
    const put = (p) => ['guide', 'cat'].forEach((who) => Object.keys(p[who]).forEach((k) => { lines[k] = { who, v: p[who][k] }; }));
    put(own); if (use) put(use);
    P = {
      title: (use && use.title) || own.title, about: (use && use.about) || own.about,
      names: Object.assign({}, own.names, use && use.names), terms: Object.assign({}, own.terms, use && use.terms), lines,
      levels: { light: use && use.levels.light.length ? use.levels.light : own.levels.light, cat: use && use.levels.cat.length ? use.levels.cat : own.levels.cat },
      own: own.names,
    };
  }
  const term = (k) => P.terms[k] || '';
  const noteF = () => (Array.isArray(P.terms.note) && P.terms.note.length === 3 ? P.terms.note : ['нота', 'ноты', 'нот']);
  const barF = () => (Array.isArray(P.terms.bar) && P.terms.bar.length === 3 ? P.terms.bar : ['такт', 'такта', 'тактов']);
  const sign = () => P.terms.sign || '♪', lsign = () => P.terms.lightSign || '✦';
  const notes = (n) => cnt(n, noteF());
  const noteHTML = (n, label) => '<p class="gn">' + esc(sign() + ' ' + (n > 1 ? n + NB : '') + plural(n, noteF()) + ' — ' + label) + '</p>';
  function hero(key, vars) {
    const l = P.lines[key]; if (!l) return null;
    const v = Array.isArray(l.v) ? l.v[Math.random() * l.v.length | 0] : l.v;
    return { who: l.who, text: fill(v, Object.assign({}, P.names, vars || {})) };
  }
  // прямая речь: точка — после кавычек, вопрос и многоточие — внутри
  function heroHTML(h) {
    if (!h || !h.text) return '';
    const t = h.text.trim(), dot = /[^.]\.$/.test(t);
    return '<p class="gsay"><b>' + esc(P.names[h.who] || '') + ':</b> «' + txt(dot ? t.slice(0, -1) : t) + '»' + (dot ? '.' : '') + '</p>';
  }
  function levelText(kind, n) { let t = ''; (P.levels[kind] || []).forEach((x) => { if (n >= x[0]) t = x[1]; }); return t; }

  // ---- состояние ученика ----
  function blank() { return { v: 1, on: false, since: 0, pack: 'own', days: {}, lessons: {}, eidos: { w: {}, s: {} }, cat: { fixed: {}, myth: {} }, words: [], log: [], seen: '', back: '' }; }
  function lessonBlank(t) {
    return { t: t || 0, v: 2, bars: { pre: 0, read: 0, q: 0, draw: 0, part2: 0, sum: 0 }, got: { pre: 0, read: 0, recall: 0, why: 0, draw: 0, part2: 0, sum: 0 },
      pa: {}, qa: {}, rc: {}, wy: {}, caught: {}, prey: {}, sumRes: '', done: 0, surprise: 0 };
  }
  const numMap = (o) => { const r = {}; if (isObj(o)) Object.keys(o).forEach((k) => { if (typeof o[k] === 'number' && o[k] > 0) r[k] = o[k]; }); return r; };
  const flagMap = (o) => { const r = {}; if (isObj(o)) Object.keys(o).forEach((k) => { if (o[k]) r[k] = 1; }); return r; };
  function normLesson(x) {
    const b = lessonBlank(); if (!isObj(x)) return b;
    b.t = +x.t || 0; b.v = x.v === 2 ? 2 : 1;
    BARS.forEach((k) => { b.bars[k] = (isObj(x.bars) && +x.bars[k]) || 0; });
    Object.keys(CAPS).forEach((k) => { b.got[k] = Math.max(0, Math.min(CAPS[k], (isObj(x.got) && +x.got[k]) || 0)); });
    ['pa', 'qa', 'rc', 'wy', 'caught', 'prey'].forEach((k) => { b[k] = flagMap(x[k]); });
    b.sumRes = ['yes', 'partial', 'no', 'text'].includes(x.sumRes) ? x.sumRes : '';
    b.done = +x.done || 0; b.surprise = +x.surprise || 0;
    return b;
  }
  function norm(d) {
    if (!isObj(d) || d.v !== 1) return null;
    const b = blank();
    b.on = !!d.on; b.since = +d.since || 0; b.pack = d.pack === 'file' ? 'file' : 'own';
    b.seen = typeof d.seen === 'string' ? d.seen : ''; b.back = typeof d.back === 'string' ? d.back : '';
    if (isObj(d.days)) Object.keys(d.days).forEach((k) => {
      const x = d.days[k]; if (!isObj(x) || !/^\d{4}-\d\d-\d\d$/.test(k)) return;
      b.days[k] = { due: +x.due || 0, r: +x.r || 0, c: +x.c || 0, by: numMap(x.by), done: +x.done || 0, myth: typeof x.myth === 'string' ? x.myth : '' };
    });
    if (isObj(d.lessons)) Object.keys(d.lessons).forEach((k) => { b.lessons[k] = normLesson(d.lessons[k]); });
    if (isObj(d.eidos)) { b.eidos.w = numMap(d.eidos.w); b.eidos.s = numMap(d.eidos.s); }
    if (isObj(d.cat)) {
      b.cat.fixed = numMap(d.cat.fixed);
      if (isObj(d.cat.myth)) Object.keys(d.cat.myth).forEach((k) => {
        const m = d.cat.myth[k];
        if (isObj(m) && typeof m.t === 'number') b.cat.myth[k] = { t: m.t, self: SELF[m.self] ? m.self : 'no', w: +m.w || 0 };
      });
    }
    if (Array.isArray(d.words)) b.words = d.words.filter((x) => isObj(x) && typeof x.t === 'number' && typeof x.text === 'string').slice(-500);
    if (Array.isArray(d.log)) b.log = d.log.filter((x) => isObj(x) && typeof x.t === 'number' && typeof x.k === 'string').slice(-3000);
    return b;
  }
  function load(n) {
    if (n !== name) panel = 'main';
    name = n || null; st = null; pend = []; stripSess = null;
    if (name) {
      try { const r = localStorage.getItem(KEY(name)); if (r) st = norm(JSON.parse(r)); } catch (e) { st = null; }
      // игра включена у всех по умолчанию (решение пользователя 18.11.2026: попробовать, как она действует).
      // Кто выключил её в настройках, у того она так и остаётся выключенной
      if (!st) { st = blank(); st.on = true; st.since = now(); save(); }
    }
    loadPack();
  }
  // не сохранилось — не страшно: учёба записана тренажёром отдельно, игра ей не мешает
  function save() { if (!st || !name) return; try { localStorage.setItem(KEY(name), JSON.stringify(st)); } catch (e) { /* память заполнена */ } }
  const on = () => !!(st && st.on && name);
  function log(k, o) { if (!on()) return; st.log.push(Object.assign({ t: now(), k }, o || {})); if (st.log.length > 3000) st.log.splice(0, st.log.length - 3000); }
  function pushWords(o) { st.words.push(Object.assign({ t: now() }, o)); if (st.words.length > 500) st.words.splice(0, st.words.length - 500); }

  // ---- занятие и день ----
  const topicOf = (id) => { const m = T.qLookup[id]; return m && T.TOPICS[m.ch] ? m.ch : null; };
  const inScope = (id) => !!topicOf(id);
  // «Новое в занятии» — вопросы того же занятия, добавленные позже: для игры это его продолжение
  const lessonKey = (s) => (!s ? null : T.TOPICS[s.key] ? s.key : s.key === '__new' && T.TOPICS[s.base] ? s.base : null);
  const sessMode = (s) => (!s ? '' : lessonKey(s) ? 'lesson' : s.key === '__review' ? 'review' : s.key === '__echo' ? 'echo' : 'other');
  const stepOf = (it) => (it.pre ? 'pre' : it.type === 'read' ? 'read' : it.type === 'draw' ? 'draw' : it.type === 'part2' ? 'part2' : 'q');
  // начало занятия — по игре или по истории тренажёра: игру могли включить уже после занятия
  function lessonT(k) { const a = st && st.lessons[k] ? st.lessons[k].t : 0, b = T.lessonStart(k) || 0; return a && b ? Math.min(a, b) : (a || b); }
  function lesson(k) { if (!st.lessons[k]) st.lessons[k] = lessonBlank(now()); return st.lessons[k]; }
  const lessonNotes = (L) => Object.keys(CAPS).reduce((a, k) => a + L.got[k], 0);
  const barsOn = (L) => BARS.filter((b) => L.bars[b]).length;
  const nPre = (k) => T.TOPICS[k].questions.filter((r) => r.pre).length;
  const nCounted = (k) => T.TOPICS[k].questions.filter(T.counted).length;
  const recallQs = (k) => T.TOPICS[k].questions.filter((r) => r.recall && T.counted(r));
  // отвеченные вопросы считаются по нынешнему списку темы: номера убранных вопросов в счёт не идут
  const qDone = (L, k) => T.TOPICS[k].questions.filter((r) => T.counted(r) && L.qa[r.id]).length;
  const MAIN = ['pre', 'read', 'q', 'part2', 'draw'];
  const mainDone = (L) => MAIN.every((b) => L.bars[b]);
  // предел нот за свой ответ — по числу вопросов «Сначала вспомните» в теме, остальные пределы — из CAPS.
  // Уже заработанное не уменьшается: у занятия, пройденного по прежним правилам, нот может быть больше
  const capOf = (k, cat) => (cat === 'recall' ? Math.min(CAPS.recall, recallQs(k).length) : CAPS[cat]);
  function give(k, cat, n, label) {
    const L = lesson(k), g = Math.max(0, Math.min(capOf(k, cat) - L.got[cat], n)); if (!g) return '';
    L.got[cat] += g; if (gain) gain.notes += g;
    const h = noteHTML(g, label); pend.push({ k: 'note', html: h }); return h;
  }
  // «Сыграна целиком» — сделано всё, что в занятии можно сделать: все такты, ответ после чтения, свои ответы
  // до вариантов и причина у каждой ошибки. Верность ответов сюда не входит, и ошибки для этого не нужны:
  // ноты за разбор получает и тот, кто не ошибался (см. finish). Причины ошибок берутся из истории тренажёра
  // (поле reason первого ответа в занятии), отдельно не хранятся. Занятия, начатые до этих правил (v 1),
  // по ним не оцениваются: исправить в них уже ничего нельзя
  const maxNotes = (k) => Object.keys(CAPS).reduce((a, c) => a + capOf(k, c), 0);
  function unexplained(k) {
    const first = {}; T.user().history.forEach((h) => { if (h.ch === k && !h.mode && !h.retry && !(h.id in first)) first[h.id] = h; });
    return Object.keys(first).filter((id) => { const m = T.qLookup[id]; return m && T.counted(m.raw) && !first[id].correct && !first[id].reason; }).length;
  }
  // чего в занятии не было — списком для фразы «в этот раз без …»: это не оценка, а подсказка к следующему занятию
  function missing(k) {
    const L = st.lessons[k], out = []; if (!L || !T.TOPICS[k] || L.v !== 2) return out;
    if (L.bars.read && !L.got.read) out.push('ответа одной фразой после чтения');
    const nr = recallQs(k).filter((r) => L.qa[r.id] && !L.rc[r.id]).length;
    if (nr) out.push('своего ответа до вариантов в ' + cnt(nr, ['вопросе', 'вопросах', 'вопросах']));
    const ne = unexplained(k);
    if (ne) out.push('причины у ' + cnt(ne, ['ошибки', 'ошибок', 'ошибок']));
    return out;
  }
  const whole = (k, L) => !!L && L.v === 2 && BARS.every((b) => L.bars[b]) && !missing(k).length;
  const missLine = (k, L) => { const m = L && mainDone(L) ? missing(k) : []; return m.length ? 'В этот раз без ' + m.join(', без ') + '. В следующем занятии это можно сделать.' : ''; };
  function lightBar(L, b) { if (L.bars[b]) return false; L.bars[b] = now(); if (!L.done && BARS.every((x) => L.bars[x])) L.done = now(); return true; }
  // мелодия дня начинается на следующий день после занятия: в день занятия звучит мелодия занятия
  function dailyActive() { const t0 = T.dayStart(now()); return Object.keys(T.TOPICS).some((k) => { const t = lessonT(k); return t && t < t0; }); }
  function srsCount(test) { const u = T.user(); let n = 0; Object.keys(u.srs).forEach((id) => { const e = u.srs[id]; if (inScope(id) && e && e.box < T.SRS_DONE && e.due != null && test(e)) n++; }); return n; }
  // длина мелодии фиксируется при первом открытии за день: вопросы темы, которым срок сегодня, и эхо, если оно открыто
  function dueToday() {
    const end = T.nextDayStart(now()); let n = Math.min(DUE_MAX, srsCount((e) => T.dueAt(e) < end));
    Object.keys(T.TOPICS).forEach((k) => { const ei = T.echoInfo(k); if (ei && ei.which) n += ei.ids.length; });
    return n;
  }
  function today() {
    if (!on()) return null;
    const k = dkey(now()); let d = st.days[k];
    if (!d && dailyActive()) {
      d = { due: dueToday(), r: 0, c: 0, by: {}, done: 0, myth: '' }; st.days[k] = d;
      const ks = Object.keys(st.days).sort(); if (ks.length > 400) ks.slice(0, ks.length - 400).forEach((x) => { delete st.days[x]; });
      save();
    }
    return d || null;
  }
  const dayTotal = (d) => d.due + CHOICE, dayNotes = (d) => d.r + d.c;
  // сыгранная мелодия — «на сегодня достаточно»: дальше ноты не считаются
  function dayDone(d) {
    if (d.done || d.r < d.due || d.c < CHOICE) return;
    d.done = now();
    pend.push({ k: 'note', html: '<p class="gn">' + esc(sign() + ' ' + term('dayDone') + ' — ' + notes(dayNotes(d))) + '</p>' });
    const h = hero('day_done'); if (h) pend.push({ k: 'say', late: true, html: heroHTML(h) });
  }
  function repNote(label) { const d = today(); if (!d || d.done || d.r >= d.due) return; d.r++; if (gain) gain.notes++; pend.push({ k: 'note', html: noteHTML(1, label) }); dayDone(d); }
  function choiceNote(src, label) {
    const d = today(); if (!d || d.done || d.c >= CHOICE) return false;
    d.c++; d.by[src] = (d.by[src] || 0) + 1; if (gain) gain.notes++;
    pend.push({ k: 'note', html: noteHTML(1, label) }); dayDone(d); return true;
  }
  // неделя — с понедельника; показывается «3 из 5», а не календарь с пустыми днями
  function weekDone() {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const from = dkey(d.getTime());
    return Object.keys(st.days).filter((k) => k >= from && st.days[k].done).length;
  }
  function gapText(b) {
    const d = b ? Math.max(1, Math.round((T.dayStart(now()) - T.dayStart(b.set || b.due || now())) / DAY)) : 1;
    return d === 1 ? 'день' : d === 7 ? 'неделю' : d === 14 ? 'две недели' : d === 21 ? 'три недели' : cnt(d, ['день', 'дня', 'дней']);
  }

  // ---- эйдос и кот ----
  // общая реплика героя — один раз за сессию: в эхе из пяти вопросов «неделя прошла» не повторяется пять раз
  function sayOnce(key) {
    if (gain) { gain.said = gain.said || {}; if (gain.said[key]) return; gain.said[key] = 1; }
    const h = hero(key); if (h) pend.push({ k: 'say', html: heroHTML(h) });
  }
  const lightPoints = () => size(st.eidos.w) + size(st.eidos.s);
  const lightAnswers = () => size(Object.assign({}, st.eidos.w, st.eidos.s));
  const crossed = (a, b, steps) => steps.filter((x) => a < x && b >= x).pop();
  // каждый вопрос даёт каждую точку один раз; эйдос только светлеет
  function light(k, id) {
    if (st.eidos[k][id]) return;
    const a = lightPoints(); st.eidos[k][id] = now(); if (gain) gain[k]++;
    pend.push({ k: 'note', html: '<p class="gn">' + esc(lsign() + ' ' + lcFirst(term('light')) + ': ' + term(k === 'w' ? 'lightW' : 'lightS')) + '</p>' });
    const lv = crossed(a, lightPoints(), LIGHT_STEPS);
    if (lv && levelText('light', lv)) pend.push({ k: 'say', html: heroHTML({ who: 'guide', text: levelText('light', lv) }) });
    else sayOnce(k === 'w' ? 'light_w' : 'light_s');
  }
  // ошибка исправлена, когда вопрос после неё вспомнен верно в срок и без «Угадываю»; приручение только растёт
  function tame(id) {
    if (st.cat.fixed[id]) return;
    const a = size(st.cat.fixed); st.cat.fixed[id] = now(); if (gain) gain.fixed++;
    const lv = crossed(a, a + 1, CAT_STEPS);
    if (lv && levelText('cat', lv)) pend.push({ k: 'say', html: '<p class="gsay">🐾 <b>' + esc(P.names.cat) + '</b> ' + txt(levelText('cat', lv)) + '</p>' });
    else sayOnce('fixed');
  }

  // ---- строка под пояснением и полоса над карточкой ----
  function renderLine(announce) {
    const el = $('qGame'); if (!el) return;
    const n = pend.filter((x) => x.k === 'note'), s = pend.filter((x) => x.k === 'say' && !x.late).slice(0, 1).concat(pend.filter((x) => x.k === 'say' && x.late).slice(0, 1));
    if (!n.length && !s.length) { el.innerHTML = ''; el.className = 'gline'; return; }
    el.innerHTML = n.map((x) => x.html).join('') + s.map((x) => x.html).join(''); el.className = 'gline show';
    // строка объявляется той же живой областью, что и пояснение, — после него
    const lv = $('qLive'); if (announce && lv) lv.textContent = (announce === 'add' && lv.textContent ? lv.textContent + ' ' : '') + el.textContent;
  }
  function barsHTML(L, cur) {
    return '<span class="gbars" aria-hidden="true">' + BARS.map((b) => '<i class="' + (L.bars[b] ? 'on' : b === cur ? 'now' : '') + '"></i>').join('') + '</span>' +
      '<span class="sr-only">' + esc(term('played') + ' ' + cnt(barsOn(L), barF()) + ' из ' + BARS.length) + '</span>';
  }
  function stripTop(k, it, L) {
    const nC = nCounted(k);
    return '<div class="gtop"><span class="gname">' + esc(term('lesson')) + '</span>' + barsHTML(L, it ? stepOf(it) : '') +
      '<span class="gmeta">' + esc('вопросы: ' + qDone(L, k) + ' из ' + nC + ' · ' + notes(lessonNotes(L))) + '</span></div>';
  }
  function dayTop(d) {
    return '<div class="gtop"><span class="gname">' + esc(sign() + ' ' + term('day')) + '</span><span class="gmeta">' +
      esc(d.done ? (term('doneShort') || 'готово') + ' · ' + notes(dayNotes(d)) : dayNotes(d) + ' из ' + notes(dayTotal(d))) +
      '</span><span class="gweek">' + esc('Неделя: ' + weekDone() + ' из ' + WEEK_GOAL) + '</span></div>';
  }
  // занятие начато, когда игра за ним ещё не следила: её включили посреди занятия или прохождение
  // продолжено после перезагрузки. Уже сделанные шаги отмечаются по данным прохождения; ноты не удваиваются:
  // у каждого вида свой предел, а свой ответ и разбор ошибки считаются по номеру вопроса
  function backfill(s, L) {
    const g0 = gain; gain = null;
    capture(() => {
      s.questions.forEach((it, i) => {
        if (!it || i >= s.idx || s.answers[i] == null) return;
        const m = T.qLookup[it.id]; if (!m) return; const raw = m.raw;
        if (it.pre) { L.pa[it.id] = 1; return; }
        if (it.type === 'read') { lightBar(L, 'read'); if (wordsOwn(it.readText) >= RECALL_MIN) give(s.key, 'read', 1, ''); return; }
        if (it.type === 'draw' || it.type === 'part2') { if (it.score != null) { lightBar(L, it.type); give(s.key, it.type, 3, ''); } return; }
        if (it.retry || !T.counted(raw)) return;
        L.qa[it.id] = 1;
        if (wordsOwn(it.recallText) >= RECALL_MIN && !L.rc[it.id]) { L.rc[it.id] = 1; give(s.key, 'recall', 1, ''); }
        if (s.answers[i] === false) {
          if (it.reason && !L.wy[it.id]) { L.wy[it.id] = 1; give(s.key, 'why', 1, ''); }
          if (raw.misconception) L.caught[it.id] = 1;
          if (it.conf === 'sure') L.prey[it.id] = 1;
        }
      });
      if (size(L.pa) >= nPre(s.key) && lightBar(L, 'pre')) give(s.key, 'pre', 1, '');
      if (qDone(L, s.key) >= nCounted(s.key)) lightBar(L, 'q');
    });
    gain = g0;
  }
  function question() {
    const strip = $('gStrip'); pend = []; renderLine(false);
    if (!strip) return;
    if (!on()) { strip.style.display = 'none'; strip.innerHTML = ''; return; }
    const s = T.session(), it = T.item(); if (!s || !it) return;
    const fresh = s !== stripSess;
    if (fresh) { stripSess = s; stripShown = {}; gain = { notes: 0, w: 0, s: 0, fixed: 0, prey: 0 }; }
    let h = '';
    const k = lessonKey(s);
    if (k) {
      const L = lesson(k), step = stepOf(it), full = !!T.TOPICS[s.key]; if (fresh && full) backfill(s, L); save();
      h = '<div id="gStripTop">' + stripTop(k, it, L) + '</div>';
      // одна реплика на шаг — на первом его вопросе; дальше над карточкой только полоса. В «Новом в занятии» реплик шагов нет
      if (full && !stripShown[step] && !it.retry) { stripShown[step] = 1; h += heroHTML(hero('step_' + step)); }
    } else if (s.key === '__review' || s.key === '__echo') {
      const d = today(); if (d) h = '<div id="gStripTop">' + dayTop(d) + '</div>';
    }
    strip.innerHTML = h; strip.style.display = h ? '' : 'none';
  }
  function refreshStrip() {
    const top = $('gStripTop'), s = T.session(), it = T.item(); if (!top || !s || !on()) return;
    const k = lessonKey(s);
    if (k) top.innerHTML = stripTop(k, it, lesson(k));
    else { const d = today(); if (d) top.innerHTML = dayTop(d); }
  }

  // ---- события тренажёра ----
  function after(id, ok) { const h = hero('after_' + id + (ok ? '_ok' : '_no')) || hero('after_' + id); if (h) pend.push({ k: 'say', html: heroHTML(h) }); }
  function pre(o) {
    if (!on()) return; const s = T.session(); if (!s || !T.TOPICS[s.key]) return;
    const L = lesson(s.key); L.pa[o.id] = 1; log('pre', { id: o.id, ok: o.correct ? 1 : 0 });
    if (size(L.pa) >= nPre(s.key) && lightBar(L, 'pre')) give(s.key, 'pre', 1, 'попытка до чтения');
    after(o.id, o.correct); save();
  }
  function read(o) {
    if (!on()) return; const s = T.session(); if (!s || !T.TOPICS[s.key]) return;
    const L = lesson(s.key), w = wordsOwn(o.text); log('rd', { id: o.id, w });
    lightBar(L, 'read'); if (w >= RECALL_MIN) give(s.key, 'read', 1, 'ответ по памяти после чтения');
    save();
  }
  function recall(o) {
    if (!on() || !inScope(o.id)) return; const s = T.session(), m = sessMode(s), w = o.skip ? 0 : wordsOwn(o.text);
    log('rc', { id: o.id, w, s: o.skip ? 1 : 0, m });
    if (w >= RECALL_MIN) {
      if (m === 'lesson') { const k = lessonKey(s), L = lesson(k); if (!L.rc[o.id]) { L.rc[o.id] = 1; give(k, 'recall', 1, 'свой ответ до вариантов'); } }
      else if (m === 'review' || m === 'echo') choiceNote('recall', 'свой ответ до вариантов');
    }
    save();
  }
  function reason(o) {
    if (!on() || !o.reason || !inScope(o.id)) return; const s = T.session(), m = sessMode(s);
    log('wy', { id: o.id, r: o.reason, m });
    const p0 = pend.length;
    if (m === 'lesson') { const k = lessonKey(s), L = lesson(k); if (!L.wy[o.id]) { L.wy[o.id] = 1; give(k, 'why', 1, 'разбор ошибки'); } }
    else if (m === 'review' || m === 'echo') choiceNote('why', 'разбор ошибки');
    save(); if (pend.length > p0) { renderLine('only'); refreshStrip(); }
  }
  function answer(o) {
    if (!on() || !inScope(o.id)) return;
    const s = T.session(), m = sessMode(s), b = o.before, a = o.after, id = o.id;
    if (!gain) gain = { notes: 0, w: 0, s: 0, fixed: 0, prey: 0 };
    log('r', { id, ok: o.correct ? 1 : 0, g: o.conf === 'guess' ? 1 : 0, sure: o.conf === 'sure' ? 1 : 0, box: b ? b.box : -1, due: o.wasDue ? 1 : 0, m, e: o.echo || '', re: o.again ? 1 : 0 });
    // повтор в сессии и работа над ошибками — тренировка сразу после разбора: ни нот, ни света
    if (o.again) { save(); return; }
    const raw = T.qLookup[id].raw;
    if (m === 'lesson') {
      const k = lessonKey(s), L = lesson(k);
      if (T.counted(raw)) { L.qa[id] = 1; if (qDone(L, k) >= nCounted(k)) lightBar(L, 'q'); }
      if (!o.correct && raw.misconception) L.caught[id] = 1;
      if (!o.correct && o.conf === 'sure') L.prey[id] = 1;
    }
    // ноты повторения: ответ на вопрос, которому сегодня срок, или в эхе занятия — верный или нет
    if ((m === 'review' && o.wasDue) || m === 'echo')
      repNote(!o.correct ? 'попытка вспомнить тоже учит' : m === 'echo' ? 'вспомнено через ' + (o.echo === 'd21' ? 'три недели' : 'неделю') : 'вопрос вспомнен через ' + gapText(b));
    // эйдос: ответ выдержал неделю (шаг очереди 2 → 3) или три недели (3 → выход); в эхе — верный и не угаданный
    if (o.correct && o.conf !== 'guess') {
      if (b && a && b.box === 2 && a.box === 3) light('w', id);
      if (b && a && b.box === 3 && a.box >= T.SRS_DONE) light('s', id);
      if (m === 'echo') light(o.echo === 'd21' ? 's' : 'w', id);
    }
    // кот: исправленная ошибка — шаг приручения; уверенная ошибка — добыча. Добыча — реплика, а не очки:
    // иначе стало бы выгодно ставить «Знаю» наугад
    if (b && a && b.box === 0 && a.box === 1) tame(id);
    if (!o.correct && o.conf === 'sure') { gain.prey++; sayOnce('prey'); }
    if (m === 'lesson') after(id, o.correct);
    save();
  }
  function task(o) {
    if (!on() || !inScope(o.id)) return; const s = T.session(), m = sessMode(s);
    log(o.type === 'draw' ? 'dr' : 'p2', { id: o.id, sc: o.score, n: o.n, m });
    if (m === 'lesson') { const k = lessonKey(s), L = lesson(k); lightBar(L, o.type); give(k, o.type, 3, o.type === 'draw' ? 'рисунок сверен со схемой' : 'объяснение и честная самопроверка'); }
    save();
  }
  function reveal() { if (!on()) return; renderLine('add'); refreshStrip(); }

  // ---- итоги ----
  const capture = (fn) => { const p0 = pend.length; fn(); return pend.splice(p0).map((x) => x.html).join(''); };
  function surprise(L) { if (!L.done || L.surprise) return ''; L.surprise = now(); return heroHTML(hero('surprise')); }
  function dueTomorrow() { const end = T.nextDayStart(T.nextDayStart(now())); return srsCount((e) => T.dueAt(e) < end); }
  // шапка итогов: такты и ноты; у занятия по новым правилам — сколько нот из возможных и «целиком», когда сделано всё
  function lessonHead(k, L) {
    const n = barsOn(L), all = n === BARS.length, nt = notes(lessonNotes(L)) + (L.v === 2 ? ' из ' + maxNotes(k) : '');
    let h = '<div class="gtop"><span class="gname">' + esc(term('lesson')) + '</span>' + barsHTML(L, '') + '</div>';
    h += '<p class="gn">' + esc(sign() + ' ' + (all ? term('lessonDone') + (whole(k, L) ? ' целиком' : '') + ': ' + cnt(n, barF()) + ', ' + nt
      : n + ' из ' + cnt(BARS.length, barF()) + ' · ' + nt)) + '</p>';
    const ml = missLine(k, L); if (ml) h += '<p class="gmeta">' + esc(ml) + '</p>';
    if (!L.bars.sum) h += '<p class="gmeta">' + esc('Последний ' + barF()[0] + ' — объяснение темы — ' + (term('later') || 'можно доиграть в любой день, когда взрослый рядом') + '. Он ниже и в «Свете и героях».') + '</p>';
    return h;
  }
  // ноты за разбор ошибок достаются и тому, кто не ошибался: полная мелодия не требует ошибок.
  // Добор — когда все шаги занятия сделаны и ни одной ошибки без причины нет
  const topUp = (k, L) => (L.v === 2 && mainDone(L) && !unexplained(k) ? capture(() => give(k, 'why', CAPS.why, 'ни одной ошибки без разбора')) : '');
  function lessonSummary(k, L) {
    const top = topUp(k, L);
    let h = '<div class="ghead">' + lessonHead(k, L) + '</div>' + top;
    h += heroHTML(hero('lesson_end')) + surprise(L);
    const c = size(L.caught), p = size(L.prey);
    h += c || p
      ? '<p class="gsay">' + esc('Улов ' + (P.names.catGen || P.names.cat) + ': ' + cnt(c, ['заблуждение', 'заблуждения', 'заблуждений']) + ', ' + cnt(p, ['уверенная ошибка', 'уверенные ошибки', 'уверенных ошибок']) + '.') + '</p>' + heroHTML(hero('catch_tail'))
      : heroHTML(hero('catch_empty'));
    const tm = dueTomorrow(); if (tm) h += '<p class="gmeta">' + esc('В повторении завтра: ' + cnt(tm, ['вопрос', 'вопроса', 'вопросов']) + '.') + '</p>';
    // два вопроса после занятия — материал для текстов следующих тем (3.8)
    if (!st.words.some((x) => x.kind === 'fb' && x.topic === k)) {
      const a = 'gfa' + (++uid), b = 'gfb' + uid;
      h += '<div class="gfb"><p class="gq">Два вопроса для следующих тем — по желанию</p>' +
        '<label for="' + a + '">Что в занятии было интересно?</label><textarea id="' + a + '" rows="2" data-fb="a"></textarea>' +
        '<label for="' + b + '">Что мешало?</label><textarea id="' + b + '" rows="2" data-fb="b"></textarea>' +
        '<button type="button" class="ghost" data-fbsave="' + esc(k) + '">Сохранить ответы</button></div>';
    }
    return h;
  }
  function wireFeedback(el) {
    const btn = el.querySelector('[data-fbsave]'); if (!btn) return;
    btn.onclick = () => {
      const box = btn.parentNode, a = box.querySelector('[data-fb="a"]').value.trim(), b = box.querySelector('[data-fb="b"]').value.trim();
      if (!a && !b) return;
      pushWords({ kind: 'fb', topic: btn.dataset.fbsave, text: 'Интересно: ' + (a || '—') + '\nМешало: ' + (b || '—') }); save();
      box.innerHTML = '<p class="gmeta">Ответы сохранены: их видно в «Свете и героях», в разделе для взрослого.</p>';
    };
  }
  function breakdown(d) {
    const L = { recall: '«сначала вспомните»', why: 'разбор ошибки', myth: 'заблуждение дня' }, p = [];
    if (d.r) p.push(d.r + ' — повторение');
    Object.keys(d.by).forEach((k) => { if (d.by[k]) p.push(d.by[k] + ' — ' + (L[k] || k)); });
    return p.join(' · ');
  }
  function daySummary(d, s) {
    let h = dayTop(d);
    if (d.done) h += '<p class="gn">' + esc(sign() + ' ' + term('dayDone') + ' — ' + notes(dayNotes(d)) + (breakdown(d) ? ': ' + breakdown(d) : '')) + '</p>' + heroHTML(hero('day_done'));
    else if (d.c < CHOICE && mythAvail()) h += '<p class="gmeta">' + esc('Ещё ' + plural(1, noteF()) + ' на выбор — заблуждение дня.') + '</p><div class="grow"><button type="button" class="ghost" data-g="myth">🐾 Заблуждение дня</button></div>';
    const g = gain || {}, parts = [];
    if (g.w || g.s) parts.push(lsign() + ' ' + lcFirst(term('light')) + ': +' + cnt(g.w + g.s, ['ответ', 'ответа', 'ответов']) + ' в долгой памяти');
    if (g.fixed) parts.push('🐾 ' + (P.names.cat || '') + ': ' + cnt(g.fixed, ['исправленная ошибка', 'исправленные ошибки', 'исправленных ошибок']));
    if (parts.length) h += '<p class="gn">' + esc(parts.join(' · ')) + '</p>';
    if (s.key === '__echo') h += heroHTML(hero('echo_done'));
    return h;
  }
  function finish(s) {
    const el = $('rGame'), ex = $('explainGame'), ai = $('aiGame');
    if (ex) ex.innerHTML = ''; if (ai) ai.innerHTML = '';
    if (!el) return; el.innerHTML = ''; el.style.display = 'none';
    if (!on() || !s) return;
    let h = '';
    if (T.TOPICS[s.key]) {
      const L = lesson(s.key); h = lessonSummary(s.key, L);
      if (ex) explainBlock(ex, s.key, () => { const hd = el.querySelector('.ghead'); if (hd) hd.innerHTML = lessonHead(s.key, lesson(s.key)); });
      if (ai) ai.innerHTML = heroHTML(hero('ai_first'));
    } else if (lessonKey(s)) {
      const k = lessonKey(s), L = lesson(k), top = topUp(k, L); h = '<div class="ghead">' + lessonHead(k, L) + '</div>' + top;
    } else if (s.key === '__review' || s.key === '__echo') {
      const d = today(); if (d) h = daySummary(d, s);
    }
    if (h) { el.innerHTML = h; el.style.display = ''; wireFeedback(el); wireGo(el); }
    save();
  }

  // ---- объяснение темы: последний такт занятия ----
  function sumDone(k, o) {
    const L = lesson(k);
    if (o.res) { L.sumRes = o.res; log('ex', { topic: k, res: o.res }); }
    else { if (!L.sumRes) L.sumRes = 'text'; pushWords({ kind: 'explain', topic: k, text: o.text.slice(0, 4000) }); log('ex', { topic: k, w: words(o.text) }); }
    if (lightBar(L, 'sum')) give(k, 'sum', 3, 'тема объяснена своими словами');
    const h = hero('explain_done'); if (h) pend.push({ k: 'say', html: heroHTML(h) });
    const sp = surprise(L); if (sp) pend.push({ k: 'say', html: sp });
    save();
  }
  function explainBlock(el, k, onDone) {
    const L = lesson(k);
    if (L.bars.sum) {
      el.innerHTML = '<p class="gn">' + esc(sign() + ' Объяснение темы отмечено' + (RES[L.sumRes] ? ': выдержало три «почему» — ' + RES[L.sumRes] : ' — письменно')) + '.</p>';
      return;
    }
    const id = 'gx' + (++uid);
    el.innerHTML = '<div class="gexp"><p class="gq" id="' + id + '">Взрослый отмечает: объяснение выдержало три «почему»?</p>' +
      '<div class="grow" role="group" aria-labelledby="' + id + '">' + ['yes', 'partial', 'no'].map((r) => '<button type="button" class="cchip" data-x="' + r + '">' + RES[r] + '</button>').join('') + '</div>' +
      '<p class="gq">Взрослого рядом нет?</p><button type="button" class="ghost" data-x="write">Объяснить ' + esc(P.names.guideDat || P.names.guide) + ' письменно</button><div class="gxw"></div></div>';
    el.querySelectorAll('[data-x]').forEach((btn) => {
      btn.onclick = () => {
        const x = btn.dataset.x;
        if (x === 'write') { btn.disabled = true; writeBox(el.querySelector('.gxw'), el, k, onDone); return; }
        const out = capture(() => sumDone(k, { res: x }));
        el.innerHTML = out; if (onDone) onDone();
        const f = el.querySelector('p'); if (f) { f.tabIndex = -1; f.focus({ preventScroll: true }); }
      };
    });
  }
  function writeBox(box, el, k, onDone) {
    const tid = 'gxt' + (++uid);
    box.innerHTML = heroHTML(hero('explain_ask')) + '<div class="recall"><label for="' + tid + '">Ваше объяснение своими словами — от ' + EXPLAIN_MIN + ' слов</label>' +
      '<textarea id="' + tid + '" rows="6"></textarea><div class="rrow"><button type="button" class="checkbtn" disabled>Сохранить объяснение</button><span class="gmeta" aria-live="polite"></span></div></div>';
    const ta = box.querySelector('textarea'), go = box.querySelector('.checkbtn'), c = box.querySelector('.gmeta');
    const upd = () => { const w = words(ta.value); c.textContent = 'слов: ' + w + (w < EXPLAIN_MIN ? ' из ' + EXPLAIN_MIN : ''); go.disabled = w < EXPLAIN_MIN; };
    ta.oninput = upd; upd(); ta.focus();
    go.onclick = () => {
      if (words(ta.value) < EXPLAIN_MIN) return;
      const out = capture(() => sumDone(k, { text: ta.value.trim() }));
      el.innerHTML = out; if (onDone) onDone();
      const f = el.querySelector('p'); if (f) { f.tabIndex = -1; f.focus({ preventScroll: true }); }
    };
  }

  // ---- заблуждение дня от кота ----
  function myths() {
    const out = [];
    Object.keys(T.TOPICS).forEach((k) => { if (!lessonT(k)) return; (T.TOPICS[k].myths || []).forEach((m) => { if (m && m.id && T.qLookup[m.q]) out.push(Object.assign({ topic: k }, m)); }); });
    return out;
  }
  // сначала — ещё не разобранные, потом — те, где сверка совпала хуже всего и давнее всего
  function mythToday() {
    const d = today(), all = myths(); if (!d || !all.length) return null;
    if (d.myth) { const m = all.find((x) => x.id === d.myth); if (m) return m; }
    const rank = { no: 0, partial: 1, yes: 2 };
    const m = all.find((x) => !st.cat.myth[x.id]) || all.slice().sort((a, b) => {
      const A = st.cat.myth[a.id], B = st.cat.myth[b.id]; return rank[A.self] - rank[B.self] || A.t - B.t; })[0];
    d.myth = m.id; save(); return m;
  }
  function mythDone() { const d = today(); if (!d || !d.myth) return false; const r = st.cat.myth[d.myth]; return !!r && T.dayStart(r.t) === T.dayStart(now()); }
  const mythAvail = () => !!today() && myths().length > 0 && !mythDone();
  function mythView(b) {
    const m = mythToday(); if (!m) { panel = 'main'; view(); return; }
    // опровержение — пояснение связанного вопроса и его схема-пояснение, если она есть: важно понять, а не найти в книге
    const raw = T.qLookup[m.q].raw, refute = () => '<div class="explain show"><b>Как на самом деле.</b> ' + txt(raw.why) + '</div>' +
      (raw.whyFig && T.fig ? '<div class="whyfig">' + T.fig(raw.whyFig) + '</div>' : '');
    let h = '<button type="button" class="backlink" data-g="main">← Свет и герои</button><h2 class="vh" tabindex="-1">Заблуждение дня</h2>' +
      heroHTML(hero('myth_intro')) + '<blockquote class="gmyth">' + txt(m.text) + '</blockquote>';
    if (mythDone()) {
      const r = st.cat.myth[m.id];
      b.innerHTML = h + '<p class="gmeta">' + esc('Сегодня это заблуждение уже разобрано: ' + SELF[r.self] + '. Новое — завтра.') + '</p>' + refute();
      return;
    }
    h += '<div class="recall"><label for="gmText">Почему это неверно? 2–4 предложения своими словами.</label><textarea id="gmText" rows="4"></textarea>' +
      '<div class="rrow"><button type="button" class="checkbtn" id="gmCheck" disabled>Сверить</button><span class="gmeta" id="gmCount" aria-live="polite"></span></div></div><div id="gmRes"></div>';
    b.innerHTML = h;
    const ta = $('gmText'), go = $('gmCheck'), c = $('gmCount');
    const upd = () => { const w = words(ta.value); go.disabled = !w; c.textContent = w ? 'слов: ' + w + (w < MYTH_MIN ? ' — ' + plural(1, noteF()) + ' от ' + MYTH_MIN : '') : ''; };
    ta.oninput = upd; upd();
    go.onclick = () => {
      const text = ta.value.trim(); if (!text) return;
      ta.readOnly = true; go.style.display = 'none';
      const lid = 'gml' + (++uid);
      $('gmRes').innerHTML = refute() + '<p class="gq" id="' + lid + '">Как совпало?</p><div class="grow" role="group" aria-labelledby="' + lid + '">' +
        ['yes', 'partial', 'no'].map((k) => '<button type="button" class="cchip" data-self="' + k + '">' + SELF[k] + '</button>').join('') + '</div>';
      $('gmRes').querySelectorAll('[data-self]').forEach((btn) => {
        btn.onclick = () => {
          const self = btn.dataset.self, w = words(text);
          st.cat.myth[m.id] = { t: now(), self, w };
          pushWords({ kind: 'myth', topic: m.topic, id: m.id, text: text.slice(0, 4000) });
          log('my', { id: m.id, self, w });
          const out = capture(() => { if (w >= MYTH_MIN) choiceNote('myth', 'заблуждение опровергнуто своими словами'); const h2 = hero('myth_' + self); if (h2) pend.push({ k: 'say', html: heroHTML(h2) }); });
          save();
          $('gmRes').innerHTML = refute() + '<p class="gmeta" id="gmSelf" tabindex="-1">' + esc('Сверка: ' + SELF[self] + '.') + '</p>' + out +
            '<div class="grow"><button type="button" class="ghost" data-g="main">← Свет и герои</button></div>';
          $('gmSelf').focus({ preventScroll: true });
        };
      });
      const f = $('gmRes').querySelector('.explain'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
  }

  // ---- стартовая страница и страница тем ----
  function wireGo(el) {
    el.querySelectorAll('[data-g]').forEach((btn) => {
      if (btn.closest('#gameBody')) return;   // на экране «Свет и герои» — свой обработчик
      btn.onclick = () => {
        const g = btn.dataset.g;
        if (g === 'view') { panel = 'main'; window.scrollTo({ top: 0 }); T.show('game'); }
        else if (g === 'myth') { panel = 'myth'; window.scrollTo({ top: 0 }); T.show('game'); }
        else if (g === 'topics') T.setMenuPage('topics');
      };
    });
  }
  function topicBlock(k) {
    // когда будет эхо и что в нём удержалось, показывает сама карточка темы: эхо — часть тренажёра
    const L = st.lessons[k], t = lessonT(k);
    let h = '<div class="gtop"><span class="gname">' + esc(term('lesson')) + '</span>' + (L ? barsHTML(L, '') + '<span class="gmeta">' + esc(notes(lessonNotes(L)) + (whole(k, L) ? ' · целиком' : '')) + '</span>' : '') + '</div>';
    if (!t) h += heroHTML(hero('topic_start'));
    else if (L && !L.bars.sum && mainDone(L)) h += '<p class="gmeta">' + esc('Последний ' + barF()[0] + ' — объяснение темы — в «Свете и героях».') + '</p>';
    return '<div class="gtopic">' + h + '</div>';
  }
  function liveDue() { return srsCount((e) => T.isDue(e)); }
  function menu() {
    const gb = $('gameBtn'), gh = $('gHub'), gt = $('gTopic'); if (!gb || !gh || !gt) return;
    const u = T.user();
    if (!u || !on()) {
      gh.style.display = 'none'; gh.innerHTML = ''; gt.style.display = 'none'; gt.innerHTML = '';
      gb.style.display = u ? '' : 'none'; gb.textContent = '✨ Свет и герои — игровой слой (выключен)';
      return;
    }
    gb.style.display = 'none';
    // перерыв два дня и больше: кот делает вид, что ничего не случилось
    const tk = dkey(now());
    if (st.seen !== tk) {
      if (st.seen) { const gap = Math.round((T.dayStart(now()) - new Date(st.seen + 'T00:00:00').getTime()) / DAY); if (gap >= 2) st.back = tk; }
      st.seen = tk; save();
    }
    const d = today(), k = Object.keys(T.TOPICS)[0];
    let h = '';
    if (d) {
      const due = liveDue();
      const say = d.done ? hero('hub_done') : st.back === tk ? hero('hub_back') : due ? hero('hub_review', { n: due }) : d.c < CHOICE && mythAvail() ? hero('hub_myth') : null;
      h += dayTop(d) + heroHTML(say) + '<div class="grow">' +
        (mythAvail() ? '<button type="button" class="ghost" data-g="myth">🐾 Заблуждение дня</button>' : '') +
        '<button type="button" class="ghost" data-g="view">Свет и герои →</button></div>';
    } else {
      const L = k && st.lessons[k], started = k && lessonT(k);
      if (started && L) h += '<div class="gtop"><span class="gname">' + esc(term('lesson')) + '</span>' + barsHTML(L, '') + '<span class="gmeta">' + esc(notes(lessonNotes(L))) + '</span></div>' + heroHTML(hero('hub_lessonday'));
      else h += heroHTML(hero(started ? 'hub_lessonday' : 'hub_nolesson'));
      h += '<div class="grow">' + (!started ? '<button type="button" class="ghost" data-g="topics">Тренажёр по теме →</button>' : '') +
        '<button type="button" class="ghost" data-g="view">Свет и герои →</button></div>';
    }
    gh.innerHTML = h; gh.style.display = ''; wireGo(gh);
    gt.innerHTML = Object.keys(T.TOPICS).map(topicBlock).join(''); gt.style.display = gt.innerHTML ? '' : 'none'; wireGo(gt);
  }
  function echoText(info) {
    if (!on() || !info || !T.TOPICS[info.key]) return '';
    return heroHTML(hero(info.which === 'd21' ? 'echo_d21' : 'echo_d7', { topic: T.TOPICS[info.key].title }));
  }

  // ---- экран «Свет и герои» ----
  function card(icon, title, line, extra) {
    return '<div class="gcard"><div class="gic" aria-hidden="true">' + icon + '</div><div class="gcb"><p><b>' + esc(title) + '</b> — ' + esc(line) + '</p>' + (extra || '') + '</div></div>';
  }
  function monthAgo() {
    if (!st.since || now() - st.since < 30 * DAY) return null;
    const lim = now() - 30 * DAY, all = Object.assign({}, st.eidos.w, st.eidos.s); let n = 0;
    Object.keys(all).forEach((id) => { if (Math.min(st.eidos.w[id] || Infinity, st.eidos.s[id] || Infinity) <= lim) n++; });
    return n;
  }
  function heroesHTML() {
    const d = today(), pts = lightPoints(), ans = lightAnswers(), sN = size(st.eidos.s), month = monthAgo();
    const lvl = LIGHT_STEPS.filter((x) => pts >= x).length, fixed = size(st.cat.fixed);
    let h = '';
    h += card(esc(sign()), P.names.guide,
      d ? (d.done ? term('dayDone') : term('day') + ': ' + dayNotes(d) + ' из ' + notes(dayTotal(d))) + ' · на неделе ' + weekDone() + ' из ' + WEEK_GOAL
        : term('day') + ' начинается на следующий день после занятия по теме',
      heroHTML(hero('view_guide')));
    const lt = levelText('light', pts);
    h += card('<span class="glight l' + lvl + '"></span>', term('light'),
      cnt(ans, ['ответ', 'ответа', 'ответов']) + ' в долгой памяти' + (sN ? ', из них ' + sN + ' — три недели' : '') + (month != null ? ' (месяц назад — ' + month + ')' : ''),
      lt ? '<p class="gsay">' + txt(lt) + '</p>' : '<p class="gmeta">' + esc('Светлеет, когда ответ выдержал неделю и три недели — в повторении и в эхе занятия.') + '</p>');
    const ct = levelText('cat', fixed);
    h += card('🐾', P.names.cat, 'приручение: ' + cnt(fixed, ['исправленная ошибка', 'исправленные ошибки', 'исправленных ошибок']),
      (ct ? '<p class="gsay">' + esc(P.names.cat) + ' ' + txt(ct) + '</p>' : '') +
      (mythAvail() ? '<div class="grow"><button type="button" class="ghost" data-g="myth">🐾 Заблуждение дня</button></div>'
        : mythDone() ? '<p class="gmeta">Заблуждение дня разобрано. Новое — завтра.</p>'
          : today() ? '' : '<p class="gmeta">Заблуждения темы появятся на следующий день после занятия.</p>'));
    const played = Object.keys(st.days).filter((x) => st.days[x].done).length, sp = Object.keys(st.lessons).some((x) => st.lessons[x].surprise);
    h += card('📖', term('book'), cnt(played, Array.isArray(P.terms.melody) ? P.terms.melody : ['мелодия', 'мелодии', 'мелодий']) + (sp && term('bookItem') ? ' · ' + term('bookItem') : ''), '');
    return h;
  }
  function lessonsHTML() {
    let h = '<h3 class="gh3">Занятия</h3>';
    Object.keys(T.TOPICS).forEach((k) => {
      const L = st.lessons[k], t = lessonT(k), ei = T.echoInfo(k), tt = T.TOPICS[k];
      const ml = L ? missLine(k, L) : '', nt = L ? notes(lessonNotes(L)) + (L.v === 2 ? ' из ' + maxNotes(k) : '') : '';
      let line = !t ? 'ещё не начато' : !L ? 'занятие прошло, когда игра была выключена' : barsOn(L) === BARS.length ? lcFirst(term('lessonDone')) + (whole(k, L) ? ' целиком' : '') + ' · ' + nt : barsOn(L) + ' из ' + cnt(BARS.length, barF()) + ' · ' + nt;
      if (ei) {
        const e7 = ei.done.d7, e21 = ei.done.d21;
        line += ei.which ? ' · эхо можно сыграть сейчас' : !e7 && !e21 && ei.nextAt ? ' · эхо — ' + T.fmtDay(ei.nextAt) : e7 && !e21 && ei.nextAt ? ' · эхо через неделю сыграно, второе — ' + T.fmtDay(ei.nextAt) : e21 ? ' · эхо сыграно' : '';
      }
      h += '<div class="gcard"><div class="gic" aria-hidden="true">' + esc(tt.icon || '⚡') + '</div><div class="gcb"><p><b>' + esc(tt.title) + '</b> — ' + esc(line) + '</p>' +
        (L ? '<div class="gtop">' + barsHTML(L, '') + '</div>' : '') + (ml ? '<p class="gmeta">' + esc(ml) + '</p>' : '') + (L && !L.bars.sum ? '<div class="gexpwrap" data-exp="' + esc(k) + '"></div>' : '') + '</div></div>';
    });
    return h;
  }
  function adultHTML() {
    const u = T.user(), H = u.history, rows = [], yes = (b) => (b ? 'да' : 'нет'), of = (a, b) => a + ' из ' + b;
    ['d7', 'd21'].forEach((e) => {
      const a = H.filter((h) => h.mode === 'echo' && h.echo === e && !h.retry);
      if (a.length) rows.push(['Эхо через ' + (e === 'd7' ? 'неделю' : 'три недели'), of(a.filter((h) => h.correct && h.conf !== 'guess').length, a.length) + ' — верно и не угадано']);
    });
    const R = st.log.filter((x) => x.k === 'r' && x.m === 'review' && !x.re);
    [[2, 'через 7 дней'], [3, 'через 21 день']].forEach(([bx, l]) => {
      const a = R.filter((x) => x.box === bx); if (a.length) rows.push(['Ошибки занятия ' + l, of(a.filter((x) => x.ok && !x.g).length, a.length) + ' — верно и не угадано']);
    });
    // база: как раньше удерживались похожие вопросы глав 4 «Ферменты» и 9 «Использование энергии»
    const base = H.filter((h) => (h.ch === 'ch4' || h.ch === 'ch9') && h.mode === 'review' && !h.retry);
    rows.push(['Для сравнения: повторение глав 4 и 9', base.length ? of(base.filter((h) => h.correct && h.conf !== 'guess').length, base.length) + ' — верно и не угадано' : 'данных нет']);
    const rc = st.log.filter((x) => x.k === 'rc');
    if (rc.length) {
      const wr = rc.filter((x) => x.w >= RECALL_MIN), sk = rc.filter((x) => x.s), avg = wr.length ? Math.round(wr.reduce((a, x) => a + x.w, 0) / wr.length) : 0;
      rows.push(['«Сначала вспомните»', 'свой ответ — ' + of(wr.length, rc.length) + (wr.length ? ', в среднем ' + cnt(avg, ['слово', 'слова', 'слов']) : '') + '; «Не могу вспомнить» — ' + sk.length]);
    }
    const dr = st.log.filter((x) => x.k === 'dr' && x.m === 'lesson').pop(), p2 = st.log.filter((x) => x.k === 'p2' && x.m === 'lesson').pop();
    if (dr) rows.push(['Рисунок по памяти', 'на месте ' + of(dr.sc, dr.n) + ' частей']);
    if (p2) rows.push(['Опыт с объяснением', 'самооценка ' + of(p2.sc, p2.n) + '; стоит один раз проверить тот же ответ вместе']);
    Object.keys(st.lessons).forEach((k) => { const L = st.lessons[k]; if (L.sumRes) rows.push(['Объяснение темы', L.sumRes === 'text' ? 'письменно' : 'выдержало три «почему»: ' + RES[L.sumRes]]); });
    Object.keys(T.TOPICS).forEach((k) => {
      const t = lessonT(k); if (!t) return; const d0 = T.dayStart(t);
      const has = (n) => { const a = d0 + n * DAY, b = a + DAY; if (now() < a) return null; return H.some((h) => h.t >= a && h.t < b); };
      const d1 = has(1), d4 = has(4); if (d1 == null) return;
      rows.push(['Возврат после занятия', 'день 1 — ' + yes(d1) + (d4 == null ? '' : ', день 4 — ' + yes(d4))]);
    });
    const sig = [];
    const short = rc.filter((x) => !x.s && x.w > 0 && x.w < RECALL_MIN); if (rc.length >= 5 && short.length / rc.length >= 0.3) sig.push('в «Сначала вспомните» часто одно слово');
    const wy = st.log.filter((x) => x.k === 'wy'); if (wy.length >= 4 && new Set(wy.map((x) => x.r)).size === 1) sig.push('в «почему ошибка» всегда одна и та же кнопка');
    const sure = st.log.filter((x) => x.k === 'r' && x.sure && !x.re); if (sure.length >= 5 && sure.filter((x) => x.ok).length / sure.length < 0.7) sig.push('«Знаю» верно меньше чем в 70 % случаев');
    rows.push(['Сигналы фарма', sig.length ? sig.join('; ') : 'не видно']);
    const KIND = { fb: 'После занятия', explain: 'Объяснение темы', myth: 'Заблуждение дня' };
    const texts = st.words.filter((w) => KIND[w.kind]).slice(-6).reverse();
    return '<details class="gadult"><summary>Для взрослого: как идёт первый этап</summary>' +
      '<p class="gmeta">Главное — удержание через 7 и 21 день. Если ноты растут, а удержание нет, игру стоит упростить или выключить.</p>' +
      '<dl class="gdl">' + rows.map((r) => '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('') + '</dl>' +
      (texts.length ? '<p class="gq">Свои слова ученика — последние записи</p>' + texts.map((w) => '<p class="gword"><span class="gmeta">' + esc(KIND[w.kind] + ' · ' + new Date(w.t).toLocaleDateString('ru-RU')) + '</span><br>' + esc(w.text.slice(0, 600)).replace(/\n/g, '<br>') + '</p>').join('') : '') +
      '</details>';
  }
  function settingsHTML() {
    const ownN = (P.own.guide || '') + (P.own.cat ? ' и ' + P.own.cat : '');
    return '<h3 class="gh3">Настройки</h3>' +
      '<div class="gset"><span id="gsOn">Игровой слой</span><span class="grow" role="group" aria-labelledby="gsOn">' +
      '<button type="button" class="cchip on" aria-pressed="true" data-g="on">вкл</button><button type="button" class="cchip" aria-pressed="false" data-g="off">выкл</button></span></div>' +
      '<div class="gset"><span id="gsPack">Герои</span><span class="grow" role="group" aria-labelledby="gsPack">' +
      '<button type="button" class="cchip' + (st.pack === 'own' ? ' on' : '') + '" aria-pressed="' + (st.pack === 'own') + '" data-g="own">свои герои: ' + esc(ownN) + '</button>' +
      (fileTitle ? '<button type="button" class="cchip' + (st.pack === 'file' ? ' on' : '') + '" aria-pressed="' + (st.pack === 'file') + '" data-g="file">из файла: ' + esc(fileTitle) + '</button>' : '') +
      '<button type="button" class="ghost" data-g="load">' + (fileTitle ? 'Загрузить другой пакет…' : 'Загрузить пакет из файла…') + '</button></span></div>' +
      '<input type="file" id="gsFile" accept="application/json,.json" hidden>' +
      '<p class="gmeta">Пакет героев из файла хранится только в этом браузере и на сайт не попадает. Выключенная игра ничего не записывает, а учёба без неё работает так же.</p>';
  }
  function offHTML() {
    return '<p class="vsub">Игровой слой — для занятий «Тренажёра по теме». Шаги занятия, повторение в срок и свои ответы зажигают дневную цель, а ответы, которые выдержали неделю и три недели, копятся как свет долгой памяти. Кот приносит заблуждения темы, чтобы их опровергнуть.</p>' +
      '<p class="vsub">Учёба от этого не меняется: вопросы, повторение и освоение работают так же. Пропуск дня ничего не отнимает, серий и соревнований нет, а игру можно выключить в любой момент.</p>' +
      (P.about ? '<p class="vsub">' + txt(P.about) + '</p>' : '') +
      '<button type="button" class="cta" data-g="on">Включить игровой слой</button>';
  }
  function view() {
    const b = $('gameBody'); if (!b) return;
    if (!T.user()) { b.innerHTML = ''; return; }
    b.onclick = (e) => { const t = e.target.closest('[data-g]'); if (t && b.contains(t)) act(t.dataset.g); };
    if (on() && panel === 'myth') { mythView(b); focusHead(b); return; }
    let h = '<h2 class="vh" tabindex="-1">Свет и герои</h2>';
    if (!on()) h += offHTML();
    else h += heroesHTML() + lessonsHTML() + adultHTML() + settingsHTML();
    b.innerHTML = h;
    b.querySelectorAll('[data-exp]').forEach((el) => explainBlock(el, el.dataset.exp, null));
    const f = $('gsFile'); if (f) f.onchange = (e) => { const x = e.target.files && e.target.files[0]; e.target.value = ''; if (x) loadFile(x); };
  }
  function focusHead(b) { const h = b.querySelector('h2'); if (h) h.focus({ preventScroll: true }); }
  function act(g) {
    const b = $('gameBody');
    if (g === 'on') { setOn(true); view(); focusHead(b); }
    else if (g === 'off') { setOn(false); view(); focusHead(b); }
    else if (g === 'own' || g === 'file') { setPack(g); view(); }
    else if (g === 'load') { const f = $('gsFile'); if (f) f.click(); }
    else if (g === 'myth') { panel = 'myth'; window.scrollTo({ top: 0 }); view(); }
    else if (g === 'main') { panel = 'main'; window.scrollTo({ top: 0 }); view(); focusHead(b); }
  }
  function setOn(v) {
    if (v) { if (!st) st = blank(); if (!st.since) st.since = now(); st.on = true; log('on'); }
    else if (st) { log('off'); st.on = false; }
    save(); loadPack();
  }
  function setPack(v) { if (!st) return; st.pack = v === 'file' && fileTitle ? 'file' : 'own'; log('pk', { p: st.pack }); save(); loadPack(); }
  function loadFile(file) {
    if (file.size > 200000) { alert('Файл слишком большой для пакета героев.'); return; }
    const r = new FileReader();
    r.onload = () => {
      let p = null; try { p = JSON.parse(r.result); } catch (e) { p = null; }
      if (!isPack(p)) { alert('Это не пакет героев тренажёра или файл повреждён.'); return; }
      try { localStorage.setItem(PACK_KEY, JSON.stringify(p)); } catch (e) { alert('Не удалось сохранить пакет: память браузера заполнена.'); return; }
      if (st) { st.pack = 'file'; log('pk', { p: 'file' }); save(); }
      loadPack(); view();
    };
    r.readAsText(file);
  }

  // ---- резервная копия ----
  // пакет из файла попадает в копию, только если ученик сам это отметил
  function backup() {
    if (!st) return null;
    const o = { game: JSON.parse(JSON.stringify(st)) }, f = readPackFile();
    if (f && confirm('Добавить в копию пакет героев «' + (clean(f).title || 'из файла') + '»? Без него на другом устройстве будут свои герои тренажёра.')) o.pack = f;
    return o;
  }
  // объединение, как у истории: дни — запись с бо́льшим числом нот, такты, эйдос и исправленные ошибки — с более ранней датой,
  // свои слова и журнал — без дублей
  function merge(g, pk) {
    const d = norm(g); if (!d) return false;
    if (!st) st = blank();
    // у ученика здесь ещё ничего не было — берём из копии и выключатель, и выбор героев
    const fresh = !size(st.days) && !size(st.lessons) && !st.log.some((x) => !['on', 'off', 'pk'].includes(x.k));
    if (fresh) { st.on = d.on; st.pack = d.pack; }
    if (d.since && (!st.since || d.since < st.since)) st.since = d.since;
    Object.keys(d.days).forEach((k) => { const a = st.days[k], b = d.days[k]; if (!a || b.r + b.c > a.r + a.c) st.days[k] = b; });
    const early = (a, b) => (a && b ? Math.min(a, b) : a || b);
    Object.keys(d.lessons).forEach((k) => {
      const a = st.lessons[k], b = d.lessons[k]; if (!a) { st.lessons[k] = b; return; }
      a.t = early(a.t, b.t); BARS.forEach((x) => { a.bars[x] = early(a.bars[x], b.bars[x]); });
      Object.keys(CAPS).forEach((x) => { a.got[x] = Math.max(a.got[x], b.got[x]); });
      ['pa', 'qa', 'rc', 'wy', 'caught', 'prey'].forEach((x) => { Object.assign(a[x], b[x]); });
      a.sumRes = a.sumRes || b.sumRes; a.done = early(a.done, b.done); a.surprise = early(a.surprise, b.surprise);
    });
    ['w', 's'].forEach((k) => Object.keys(d.eidos[k]).forEach((id) => { st.eidos[k][id] = early(st.eidos[k][id], d.eidos[k][id]); }));
    Object.keys(d.cat.fixed).forEach((id) => { st.cat.fixed[id] = early(st.cat.fixed[id], d.cat.fixed[id]); });
    Object.keys(d.cat.myth).forEach((id) => { const a = st.cat.myth[id], b = d.cat.myth[id]; if (!a || b.t > a.t) st.cat.myth[id] = b; });
    const uni = (A, B, keyOf, lim) => { const seen = new Set(A.map(keyOf)); B.forEach((x) => { if (!seen.has(keyOf(x))) { seen.add(keyOf(x)); A.push(x); } }); A.sort((x, y) => x.t - y.t); return A.slice(-lim); };
    st.words = uni(st.words, d.words, (x) => x.t + '|' + x.kind, 500);
    st.log = uni(st.log, d.log, (x) => x.t + '|' + x.k + '|' + (x.id || ''), 3000);
    if (isPack(pk)) { try { if (!readPackFile()) localStorage.setItem(PACK_KEY, JSON.stringify(pk)); } catch (e) { /* без пакета — свои герои */ } }
    if (st.pack === 'file' && !readPackFile()) st.pack = 'own';
    save(); loadPack();
    return true;
  }
  function storage(key) { if (name && (key === KEY(name) || key === PACK_KEY)) load(name); }

  return { user: load, menu, question, pre, read, recall, reason, answer, task, reveal, finish, view, echoText, backup, merge, storage, isOn: on };
};
