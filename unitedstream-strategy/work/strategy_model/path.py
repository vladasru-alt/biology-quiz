from model import *

# --- параметры разгона ---
SEARCH_LEAD_RAMP = [0.4, 0.7, 1.0]   # доля лидов от установившегося уровня: 1-й, 2-й, 3-й+ месяц
SEARCH_SPEND_RAMP = [0.6, 0.85, 1.0] # доля бюджета, которую кампании реально тратят (потолки CPC, сбор данных)
MEDIA_LEAD_RAMP = [0.2, 0.5, 0.8, 1.0]
SEARCHLIKE = set(SEARCH.keys())
MEDIA = {"klerk","rbc","max","tg","pr","events","yabiz"}

def rampv(r, age):
    return r[min(age, len(r)-1)]

def aggr_params(ch):
    return ch == "rsya"

def month_budgets(path):
    """path: список из 12 словарей бюджетов"""
    return path

def simulate(path, free_targets, trust=None, pess=None, opt=None, events_cpl=None, klerk_cpl=None, aggr_rsya_from=None, react=0, react_from=2):
    """Возвращает помесячно: spend, leads, clients, partner_clients"""
    # tranches: для каждого канала — список (месяц старта, прирост бюджета)
    tranches = {}
    prev = {}
    for t, b in enumerate(path):
        for ch in set(list(b.keys()) + list(prev.keys())):
            nb = b.get(ch, 0); pb = prev.get(ch, 0)
            if nb > pb:
                tranches.setdefault(ch, []).append([t, nb - pb])
            elif nb < pb:
                # уменьшение — срезаем последние транши
                cut = pb - nb
                lst = tranches.get(ch, [])
                while cut > 1e-9 and lst:
                    if lst[-1][1] <= cut:
                        cut -= lst[-1][1]; lst.pop()
                    else:
                        lst[-1][1] -= cut; cut = 0
        prev = dict(b)
    res = []
    # восстанавливаем транши по месяцам заново (простая версия: пересчёт по истории)
    history = {}
    prev = {}
    active = {}
    for t, b in enumerate(path):
        for ch in set(list(b.keys()) + list(prev.keys())):
            nb = b.get(ch, 0); pb = prev.get(ch, 0)
            lst = active.setdefault(ch, [])
            if nb > pb:
                lst.append([t, nb - pb])
            elif nb < pb:
                cut = pb - nb
                while cut > 1e-9 and lst:
                    if lst[-1][1] <= cut:
                        cut -= lst[-1][1]; lst.pop()
                    else:
                        lst[-1][1] -= cut; cut = 0
        prev = dict(b)
        s = SEAS[t]
        spend = 0; leads = 0; clients = 0; pclients = 0
        for ch, lst in active.items():
            for (t0, amt) in lst:
                age = t - t0
                if ch in NOLEAD:
                    spend += amt; continue
                if ch in SEARCHLIKE:
                    cpc, cr, cv = SEARCH[ch]
                    if ch == "rsya" and aggr_rsya_from is not None and t >= aggr_rsya_from:
                        cpc, cr, cv = 40, 0.006, 0.08
                    sp = amt * rampv(SEARCH_SPEND_RAMP, age) * s
                    l_ss = amt * 1000 / cpc * cr
                    if pess: l_ss *= (1/1.25) * 0.75
                    if opt: l_ss *= (1/0.85) * 1.20
                    l = l_ss * rampv(SEARCH_LEAD_RAMP, age) * s
                    spend += sp
                else:
                    cpl, cv = CPLCH[ch]
                    if ch == "events" and events_cpl: cpl = events_cpl
                    if ch == "klerk" and klerk_cpl: cpl = klerk_cpl
                    l = amt / cpl * rampv(MEDIA_LEAD_RAMP, age)
                    if pess: l *= 0.6
                    if opt: l *= 1.4
                    if ch != "events": l *= s
                    spend += amt
                if pess: cv *= 0.75
                if opt: cv *= 1.25
                if trust: cv *= trust[t]
                leads += l; clients += l * cv
        # партнёры и SEO: линейно к 6-му месяцу от октября, цель по текущему сценарию
        pt, st = free_targets[t]
        k = min(1.0, (t + 1) / 6)
        pl = pt * k * s; sl = st * k * s
        if pess: pl *= 0.6; sl *= 0.6
        if opt: pl *= 1.4; sl *= 1.4
        pcv = 0.35; scv = 0.15
        if pess: pcv *= 0.75; scv *= 0.75
        if opt: pcv *= 1.25; scv *= 1.25
        if trust: pcv *= trust[t]; scv *= trust[t]
        leads += pl + sl
        pc = pl * pcv
        clients += pc + sl * scv
        pclients += pc
        r = react if t >= react_from else 0
        res.append(dict(spend=spend, leads=leads, clients=clients, pclients=pclients, react=r))
    return res

def nsm(res, start=185, horizon=12):
    out = []
    for t in range(horizon):
        base = start * (1 - CHURN_BASE) ** (t + 1)
        new = sum(res[m]["clients"] * (1 - CHURN_NEW) ** (t - m) for m in range(t + 1))
        re = sum(res[m]["react"] * (1 - CHURN_NEW) ** (t - m) for m in range(t + 1))
        out.append((base + new, base + new + re))
    return out

def print_path(title, res, fixed=None):
    print("\n==", title)
    ns = nsm(res)
    ts = tl = tc = 0
    for t, r in enumerate(res):
        ts += r["spend"]; tl += r["leads"]; tc += r["clients"]
        print(f"{MONTHS[t]:9s} spend {r['spend']:6.0f} leads {r['leads']:6.1f} cl {r['clients']:5.1f} p {r['pclients']:4.1f} NSM {ns[t][0]:5.0f} ({ns[t][1]:5.0f})")
    print(f"TOTAL spend {ts:.0f} leads {tl:.0f} clients {tc:.1f}  CAC {ts/tc:.1f}")
    return ts, tl, tc, ns

if __name__ == "__main__":
    minq4 = dict(MIN); minq4.update(MIN_Q4_EXTRA)
    baseq4 = dict(BASE); baseq4.pop("max"); baseq4["tg_partner"] = 50; baseq4["reliab"] = 20
    basejan = dict(BASE); basejan["reliab"] = 10   # тест до середины января
    # EAEU после страницы Казахстана (11.12) — в декабре половина
    baseq4["eaeu"] = 17.5
    path_rec = [minq4, minq4, baseq4, basejan] + [BASE]*8
    ft_rec = [FREE["min"]]*2 + [FREE["base"]]*10
    res = simulate(path_rec, ft_rec, react=1, react_from=2)
    ts, tl, tc, ns = print_path("Рекомендованный: мин (окт-ноя) -> баз (дек)", res)
    # минимальный весь год
    minyear = [minq4]*3 + [MIN]*9
    res_min = simulate(minyear, [FREE["min"]]*12)
    print_path("Минимальный весь год", res_min)
    # базовый с октября
    base_oct = [dict(baseq4, eaeu=35)]*3 + [basejan] + [BASE]*8
    res_b = simulate(base_oct, [FREE["base"]]*12)
    print_path("Базовый с октября", res_b)
    # агрессивный облегчённый с апреля
    path_ag = [minq4, minq4, baseq4, basejan] + [BASE]*2 + [AGGR]*6
    ft_ag = [FREE["min"]]*2 + [FREE["base"]]*4 + [FREE["aggr"]]*6
    res_ag = simulate(path_ag, ft_ag, events_cpl=None, klerk_cpl=17.5, aggr_rsya_from=6, react=1)
    print_path("Путь с облегчённым агрессивным с апреля", res_ag)
    # эффект доверия как потенциал
    trust = [1.0, 1.05, 1.15] + [1.25]*9
    res_t = simulate(path_rec, ft_rec, trust=trust, react=1)
    print_path("Рекомендованный + эффект доверия (потенциал)", res_t)
    # пессимистичная и оптимистичная воронка
    res_p = simulate(path_rec, ft_rec, pess=True, react=1)
    print_path("Рекомендованный, пессимистичная воронка", res_p)
    res_o = simulate(path_rec, ft_rec, opt=True, react=1)
    print_path("Рекомендованный, оптимистичная воронка", res_o)
