# Модель сценариев United Stream, версия 2 (итоговая стратегия strategy.md).
# Правки к v1 (model.py, path.py, final2.py) по замечаниям критиков:
#  - потолок кликов по кластерам (demand_economics §1.3): лишний бюджет повышает CPC, а не число кликов;
#  - рост CPC +10% с января 2027 года (Р19: +7–12% в год плюс 3% сбора);
#  - бренд — защита: клиенты бренда не засчитываются плану, CAC считается без бренда;
#  - партнёрская линия стартует с ноября: активные партнёры × 0,5 лида + рекомендации клиентов;
#  - SEO-прирост — с ноября (страницы P1 выходят 29.10);
#  - Яндекс Бизнес в мин. и баз. — только тариф «Продвинутый», лиды карточек в прогноз не входят;
#  - ретаргетинг ограничен размером пула, look-alike — отдельная строка;
#  - перебалансировка: Азия 30 в баз., услуги 30 до публикации фикса, ЕС 50, проблемные 20 + резерв новостей;
#  - промежуточный сценарий ≈283 тыс. ₽;
#  - подрядчики по балансу часов (редактор, юрист-абонемент);
#  - резерв гарантии пересчитан на платёж $40 тыс.;
#  - экономика ×1,75 и ветка «НДС внутри 0,3%» (×0,82), касса с вычетом входящего НДС и без.
# Все деньги — тыс. ₽ в месяц без НДС, если не сказано иное.

MONTHS = ["Окт 2026","Ноя","Дек","Янв 2027","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен"]
SEAS = [1.0,1.05,1.0,0.7,0.85,1.0,1.0,0.85,1.0,0.9,0.85,1.05]

# --- Экономика клиента (базовая, demand_economics п. 2.2) ---
CONTRIB = 7.090; REV = 14.179
CHURN_NEW = 0.056; CHURN_BASE = 0.02
LTV = 127.613; LTV_PARTNER = 83.088; ALLOW_CAC = 42.538; MAX_CAC = 127.613
BASE_CLIENTS = 185

# --- Поиск: CPC ₽ (2026), CR, лид -> клиент, потолок кликов в месяц (§1.3) ---
SEARCH = {
 "brand":   (30, 0.03, 0.30, 110),
 "eu":      (245, 0.0425, 0.18, 190),
 "serv":    (165, 0.0425, 0.15, 250),
 "prob":    (165, 0.0325, 0.15, 115),
 "asia":    (325, 0.035, 0.12, 325),    # Турция и ОАЭ 190 + Гонконг, Корея, Индия 135
 "eaeu":    (265, 0.035, 0.12, 200),
 "export":  (265, 0.03, 0.15, 75),
 "reliab":  (350, 0.03, 0.10, 10**6),
 "retarg":  (37.5, 0.007, 0.09, None), # потолок — размер пула, задаётся сценарием
 "lal":     (40, 0.006, 0.08, 10**6),
}
CPC_2027 = 1.10
# Медиа: CPL тыс. ₽, конверсия
CPLCH = {
 "klerk_start": (20.0, 0.15),   # только блог «Старт», без платной статьи [О]
 "klerk": (15.6, 0.15),
 "klerk_aggr": (17.5, 0.15),
 "rbc":   (16.0, 0.14),
 "max":   (15.0, 0.12),
 "pr":    (25.0, 0.20),
 "events":(8.0, 0.20),
 "yabiz_ads": (10.0, 0.15),
}
NOLEAD = {"partner_dir","partner_prog","services","tg_partner","yabiz","news_reserve","vk_test"}
SEARCH_LEAD_RAMP = [0.4, 0.7, 1.0]
SEARCH_SPEND_RAMP = [0.6, 0.85, 1.0]
MEDIA_LEAD_RAMP = [0.2, 0.5, 0.8, 1.0]

# --- Бюджеты установившегося месяца ---
MIN = dict(brand=4, eu=45, serv=30, prob=20, asia=30, retarg=12, yabiz=10,
           partner_dir=10, partner_prog=15, services=12)
MID = dict(MIN, partner_prog=40, events=40, klerk_start=30)            # промежуточный
BASE = dict(brand=4, eu=50, serv=30, prob=20, news_reserve=5, asia=30, eaeu=35, export=20,
            retarg=20, lal=20, yabiz=10, klerk=60, rbc=8, events=40,
            partner_dir=15, partner_prog=40, max=25, services=15)
AGGR = dict(brand=4, eu=50, serv=40, prob=20, news_reserve=15, asia=45, eaeu=40, export=20,
            retarg=25, lal=40, yabiz=10, yabiz_ads=20, klerk_aggr=105, rbc=8, pr=25, events=110,
            partner_dir=20, partner_prog=100, max=60, services=30)
RETARG_POOL = {"min": 300, "mid": 300, "base": 500, "aggr": 700}   # кликов в месяц
SEO_TARGET = {"min": 4, "mid": 4, "base": 8, "aggr": 15}

# Активные партнёры на конец месяца
ACTIVE = {
 "min":  [0,1,2,3,4,5,6,7,8,9,10,10],
 "mid":  [0,1,3,4,6,8,10,12,14,15,17,18],
 "base": [0,1,3,5,8,12,14,16,18,20,22,25],
}
REFERRALS = [0,0.5,1.0] + [1.5]*9
LEADS_PER_PARTNER = 0.5
PCV = 0.35; SCV = 0.15

def rampv(r, age): return r[min(age, len(r)-1)]

def simulate(path, scen_by_month, active, react_from=2, react=1, econ_cpc=True, pess=False, opt=False, seas=None):
    seas = seas or SEAS
    n = len(path)
    active_tr = {}; prev = {}; res = []
    for t in range(n):
        b = path[t]
        for ch in set(b) | set(prev):
            nb = b.get(ch, 0); pb = prev.get(ch, 0)
            lst = active_tr.setdefault(ch, [])
            if nb > pb: lst.append([t, nb - pb])
            elif nb < pb:
                cut = pb - nb
                while cut > 1e-9 and lst:
                    if lst[-1][1] <= cut: cut -= lst[-1][1]; lst.pop()
                    else: lst[-1][1] -= cut; cut = 0
        prev = dict(b)
        s = seas[t % 12]
        sc = scen_by_month[t]
        cpcm = CPC_2027 if (econ_cpc and t >= 3) else 1.0
        r = dict(spend=0, brand_spend=0, leads=0, clients=0, brand_leads=0, brand_clients=0,
                 pleads=0, pclients=0, paid_clicks=0, rows={})
        for ch, lst in active_tr.items():
            if not lst: continue
            if ch in NOLEAD:
                r["spend"] += sum(a for _, a in lst); continue
            if ch in SEARCH:
                cpc, cr, cv, cap = SEARCH[ch]
                if ch == "retarg": cap = RETARG_POOL[sc]
                cpc = cpc * cpcm
                if pess: cpc *= 1.25; cr *= 0.75; cv *= 0.75
                if opt: cpc *= 0.85; cr *= 1.20; cv *= 1.25
                sp = sum(a * rampv(SEARCH_SPEND_RAMP, t - t0) for t0, a in lst) * s
                pot = sum(a * 1000 / cpc * rampv(SEARCH_LEAD_RAMP, t - t0) for t0, a in lst)
                clicks = min(pot, cap) * s
                l = clicks * cr; c = l * cv
                r["spend"] += sp
                if ch == "brand":
                    r["brand_spend"] += sp; r["brand_leads"] += l; r["brand_clients"] += c
                    continue
                r["paid_clicks"] += clicks
            else:
                cpl, cv = CPLCH[ch]
                if pess: cv *= 0.75
                if opt: cv *= 1.25
                l = sum(a / cpl * rampv(MEDIA_LEAD_RAMP, t - t0) for t0, a in lst)
                if pess: l *= 0.6
                if opt: l *= 1.4
                if ch != "events": l *= s
                c = l * cv
                r["spend"] += sum(a for _, a in lst)
            r["leads"] += l; r["clients"] += c
            r["rows"][ch] = r["rows"].get(ch, 0) + c
        # партнёры и рекомендации — с ноября
        pl = (active[t] * LEADS_PER_PARTNER + REFERRALS[min(t, 11)]) * s
        k = min(1.0, t / 6)
        sl = SEO_TARGET[sc] * k * s
        pcv, scv = PCV, SCV
        if pess: pl *= 0.6; sl *= 0.6; pcv *= 0.75; scv *= 0.75
        if opt: pl *= 1.4; sl *= 1.4; pcv *= 1.25; scv *= 1.25
        r["leads"] += pl + sl; r["pleads"] = pl
        r["pclients"] = pl * pcv
        r["clients"] += pl * pcv + sl * scv
        r["react"] = react if t >= react_from else 0
        res.append(r)
    return res

def nsm(res, start=BASE_CLIENTS):
    out = []
    for t in range(len(res)):
        base = start * (1 - CHURN_BASE) ** (t + 1)
        new = sum(res[m]["clients"] * (1 - CHURN_NEW) ** (t - m) for m in range(t + 1))
        re = sum(res[m]["react"] * (1 - CHURN_NEW) ** (t - m) for m in range(t + 1))
        out.append(base + new + re)
    return out

VAT = 1.22

def cash(res, contr, staff, oneoff, legal=340, reserve=98, reserve_from=2, econ=1.0, vat=VAT, n=None):
    n = n or len(res)
    cum = 0; mn = 0; mnm = None; rows = []
    for t in range(n):
        out = res[t]["spend"] * vat + contr[t] + staff[t] + oneoff[t] + (legal if t == 0 else 0) \
              + (reserve if (reserve and t >= reserve_from) else 0)
        inflow = 0
        for m in range(t):
            nonp = res[m]["clients"] - res[m]["pclients"] + res[m]["react"]; p = res[m]["pclients"]
            k = (1 - CHURN_NEW) ** (t - m - 1)
            payout = (0.25 if (t - m - 1) < 12 else 0.10) * REV
            inflow += (nonp * CONTRIB * econ + p * (CONTRIB * econ - payout * econ)) * k
        cum += inflow - out
        rows.append((t, res[t]["spend"], res[t]["spend"] * vat, contr[t], staff[t], oneoff[t],
                     (legal if t == 0 else 0) + (reserve if (reserve and t >= reserve_from) else 0), out, inflow, cum))
        if cum < mn: mn = cum; mnm = t
    return rows, mn, mnm

def cohort_value(res, econ=1.0):
    v = 0
    for m in range(len(res)):
        nonp = res[m]["clients"] - res[m]["pclients"] + res[m]["react"]; p = res[m]["pclients"]
        v += (nonp * LTV + p * LTV_PARTNER) * econ
    return v

def payback_month(res, total_cost, econ=1.0, horizon=60):
    cum = 0
    for T in range(horizon):
        inflow = 0
        for m in range(min(T, len(res))):
            nonp = res[m]["clients"] - res[m]["pclients"] + res[m]["react"]; p = res[m]["pclients"]
            k = T - m - 1
            if k < 0: continue
            pc = CONTRIB - (0.25 if k < 12 else 0.10) * REV
            inflow += (nonp * CONTRIB + p * pc) * econ * (1 - CHURN_NEW) ** k
        cum += inflow
        if cum >= total_cost: return T + 1
    return None

# ---------------- Пути ----------------
oct_ = dict(MIN); oct_.pop("partner_dir"); oct_.pop("partner_prog")        # партнёрские строки — с ноября
nov_ = dict(MIN, tg_partner=20)
dec_min = dict(MIN, tg_partner=20)
feb_min = dict(MIN, vk_test=20); mar_min = dict(MIN, vk_test=10)             # тест VK Рекламы на набор партнёров

# A: минимальный весь год (план по умолчанию)
path_A = [oct_, nov_, dec_min, MIN, feb_min, mar_min] + [MIN]*6
scen_A = ["min"]*12
# A+: промежуточный с 01.12 (семинары — с февраля)
mid_dec = dict(MIN, partner_prog=40, klerk_start=30, tg_partner=20)
mid_jan = dict(MIN, partner_prog=40, klerk_start=30)
path_Ap = [oct_, nov_, mid_dec, mid_jan, dict(MID, vk_test=20), dict(MID, vk_test=10)] + [MID]*6
scen_Ap = ["min","min"] + ["mid"]*10
# B: базовый с 11.01.2027 (экономика подтверждена); январь — 2/3 месяца
def blend(a, b, w):
    keys = set(a) | set(b)
    return {k: a.get(k, 0) * (1 - w) + b.get(k, 0) * w for k in keys}
base_jan = blend(dict(MIN), dict(BASE, reliab=15, max=0, events=0), 0.67)
base_feb = dict(BASE, reliab=20, vk_test=20)
base_mar = dict(BASE, vk_test=10)
path_B = [oct_, nov_, dec_min, base_jan, base_feb, base_mar] + [BASE]*6
scen_B = ["min","min","min","base","base","base"] + ["base"]*6
# B0: базовый с 01.12 при опережающих индикаторах (для чувствительности)
base_dec = dict(BASE, reliab=20, tg_partner=20, max=0, events=0)
path_B0 = [oct_, nov_, base_dec, dict(BASE, reliab=10, events=0), base_feb, base_mar] + [BASE]*6
scen_B0 = ["min","min"] + ["base"]*10
# C: B + облегчённый агрессивный с 01.04.2027
path_C = path_B[:6] + [AGGR]*6
scen_C = scen_B[:6] + ["aggr"]*6
ACTIVE_C = ACTIVE["base"][:6] + [17,22,27,32,37,42]

ACT = {"A": ACTIVE["min"], "Ap": ACTIVE["mid"], "B": [0,1,2,4,7,11,14,16,18,20,22,25], "B0": ACTIVE["base"], "C": [0,1,2,4,7,11,17,22,27,32,37,42]}

# Подрядчики (середины вилок) и новые ставки по месяцам
CONTR = {
 "A":  [220,220] + [250]*10,
 "Ap": [220,220] + [275]*10,
 "B":  [220,220,250,390] + [440]*8,
 "B0": [220,220,440,440] + [440]*8,
 "C":  [220,220,250,390,440,440] + [680]*6,
}
STAFF = {
 "A": [0] + [88]*11, "Ap": [0] + [88]*11,
 "B": [0,88,88,88] + [175]*8, "B0": [0,88,88,88] + [175]*8,
 "C": [0,88,88,88,175,175] + [350]*6,
}
# Разовые вложения по месяцам (середины), тыс. ₽ — см. таблицу 10.5 в strategy.md
ONEOFF_COMMON = [
  # Октябрь: P0 165, объявления 7.5, тариф и калькулятор 130, документы 65, LCP 75, 4 проблемные страницы 82.5,
  # аналитика 115 (60% в октябре), стандарт 35, отзывы 17.5, памятка 30, белый список 25,
  # партнёрка MVP 130 (70% в октябре), РКН и форма согласия 25, НДС-позиция налогового консультанта 30, реестр текстов 12.5
  165+7.5+130+65+75+82.5+0.6*115+35+17.5+30+25+0.7*130+25+30+12.5+15,   # +15: пересчёт модели аналитиком
  # Ноябрь: аналитика 40%, партнёрка 30%, P50/P90 20, сравнение с А7 (половина), медиатренинг 40
  0.4*115+0.3*130+20+0.5*61.5+40,
  # Декабрь: сравнение (вторая половина), реактивация 30, email-цепочка и дайджест 50
  0.5*61.5+30+50,
]
ONEOFF_BASE_EXTRA = {3: 70+95+45+17+30+35+10,       # янв: тех. SEO, хаб ЕС, полный набор партнёра, Казахстан, GEO-скрипт, аналитика баз., фото
                     4: 100+65+52+110+52.5+40+50,    # фев: услуги, хаб главбуха, статьи, бот партнёра, ABM-набор, лид-магнит Клерка, страницы для брокеров
                     5: 65+39+50+42.5,               # мар: хаб главбуха, статьи, Индекс, Азия
                     6: 39+42.5+72.5}                # апр: статьи, Азия, кейсы
def oneoffs(kind):
    o = [0]*12
    for i, v in enumerate(ONEOFF_COMMON): o[i] += v
    if kind in ("B","B0","C"):
        for m, v in ONEOFF_BASE_EXTRA.items(): o[m] += v
    if kind == "C": o[6] += 90 + 30 + 40
    if kind == "Ap": o[2] += 45          # полный набор партнёра
    return o

PATHS = {"A": (path_A, scen_A), "Ap": (path_Ap, scen_Ap), "B": (path_B, scen_B), "B0": (path_B0, scen_B0), "C": (path_C, scen_C)}

def summarize(key, econ=1.0, reserve=98, vat=VAT, verbose=False):
    pth, sc = PATHS[key]
    res = simulate(pth, sc, ACT[key])
    ns = nsm(res)
    sp = sum(r["spend"] for r in res); bsp = sum(r["brand_spend"] for r in res)
    L = sum(r["leads"] for r in res); C = sum(r["clients"] for r in res); BC = sum(r["brand_clients"] for r in res)
    R = sum(r["react"] for r in res); PC = sum(r["pclients"] for r in res)
    planned = sum(sum(b.values()) for b in pth)
    full = sum(res[t]["spend"] + CONTR[key][t] + STAFF[key][t] for t in range(12))
    oo = oneoffs(key)
    rows, mn, mnm = cash(res, CONTR[key], STAFF[key], oo, reserve=reserve, econ=econ, vat=vat)
    rows0, mn0, mnm0 = cash(res, CONTR[key], STAFF[key], oo, reserve=0, econ=econ, vat=vat)
    rows_q1 = min(r[-1] for r in rows[:6])
    vl = cohort_value(res, econ)
    out = dict(planned=planned, spend=sp, brand_spend=bsp, leads=L, clients=C, brand_clients=BC, react=R, pclients=PC,
               cac_ch=(sp - bsp) / C, cac_full=(full - bsp) / C, oneoff=sum(oo), contr=sum(CONTR[key]), staff=sum(STAFF[key]),
               nsm=[ns[i] for i in (2,5,8,11)], dd=mn, ddm=mnm, dd0=mn0, dd_q1=rows_q1, value=vl,
               x_ch=vl / (sp - bsp + sum(oo)), x_full=vl / (full - bsp + sum(oo)),
               pb_ch=payback_month(res, sp - bsp + sum(oo), econ), pb_full=payback_month(res, full - bsp + sum(oo), econ),
               res=res, rows=rows)
    return out

def steady(budget, sc, active_n=None, pess=False, opt=False):
    # установившийся месяц 2027 (CPC ×1,1), без разгона, сезонность 1,0
    res = simulate([budget]*7, [sc]*7, [active_n or 0]*7, react=0, pess=pess, opt=opt, seas=[1.0]*12)
    return res[6]

if __name__ == "__main__":
    import sys
    print("=== Установившийся месяц 2027 ===")
    for name, b, sc, act in [("MIN", MIN, "min", 10), ("MID", MID, "mid", 15), ("BASE", BASE, "base", 20), ("AGGR", AGGR, "aggr", 36)]:
        r = steady(b, sc, act)
        tot = sum(b.values())
        nb_sp = r["spend"] - r["brand_spend"]
        print(f"{name}: budget {tot}, leads {r['leads']:.1f} (+brand {r['brand_leads']:.1f}), clients {r['clients']:.2f} (+brand {r['brand_clients']:.2f}), "
              f"partner leads {r['pleads']:.1f}, paid clicks {r['paid_clicks']:.0f}, CAC(no brand) {nb_sp/r['clients']:.1f}")
        for ch, c in sorted(r["rows"].items(), key=lambda x: -x[1]):
            print(f"     {ch:12s} budget {b.get(ch,0):5.0f} clients {c:5.2f} CAC {b.get(ch,0)/c if c else 0:6.1f}")
        for tag, p, o in [("pess", True, False), ("opt", False, True)]:
            rr = steady(b, sc, act, pess=p, opt=o)
            print(f"     {tag}: clients {rr['clients']:.2f}, CAC {(rr['spend']-rr['brand_spend'])/rr['clients']:.1f}")
    for key in ["A","Ap","B","B0","C"]:
        for econ in ([1.0, 1.75] if key in ("B","B0","C") else [1.0, 1.75]):
            o = summarize(key, econ=econ)
            print(f"\n#### {key} econ x{econ}: planned {o['planned']:.0f}, spend {o['spend']:.0f} (brand {o['brand_spend']:.0f}), leads {o['leads']:.0f}, clients {o['clients']:.1f} (+brand {o['brand_clients']:.1f}), partners {o['pclients']:.1f}, react {o['react']}")
            print(f"   CAC ch {o['cac_ch']:.1f}, CAC full {o['cac_full']:.1f}; oneoff {o['oneoff']:.0f}; contr {o['contr']}; staff {o['staff']}")
            print(f"   NSM Q: {[round(x) for x in o['nsm']]}; value {o['value']:.0f}; x_ch {o['x_ch']:.2f}; x_full {o['x_full']:.2f}; payback ch {o['pb_ch']} full {o['pb_full']}")
            print(f"   drawdown with reserve {o['dd']:.0f} at {MONTHS[o['ddm']]}; without reserve {o['dd0']:.0f}; cum at Mar-2027 (min to Mar) {o['dd_q1']:.0f}")
            if econ == 1.0 or key in ("B",):
                for r in o["rows"]:
                    t = r[0]
                    rr = o["res"][t]
                    print(f"     {MONTHS[t]:9s} plan {sum(PATHS[key][0][t].values()):5.0f} spend {rr['spend']:5.0f} leads {rr['leads']:5.1f} cl {rr['clients']:4.1f} p {rr['pclients']:3.1f} brand {rr['brand_clients']:3.1f} "
                          f"| chVAT {r[2]:5.0f} contr {r[3]:4.0f} staff {r[4]:4.0f} one {r[5]:5.0f} legal/res {r[6]:4.0f} OUT {r[7]:6.0f} IN {r[8]:5.0f} CUM {r[9]:7.0f}")
