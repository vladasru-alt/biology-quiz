// Робот для прогона тренажёра в браузере. Загрузка на странице с локальным сервером
// (python3 -m http.server 8753 из корня репозитория, страница http://localhost:8753/):
//   eval(await (await fetch('/tools/browser/runner.js')).text());
//   await __runAll()            — все главы, каждый ответ верный: ждём «chN: N из N» без замечаний
//   await __runChapter('ch5')   — одна глава
//   await __ans(true|false)     — ответить на текущий вопрос верно или заведомо неверно (для сценарных проверок)
// Нужен вошедший пользователь. Код сохраняется в sessionStorage и после location.reload()
// восстанавливается: eval(sessionStorage.getItem('__runnerLib')).
// Робот находит вопрос по тексту условия, поэтому не зависит от перемешивания;
// неразрывные пробелы, которые ставит типографика при выводе, приводятся к обычным.
(() => {
  const PREFIX = 'bio_'; // префикс ключей хранилища приложения — свой у каждого тренажёра
  const src = '(' + (function lib(PREFIX) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const T = (e) => e.innerText.replace(/\u00a0/g, ' ');
    const $ = (id) => document.getElementById(id);
    const optBtns = () => [...document.querySelectorAll('#qOpts button.opt')];
    const optText = (b) => T(b.querySelector('span:nth-child(2)')).trim();
    const clickText = (t) => { const b = optBtns().find((b) => optText(b) === t); if (!b) throw new Error('нет кнопки «' + t + '»'); b.click(); };
    const SECS = () => Object.assign({}, QUIZ, typeof TOPICS !== 'undefined' ? TOPICS : {});
    const byQ = () => { const m = {}; Object.values(SECS()).forEach((c) => c.questions.forEach((q) => { m[q.q] = q; })); return m; };
    // шаги тренажёра по теме: кнопки-переключатели (рисунок, элементы ответа) — отметить все или ни одного
    const markAll = (sel, on) => { [...document.querySelectorAll(sel)].forEach((b) => { if (b.classList.contains('sel') !== on) b.click(); }); };
    const orderRight = (q) => { for (let i = 0; i < q.items.length; i++) for (let g = 0; g < 10; g++) {
      const rows = [...document.querySelectorAll('#qOpts .orderitem')]; const pos = rows.findIndex((r) => T(r.querySelector('.otext')).trim() === q.items[i]);
      if (pos === i) break; rows[pos].querySelector('.up').click(); } };
    async function answer(q, ok) {
      // шаг «Сначала вспомните»: варианты появляются после своего ответа
      if ($('recallGo')) { $('recallText').value = 'ответ робота'; $('recallGo').click(); await sleep(10); }
      if (q.type === 'read') { $('readDone').click(); return; }
      if (q.type === 'draw') { $('drawDone').click(); await sleep(10); markAll('#qOpts .opt', ok); $('qCheck').click(); return; }
      if (q.type === 'part2') { const ta = $('p2Text'); ta.value = 'ответ робота'; ta.dispatchEvent(new Event('input', { bubbles: true }));
        $('qCheck').click(); await sleep(10); markAll('#p2Crit .opt', ok); $('qCheck').click(); return; }
      if (q.type === 'single') clickText(ok ? q.options[q.correct] : q.options.find((_, i) => i !== q.correct));
      else if (q.type === 'truefalse') optBtns().find((b) => (q.answer === ok) ? !/Неверно/.test(b.innerText) : /Неверно/.test(b.innerText)).click();
      else if (q.type === 'twotier') { clickText(ok ? q.options[q.correct] : q.options.find((_, i) => i !== q.correct)); await sleep(20); if (ok) clickText(q.reasons[q.reasonCorrect]); }
      else if (q.type === 'multi') { (ok ? q.correct.map((i) => q.options[i]) : [q.options.find((_, i) => !q.correct.includes(i))]).forEach(clickText); $('qCheck').click(); }
      else if (q.type === 'match') { [...document.querySelectorAll('#qOpts .matchrow')].forEach((row) => {
          const l = T(row.querySelector('.ml')).replace(/^[А-Я]\.\s*/, '').trim(); const i = q.left.indexOf(l); const s = row.querySelector('select');
          s.value = ok ? q.right[i] : q.right[(i + 1) % q.right.length]; s.dispatchEvent(new Event('change', { bubbles: true })); }); $('qCheck').click(); }
      else if (q.type === 'order') { if (ok) orderRight(q); $('qCheck').click(); }
    }
    window.__ans = async function (ok) { const q = byQ()[T($('qText')).trim()]; if (!q) throw new Error('вопрос не найден в банке'); await answer(q, ok); await sleep(20); return q.id + ' ' + q.type; };
    // открыть главу или занятие по теме: карточки рисуются всегда, даже на скрытой странице меню
    window.__runChapter = async function (chKey) {
      // выход из открытого теста и замена незаконченного прохождения спрашивают confirm — на время отвечаем «да»
      const conf = window.confirm; window.confirm = () => true;
      try {
        if ($('menu').style.display === 'none') { if ($('results').style.display !== 'none') $('homeBtn').click(); else if ($('dash').style.display !== 'none') $('dashHomeBtn').click(); else $('quitBtn').click(); await sleep(150); }
        const card = [...document.querySelectorAll('.chapter')].find((c) => T(c.querySelector('h3')).trim() === SECS()[chKey].title);
        if (!card) throw new Error('нет карточки главы ' + chKey);
        card.click(); await sleep(150);
      } finally { window.confirm = conf; }
      if ($('quiz').style.display === 'none') return chKey + ': глава не открылась';
      const m = byQ(); const bad = [];
      for (let n = 0; n < 200; n++) {
        if ($('quiz').style.display === 'none') break;
        const q = m[T($('qText')).trim()]; if (!q) { bad.push('не найден: ' + T($('qText')).slice(0, 40)); break; }
        try { await answer(q, true); } catch (e) { bad.push(q.id + ': ' + e.message); }
        await sleep(15);
        // шаг «чтение» сам переходит к следующему шагу — пояснения и «Далее» у него нет
        if (q.type === 'read') continue;
        if (!$('qExplain').innerText.startsWith('✓')) bad.push(q.id + ' не засчитан');
        $('qNext').click(); await sleep(20);
      }
      const res = $('rFrac') ? $('rFrac').innerText : '?'; $('homeBtn').click(); await sleep(100);
      return chKey + ': ' + res + (bad.length ? ' | ' + bad.join('; ') : '');
    };
    window.__runAll = async function () {
      // сохранённые прохождения иначе предложат «Продолжить» вместо нового прохода.
      // Удаляются незаконченные прохождения ВСЕХ пользователей этого браузера — запускать под тестовым профилем
      Object.keys(localStorage).filter((k) => k.startsWith(PREFIX + 'session_') || k.startsWith(PREFIX + 'side_session_')).forEach((k) => localStorage.removeItem(k));
      const out = []; for (const k of Object.keys(SECS())) out.push(await window.__runChapter(k)); return out;
    };
  }).toString() + ')(' + JSON.stringify(PREFIX) + ')';
  sessionStorage.setItem('__runnerLib', src);
  eval(src);
})();
