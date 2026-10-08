
import numpy as np
from .models import surrogate_predict

def scenarios(model, current, n=0):
    base_choke=float(current["choke_pct"])
    base_inj=float(current["water_injection"])
    base_p=float(current["pressure_bar"])
    base_wc=float(current["water_cut"])
    base_oil=float(current["oil_rate"])
    rows=[]
    for dc in [-10,-5,0,5,10]:
        for di in [-15,-8,0,8,15]:
            choke=np.clip(base_choke*(1+dc/100),5,60)
            inj=max(0,base_inj*(1+di/100))
            # Demonstration proxy: injection supports pressure but can increase water cut.
            pressure=np.clip(base_p + 0.06*(inj-base_inj),80,230)
            wc=np.clip(base_wc + 0.00018*(inj-base_inj) - 0.0008*(choke-base_choke),0.01,.95)
            pred=surrogate_predict(model,pressure,choke,inj,wc)
            # Soft economic penalty for water and large operating changes.
            oil_gain=(pred-base_oil)/max(base_oil,1)*100
            water_penalty=max(0,wc-base_wc)*100
            change_penalty=abs(dc)*0.12+abs(di)*0.06
            score=oil_gain - 0.7*water_penalty - change_penalty
            rows.append({
                "choke_change_pct":dc,"injection_change_pct":di,
                "predicted_oil":pred,"predicted_water_cut":wc,
                "pressure":pressure,"score":score
            })
    return sorted(rows,key=lambda r:r["score"],reverse=True)
