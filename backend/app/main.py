"""FastAPI backend for Diabetes Prevalence & Management Intelligence.

Tries to fetch live indicators from WHO GHO OData API; falls back to bundled
CSV/JSON mock data (emulated IDF Atlas + UAE Weqaya) when the network or
upstream is unavailable.

Run:
    cd backend
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

import csv
import json
import random
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

app = FastAPI(
    title="Diabetes Intelligence API",
    description="Serves diabetes prevalence, HbA1c control, complications, cost and cohort data. Live WHO GHO with mock fallback.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _read_json(name: str) -> Any:
    return json.loads((DATA_DIR / name).read_text())


def _read_csv(name: str) -> list[dict[str, Any]]:
    with (DATA_DIR / name).open() as f:
        rows = list(csv.DictReader(f))
    # coerce numerics
    for row in rows:
        for k, v in row.items():
            try:
                if "." in v:
                    row[k] = float(v)
                else:
                    row[k] = int(v)
            except (ValueError, TypeError):
                pass
    return rows


# ---------- Synthetic cohort (deterministic) ----------
def _build_cohort(n: int = 240) -> list[dict[str, Any]]:
    rng = random.Random(42)
    emirates = _read_json("emirates.json")
    out = []
    for i in range(n):
        em = rng.choice(emirates)
        hba1c = round(5.6 + rng.random() * 6.4, 1)
        severe = hba1c > 9
        out.append({
            "id": f"PT-{1000 + i}",
            "age": 28 + int(rng.random() * 55),
            "sex": "F" if rng.random() > 0.52 else "M",
            "emirate": em["name"],
            "hba1c": hba1c,
            "retinopathy": (rng.random() > (0.4 if severe else 0.85)),
            "nephropathy": (rng.random() > (0.5 if severe else 0.88)),
            "neuropathy": (rng.random() > (0.45 if severe else 0.82)),
            "costAED": int(2800 + hba1c * 900 + rng.random() * 3000),
            "screened": rng.random() > 0.35,
        })
    return out


_COHORT = _build_cohort()


# ---------- Live: WHO GHO diabetes indicator (NCD_GLUC_04 = raised fasting blood glucose) ----------
async def _fetch_who_uae_prevalence() -> dict[str, Any] | None:
    url = (
        "https://ghoapi.azureedge.net/api/NCD_GLUC_04"
        "?$filter=SpatialDim eq 'ARE'&$orderby=TimeDim desc&$top=5"
    )
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.get(url)
            r.raise_for_status()
            data = r.json().get("value", [])
            if not data:
                return None
            latest = data[0]
            return {
                "source": "WHO GHO (live)",
                "indicator": "NCD_GLUC_04",
                "country": "ARE",
                "year": latest.get("TimeDim"),
                "value": latest.get("NumericValue"),
            }
    except Exception:
        return None


# ---------- Routes ----------
@app.get("/")
def root():
    return {
        "service": "Diabetes Intelligence API",
        "endpoints": [
            "/api/emirates", "/api/hba1c-trend", "/api/complications",
            "/api/cost-waterfall", "/api/screening-gap", "/api/patients",
            "/api/stats", "/api/live/who-uae",
        ],
    }


@app.get("/api/emirates")
def emirates():
    return {"source": "mock (IDF Atlas 2024 emulated)", "data": _read_json("emirates.json")}


@app.get("/api/hba1c-trend")
def hba1c_trend():
    rows = _read_csv("hba1c_trend.csv")
    return {
        "source": "mock (WHO GHO emulated)",
        "quarters": [r["quarter"] for r in rows],
        "controlled": [r["controlled"] for r in rows],
        "uncontrolled": [r["uncontrolled"] for r in rows],
        "target": [r["target"] for r in rows],
    }


@app.get("/api/complications")
def complications():
    return {"source": "mock (ICD-10 emulated)", "data": _read_csv("complications.csv")}


@app.get("/api/cost-waterfall")
def cost_waterfall():
    return {"source": "mock (UAE MoH emulated)", "data": _read_csv("cost_waterfall.csv")}


@app.get("/api/screening-gap")
def screening_gap():
    ems = _read_json("emirates.json")
    return {
        "source": "mock (UAE Weqaya emulated)",
        "data": [
            {
                "name": e["name"],
                "screened": e["screened"],
                "diagnosed": e["diagnosed"],
                "gap": max(0, e["screened"] - e["diagnosed"]),
            }
            for e in ems
        ],
    }


@app.get("/api/patients")
def patients(limit: int = 240):
    return {"source": "synthetic cohort (seed=42)", "count": len(_COHORT[:limit]), "data": _COHORT[:limit]}


@app.get("/api/stats")
def stats():
    n = len(_COHORT)
    mean_hba1c = round(sum(p["hba1c"] for p in _COHORT) / n, 2)
    mean_cost = round(sum(p["costAED"] for p in _COHORT) / n)
    any_comp = round(100 * sum(1 for p in _COHORT if p["retinopathy"] or p["nephropathy"] or p["neuropathy"]) / n)
    ems = _read_json("emirates.json")
    total_pop = sum(e["population"] for e in ems)
    weighted = round(sum(e["prevalence"] * e["population"] for e in ems) / total_pop, 2)
    return {
        "n": n, "meanHba1c": mean_hba1c, "meanCost": mean_cost,
        "anyComplication": any_comp, "totalPopulation": total_pop,
        "weightedPrevalence": weighted,
    }


@app.get("/api/live/who-uae")
async def live_who_uae():
    """Attempt WHO GHO live pull; fall back to mock weighted prevalence."""
    live = await _fetch_who_uae_prevalence()
    if live:
        return {**live, "available": True}
    s = stats()
    return {
        "source": "mock fallback (WHO GHO unreachable)",
        "indicator": "weightedPrevalence",
        "country": "ARE",
        "value": s["weightedPrevalence"],
        "available": False,
    }


@app.get("/api/dashboard")
async def dashboard():
    """Single-call dashboard payload: emirates, trends, complications, cost, gap, cohort and live status.
    If WHO GHO live data is unavailable, every chart still renders from the mock fallback files.
    """
    live = await _fetch_who_uae_prevalence()
    live_status = {
        "available": bool(live),
        "source": live["source"] if live else "mock fallback (WHO GHO unreachable)",
        "indicator": live["indicator"] if live else "weightedPrevalence",
        "country": "ARE",
        "value": live["value"] if live else stats()["weightedPrevalence"],
    }
    return {
        "live": live_status,
        "stats": stats(),
        "emirates": emirates(),
        "hba1cTrend": hba1c_trend(),
        "complications": complications(),
        "costWaterfall": cost_waterfall(),
        "screeningGap": screening_gap(),
        "patients": patients(limit=12),
    }
