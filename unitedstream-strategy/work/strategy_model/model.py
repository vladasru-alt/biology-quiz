# Сведённая модель сценариев United Stream (итоговая стратегия)
# Все деньги — тыс. ₽ в месяц, без НДС, если не сказано иное.
import math

MONTHS = ["Окт 2026","Ноя","Дек","Янв 2027","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен"]
SEAS = [1.0,1.05,1.0,0.7,0.85,1.0,1.0,0.85,1.0,0.9,0.85,1.05]

# Экономика клиента (базовая, demand_economics п. 2.2)
CONTRIB = 7.090          # вклад в месяц, тыс. ₽
REV = 14.179             # выручка в месяц
CHURN_NEW = 0.056
CHURN_BASE = 0.02
LTV = 127.613
LTV_PARTNER = 83.088     # после выплат 25/10
ALLOW_CAC = 42.538
MAX_CAC = 127.613

# Каналы поиска: CPC ₽, CR, конверсия лид -> клиент
SEARCH = {
 "brand":   (30, 0.03, 0.30),
 "eu":      (245, 0.0425, 0.18),
 "serv":    (165, 0.0425, 0.15),
 "prob":    (165, 0.0325, 0.15),
 "asia":    (325, 0.035, 0.12),
 "eaeu":    (265, 0.035, 0.12),
 "export":  (265, 0.03, 0.15),
 "reliab":  (350, 0.03, 0.10),
 "rsya":    (35, 0.007, 0.09),
}
# фиксированный CPL: (CPL тыс ₽, конверсия)
CPLCH = {
 "yabiz": (5.0, 0.20),
 "klerk": (15.6, 0.15),
 "rbc":   (16.0, 0.14),
 "max":   (15.0, 0.12),
 "tg":    (16.7, 0.12),   # клиентские лиды от посевов (основная цель — партнёры)
 "pr":    (25.0, 0.20),
 "events":(8.0, 0.20),
}
NOLEAD = {"partner_dir","partner_prog","services","tg_partner"}

# Установившиеся бюджеты сценариев (2027)
MIN = dict(brand=4, eu=45, serv=30, prob=20, asia=30, rsya=15, yabiz=10,
           partner_dir=10, partner_prog=15, services=12)
MIN_Q4_EXTRA = dict(tg_partner=20)
BASE = dict(brand=5, eu=55, serv=45, prob=30, asia=85, eaeu=35, export=20,
            rsya=60, yabiz=15, klerk=60, rbc=8, events=40,
            partner_dir=15, partner_prog=40, max=25, services=15)
AGGR = dict(brand=5, eu=65, serv=50, prob=35, asia=110, eaeu=40, export=25,
            rsya=120, yabiz=20, klerk=105, rbc=8, pr=25, events=110,
            partner_dir=20, partner_prog=100, max=60, services=30)
FREE = {"min": (4,4), "base": (10,8), "aggr": (25,15)}   # партнёры и рекомендации, SEO: лидов в мес к 6-му месяцу

def steady(budget, scen, aggr_rsya=False, klerk_cpl=None):
    leads=0; clients=0; rows=[]
    for ch,b in budget.items():
        if ch in NOLEAD:
            rows.append((ch,b,0,0)); continue
        if ch in SEARCH:
            cpc,cr,cv = SEARCH[ch]
            if ch=="rsya" and aggr_rsya:
                cpc,cr,cv = 40,0.006,0.08
            clicks = b*1000/cpc; l = clicks*cr; c = l*cv
        else:
            cpl,cv = CPLCH[ch]
            if ch=="klerk" and klerk_cpl: cpl=klerk_cpl
            l = b/cpl; c = l*cv
        leads+=l; clients+=c; rows.append((ch,b,l,c))
    pl,sl = FREE[scen]
    leads += pl+sl; clients += pl*0.35 + sl*0.15
    rows.append(("partners",0,pl,pl*0.35)); rows.append(("seo",0,sl,sl*0.15))
    return leads, clients, rows

for name,b,sc,ag,kc in [("MIN",MIN,"min",False,None),("BASE",BASE,"base",False,None),("AGGR",AGGR,"aggr",True,17.5)]:
    L,C,rows = steady(b,sc,ag,kc)
    tot = sum(b.values())
    print(f"\n{name}: budget {tot}, leads {L:.1f}, clients {C:.2f}, CAC {tot/C:.1f}")
    for r in rows:
        ch,bb,l,c = r
        cac = (bb/c) if c else 0
        print(f"   {ch:12s} {bb:6.0f} leads {l:6.2f} cl {c:5.2f} CAC {cac:6.1f}")
