
import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from src.data import load_data, field_daily, well_summary, features_for_well
from src.models import train_forecaster, forecast_30d, build_surrogate
from src.optimizer import scenarios

st.set_page_config(page_title="MATURE-X", page_icon="🛢️", layout="wide")
st.title("🛢️ MATURE-X")
st.caption("AI-assisted mature-field production optimisation & reservoir decision support")

df=load_data()
field=field_daily(df)
summary=well_summary(df)
surrogate=build_surrogate(df)

# Sidebar
st.sidebar.header("Field Controls")
well_options=summary["well"].tolist()
selected=st.sidebar.selectbox("Select producer", well_options, index=0)
horizon=st.sidebar.slider("Forecast horizon (days)", 7, 60, 30)

sel=df[df["well"]==selected].sort_values("date")
features=features_for_well(df,selected)
model,metrics=train_forecaster(features)

active_sel=sel[sel["oil_rate"].fillna(0)>0]
latest=active_sel.iloc[-1] if not active_sel.empty else sel.iloc[-1]
s=scenarios(surrogate,latest)
best=s[0]

# KPIs
c1,c2,c3,c4=st.columns(4)
c1.metric("Current oil rate",f"{latest['oil_rate']:,.0f} Sm³/d")
c2.metric("Water cut",f"{latest['water_cut']*100:.1f}%")
c3.metric("Pressure",f"{latest['pressure_bar']:.1f} bar")
c4.metric("AI priority",str(summary.loc[summary.well==selected,"priority"].iloc[0]))

st.markdown("---")
left,right=st.columns([1.65,1])

with left:
    st.subheader("Field production trajectory")
    fig=go.Figure()
    fig.add_trace(go.Scatter(x=field.date,y=field.oil_rate,name="Field oil",mode="lines"))
    fig.update_layout(height=330,margin=dict(l=10,r=10,t=20,b=10),yaxis_title="Oil Sm³/day")
    st.plotly_chart(fig,use_container_width=True)

    st.subheader(f"{selected} — historical production")
    fig2=go.Figure()
    fig2.add_trace(go.Scatter(x=sel.date,y=sel.oil_rate,name="Oil",mode="lines"))
    fig2.add_trace(go.Scatter(x=sel.date,y=sel.water_rate,name="Water",mode="lines"))
    fig2.update_layout(height=300,margin=dict(l=10,r=10,t=20,b=10))
    st.plotly_chart(fig2,use_container_width=True)

with right:
    st.subheader("🤖 AI recommendation")
    st.success(f"Recommended scenario: choke {best['choke_change_pct']:+.0f}% | injection {best['injection_change_pct']:+.0f}%")
    base=latest["oil_rate"]
    gain=(best["predicted_oil"]-base)/max(base,1)*100
    st.metric("Predicted oil response",f"{best['predicted_oil']:,.0f} Sm³/d",f"{gain:+.1f}%")
    st.metric("Predicted water cut",f"{best['predicted_water_cut']*100:.1f}%",f"{(best['predicted_water_cut']-latest['water_cut'])*100:+.1f} pp")
    st.metric("Scenario pressure",f"{best['pressure']:.1f} bar")
    st.caption("Decision score combines predicted oil uplift, water-cut penalty and operating-change penalty. It is a surrogate scenario model for demonstration—not a validated causal reservoir simulator.")

    st.subheader("Top intervention scenarios")
    table=pd.DataFrame(s[:6])
    table["oil_gain_%"]=((table.predicted_oil-base)/max(base,1)*100).round(1)
    table["water_cut_%"]=(table.predicted_water_cut*100).round(1)
    st.dataframe(table[["choke_change_pct","injection_change_pct","oil_gain_%","water_cut_%","score"]].rename(columns={
        "choke_change_pct":"Choke Δ%","injection_change_pct":"Injection Δ%",
        "oil_gain_%":"Oil gain %","water_cut_%":"Water cut %"
    }),hide_index=True,use_container_width=True)

st.markdown("---")
st.subheader("Well prioritisation")
display=summary.copy()
display["Cumulative oil (Sm³)"]=display["cumulative_oil"].round(0)
display["Health"]=display["health_score"].round(1)
display["Water cut"]= (display["latest_water_cut"]*100).round(1)
st.dataframe(display[["well","Cumulative oil (Sm³)","latest_oil","Water cut","Health","priority"]].rename(columns={
    "well":"Well","latest_oil":"Latest oil (Sm³/d)","priority":"Intervention priority"
}),hide_index=True,use_container_width=True)

if model is not None:
    st.subheader(f"{selected} — {horizon}-day production forecast")
    fc=forecast_30d(features,model,horizon)
    fig3=go.Figure()
    hist=(active_sel if not active_sel.empty else sel).tail(120)
    fig3.add_trace(go.Scatter(x=hist.date,y=hist.oil_rate,name="Historical",mode="lines"))
    if not fc.empty:
        fig3.add_trace(go.Scatter(x=fc.date,y=fc.forecast_oil,name="AI forecast",mode="lines"))
    fig3.update_layout(height=300,margin=dict(l=10,r=10,t=20,b=10),yaxis_title="Oil Sm³/day")
    st.plotly_chart(fig3,use_container_width=True)
    st.caption(f"Holdout validation — MAE: {metrics['MAE']:.1f} Sm³/d | MAPE: {metrics['MAPE']:.1f}%")

st.markdown("---")
st.caption("Data mode: " + ("Volve production workbook detected." if __import__('pathlib').Path("data/raw/Volve production data.xlsx").exists() else "Synthetic demo data. Add the Volve workbook to data/raw/ for real-data mode."))
