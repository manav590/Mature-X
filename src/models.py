
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error

FEATURES = ["lag_7","lag_30","roll_7","roll_30","pressure_bar","wellhead_pressure_bar","choke_pct","water_injection","water_cut","day_index"]

def train_forecaster(well_df):
    x = well_df.copy()
    if len(x) < 60:
        return None, {}
    X=x[FEATURES]
    y=x["oil_rate"]
    cut=max(30, int(len(x)*.8))
    model=HistGradientBoostingRegressor(max_iter=250, learning_rate=.06, max_leaf_nodes=15, random_state=42)
    model.fit(X.iloc[:cut], y.iloc[:cut])
    pred=model.predict(X.iloc[cut:])
    metrics={
        "MAE":float(mean_absolute_error(y.iloc[cut:],pred)),
        "MAPE":float(mean_absolute_percentage_error(y.iloc[cut:],pred)*100)
    }
    return model,metrics

def forecast_30d(well_df, model, days=30):
    h=well_df.sort_values("date").copy()
    if model is None or len(h)<31:
        return pd.DataFrame()
    hist=list(h["oil_rate"].tail(30).values)
    last=h.iloc[-1].copy()
    out=[]
    for i in range(1,days+1):
        row={
            "lag_7":hist[-7],
            "lag_30":hist[0],
            "roll_7":float(np.mean(hist[-7:])),
            "roll_30":float(np.mean(hist)),
            "pressure_bar":float(last["pressure_bar"]),
            "wellhead_pressure_bar":float(last["wellhead_pressure_bar"]),
            "choke_pct":float(last["choke_pct"]),
            "water_injection":float(last["water_injection"]),
            "water_cut":float(last["water_cut"]),
            "day_index":float(last["day_index"]+i)
        }
        y=float(model.predict(pd.DataFrame([row])[FEATURES])[0])
        y=max(0,y)
        hist.append(y); hist=hist[-30:]
        out.append([last["date"]+pd.Timedelta(days=i),y])
    return pd.DataFrame(out,columns=["date","forecast_oil"])

def build_surrogate(df):
    p=df[df["oil_rate"].fillna(0)>0].copy()
    p=p.dropna(subset=["pressure_bar","choke_pct","water_injection","water_cut"])
    p["log_oil"]=np.log1p(p["oil_rate"])
    cols=["pressure_bar","choke_pct","water_injection","water_cut"]
    model=RandomForestRegressor(n_estimators=250,max_depth=12,min_samples_leaf=4,random_state=42,n_jobs=-1)
    model.fit(p[cols],p["log_oil"])
    return model

def surrogate_predict(model, pressure, choke, injection, water_cut):
    x=pd.DataFrame([{
        "pressure_bar":pressure,"choke_pct":choke,
        "water_injection":injection,"water_cut":water_cut
    }])
    return float(np.expm1(model.predict(x)[0]))
