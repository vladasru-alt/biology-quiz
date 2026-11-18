"""Проверка игрового слоя (game.js) в безголовом Chrome — PIPELINE.md, раздел 11.
  python3 tools/browser/game_check.py [папка для снимков]
Нужны Playwright (pip install playwright) и локальный сервер: python3 -m http.server 8753 из корня репозитория.
Сценарий: занятие с игрой и без (учёба должна совпасть), дни 1, 4, 7, 11, 21, 32 после занятия —
мелодия дня, заблуждение дня, эхо, эйдос, кот; пакет героев из файла; резервная копия и восстановление.
Время сдвигается подменой Date: смещение — в localStorage.__shift, затем перезагрузка.
Браузер — отдельный, со своим хранилищем: данные учеников в обычном браузере не трогаются."""
import json
import os
import sys

from playwright.sync_api import sync_playwright

URL = "http://localhost:8753/"
SHOTS = sys.argv[1] if len(sys.argv) > 1 else "."
os.makedirs(SHOTS, exist_ok=True)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
# пакет героев для проверки: свой файл из private/, если есть, иначе свои герои в формате пакета
PACK = os.path.join(ROOT, "private", "dafna-pack.json")
DAY = 86400000
RUNNER = "async()=>{eval(await (await fetch('/tools/browser/runner.js')).text());}"
SHIFT = """(() => { let off = 0; try { off = +(localStorage.getItem('__shift') || 0); } catch (e) {} if (!off) return;
  const RD = Date; function D(...a) { if (!new.target) return new RD(RD.now() + off).toString(); return a.length ? new RD(...a) : new RD(RD.now() + off); }
  D.prototype = RD.prototype; D.now = () => RD.now() + off; D.parse = RD.parse; D.UTC = RD.UTC; Object.setPrototypeOf(D, RD); window.Date = D; })();"""
DRIVE = r"""async (spec) => {
  const S = (ms) => new Promise((r) => setTimeout(r, ms)), $ = (id) => document.getElementById(id), T = (e) => e.innerText.replace(/ /g, ' ');
  const m = {}; Object.values(Object.assign({}, QUIZ, TOPICS)).forEach((c) => c.questions.forEach((q) => { m[q.q] = q; }));
  const out = [];
  for (let n = 0; n < 80; n++) {
    if ($('quiz').style.display === 'none') break;
    if ($('qExplain').className.includes('show')) { $('qNext').click(); await S(80); continue; }
    const q = m[T($('qText')).trim()]; if (!q) { out.push({ err: 'нет вопроса ' + T($('qText')).slice(0, 40) }); break; }
    const isRetry = $('qBadge').textContent.startsWith('Ещё раз');
    const sp = Object.assign({ ok: true }, spec.default || {}, spec[q.id] || {}, isRetry ? (spec.retry || { ok: true, conf: null, reason: null }) : {});
    const strip0 = T($('gStrip'));
    if (q.type === 'read') { if (sp.readText != null && $('readText')) $('readText').value = sp.readText; $('readDone').click(); await S(80); out.push({ id: q.id, strip: strip0 }); continue; }
    if (sp.conf) { const c = document.querySelector('#qConf .cchip[data-k="' + sp.conf + '"]'); if (c) c.click(); }
    let recalled = false;
    if ($('recallGo')) { $('recallText').value = sp.recall || 'клетка получает энергию из глюкозы'; $('recallGo').click(); recalled = true; await S(30); }
    if (q.type === 'draw') { $('drawDone').click(); await S(30); [...document.querySelectorAll('#qOpts .opt')].forEach((b, i) => { if (!(sp.drawMiss || []).includes(i)) b.click(); }); $('qCheck').click(); }
    else await window.__ans(sp.ok);
    await S(60);
    if (sp.reason && $('qWhy').className.includes('show')) { document.querySelector('#qWhy .cchip[data-k="' + sp.reason + '"]').click(); await S(30); }
    if (spec.stop === q.id) { spec.stop = null; out.push({ id: q.id, stopped: true, line: T($('qGame')) }); return out; }
    out.push({ id: q.id, retry: isRetry, recalled, ok: $('qExplain').innerText.startsWith('✓'), explain: T($('qExplain')).slice(0, 90), line: T($('qGame')), strip: strip0 + ' ⇒ ' + T($('gStrip')) });
    $('qNext').click(); await S(80);
  }
  return out;
}"""


def main():
    errors, consoles = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        ctx = browser.new_context(viewport={"width": 420, "height": 900}, device_scale_factor=2, accept_downloads=True)
        ctx.add_init_script(SHIFT)
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: consoles.append(m.text) if m.type == "error" else None)
        page.on("dialog", lambda d: d.accept())
        page.on("response", lambda r: consoles.append('HTTP %d %s' % (r.status, r.url)) if r.status >= 400 else None)
        ev = page.evaluate
        def shot(nm, sel=None):
            if sel: ev("(s)=>{const e=document.querySelector(s); if(e) e.scrollIntoView({block:'start'});}", sel)
            else: ev("()=>window.scrollTo(0,0)")
            page.wait_for_timeout(120); page.screenshot(path=f"{SHOTS}/{nm}.png")

        def login(name):
            ev("()=>{const b=document.getElementById('switchBtn'); if(document.getElementById('userbar').style.display!=='none') b.click();}")
            page.wait_for_timeout(150)
            page.fill("#loginInput", name); page.click("#loginBtn"); page.wait_for_timeout(300)
            ev(RUNNER)

        def set_day(n, hours=0):
            ev(f"()=>localStorage.setItem('__shift',String({n}*{DAY}+{hours}*3600000))")
            page.reload(); page.wait_for_timeout(500); ev(RUNNER)

        def game_state(name):
            return ev(f"()=>JSON.parse(localStorage.getItem('bio_game_'+{json.dumps(name)})||'null')")

        def learn_state(name):
            return ev(f"""()=>{{const h=JSON.parse(localStorage.getItem('bio_user_'+{json.dumps(name)})||'{{}}').history||[];
              const s=JSON.parse(localStorage.getItem('bio_srs_'+{json.dumps(name)})||'{{}}');
              return {{hist:h.map(x=>[x.id,x.correct,x.conf||'',x.mode||'',!!x.retry,x.echo||'',x.reason||'']), srs:Object.keys(s).sort().map(k=>[k,s[k].box])}};}}""")

        def start_topic():
            ev("()=>{document.getElementById('modeTopic').click();}"); page.wait_for_timeout(150)
            ev("()=>document.querySelector('#topicGrid .chapter').click()"); page.wait_for_timeout(250)

        def start_review():
            ev("()=>{const b=document.getElementById('reviewTodayBtn'); if(b.style.display!=='none') b.click(); else document.getElementById('reviewBtn').click();}")
            page.wait_for_timeout(250)

        LESSON = {
            "t1-001": {"ok": True}, "t1-002": {"ok": False}, "t1-003": {"ok": True},
            "t1-004": {"readText": "фермент не расходуется в реакции"},
            "t1-006": {"ok": False, "conf": "sure", "reason": "mixed"},
            "t1-011": {"ok": False, "conf": "unsure", "reason": "fact"},
            "t1-017": {"drawMiss": [2]},
            "default": {"ok": True, "recall": "белок ускоряет реакции в клетке"},
        }

        page.goto(URL); page.wait_for_timeout(300)
        ev("()=>localStorage.removeItem('__shift')"); page.reload(); page.wait_for_timeout(300)

        # ===== 1. Без игры: тот же сценарий — для сравнения учёбы =====
        login("Без игры")
        hub_off = ev("()=>({gameBtn:document.getElementById('gameBtn').textContent, gHub:document.getElementById('gHub').style.display})")
        start_topic(); off0 = ev(DRIVE, LESSON)
        res_off = ev("()=>({frac:document.getElementById('rFrac').textContent, rGame:document.getElementById('rGame').style.display, exp:document.getElementById('explainGame').innerHTML})")
        print("== без игры, занятие ==", hub_off, res_off, "строк игры:", sum(1 for x in off0 if x.get('line')))
        print("   ключ игры:", game_state("Без игры"))

        # ===== 2. С игрой: включение, занятие =====
        login("Игрок")
        shot("g01-hub-off")
        ev("()=>document.getElementById('gameBtn').click()"); page.wait_for_timeout(200); shot("g02-view-off")
        ev("()=>document.querySelector('#gameBody [data-g=on]').click()"); page.wait_for_timeout(200); shot("g03-view-on")
        ev("()=>document.getElementById('gameBack').click()"); page.wait_for_timeout(200); shot("g04-hub-on")
        print("== хаб после включения ==", ev("()=>document.getElementById('gHub').innerText"))
        start_topic(); shot("g05-lesson-pre")
        on0 = ev(DRIVE, dict(LESSON, stop="t1-006"))
        shot("g05b-lesson-q6", "#qExplain")
        on0 += ev(DRIVE, LESSON)
        for x in on0:
            if x.get('line') or x['id'] in ('t1-001', 't1-004', 't1-005', 't1-017', 't1-018'):
                print("  ", x['id'], 'повтор' if x.get('retry') else '', '|', x.get('line', ''), '|', x.get('strip', '')[:160])
        shot("g06-results", "#rGame")
        print("== итоги занятия (игра) ==", ev("()=>document.getElementById('rGame').innerText"))
        print("   объяснение:", ev("()=>document.getElementById('explainGame').innerText"))
        ev("()=>document.querySelector('#explainGame [data-x=partial]').click()"); page.wait_for_timeout(150)
        print("   после «частично»:", ev("()=>document.getElementById('explainGame').innerText"))
        print("   шапка итогов:", ev("()=>document.querySelector('#rGame .ghead').innerText"))
        ev("()=>{const b=document.querySelector('#rGame [data-fb=a]'); if(b){b.value='Опыт с картофелем'; document.querySelector('#rGame [data-fb=b]').value='Длинные вопросы'; document.querySelector('#rGame [data-fbsave]').click();}}")
        shot("g07-results-explained", "#explainGame")
        g = game_state("Игрок"); L = g['lessons']['t1']
        print("   такты:", {k: bool(v) for k, v in L['bars'].items()}, "ноты:", L['got'], "сумма:", sum(L['got'].values()), "улов:", L['caught'], L['prey'], "сюрприз:", bool(L['surprise']))

        # сравнение учёбы с игрой и без неё
        a, b = learn_state("Без игры"), learn_state("Игрок")
        print("== учёба одинакова с игрой и без ==", a['hist'] == b['hist'], a['srs'] == b['srs'], "| очередь:", b['srs'])

        # ===== 3. День 1: мелодия дня, повторение, заблуждение дня =====
        set_day(1, 2)
        shot("g08-day1-hub")
        print("== день 1, хаб ==", ev("()=>document.getElementById('gHub').innerText"))
        print("   день:", game_state("Игрок")['days'])
        start_review(); r1 = ev(DRIVE, {"default": {"ok": True, "recall": "митохондрия место дыхания клетки"}})
        for x in r1: print("  ", x['id'], '|', x.get('line', ''), '|', x.get('strip', '')[:120])
        print("   итоги:", ev("()=>document.getElementById('rGame').innerText"))
        shot("g09-day1-review-results", "#rGame")
        ev("()=>document.getElementById('homeBtn').click()"); page.wait_for_timeout(200)
        ev("()=>document.querySelector('#gHub [data-g=myth]').click()"); page.wait_for_timeout(200); shot("g10-myth")
        print("== заблуждение дня ==", ev("()=>document.getElementById('gameBody').innerText")[:300])
        ev("()=>{const t=document.getElementById('gmText'); t.value='Растения дышат всегда, днём тоже: энергия нужна каждой живой клетке, просто фотосинтез днём сильнее'; t.dispatchEvent(new Event('input',{bubbles:true})); document.getElementById('gmCheck').click();}")
        page.wait_for_timeout(150)
        ev("()=>document.querySelector('#gmRes [data-self=yes]').click()"); page.wait_for_timeout(150); shot("g11-myth-done", "#gmRes")
        print("   после сверки:", ev("()=>document.getElementById('gmRes').innerText"))
        print("   день:", game_state("Игрок")['days'], "кот:", game_state("Игрок")['cat']['fixed'].keys())

        # ===== 4. День 4: шаг очереди 1 → 2 =====
        set_day(4, 2)
        print("== день 4, хаб ==", ev("()=>document.getElementById('gHub').innerText"))
        start_review(); r4 = ev(DRIVE, {"default": {"ok": True, "recall": "энергия глюкозы переходит в АТФ"}})
        print("   ", [(x['id'], x.get('line', '')) for x in r4])
        ev("()=>document.getElementById('homeBtn').click()"); page.wait_for_timeout(200)

        # ===== 5. День 7: эхо через неделю =====
        set_day(7, 2)
        shot("g12-day7-hub")
        print("== день 7: эхо ==", ev("()=>({offer:document.getElementById('echoOffer').style.display, text:document.getElementById('echoText').innerText, go:document.getElementById('echoGo').textContent})"))
        print("   хаб:", ev("()=>document.getElementById('gHub').innerText"))
        ev("()=>document.getElementById('echoGo').click()"); page.wait_for_timeout(250); shot("g13-echo-recall")
        e7 = ev(DRIVE, {"default": {"ok": True, "recall": "ответ из памяти через неделю"}})
        for x in e7: print("  ", x['id'], x.get('recalled'), '|', x.get('explain'), '|', x.get('line', ''))
        print("   итоги эха:", ev("()=>({v:document.getElementById('rVerdict').textContent, retry:document.getElementById('retryBtn').style.display, g:document.getElementById('rGame').innerText})"))
        shot("g14-echo-results", "#rGame")
        ev("()=>document.getElementById('homeBtn').click()"); page.wait_for_timeout(200)
        print("   после эха — предложение:", ev("()=>document.getElementById('echoOffer').style.display"), "| эйдос w:", len(game_state("Игрок")['eidos']['w']))

        # ===== 6. День 11: шаг 2 → 3 — точки эйдоса =====
        set_day(11, 2)
        start_review(); r11 = ev(DRIVE, {"default": {"ok": True, "recall": "глюкоза окисляется в митохондрии"}})
        print("== день 11 ==", [(x['id'], x.get('line', '')) for x in r11])
        ev("()=>document.getElementById('homeBtn').click()"); page.wait_for_timeout(200)

        # ===== 7. Пакет из файла и экран «Свет и герои» =====
        ev("()=>{document.getElementById('gHub').querySelector('[data-g=view]').click();}"); page.wait_for_timeout(200)
        pack = PACK
        if not os.path.exists(pack):   # без private/ — свои герои в формате пакета под другим названием
            pack = os.path.join(SHOTS, "pack-test.json")
            json.dump(ev("()=>Object.assign({}, gameOwn, {title: 'Проверочный пакет'})"), open(pack, "w", encoding="utf-8"), ensure_ascii=False)
        page.set_input_files("#gsFile", pack); page.wait_for_timeout(300)
        shot("g15-view-pack")
        print("== свет и герои (пакет) ==", ev("()=>document.getElementById('gameBody').innerText")[:1400])

        # ===== 8. День 21: эхо через три недели, день 32: выход из очереди =====
        set_day(21, 2)
        print("== день 21: эхо ==", ev("()=>({offer:document.getElementById('echoOffer').style.display, text:document.getElementById('echoText').innerText})"))
        ev("()=>document.getElementById('echoGo').click()"); page.wait_for_timeout(250)
        e21 = ev(DRIVE, {"default": {"ok": True, "recall": "ответ из памяти через три недели"}})
        print("   ", [(x['id'], x.get('line', '')) for x in e21])
        ev("()=>document.getElementById('homeBtn').click()"); page.wait_for_timeout(200)
        set_day(32, 2)
        start_review(); r32 = ev(DRIVE, {"default": {"ok": True, "recall": "ответ продержался три недели"}})
        print("== день 32 ==", [(x['id'], x.get('line', '')) for x in r32])
        ev("()=>document.getElementById('homeBtn').click()"); page.wait_for_timeout(200)
        g = game_state("Игрок")
        print("   эйдос w/s:", len(g['eidos']['w']), len(g['eidos']['s']), "| кот:", len(g['cat']['fixed']), "| дней сыграно:", sum(1 for d in g['days'].values() if d['done']), "| журнал:", len(g['log']))
        ev("()=>document.getElementById('gameBtn').click() || document.querySelector('#gHub [data-g=view]').click()"); page.wait_for_timeout(200)
        shot("g16-view-day32", ".gcard")
        print("   для взрослого:", ev("()=>{const d=document.querySelector('.gadult'); if(d) d.open=true; return d?d.innerText:'';}")[:1500])

        # ===== 9. Резервная копия с игрой и восстановление в нового ученика =====
        ev("()=>document.getElementById('gameBack').click()"); page.wait_for_timeout(150)
        ev("()=>document.getElementById('dashBtn').click()"); page.wait_for_timeout(200)
        with page.expect_download() as dl:
            ev("()=>document.getElementById('backupBtn').click()")
        path = f"{SHOTS}/backup.json"; dl.value.save_as(path)
        bk = json.load(open(path))
        print("== копия ==", "game" in bk, "gamePack" in bk, len(bk.get('game', {}).get('log', [])))
        login("Копия")
        ev("()=>document.getElementById('dashBtn').click()"); page.wait_for_timeout(200)
        page.set_input_files("#restoreFile", path); page.wait_for_timeout(400)
        gc = game_state("Копия")
        print("   восстановлено:", gc and gc['on'], gc and len(gc['eidos']['w']), gc and len(gc['cat']['fixed']), gc and gc['pack'])

        print("ошибки страницы:", errors or "нет", "| ошибки консоли:", consoles or "нет")
        ev("()=>localStorage.removeItem('__shift')")
        browser.close()


main()
