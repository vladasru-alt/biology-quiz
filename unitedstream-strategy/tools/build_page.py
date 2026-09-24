#!/usr/bin/env python3
"""Собирает HTML-страницу стратегии United Stream из итоговых документов и data.json."""
import html
import json
import os
import re

import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "page", "index.html")
DATA = json.load(open(os.path.join(ROOT, "page", "data.json"), encoding="utf-8"))
GH = "https://github.com/vladasru-alt/biology-quiz/blob/claude/united-stream-marketing-strategy-v5cr5x/unitedstream-strategy/"


def e(s):
    return html.escape(str(s if s is not None else ""), quote=True)


STATUS = {"П": ("p", "подтверждено"), "ОИ": ("oi", "одиночный источник"), "О": ("o", "оценка"), "НП": ("np", "не проверено")}


def badges(h):
    """[П], [ОИ: …], [О], [НП] → бейджи статуса данных."""
    def rep(m):
        code, rest = m.group(1), (m.group(2) or "").strip()
        cls, name = STATUS[code]
        tip = name + (": " + re.sub(r"<[^>]+>", "", rest) if rest else "")
        return f'<span class="st st-{cls}" title="{e(tip)}">{code}</span>'
    return re.sub(r"\[(П|ОИ|О|НП)(?::\s*([^\]]*))?\]", rep, h)


def t(s):
    """Короткий текст из data.json: экранирование + бейджи + **жирный**."""
    h = e(s)
    h = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", h)
    h = re.sub(r"`([^`]+)`", r"<code>\1</code>", h)
    return badges(h)


def ul(items, cls=""):
    return f'<ul class="{cls}">' + "".join(f"<li>{t(i)}</li>" for i in items) + "</ul>"


def table(headers, rows, cls="", first_strong=False):
    th = "".join(f"<th>{e(h)}</th>" for h in headers)
    body = ""
    for r in rows:
        cells = []
        for i, c in enumerate(r):
            v = c if isinstance(c, str) and c.startswith("<") else t(c)
            cells.append(f"<th scope=\"row\">{v}</th>" if (first_strong and i == 0) else f"<td>{v}</td>")
        body += "<tr>" + "".join(cells) + "</tr>"
    return f'<div class="tbl {cls}"><table><thead><tr>{th}</tr></thead><tbody>{body}</tbody></table></div>'


# ---------- полные документы ----------
def render_doc(path, prefix):
    src = open(path, encoding="utf-8").read()
    # ссылки на файлы репозитория → GitHub
    def fix_link(m):
        text, href = m.group(1), m.group(2)
        if href.startswith(("http", "#", "mailto:")):
            return m.group(0)
        clean = href.replace("../", "")
        if not clean.startswith(("research/", "work/", "tools/", "page/")) and "/" not in clean:
            clean = ("research/" if os.path.exists(os.path.join(ROOT, "research", clean)) else "") + clean
        return f"[{text}]({GH}{clean})"
    src = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", fix_link, src)
    h = markdown.markdown(src, extensions=["tables", "sane_lists", "fenced_code"])
    # заголовки: ASCII-id и оглавление
    toc, n2, n3 = [], 0, 0
    def head(m):
        nonlocal n2, n3
        lvl, inner = int(m.group(1)), m.group(2)
        if lvl == 1:
            return f"<h1 class=\"doc-title\">{inner}</h1>"
        if lvl == 2:
            n2 += 1; n3 = 0; hid = f"{prefix}-{n2}"
        elif lvl == 3:
            n3 += 1; hid = f"{prefix}-{n2}-{n3}"
        else:
            return m.group(0)
        toc.append((lvl, hid, re.sub(r"<[^>]+>", "", inner)))
        return f'<h{lvl} id="{hid}">{inner}</h{lvl}>'
    h = re.sub(r"<h([1-4])>(.*?)</h\1>", head, h, flags=re.S)
    h = h.replace("<table>", '<div class="tbl"><table>').replace("</table>", "</table></div>")
    h = badges(h)
    h = h.replace("<a href=\"http", "<a target=\"_blank\" rel=\"noopener\" href=\"http")
    nav = ""
    for lvl, hid, text in toc:
        nav += f'<li class="l{lvl}"><a href="#{hid}">{e(text)}</a></li>'
    return h, f'<ol class="doc-toc">{nav}</ol>'


strategy_html, strategy_toc = render_doc(os.path.join(ROOT, "strategy.md"), "st")
comp_html, comp_toc = render_doc(os.path.join(ROOT, "competitive-analysis.md"), "ca")

C, S, M = DATA["competitive"], DATA["strategy"], DATA["money"]

# ---------- график: позиционная карта ----------
GROUP_COLOR = {"us": "var(--s1)", "a7": "var(--s2)", "bank": "var(--s3)", "other": "var(--others)"}
LABEL_POS = {  # dx, dy, anchor
    "Сбер": (14, -8, "start"), "ВТБ": (12, 14, "start"), "Т-Банк": (-16, 5, "end"), "Точка": (14, 5, "start"),
    "А7": (16, 5, "start"), "ВЭД-Мастер": (12, 4, "start"), "Своя компания": (10, 4, "start"), "GPO": (11, 4, "start"),
    "КВТ": (0, 22, "middle"), "Raketa Pay": (11, 0, "start"), "Dalistra": (13, 8, "start"), "Платежка": (11, 4, "start"),
    "neoved": (-12, 5, "end"), "Карго": (14, 5, "start"), "USDT": (11, 4, "start"),
    "United Stream — сейчас": (12, 18, "start"), "United Stream — цель": (0, -16, "middle"),
}


def short(name):
    n = name.replace("**", "")
    for k in ["United Stream — сейчас", "United Stream — цель", "Т-Банк", "Точка", "Сбер", "ВТБ", "Платежка", "ВЭД-Мастер",
              "Dalistra", "neoved", "Raketa Pay", "GPO", "MoneyPort", "КВТ", "Карго", "USDT", "Своя компания", "А7"]:
        if k in n:
            return k
    return n


def group_of(p):
    g, n = p["group"].lower(), p["name"]
    if "united stream" in n.lower() or "объект" in g:
        return "us"
    if g.startswith("а7") or n.startswith("А7"):
        return "a7"
    if "банк" in g:
        return "bank"
    return "other"


def positioning_svg(points):
    X0, X1, Y0, Y1 = 56, 616, 20, 392
    sx = lambda v: X0 + v * (X1 - X0) / 10
    sy = lambda v: Y1 - v * (Y1 - Y0) / 10
    g = []
    g.append(f'<rect class="quad" x="{sx(7):.1f}" y="{Y0}" width="{X1 - sx(7):.1f}" height="{sy(7) - Y0:.1f}"/>')
    g.append(f'<text class="quad-label" x="{sx(7) + 8:.1f}" y="{Y0 + 16}">Пустой квадрант:</text>')
    g.append(f'<text class="quad-label" x="{sx(7) + 8:.1f}" y="{Y0 + 31}">доступ + доверие</text>')
    for v in [0, 2.5, 5, 7.5, 10]:
        g.append(f'<line class="grid" x1="{X0}" x2="{X1}" y1="{sy(v):.1f}" y2="{sy(v):.1f}"/>')
        g.append(f'<line class="grid" y1="{Y0}" y2="{Y1}" x1="{sx(v):.1f}" x2="{sx(v):.1f}"/>')
        lab = str(v).replace(".", ",").replace(",0", "")
        g.append(f'<text class="tick" x="{X0 - 8}" y="{sy(v) + 4:.1f}" text-anchor="end">{lab}</text>')
        g.append(f'<text class="tick" x="{sx(v):.1f}" y="{Y1 + 18}" text-anchor="middle">{lab}</text>')
    g.append(f'<line class="axis" x1="{X0}" x2="{X1}" y1="{Y1}" y2="{Y1}"/><line class="axis" x1="{X0}" x2="{X0}" y1="{Y0}" y2="{Y1}"/>')
    g.append(f'<text class="axis-title" x="{(X0 + X1) / 2}" y="{Y1 + 40}" text-anchor="middle">Доступ к получателю вне Китая →</text>')
    g.append(f'<text class="axis-title" transform="translate(16 {(Y0 + Y1) / 2}) rotate(-90)" text-anchor="middle">Проверяемое доверие →</text>')
    now = next((p for p in points if "сейчас" in p["name"]), None)
    tgt = next((p for p in points if "цель" in p["name"].lower()), None)
    if now and tgt:
        g.append(f'<line class="path" x1="{sx(now["x"]):.1f}" y1="{sy(now["y"]):.1f}" x2="{sx(tgt["x"]):.1f}" y2="{sy(tgt["y"]) + 12:.1f}" marker-end="url(#arr)"/>')
    seen = {}
    labels = []
    for p in sorted(points, key=lambda p: -p.get("size", 1)):
        key = (p["x"], p["y"])
        grp = group_of(p)
        r = 4.5 + p.get("size", 1) * 1.5
        cx, cy = sx(p["x"]), sy(p["y"])
        nm = p["name"].replace("**", "")
        tip = f'{nm}: доступ {str(p["x"]).replace(".", ",")}, доверие {str(p["y"]).replace(".", ",")}'
        if "цель" in nm.lower():
            g.append(f'<circle class="pt target" cx="{cx:.1f}" cy="{cy:.1f}" r="9" data-tip="{e(tip)}"/>')
        else:
            g.append(f'<circle class="pt" cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" style="fill:{GROUP_COLOR[grp]}" data-tip="{e(tip)}"/>')
        s = short(nm)
        if key in seen:
            seen[key].append(s)
            continue
        seen[key] = [s]
        labels.append((key, cx, cy, s, grp))
    for key, cx, cy, s, grp in labels:
        names = seen[key]
        text = " · ".join(names)
        if s == "КВТ":
            text = "КВТ-Эксперт, логисты"
        if s == "Своя компания":
            text = "Своя компания за рубежом"
        if s == "USDT":
            text = "USDT-агенты"
        if s.startswith("United Stream"):
            text = "United Stream сейчас" if "сейчас" in s else "Цель на 31.03.2027"
        dx, dy, anc = LABEL_POS.get(s, (11, 4, "start"))
        cls = "lbl strong" if grp in ("us", "a7") else "lbl"
        labels_svg = f'<text class="{cls}" x="{cx + dx:.1f}" y="{cy + dy:.1f}" text-anchor="{anc}">{e(text)}</text>'
        g.append(labels_svg)
    defs = '<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="arrow"/></marker></defs>'
    return f'<svg class="chart map" viewBox="0 0 640 440" role="img" aria-label="Позиционная карта: доступ к получателю вне Китая и проверяемое доверие">{defs}{"".join(g)}</svg>'


# ---------- график: бюджеты по каналам ----------
SERIES = [
    ("Директ: поиск и РСЯ", [137, 137, 230, 295]),
    ("Директ: бренд и набор партнёров", [14, 14, 19, 24]),
    ("Яндекс Бизнес и Карты", [10, 10, 10, 30]),
    ("Медиа и PR", [0, 30, 68, 138]),
    ("Мероприятия", [0, 40, 40, 110]),
    ("MAX", [0, 0, 25, 60]),
    ("Партнёрская программа", [15, 40, 40, 100]),
    ("Сервисы аналитики", [12, 12, 15, 30]),
]
SCEN = ["Минимальный", "Промежуточный", "Базовый (ветка)", "Агрессивный"]


def budget_svg():
    L, R, top, bh, gap = 150, 660, 14, 34, 22
    mx = 800
    sx = lambda v: L + v * (R - L) / mx
    g = []
    for v in range(0, 801, 200):
        g.append(f'<line class="grid" x1="{sx(v):.1f}" x2="{sx(v):.1f}" y1="{top - 6}" y2="{top + 4 * (bh + gap) - gap + 6}"/>')
        g.append(f'<text class="tick" x="{sx(v):.1f}" y="{top + 4 * (bh + gap) - gap + 24}" text-anchor="middle">{v}</text>')
    for i, sc in enumerate(SCEN):
        y = top + i * (bh + gap)
        g.append(f'<text class="cat" x="{L - 12}" y="{y + bh / 2 + 5}" text-anchor="end">{sc}</text>')
        x = 0
        total = sum(s[1][i] for s in SERIES)
        for k, (name, vals) in enumerate(SERIES):
            v = vals[i]
            if not v:
                continue
            x0, x1 = sx(x), sx(x + v)
            w = max(x1 - x0 - 2, 1)
            g.append(f'<rect class="seg" x="{x0:.1f}" y="{y}" width="{w:.1f}" height="{bh}" rx="3" style="fill:var(--s{k + 1})" data-tip="{e(sc)} · {e(name)}: {v} тыс. ₽"/>')
            x += v
        g.append(f'<text class="total" x="{sx(total) + 8:.1f}" y="{y + bh / 2 + 5}">{total} тыс. ₽</text>')
    h = top + 4 * (bh + gap) - gap + 34
    return f'<svg class="chart bars" viewBox="0 0 740 {h}" role="img" aria-label="Бюджет каналов по сценариям, тыс. ₽ в месяц">{"".join(g)}</svg>'


def legend():
    return '<ul class="legend">' + "".join(
        f'<li><span class="sw" style="background:var(--s{k + 1})"></span>{e(n)}</li>' for k, (n, _) in enumerate(SERIES)) + "</ul>"


def budget_table():
    rows = [[n] + [str(v) if v else "—" for v in vals] for n, vals in SERIES]
    rows.append(["<strong>Итого</strong>"] + [f"<strong>{sum(s[1][i] for s in SERIES)}</strong>" for i in range(4)])
    return table(["Канал, тыс. ₽ в месяц"] + SCEN, rows, cls="num")


# ---------- секции сводки ----------
def sec(id_, eyebrow, title, body, lead=""):
    lead_h = f'<p class="lead">{t(lead)}</p>' if lead else ""
    return f'<section id="{id_}" class="sec"><header class="sec-head"><p class="eyebrow">{e(eyebrow)}</p><h2>{e(title)}</h2>{lead_h}</header>{body}</section>'


def facts():
    return '<div class="facts">' + "".join(
        f'<div class="fact"><div class="fact-v">{e(f["value"])}</div><div class="fact-l">{t(f["label"])}</div><div class="fact-n">{t(f["note"])}</div></div>'
        for f in C["key_facts"]) + "</div>"


def stages():
    return '<ol class="stages">' + "".join(
        f'<li class="stage"><div class="stage-top"><span class="stage-n">{i + 1}</span><span class="stage-period">{t(s["period"])}</span></div>'
        f'<h3>{t(s["name"])}</h3><p>{t(s["goal"])}</p><p class="gate"><span>Условие перехода</span>{t(s["gate"])}</p></li>'
        for i, s in enumerate(S["stages"])) + "</ol>"


def decisions():
    return '<ol class="decisions">' + "".join(
        f'<li><h3>{t(d["title"])}</h3><p>{t(d["detail"])}</p></li>' for d in S["decisions"]) + "</ol>"


def a7_block():
    a = C["a7"]
    arg = "".join(f'<li><strong>{t(x["point"])}</strong><span class="proof">{t(x["proof"])}</span></li>' for x in a["argue"])
    obj = "".join(f'<details class="qa"><summary>{t(x["q"])}</summary><p>{t(x["a"])}</p></details>' for x in a["objections"])
    return (f'<p class="lead">{t(a["summary"])}</p><div class="two">'
            f'<div class="panel"><h3>Где не спорим</h3>{ul(a["dont_argue"])}</div>'
            f'<div class="panel"><h3>Где выигрываем и чем доказываем</h3><ul class="args">{arg}</ul></div></div>'
            f'<h3 class="sub">Возражения и ответы</h3><div class="qas">{obj}</div>'
            f'<div class="panel warn"><h3>Чего не говорим об А7</h3>{ul(a["never_say"])}</div>')


def battlecards():
    return '<div class="cards">' + "".join(
        f'<article class="card"><p class="eyebrow">против</p><h3>{t(b["vs"])}</h3><p class="stance">{t(b["stance"])}</p>{ul(b["points"])}</article>'
        for b in C["battlecards"]) + "</div>"


def swot():
    q = C["swot"]
    names = [("strengths", "Сильные стороны"), ("weaknesses", "Слабые стороны"), ("opportunities", "Возможности"), ("threats", "Угрозы")]
    return '<div class="swot">' + "".join(f'<div class="sw-q sw-{k}"><h3>{n}</h3>{ul(q[k])}</div>' for k, n in names) + "</div>"


def segments():
    rows = []
    for s in C["segments"]:
        pr = s["priority"].lower()
        cls = "pill good" if pr.startswith("приор") else ("pill muted" if "не" in pr else "pill")
        rows.append([f'<strong>{e(s["code"])}</strong>', t(s["name"]), f'<span class="{cls}">{e(s["priority"])}</span>', t(s["score"]), t(s["why"])])
    return table(["Код", "Сегмент", "Статус", "Балл", "Почему"], rows)


def pillars():
    return '<div class="cards four">' + "".join(
        f'<article class="card"><h3>{t(p["title"])}</h3><p>{t(p["proof"])}</p></article>' for p in C["pillars"]) + "</div>"


def standard7():
    return '<ol class="std7">' + "".join(
        f'<li><strong>{t(x["item"])}</strong><span>{t(x["publish_condition"])}</span></li>' for x in S["standard7"]) + "</ol>"


def site_plan():
    cols = [("p0", "P0 · первые 2 недели"), ("p1", "P1 · до конца октября"), ("p2", "P2 · декабрь — I квартал")]
    out = '<div class="cols3">'
    for k, n in cols:
        out += f'<div class="panel"><h3>{n}</h3><ul class="tasks">' + "".join(
            f'<li><span>{t(x["task"])}</span><time>{t(x["due"])}</time></li>' for x in S["site"][k]) + "</ul></div>"
    return out + "</div>"


def copy_chips(items, label):
    return f'<div class="copy"><h3>{e(label)}</h3><ul>' + "".join(f"<li>{t(x)}</li>" for x in items) + "</ul></div>"


def content_plan():
    return '<div class="cols3">' + "".join(
        f'<div class="panel"><h3>{t(m["month"])}</h3>{ul(m["topics"])}<p class="small">{t(m["formats"])}</p></div>' for m in S["content_plan"]) + "</div>"


def plan90():
    return '<ol class="timeline">' + "".join(
        f'<li><div class="tl-when"><strong>{t(p["weeks"])}</strong><span>{t(p["dates"])}</span></div><div class="tl-what"><h3>{t(p["focus"])}</h3>{ul(p["deliverables"])}</div></li>'
        for p in M["plan90"]) + "</ol>"


def roadmap():
    return '<div class="cards four">' + "".join(
        f'<article class="card"><p class="eyebrow">{t(r["period"])}</p><h3>{t(r["focus"])}</h3>{ul(r["milestones"])}</article>' for r in M["roadmap"]) + "</div>"


def risk_rows():
    rows = []
    for r in M["risks"]:
        lv = r["level"].lower()
        cls = "crit" if "крит" in lv or "высок" in lv else ("warn" if "сред" in lv else "ok")
        rows.append([t(r["risk"]), f'<span class="pill {cls}">{e(r["level"])}</span>', t(r["mitigation"])])
    return table(["Риск", "Уровень", "Что делаем"], rows)


pos_rows = [[t(p["name"]), t(p["group"]), str(p["x"]).replace(".", ","), str(p["y"]).replace(".", ","), str(p.get("size", ""))] for p in C["positioning_points"]]
ax = C["positioning_axes"]

summary = "".join([
    sec("summary-top", "Резюме", "Продаём проверку, а не процент", f'<p class="thesis">{t(S["thesis"])}</p>{facts()}'
        f'<h3 class="sub">Ситуация</h3>{ul(C["situation"], "cols")}'
        f'<h3 class="sub">Четыре этапа и условия перехода</h3>{stages()}'
        f'<h3 class="sub">Шесть решений, с которых начинается работа</h3>{decisions()}'),
    sec("competitors", "Конкурентный анализ", "Кто забирает клиента и где он уязвим",
        table(["Группа", "Доля внимания клиента", "Роль", "Игроки"], [[g["name"], g["attention_share"], g["role"], g["players"]] for g in C["groups"]], first_strong=True)
        + '<h3 class="sub">Ключевые игроки</h3>'
        + table(["Игрок", "Группа", "Цена", "Скорость", "География", "Доверие", "Слабое место"],
                [[c["name"], c["group"], c["price"], c["speed"], c["geography"], c["trust"], c["weakness"]] for c in C["competitors"]], cls="wide", first_strong=True)
        + f'<h3 class="sub">Позиционная карта</h3><figure class="fig"><div class="map-wrap">{positioning_svg(C["positioning_points"])}</div>'
        f'<figcaption><span class="key"><i style="background:var(--s1)"></i>United Stream</span><span class="key"><i style="background:var(--s2)"></i>А7</span>'
        f'<span class="key"><i style="background:var(--s3)"></i>Банки</span><span class="key"><i style="background:var(--others)"></i>Другие агенты и альтернативы</span>'
        f'<span class="key">Размер точки — масштаб игрока</span></figcaption></figure>'
        f'<p class="note"><strong>Оси.</strong> X — {t(ax["x"])} Y — {t(ax["y"])}</p><p class="callout">{t(ax["takeaway"])}</p>'
        f'<details class="data"><summary>Данные карты</summary>{table(["Игрок", "Группа", "X", "Y", "Масштаб"], pos_rows, cls="num")}</details>'),
    sec("a7", "Главный конкурент", "А7: с чем не спорить и где выигрывать", a7_block()),
    sec("battlecards", "Battlecards", "Как отвечать клиенту, который сравнивает", battlecards() + '<h3 class="sub">SWOT United Stream</h3>' + swot()
        + '<div class="two"><div class="panel"><h3>Белые пятна позиционирования</h3>' + ul(C["white_spaces"]) + '</div><div class="panel"><h3>Выводы</h3>' + ul(C["conclusions"]) + "</div></div>"),
    sec("positioning", "Клиенты и позиционирование", "Кому и что обещаем", segments()
        + f'<blockquote class="statement"><p>{t(C["positioning_statement"])}</p></blockquote>'
        + f'<p class="promise"><span>Главное обещание</span>{t(C["promise"])}</p>' + pillars()
        + f'<h3 class="sub">Стандарт проверяемого платежа</h3><p class="note">Каждый пункт появляется на сайте с публичным статусом и датой проверки, только когда выполнено условие.</p>{standard7()}'
        + '<h3 class="sub">Барьеры доверия</h3>' + table(["Барьер", "Что меняем"], [[b["barrier"], b["fix"]] for b in C["trust_barriers"]], first_strong=True)
        + '<div class="two">' + copy_chips(C["headlines"], "Заголовки для главной") + copy_chips(C["direct_ads"], "Заголовки для Директа") + "</div>"),
    sec("site", "Сайт и конверсия", "Сначала чистим сайт, потом покупаем трафик", site_plan()),
    sec("channels", "Каналы", "Бесплатные и платные каналы",
        '<h3 class="sub">Бесплатные и условно-бесплатные</h3>' + table(["Канал", "Что делаем", "KPI", "Трудозатраты"], [[c["channel"], c["actions"], c["kpi"], c["effort"]] for c in S["free_channels"]], cls="wide", first_strong=True)
        + '<h3 class="sub">Платные</h3>' + table(["Канал", "Роль", "Бюджет", "KPI", "Стоп-правило"], [[c["channel"], c["role"], c["budget"], c["kpi"], c["stop_rule"]] for c in S["paid_channels"]], cls="wide", first_strong=True)
        + '<h3 class="sub">Структура Яндекс Директа</h3>' + table(["Кампания", "Бюджет", "Лимит цены клика", "Комментарий"], [[d["campaign"], d["budget"], d["cpc_limit"], d["note"]] for d in S["direct_structure"]], first_strong=True)
        + f'<h3 class="sub">Партнёрская программа</h3><div class="two"><div class="panel"><p>{t(S["partners"]["model"])}</p><p><strong>Вознаграждение.</strong> {t(S["partners"]["reward"])}</p><p><strong>KPI.</strong> {t(S["partners"]["kpi"])}</p></div><div class="panel"><h3>С кем</h3>{ul(S["partners"]["targets"])}</div></div>'
        + '<h3 class="sub">Контент-план на три месяца</h3>' + content_plan()),
    sec("budget", "Бюджет", "Три сценария плюс промежуточный",
        f'<div class="panel econ"><h3>Экономика клиента</h3><p>{t(M["unit_economics"]["assumptions"])}</p>'
        f'<dl class="kv"><div><dt>Выручка на клиента</dt><dd>{t(M["unit_economics"]["revenue_per_client"])}</dd></div><div><dt>Вклад на клиента</dt><dd>{t(M["unit_economics"]["contribution_per_client"])}</dd></div>'
        f'<div><dt>LTV</dt><dd>{t(M["unit_economics"]["ltv"])}</dd></div><div><dt>Допустимый CAC</dt><dd>{t(M["unit_economics"]["allowable_cac"])}</dd></div></dl><p class="small">{t(M["unit_economics"]["caveat"])}</p></div>'
        + table(["Показатель"] + [s["name"] for s in M["scenarios"]], [
            ["Бюджет каналов в месяц"] + [s["channels_budget"] for s in M["scenarios"]],
            ["Подрядчики маркетинга"] + [s["contractors"] for s in M["scenarios"]],
            ["Новые ставки"] + [s["new_roles"] for s in M["scenarios"]],
            ["Полная стоимость в месяц без НДС"] + [s["full_cost"] for s in M["scenarios"]],
            ["То же с НДС на рекламу"] + [s["full_cost_vat"] for s in M["scenarios"]],
            ["Нужный вклад текущей базы"] + [s["needed_base_contribution"] for s in M["scenarios"]],
            ["Доля вклада при базовой экономике"] + [s["share_of_contribution"] for s in M["scenarios"]],
            ["Разовые вложения"] + [s["one_off"] for s in M["scenarios"]],
            ["Лиды в месяц"] + [s["leads"] for s in M["scenarios"]],
            ["Новые клиенты в месяц"] + [s["clients"] for s in M["scenarios"]],
            ["CAC: по бюджету каналов / полный"] + [s["cac"] for s in M["scenarios"]],
            ["LTV/CAC"] + [s["ltv_cac"] for s in M["scenarios"]],
            ["Когда открывается"] + [s["when"] for s in M["scenarios"]],
        ], cls="wide scen", first_strong=True)
        + f'<h3 class="sub">Куда идут деньги каналов</h3><figure class="fig">{legend()}<div class="bars-wrap">{budget_svg()}</div><figcaption>Установившийся месяц 2027 года, тыс. ₽ без НДС. Выплаты партнёрам идут из выручки. SEO и контент оплачиваются подрядчикам и в бюджет каналов не входят.</figcaption></figure>'
        + f'<details class="data"><summary>Таблица бюджета по каналам</summary>{budget_table()}</details>'
        + '<h3 class="sub">Ожидаемый результат за 12 месяцев</h3>' + table(["Показатель", "План по умолчанию: минимальный весь год", "Подтверждённая экономика: базовый с 11.01.2027"], [[r["metric"], r["default_path"], r["confirmed_path"]] for r in M["results"]], first_strong=True)
        + f'<p class="callout">{t(M["decision_note"])}</p>'
        + '<h3 class="sub">Ворота между сценариями</h3>' + table(["Переход", "Условие"], [[g["transition"], g["condition"]] for g in M["gates"]], first_strong=True)),
    sec("plan", "План", "90 дней и 12 месяцев", plan90() + '<h3 class="sub">Дорожная карта</h3>' + roadmap()
        + '<div class="two"><div class="panel"><h3>Команда</h3>' + table(["Роль", "Загрузка", "Кто"], [[x["role"], x["load"], x["who"]] for x in M["team"]]) + '</div><div class="panel"><h3>Аналитика: что настроить</h3>' + ul(M["analytics"]) + "</div></div>"),
    sec("risks", "Риски и комплаенс", "Что может сломать план", risk_rows()
        + '<div class="two"><div class="panel warn"><h3>Чего United Stream не говорит</h3>' + ul(S["never_say"]) + '</div><div class="panel"><h3>Правила разговора об А7</h3>' + ul(S["a7_rules"]) + "</div></div>"
        + '<h3 class="sub">Бэклог экспериментов</h3>' + table(["Гипотеза", "ICE"], [[x["hypothesis"], x["ice"]] for x in M["experiments"]], cls="num-last")
        + '<h3 class="sub">Что выяснить первым</h3>' + table(["Вопрос", "Кто", "Срок"], [[x["question"], x["owner"], x["due"]] for x in M["unknowns"]])),
])

SOURCES = [
    ("united_stream.md", "United Stream: первичное досье"), ("verification_us_a7.md", "Фактчекинг досье United Stream и А7"),
    ("site_audit.md", "Аудит сайта unitedstream.ru по 58 страницам"), ("a7.md", "А7: досье"), ("a7_site.md", "А7: разбор сайтов и тарифов"),
    ("agents_general.md", "Рынок платёжных агентов"), ("agents_china_alt.md", "Китай, карго, крипто"), ("banks.md", "Банки как конкуренты"),
    ("market_regulation.md", "Рынок, сегменты, регулирование"), ("voice_of_customer.md", "Голос клиента"),
    ("us_yandex_maps_reviews_raw.md", "45 отзывов с Яндекс Карт"), ("seo_serp.md", "Выдача Яндекса и SEO"), ("geo_audit.md", "GEO-аудит: 18 ответов Алисы AI"),
    ("paid_partners.md", "Платные каналы, медиа, мероприятия, партнёрства"),
]
method = sec("method", "Методика", "Откуда данные и чего в них нет",
    '<div class="two"><div class="panel"><h3>Как собрано</h3><ul>'
    '<li>14 исследовательских досье: сайты конкурентов и тарифные PDF прочитаны напрямую, реестры ФНС и санкционные списки ЕС, Великобритании и США проверены по первоисточникам.</li>'
    '<li>Аудит сайта unitedstream.ru: 58 страниц, Lighthouse, проверка антибота KillBot.</li>'
    '<li>Выдача Яндекса снята вживую по 14 запросам, нейропоиск — 18 ответов Алисы AI.</li>'
    '<li>Три независимых черновика стратегии, оценка тремя судьями (CMO, финдиректор, юрист), синтез, два критика (57 замечаний), финальная правка.</li></ul></div>'
    '<div class="panel warn"><h3>Ограничения</h3><ul>'
    '<li>Частотности Wordstat не собраны: API недоступен из среды. Фразы и скрипт сбора лежат в репозитории.</li>'
    '<li>Perplexity недоступен: прокси организации закрывает perplexity.ai.</li>'
    '<li>Экономика клиента — оценка. Все решения о бюджете выше минимального ждут выгрузки финотдела.</li>'
    '<li>Выдача — один снимок от 24.09.2026, до решений перепроверить в Топвизоре.</li></ul></div></div>'
    '<h3 class="sub">Досье</h3><ul class="src">' + "".join(f'<li><a href="{GH}research/{f}" target="_blank" rel="noopener">{e(n)}</a></li>' for f, n in SOURCES) + "</ul>"
    '<p class="small">Статусы данных: <span class="st st-p">П</span> подтверждено первоисточником, <span class="st st-oi">ОИ</span> одиночный источник, <span class="st st-o">О</span> оценка, <span class="st st-np">НП</span> не проверено.</p>')

SUBNAV = [("summary-top", "Резюме"), ("competitors", "Конкуренты"), ("a7", "А7"), ("battlecards", "Battlecards"), ("positioning", "Позиционирование"),
          ("site", "Сайт"), ("channels", "Каналы"), ("budget", "Бюджет"), ("plan", "План"), ("risks", "Риски"), ("method", "Методика")]

CSS = open(os.path.join(HERE, "page.css"), encoding="utf-8").read()
JS = open(os.path.join(HERE, "page.js"), encoding="utf-8").read()

page = f"""<title>Стратегия United Stream</title>
<meta name="description" content="Конкурентный анализ и стратегия продвижения unitedstream.ru: банки, платёжные агенты, А7; платные и бесплатные каналы; три сценария бюджета.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>{CSS}</style>
<div class="page">
<header class="top">
  <div class="wrap">
    <p class="eyebrow">Конкурентный анализ и стратегия продвижения</p>
    <h1>United Stream: международные платежи для бизнеса</h1>
    <dl class="slip">
      <div><dt>Объект</dt><dd>unitedstream.ru · ООО «ЮНАЙТЕД СТРИМ», ИНН 9701326060</dd></div>
      <div><dt>Срез</dt><dd>24.09.2026</dd></div>
      <div><dt>Горизонт</dt><dd>до 30.09.2027</dd></div>
      <div><dt>Конкуренты</dt><dd>А7, банки, 13 платёжных агентов, карго, крипто</dd></div>
      <div><dt>Для кого</dt><dd>директор по маркетингу, собственник, продажи, финотдел</dd></div>
    </dl>
  </div>
</header>
<nav class="tabs" role="tablist" aria-label="Разделы">
  <div class="wrap tabs-row">
    <button role="tab" id="tab-summary" aria-controls="summary" aria-selected="true">Сводка</button>
    <button role="tab" id="tab-strategy" aria-controls="strategy" aria-selected="false">Стратегия: полный текст</button>
    <button role="tab" id="tab-competitive" aria-controls="competitive" aria-selected="false">Конкурентный анализ: полный текст</button>
  </div>
</nav>
<main>
  <div id="summary" role="tabpanel" aria-labelledby="tab-summary" class="panel-tab">
    <nav class="subnav wrap" aria-label="Разделы сводки">{"".join(f'<a href="#{i}">{e(n)}</a>' for i, n in SUBNAV)}</nav>
    <div class="wrap">{summary}{method}</div>
  </div>
  <div id="strategy" role="tabpanel" aria-labelledby="tab-strategy" class="panel-tab" hidden>
    <div class="wrap doc-grid"><aside class="doc-side"><details open class="toc-box"><summary>Оглавление</summary>{strategy_toc}</details></aside><article class="doc">{strategy_html}</article></div>
  </div>
  <div id="competitive" role="tabpanel" aria-labelledby="tab-competitive" class="panel-tab" hidden>
    <div class="wrap doc-grid"><aside class="doc-side"><details open class="toc-box"><summary>Оглавление</summary>{comp_toc}</details></aside><article class="doc">{comp_html}</article></div>
  </div>
</main>
<footer class="foot"><div class="wrap"><p>Исходники, досье и модель расчёта — в ветке <a href="https://github.com/vladasru-alt/biology-quiz/tree/claude/united-stream-marketing-strategy-v5cr5x/unitedstream-strategy" target="_blank" rel="noopener">claude/united-stream-marketing-strategy-v5cr5x</a>.</p></div></footer>
<div class="tip" id="tip" hidden></div>
</div>
<script>{JS}</script>
"""
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(page)
print(OUT, len(page.encode("utf-8")) // 1024, "KB")
