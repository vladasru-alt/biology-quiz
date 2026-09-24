from model import *
import path as P
from path import simulate, nsm, MONTHS
from cash import oct_, nov_, dec_, jan_, VAT, cohort_value, payback_month
SEAS12 = P.SEAS[:12]
oct_c=oct_; nov_c=nov_
path_rec = [oct_, nov_, dec_, jan_] + [BASE]*8
ft_rec = [FREE["min"]]*2 + [FREE["base"]]*10
min_year = [oct_, nov_, dict(nov_)] + [MIN]*9
ft_min = [FREE["min"]]*12
path_ag = [oct_, nov_, dec_, jan_, BASE, BASE] + [AGGR]*6
ft_ag = [FREE["min"]]*2 + [FREE["base"]]*4 + [FREE["aggr"]]*6
contr = {"rec":[128,128]+[300]*10, "min":[128]*12, "ag":[128,128]+[300]*4+[400]*6}
staff = {"rec":[0,88,88,88]+[175]*8, "min":[0]+[88]*11, "ag":[0,88,88,88,175,175]+[350]*6}
oo_min = [792,135.75,60.75]+[0]*9
oo_rec = [813,149.75,408.75,314.5,311.5,123]+[0]*6
oo_ag = list(oo_rec); oo_ag[6] += 90+30+40   # видео, материалы делегаций, совместные кейсы (апрель)
def cash(res, c, s, oo, legal=340, reserve_from=2, reserve=113, econ=1.0, n=12, verbose=False):
    cum=0; mn=0; mnm=None; rows=[]
    for t in range(n):
        out = res[t]["spend"]*VAT + c[t] + s[t] + oo[t] + (legal if t==0 else 0) + (reserve if (reserve and t>=reserve_from) else 0)
        inflow=0
        for m in range(t):
            nonp=res[m]["clients"]-res[m]["pclients"]+res[m]["react"]; p=res[m]["pclients"]
            k=(1-CHURN_NEW)**(t-m-1)
            inflow += (nonp*CONTRIB + p*(CONTRIB-0.25*REV))*econ*k
        cum += inflow-out
        rows.append((MONTHS[t], res[t]["spend"], res[t]["spend"]*VAT, c[t], s[t], oo[t], out, inflow, cum))
        if cum<mn: mn=cum; mnm=MONTHS[t]
    return rows, mn, mnm
for name, pth, ft, key, oo, rsv in [("MIN",min_year,ft_min,"min",oo_min,0),("REC",path_rec,ft_rec,"rec",oo_rec,113),("AG",path_ag,ft_ag,"ag",oo_ag,113)]:
    if key=="ag":
        CPLCH["events"]=(11.0,0.2)
        res = simulate(pth, ft, react=1, react_from=2, klerk_cpl=17.5, aggr_rsya_from=6)
        CPLCH["events"]=(8.0,0.2)
    else:
        res = simulate(pth, ft, react=1, react_from=2)
    ns = nsm(res)
    sp=sum(r["spend"] for r in res); L=sum(r["leads"] for r in res); C=sum(r["clients"] for r in res); R=sum(r["react"] for r in res)
    planned = sum(sum(b.values()) for b in pth)
    full = [res[t]["spend"]+contr[key][t]+staff[key][t] for t in range(12)]
    v24, vl = cohort_value(res)
    pm1 = payback_month(res, [res[t]['spend'] for t in range(12)]+[sum(oo)])
    pm2 = payback_month(res, full+[sum(oo)])
    print(f"\n#### {name}: planned {planned:.0f}, spend {sp:.0f}, leads {L:.0f}, clients {C:.1f}, react {R}, CACch {sp/C:.1f}, CACfull {sum(full)/C:.1f}, oneoff {sum(oo):.0f}, contr {sum(contr[key])}, staff {sum(staff[key])}")
    print("   NSM q:", [round(ns[i][0]) for i in (2,5,8,11)], "with react:", [round(ns[i][1]) for i in (2,5,8,11)])
    print(f"   lifetime value {vl:.0f}; x vs ch+oo {vl/(sp+sum(oo)):.2f}; x vs full+oo {vl/(sum(full)+sum(oo)):.2f}; payback ch+oo {pm1} ; full+oo {pm2}")
    rows, mn, mnm = cash(res, contr[key], staff[key], oo, reserve=rsv)
    print(f"   cash 12m: max drawdown {mn:.0f} at {mnm}")
    if name=="REC":
        for r in rows: print("   ", r[0], " ".join(f"{x:7.0f}" for x in r[1:]))
        for t,r in enumerate(res): print("    mo", MONTHS[t], f"budget {sum(pth[t].values()):.0f} spend {r['spend']:.0f} leads {r['leads']:.0f} clients {r['clients']:.1f} partners {r['pclients']:.1f} NSM {ns[t][1]:.0f}")
