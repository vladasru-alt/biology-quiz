# Отчёт по модели v2: все цифры для strategy.md
from v2 import *
import v2

def nsm_full(res, start=BASE_CLIENTS, brand=True):
    out = []
    for t in range(len(res)):
        base = start * (1 - CHURN_BASE) ** (t + 1)
        new = sum((res[m]["clients"] + (res[m]["brand_clients"] if brand else 0)) * (1 - CHURN_NEW) ** (t - m) for m in range(t + 1))
        re = sum(res[m]["react"] * (1 - CHURN_NEW) ** (t - m) for m in range(t + 1))
        out.append(dict(base=base, plan=sum(res[m]["clients"] * (1 - CHURN_NEW) ** (t - m) for m in range(t + 1)),
                        brand=sum(res[m]["brand_clients"] * (1 - CHURN_NEW) ** (t - m) for m in range(t + 1)), react=re, total=base + new + re))
    return out

print("===== 1. Установившийся месяц 2027 (CPC x1,1, сезонность 1,0) =====")
SC = [("Минимальный", MIN, "min", 10, 250, (210,290), 88),
      ("Промежуточный", MID, "mid", 15, 275, (225,320), 88),
      ("Базовый", BASE, "base", 20, 440, (375,505), 175),
      ("Агрессивный", AGGR, "aggr", 36, 680, (610,750), 350)]
for name, b, sc, act, contr, cr, staff in SC:
    r = steady(b, sc, act)
    tot = sum(b.values())
    nb = r["spend"] - r["brand_spend"]
    full = tot + contr + staff
    fullv = tot * VAT + contr + staff
    cac_ch = nb / r["clients"]; cac_full = (full - b["brand"]) / r["clients"]
    # доля партнёров и рекомендаций в клиентах
    pshare = r["pclients"] / r["clients"]; plead_share = r["pleads"] / r["leads"]
    paid_leads = r["leads"] - r["pleads"] - SEO_TARGET[sc]
    # LTV с учётом партнёров
    ltv_mix = (r["clients"] - r["pclients"]) / r["clients"] * LTV + r["pclients"] / r["clients"] * LTV_PARTNER
    # доля бюджета в каналах с CAC выше допустимого
    above = 0; above175 = 0; maxc = 0
    for ch, c in r["rows"].items():
        cac = b.get(ch, 0) / c if c else 0
        if cac > ALLOW_CAC: above += b.get(ch, 0)
        if cac > ALLOW_CAC * 1.75: above175 += b.get(ch, 0)
        if cac > MAX_CAC: maxc += b.get(ch, 0)
    paid_cpl = (nb - b.get("partner_prog",0) - b.get("partner_dir",0) - b.get("services",0) - b.get("yabiz",0) - b.get("news_reserve",0)) / paid_leads
    print(f"{name}: бюджет {tot}; подрядчики {contr} ({cr[0]}–{cr[1]}); ставки {staff}; полная без НДС {full} ({tot+cr[0]+staff}–{tot+cr[1]+staff}); с НДС {fullv:.0f}")
    print(f"   лиды {r['leads']:.1f} (платные {paid_leads:.1f}, партнёры+рек. {r['pleads']:.1f}, SEO {SEO_TARGET[sc]}); клиенты {r['clients']:.2f}; + бренд {r['brand_leads']:.1f} лида / {r['brand_clients']:.2f} кл.")
    print(f"   CAC по каналам (без бренда) {cac_ch:.1f}; полный {cac_full:.1f} ({(tot+cr[0]+staff-b['brand'])/r['clients']:.0f}–{(tot+cr[1]+staff-b['brand'])/r['clients']:.0f}); LTVmix {ltv_mix:.1f}; LTV/CAC каналы {ltv_mix/cac_ch:.2f} полный {ltv_mix/cac_full:.2f}")
    print(f"   LTV/CAC при x1,75: каналы {ltv_mix*1.75/cac_ch:.2f}, полный {ltv_mix*1.75/cac_full:.2f}; НДС внутри (x0,82): {ltv_mix*0.82/cac_ch:.2f} / {ltv_mix*0.82/cac_full:.2f}")
    print(f"   окупаемость CAC мес. (с оттоком) каналы / полный: ", end="")
    for cac in (cac_ch, cac_full):
        cum=0; m=0
        while cum < cac and m < 200:
            cum += CONTRIB*(1-CHURN_NEW)**m; m+=1
        print(m if m<200 else '>200', end=" / ")
    print()
    print(f"   доля партнёров в клиентах {pshare:.0%}, в лидах {plead_share:.0%}; CPL платных {paid_cpl:.1f}; платные клики {r['paid_clicks']:.0f}")
    print(f"   доля бюджета с CAC > допустимого {above/tot:.0%} (при x1,75: {above175/tot:.0%}); > предельного {maxc/tot:.0%}")
    print(f"   нужный вклад базы при лимите 50%: {fullv*2/1000:.2f} млн ₽; на клиента при 185: {fullv*2/185:.1f} тыс. ₽ (x{fullv*2/185/CONTRIB:.2f}); доля при базовом вкладе 1,31 млн: {fullv/(185*CONTRIB):.0%}")

print("\n===== 1b. Прогноз по кампаниям, базовый и минимальный установившийся месяц =====")
for name, b, sc, act in [("BASE", BASE, "base", 20), ("MIN", MIN, "min", 10), ("AGGR", AGGR, "aggr", 36), ("MID", MID, "mid", 15)]:
    print(name)
    for ch in ["brand","eu","serv","prob","asia","eaeu","export","retarg","lal"]:
        if ch not in b: continue
        cpc, cr, cv, cap = SEARCH[ch]
        if ch == "retarg": cap = RETARG_POOL[sc]
        cpc27 = cpc * CPC_2027
        pot = b[ch]*1000/cpc27; clicks = min(pot, cap); l = clicks*cr; c = l*cv
        print(f"   {ch:8s} {b[ch]:5.0f} клики {clicks:5.0f} (потолок {cap}, без потолка {pot:5.0f}) лиды {l:5.2f} клиенты {c:5.2f} CPL {b[ch]/l if l else 0:5.1f} CAC {b[ch]/c if c else 0:6.1f} CPCэфф {b[ch]*1000/clicks:5.0f}")

print("\n===== 2. Пути за 12 месяцев =====")
for key, label in [("A","Минимальный весь год"),("Ap","Мин -> промежуточный с 01.12"),("B","Мин -> базовый с 11.01"),("B0","Мин -> базовый с 01.12"),("C","B + облегчённый агрессивный с 01.04")]:
    for econ in (1.0, 1.75):
        o = summarize(key, econ=econ)
        nf = nsm_full(o["res"])
        tot = nf[-1]
        print(f"\n## {key} {label}, экономика x{econ}")
        print(f"   бюджет план {o['planned']:.0f}, факт {o['spend']:.0f} (бренд {o['brand_spend']:.0f}); подрядчики {o['contr']}; ставки {o['staff']}; разовые {o['oneoff']:.0f}")
        print(f"   лиды плана {o['leads']:.0f} (+бренд); клиенты плана {o['clients']:.1f}, из них партнёрских {o['pclients']:.1f}; бренд {o['brand_clients']:.1f}; вернувшиеся {o['react']}")
        print(f"   CAC каналы {o['cac_ch']:.1f}; полный {o['cac_full']:.1f}; ценность/затраты каналы+разовые x{o['x_ch']:.2f}, полные x{o['x_full']:.2f}; окупаемость {o['pb_ch']} / {o['pb_full']}")
        print(f"   NSM кварталы: всего {[round(nf[i]['total']) for i in (2,5,8,11)]}; база с оттоком {[round(nf[i]['base']) for i in (2,5,8,11)]}; бренд {[round(nf[i]['brand'],1) for i in (2,5,8,11)]}; план {[round(nf[i]['plan'],1) for i in (2,5,8,11)]}; возвр {[round(nf[i]['react'],1) for i in (2,5,8,11)]}")
        print(f"   просадка 12 мес: с резервом {o['dd']:.0f}; без резерва {o['dd0']:.0f}; накопленный итог к 31.03 {o['dd_q1']:.0f} (без резерва {o['dd_q1']+4*98:.0f})")
        oo = summarize(key, econ=econ, vat=1.0)
        print(f"   если входящий НДС к вычету: просадка без резерва {oo['dd0']:.0f}")
        # квартальные KPI
        res = o["res"]
        def q(a,b_):
            sp = sum(res[t]["spend"]-res[t]["brand_spend"] for t in range(a,b_)); cl = sum(res[t]["clients"] for t in range(a,b_))
            full = sum(res[t]["spend"]-res[t]["brand_spend"]+CONTR[key][t]+STAFF[key][t] for t in range(a,b_))
            ld = sum(res[t]["leads"] for t in range(a,b_)); pl = sum(res[t]["pleads"] for t in range(a,b_))
            return sp/cl, full/cl, cl, ld, pl/ld
        for nm,(a,b_) in [("IV кв",(0,3)),("I кв",(3,6)),("II кв",(6,9)),("III кв",(9,12))]:
            c1,c2,cl,ld,ps = q(a,b_)
            print(f"      {nm}: CAC каналы {c1:.0f}, полный {c2:.0f}, клиенты {cl:.1f}, лиды {ld:.0f}, доля партнёров в лидах {ps:.0%}")
        # доля партнёров в лидах сентября
        print(f"      сентябрь: лиды {res[11]['leads']:.1f}, партнёры+рек {res[11]['pleads']:.1f} ({res[11]['pleads']/res[11]['leads']:.0%}); декабрь: {res[2]['pleads']:.1f} ({res[2]['pleads']/res[2]['leads']:.0%}); март {res[5]['pleads']/res[5]['leads']:.0%}")

print("\n===== 3. Просадка за 24 месяца =====")
import copy
def run24(key, econ=1.0, reserve=98, vat=VAT):
    pth, sc = PATHS[key]
    path = pth + [pth[-1]]*12; scen = sc + [sc[-1]]*12
    act = ACT[key] + [ACT[key][-1]]*12
    res = simulate(path, scen, act, seas=SEAS*2)
    contr = CONTR[key] + [CONTR[key][-1]]*12; staff = STAFF[key] + [STAFF[key][-1]]*12
    oo = oneoffs(key) + [0]*12
    rows, mn, mnm = cash(res, contr, staff, oo, reserve=reserve, econ=econ, vat=vat)
    pos = next((r[0]+1 for r in rows if r[8]-r[7] > 0), None)
    return mn, mnm+1, pos, rows[-1][-1]
for key in ["A","Ap","B","C"]:
    for econ in (1.0, 1.5, 1.75, 2.0):
        mn, mnm, pos, c24 = run24(key, econ)
        mn0, mnm0, pos0, c240 = run24(key, econ, reserve=0)
        print(f"{key} x{econ}: пик просадки {mn:.0f} (мес. {mnm}); без резерва {mn0:.0f} (мес. {mnm0}); месячный итог >0 с мес. {pos} (без резерва {pos0}); накопл. на 24-м мес {c24:.0f} / {c240:.0f}")

print("\n===== 4. Устойчивость пути (пессимистичная / оптимистичная воронка) =====")
for key in ["A","B"]:
    pth, sc = PATHS[key]
    for tag, p, o_ in [("pess", True, False), ("opt", False, True)]:
        res = simulate(pth, sc, ACT[key], pess=p, opt=o_)
        C = sum(r["clients"] for r in res); sp = sum(r["spend"]-r["brand_spend"] for r in res)
        nf = nsm_full(res)
        print(f"{key} {tag}: клиенты {C:.0f}, NSM {nf[-1]['total']:.0f}, CAC каналы {sp/C:.0f}")

print("\n===== 5. Эффект доверия x1,25 к конверсии лид->клиент (потенциал) =====")
for key in ["A","Ap","B"]:
    pth, sc = PATHS[key]
    old = dict(v2.SEARCH); oldc = dict(v2.CPLCH); pcv = v2.PCV; scv = v2.SCV
    trust = [1.0,1.05,1.15]+[1.25]*9
    # применяем помесячно через пересчёт клиентов
    res = simulate(pth, sc, ACT[key])
    C = sum(r["clients"]*trust[t] for t,r in enumerate(res))
    for t,r in enumerate(res):
        r["clients"] *= trust[t]; r["pclients"] *= trust[t]
    nf = nsm_full(res)
    sp = sum(r["spend"]-r["brand_spend"] for r in res)
    print(f"{key}: клиенты {C:.0f}, NSM {nf[-1]['total']:.0f}, CAC каналы {sp/C:.0f}")

print("\n===== 6. Цена утечки: базовый бюджет при CR и конверсии -25% =====")
r = steady(BASE, "base", 20)
old = {k: v for k, v in v2.SEARCH.items()}
for k,(cpc,cr,cv,cap) in old.items():
    v2.SEARCH[k] = (cpc, cr*0.75, cv*0.75, cap)
oldc = dict(v2.CPLCH)
for k,(cpl,cv) in oldc.items(): v2.CPLCH[k] = (cpl/0.75, cv*0.75)
v2.PCV = PCV*0.75; v2.SCV = SCV*0.75
r2 = steady(BASE, "base", 20)
v2.SEARCH.update(old); v2.CPLCH.update(oldc); v2.PCV = 0.35; v2.SCV = 0.15
nb = r["spend"]-r["brand_spend"]
print(f"база: {r['clients']:.1f} клиентов, CAC {nb/r['clients']:.1f}; при утечке {r2['clients']:.1f}, CAC {nb/r2['clients']:.1f}; потеря {r['clients']-r2['clients']:.1f} кл./мес = {(r['clients']-r2['clients'])*LTV:.0f} тыс. ₽ LTV")
rm = steady(MIN, "min", 10)
for k,(cpc,cr,cv,cap) in old.items(): v2.SEARCH[k] = (cpc, cr*0.75, cv*0.75, cap)
for k,(cpl,cv) in oldc.items(): v2.CPLCH[k] = (cpl/0.75, cv*0.75)
v2.PCV = PCV*0.75; v2.SCV = SCV*0.75
rm2 = steady(MIN, "min", 10)
v2.SEARCH.update(old); v2.CPLCH.update(oldc); v2.PCV = 0.35; v2.SCV = 0.15
nbm = rm["spend"]-rm["brand_spend"]
print(f"мин: {rm['clients']:.1f} клиентов, CAC {nbm/rm['clients']:.1f}; при утечке {rm2['clients']:.1f}, CAC {nbm/rm2['clients']:.1f}; потеря {rm['clients']-rm2['clients']:.1f} кл./мес = {(rm['clients']-rm2['clients'])*LTV:.0f}")

print("\n===== 7. Резерв гарантии =====")
for share in (0.01, 0.03):
    amt = share*125*40*84.4/1000
    print(f"доля возвратов {share:.0%}: резерв {amt:.2f} млн ₽; стоимость денег 14% годовых {amt*1000*0.14/12:.0f} тыс. ₽ в месяц")

print("\n===== 8. Помесячные таблицы =====")
for key in ["A","Ap","B"]:
    for econ in ((1.0,) if key != "B" else (1.0, 1.75)):
        o = summarize(key, econ=econ)
        nf = nsm_full(o["res"])
        pth = PATHS[key][0]
        print(f"\n-- {key} econ x{econ}")
        cum0 = 0
        rows0, _, _ = cash(o["res"], CONTR[key], STAFF[key], oneoffs(key), reserve=0, econ=econ)
        tot_plan=tot_sp=tot_l=tot_c=tot_p=tot_b=0
        for t, r in enumerate(o["rows"]):
            rr = o["res"][t]
            tot_plan += sum(pth[t].values()); tot_sp += rr['spend']; tot_l += rr['leads']; tot_c += rr['clients']; tot_p += rr['pclients']; tot_b += rr['brand_clients']
            print(f"   {MONTHS[t]:9s} | план {sum(pth[t].values()):5.0f} | факт {rr['spend']:5.0f} | лиды {rr['leads']:5.1f} | клиенты {rr['clients']:4.1f} | партн {rr['pclients']:3.1f} | бренд {rr['brand_clients']:3.1f} | NSM {nf[t]['total']:5.1f} "
                  f"|| кан.НДС {r[2]:5.0f} | подр {r[3]:4.0f} | ставки {r[4]:4.0f} | разов {r[5]:5.0f} | юр {340 if t==0 else 0:4.0f} | расход без резерва {r[7]-(98 if t>=2 else 0):6.0f} | вклад {r[8]:5.0f} | итог без резерва {rows0[t][9]:7.0f} | с резервом {r[9]:7.0f}")
        print(f"   ИТОГО план {tot_plan:.0f} факт {tot_sp:.0f} лиды {tot_l:.0f} клиенты {tot_c:.1f} партн {tot_p:.1f} бренд {tot_b:.1f}")
