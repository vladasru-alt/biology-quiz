from cash import *
import copy
def run24(path12, ft12, contr12, staff12, oo12, econ=1.0, legal=True, reserve=True, label=""):
    path = path12 + [path12[-1]]*12
    ft = ft12 + [ft12[-1]]*12
    import path as P
    P.SEAS[:] = P.SEAS[:12]*2 if len(P.SEAS)==12 else P.SEAS
    months = [f"M{i+1}" for i in range(24)]
    res = simulate(path, ft, react=1, react_from=2) if len(path)<=len(P.SEAS) else None
    contr = contr12 + [contr12[-1]]*12
    staff = staff12 + [staff12[-1]]*12
    oo = oo12 + [0]*12
    cum=0; mn=0; mnm=None; pos=None; be=None
    for t in range(24):
        out = res[t]["spend"]*VAT + contr[t] + staff[t] + oo[t]
        if legal and t==0: out += 340
        if reserve and t>=2: out += 113
        inflow=0
        for m in range(t):
            nonp = res[m]["clients"]-res[m]["pclients"]+res[m]["react"]; p=res[m]["pclients"]
            k=(1-CHURN_NEW)**(t-m-1)
            inflow += (nonp*CONTRIB*econ + p*(CONTRIB*econ-0.25*REV*econ if (t-m-1)<12 else CONTRIB*econ-0.10*REV*econ))*k
        net = inflow-out; cum+=net
        if cum<mn: mn=cum; mnm=t+1
        if pos is None and net>0: pos=t+1
        if be is None and t>0 and cum>=0: be=t+1
    print(f"{label}: max drawdown {mn:.0f} at month {mnm}; monthly net >0 from month {pos}; cumulative >=0 at {be}; cum at M24 {cum:.0f}")
import path as P
P.SEAS[:] = P.SEAS*2
for econ in [1.0, 1.5, 1.75]:
    run24(path_rec, ft_rec, contr_rec, staff_rec, oneoffs("rec"), econ=econ, label=f"REC econ x{econ}")
    run24(min_year, ft_min, contr_min, staff_min, oneoffs("min"), econ=econ, reserve=False, label=f"MIN econ x{econ}")
