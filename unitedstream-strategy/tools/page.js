(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var panels = { summary: 'summary', strategy: 'strategy', competitive: 'competitive' };

  function show(id, scroll) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (scroll) window.scrollTo(0, 0);
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var id = t.getAttribute('aria-controls');
      show(id, true);
      try { history.replaceState(null, '', '#' + id); } catch (e) {}
    });
  });

  // якорь из ссылки: вкладка или раздел внутри вкладки
  function route() {
    var h = (location.hash || '').slice(1);
    if (!h) return;
    if (panels[h]) { show(h, false); return; }
    var el = document.getElementById(h);
    if (!el) return;
    var p = el.closest('[role="tabpanel"]');
    if (p) show(p.id, false);
    el.scrollIntoView();
  }
  route();
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var el = document.getElementById(id);
    if (!el) return;
    var p = el.closest('[role="tabpanel"]');
    if (p && p.hidden) { show(p.id, false); }
  });

  // подсказки на графиках
  var tip = document.getElementById('tip');
  document.addEventListener('pointermove', function (ev) {
    var t = ev.target.closest && ev.target.closest('[data-tip]');
    if (!t) { tip.hidden = true; return; }
    tip.textContent = t.getAttribute('data-tip');
    tip.hidden = false;
    var x = ev.clientX + 14, y = ev.clientY + 14;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    if (x + w > window.innerWidth - 8) x = ev.clientX - w - 14;
    if (y + h > window.innerHeight - 8) y = ev.clientY - h - 14;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  });
  document.addEventListener('pointerleave', function () { tip.hidden = true; });
})();
