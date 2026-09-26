from model import *
from path import simulate, nsm, MONTHS, SEAS
VAT = 1.22

oct_ = dict(brand=4, eu=45, serv=30, prob=20, asia=30, rsya=15, yabiz=10, services=12)
nov_ = dict(oct_, partner_dir=10, partner_prog=15, tg_partner=20)
dec_ = dict(brand=5, eu=55, serv=45, prob=30, asia=85, eaeu=17.5, export=20, rsya=40, yabiz=15,
            klerk=60, rbc=8, events=40, partner_dir=15, partner_prog=40, tg_partner=40, reliab=20, services=15)
jan_ = dict(BASE, reliab=10)
path_rec = [oct_, nov_, dec_, jan_] + [BASE]*8
ft_rec = [FREE["min"]]*2 + [FREE["base"]]*10
min_year = [oct_, nov_, dict(nov_)] + [MIN]*9
ft_min = [FREE["min"]]*12

# подрядчики и новые ставки по месяцам (середины вилок)
contr_rec = [128,128] + [300]*10
staff_rec = [0, 88, 88, 88] + [175]*8     # партнёр-менеджер 0,5 с ноября; 1,0 после контрольной точки 31.01
contr_min = [128]*12
staff_min = [0] + [88]*11

# разовые маркетинговые вложения по месяцам (середины), тыс. ₽
oneoff_core = [ # октябрь, ноябрь, декабрь
    165+7.5+130+65+75+82.5+ 0.6*115 + 35+17.5+30+25+ 0.7*130,   # Oct
    0.4*115 + 0.3*130 + 20 + 0.5*61.5,                          # Nov
    0.5*61.5 + 30,                                               # Dec: сравнение (2-я половина) + реактивация
]
oneoff_base_extra = {2: 70+95+45+17+50+30+10, 3: 100+65+52+110+52, 4: 65+39+50+50+42, 5: 39+42+41}
# 2 (Dec): тех. SEO 70, хаб ЕС 95, набор партнёра полн. 45, Казахстан 17, email 50, GEO-скрипт 30, фото 10
# 3 (Jan): услуги 100, хаб главбуха 65, статьи 52, полная партнёрка 110, ABM-набор 52
# 4 (Feb): хаб главбуха 65, статьи 39, Индекс 50, страницы для брокеров 50, Азия 42
# 5 (Mar): статьи 39, Азия 42, кейсы 41

def oneoffs(path_kind):
    o = [0]*12
    for i,v in enumerate(oneoff_core): o[i] += v
    if path_kind == "rec":
        for m,v in oneoff_base_extra.items(): o[m] += v
    return o

def cashplan(res, contr, staff, oneoff, legal=None, reserve=None, title=""):
    print("\n==", title)
    cum = 0; mn = 0; mn_m = None
    # новые клиенты: вклад со следующего месяца; партнёрские — за вычетом выплат 25%
    tot_out = 0; tot_in = 0
    rows = []
    for t in range(12):
        ch = res[t]["spend"]
        out = ch*VAT + contr[t] + staff[t] + oneoff[t]
        if legal: out += legal[t]
        if reserve: out += reserve[t]
        inflow = 0
        for m in range(t):  # лаг 1 месяц
            nonp = res[m]["clients"] - res[m]["pclients"] + res[m]["react"]
            p = res[m]["pclients"]
            k = (1-CHURN_NEW)**(t-m-1)
            inflow += (nonp*CONTRIB + p*(CONTRIB-0.25*REV))*k
        cum += inflow - out
        tot_out += out; tot_in += inflow
        if cum < mn: mn = cum; mn_m = MONTHS[t]
        rows.append((MONTHS[t], ch, ch*VAT, contr[t], staff[t], oneoff[t], out, inflow, cum))
        print(f"{MONTHS[t]:9s} ch {ch:5.0f} chVAT {ch*VAT:5.0f} contr {contr[t]:4.0f} staff {staff[t]:4.0f} one {oneoff[t]:5.0f} OUT {out:6.0f} IN {inflow:5.0f} CUM {cum:7.0f}")
    print(f"max drawdown {mn:.0f} in {mn_m}; total out {tot_out:.0f} in {tot_in:.0f}")
    return rows

def cohort_value(res, horizon_after=24):
    # вклад клиентов года за 24 месяца от старта (окт 2026 — сен 2028) и за весь срок
    v24 = 0; vlife = 0
    for m in range(12):
        nonp = res[m]["clients"] - res[m]["pclients"] + res[m]["react"]
        p = res[m]["pclients"]
        for k in range(24 - m - 1):
            f = (1-CHURN_NEW)**k
            pc = CONTRIB-0.25*REV if k < 12 else CONTRIB-0.10*REV
            v24 += (nonp*CONTRIB + p*pc)*f
        vlife += nonp*LTV + p*LTV_PARTNER
    return v24, vlife

def payback_month(res, cost_monthly_total_by_month, horizon=48):
    # когда накопленный вклад клиентов года покрывает затраты года
    total_cost = sum(cost_monthly_total_by_month)
    cum = 0
    for T in range(horizon):
        inflow = 0
        for m in range(min(T,12)):
            nonp = res[m]["clients"] - res[m]["pclients"] + res[m]["react"]
            p = res[m]["pclients"]
            k = T-m-1
            if k < 0: continue
            pc = CONTRIB-0.25*REV if k < 12 else CONTRIB-0.10*REV
            inflow += (nonp*CONTRIB + p*pc)*(1-CHURN_NEW)**k
        cum += inflow
        if cum >= total_cost: return T+1
    return None

for title, path, ft, contr, staff, kind in [
    ("Рекомендованный путь", path_rec, ft_rec, contr_rec, staff_rec, "rec"),
    ("Минимальный весь год", min_year, ft_min, contr_min, staff_min, "min")]:
    res = simulate(path, ft, react=1, react_from=2)
    ns = nsm(res)
    print(f"\n#### {title}")
    for t,r in enumerate(res):
        print(f"{MONTHS[t]:9s} budget {sum(path[t].values()):5.0f} spend {r['spend']:5.0f} leads {r['leads']:5.1f} clients {r['clients']:4.1f} (partners {r['pclients']:.1f}) react {r['react']} NSM {ns[t][0]:.0f} / {ns[t][1]:.0f}")
    sp = sum(r['spend'] for r in res); L = sum(r['leads'] for r in res); C = sum(r['clients'] for r in res)
    oo = oneoffs(kind)
    full = [res[t]['spend'] + contr[t] + staff[t] for t in range(12)]
    print(f"spend {sp:.0f}, leads {L:.0f}, clients {C:.1f}, CAC ch {sp/C:.1f}, full(no oneoff) {sum(full)/C:.1f}; oneoffs {sum(oo):.0f}; contr {sum(contr)} staff {sum(staff)}")
    v24, vl = cohort_value(res)
    cost_ch_one = sp + sum(oo)
    cost_full = sum(full) + sum(oo)
    print(f"cohort value 24m {v24:.0f}, lifetime {vl:.0f}; cost ch+oneoff {cost_ch_one:.0f} (x{vl/cost_ch_one:.2f}), full+oneoff {cost_full:.0f} (x{vl/cost_full:.2f})")
    pm1 = payback_month(res, [res[t]['spend'] for t in range(12)] + [sum(oo)])
    pm2 = payback_month(res, full + [sum(oo)])
    print(f"payback month (channels+oneoff): {pm1}; (full+oneoff): {pm2}")
    legal = [340,0,0,0,0,0,0,0,0,0,0,0]
    reserve = [0,0,113,113,113,113,113,113,113,113,113,113] if kind=="rec" else None
    cashplan(res, contr, staff, oo, title=title+" — маркетинг")
    cashplan(res, contr, staff, oo, legal=legal, reserve=reserve, title=title+" — плюс юр. работы и резерв гарантии")
