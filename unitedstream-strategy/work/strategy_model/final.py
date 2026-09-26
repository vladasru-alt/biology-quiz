from model import *
from path import simulate, nsm, MONTHS, SEAS

VAT = 1.22

def payback(cac, contrib=CONTRIB):
    s = 0; n = 0
    while s < cac and n < 200:
        s += contrib * (1 - CHURN_NEW) ** n; n += 1
    return n

# ---- установившийся месяц ----
CONTR = {"min": (95,160), "base": (260,355), "aggr": (330,470)}
STAFF = {"min": 88, "base": 175, "aggr": 350}
print("=== Установившийся месяц ===")
for name,b,sc,ag,kc,ecpl in [("min",MIN,"min",False,None,None),("base",BASE,"base",False,None,None),("aggr",AGGR,"aggr",True,17.5,11.0)]:
    if ecpl:
        CPLCH["events"] = (ecpl, 0.20)
    L,C,rows = steady(b,sc,ag,kc)
    CPLCH["events"] = (8.0, 0.20)
    ch_budget = sum(b.values())
    pcl = FREE[sc][0]*0.35
    wltv = (pcl*LTV_PARTNER + (C-pcl)*LTV)/C
    cmid = sum(CONTR[sc])/2
    full = ch_budget + cmid + STAFF[sc]
    full_lo = ch_budget + CONTR[sc][0] + STAFF[sc]
    full_hi = ch_budget + CONTR[sc][1] + STAFF[sc]
    paid_leads = sum(r[2] for r in rows if r[0] not in ("partners","seo"))
    paid_cl = sum(r[3] for r in rows if r[0] not in ("partners","seo"))
    print(f"{name}: channels {ch_budget}, leads {L:.0f} (paid {paid_leads:.0f}), clients {C:.1f} (paid {paid_cl:.1f}), partner share {pcl/C:.0%}")
    print(f"   CAC channels {ch_budget/C:.1f}; CAC paid-only {ch_budget/paid_cl:.1f}; CPL paid {ch_budget/paid_leads:.1f}")
    print(f"   full {full:.0f} ({full_lo}-{full_hi}); full CAC {full/C:.1f} ({full_lo/C:.0f}-{full_hi/C:.0f})")
    print(f"   weighted LTV {wltv:.1f}; LTV/CAC ch {LTV/(ch_budget/C):.2f} / w {wltv/(ch_budget/C):.2f}; full {LTV/(full/C):.2f} / w {wltv/(full/C):.2f}")
    print(f"   payback ch {payback(ch_budget/C)} mo; full {payback(full/C)} mo")
    print(f"   cash full w VAT {ch_budget*VAT + cmid + STAFF[sc]:.0f}; needs contribution at 40%: {(ch_budget*VAT + cmid + STAFF[sc])/0.4:.0f}")
    # доля бюджета в каналах с CAC > допустимого / предельного
    over_allow = sum(r[1] for r in rows if r[3]>0 and r[1]/r[3] > ALLOW_CAC)
    over_max = sum(r[1] for r in rows if r[3]>0 and r[1]/r[3] > MAX_CAC)
    print(f"   budget share CAC>allow {over_allow/ch_budget:.0%}, CAC>max {over_max/ch_budget:.0%}")

# предельная стоимость дополнительного клиента
Lm,Cm,_ = steady(MIN,"min"); Lb,Cb,_ = steady(BASE,"base")
CPLCH["events"]=(11.0,0.20); La,Ca,_ = steady(AGGR,"aggr",True,17.5); CPLCH["events"]=(8.0,0.20)
bm,bb,ba = sum(MIN.values()),sum(BASE.values()),sum(AGGR.values())
fm = bm+sum(CONTR['min'])/2+STAFF['min']; fb = bb+sum(CONTR['base'])/2+STAFF['base']; fa = ba+sum(CONTR['aggr'])/2+STAFF['aggr']
print(f"\nmarginal min->base: ch {(bb-bm)/(Cb-Cm):.1f}, full {(fb-fm)/(Cb-Cm):.1f}; base->aggr: ch {(ba-bb)/(Ca-Cb):.1f}, full {(fa-fb)/(Ca-Cb):.1f}")
print(f"clients: min {Cm:.2f} base {Cb:.2f} aggr {Ca:.2f}")

# пессимистичная/оптимистичная воронка в установившемся месяце
def steady_var(b, sc, mode, ag=False, kc=None, ecpl=None):
    if ecpl: CPLCH["events"]=(ecpl,0.2)
    L=0;C=0
    for ch,bud in b.items():
        if ch in NOLEAD: continue
        if ch in SEARCH:
            cpc,cr,cv = SEARCH[ch]
            if ch=="rsya" and ag: cpc,cr,cv = 40,0.006,0.08
            l = bud*1000/cpc*cr
            if mode=="p": l*= (1/1.25)*0.75; cv*=0.75
            if mode=="o": l*= (1/0.85)*1.2; cv*=1.25
        else:
            cpl,cv = CPLCH[ch]
            if ch=="klerk" and kc: cpl=kc
            l = bud/cpl
            if mode=="p": l*=0.6; cv*=0.75
            if mode=="o": l*=1.4; cv*=1.25
        L+=l; C+=l*cv
    pl,sl = FREE[sc]
    k = 0.6 if mode=="p" else (1.4 if mode=="o" else 1.0)
    f = 0.75 if mode=="p" else (1.25 if mode=="o" else 1.0)
    L += (pl+sl)*k; C += (pl*0.35+sl*0.15)*k*f
    CPLCH["events"]=(8.0,0.2)
    return L,C
print("\n=== Устойчивость (установившийся месяц) ===")
for name,b,sc,ag,kc,ec in [("min",MIN,"min",False,None,None),("base",BASE,"base",False,None,None),("aggr",AGGR,"aggr",True,17.5,11.0)]:
    bud = sum(b.values()); full = bud+sum(CONTR[sc])/2+STAFF[sc]
    for mode in ["p","b","o"]:
        L,C = steady_var(b,sc,mode,ag,kc,ec)
        print(f"{name} {mode}: leads {L:.0f} clients {C:.1f} CACch {bud/C:.0f} CACfull {full/C:.0f} LTV/CACch base-econ {LTV/(bud/C):.1f} full {LTV/(full/C):.1f}; pess econ ch {22.788/(bud/C):.2f} full {22.788/(full/C):.2f}; opt econ full {820.4/(full/C):.1f}")
