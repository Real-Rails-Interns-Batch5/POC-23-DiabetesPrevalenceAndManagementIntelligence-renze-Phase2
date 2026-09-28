# Diabetes Intelligence — FastAPI Backend

Serves the same data the dashboard uses. Attempts a **live pull from the WHO GHO OData API** for UAE diabetes indicators; if the network or upstream fails, it falls back to bundled mock data (`backend/data/*.csv` and `*.json`) emulating **IDF Diabetes Atlas 2024**, **WHO GHO**, and **UAE Weqaya**.

## Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive Swagger UI.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/emirates` | Prevalence, screening & control by emirate |
| GET | `/api/hba1c-trend` | Quarterly HbA1c control rate |
| GET | `/api/complications` | ICD-10 complication incidence |
| GET | `/api/cost-waterfall` | Cost-of-diabetes breakdown (AED) |
| GET | `/api/screening-gap` | Screened vs diagnosed gap |
| GET | `/api/patients?limit=N` | Synthetic patient cohort |
| GET | `/api/stats` | Aggregate cohort + population stats |
| GET | `/api/live/who-uae` | **Live** WHO GHO pull, mock fallback |

## Mock data files

- `data/emirates.json`
- `data/hba1c_trend.csv`
- `data/complications.csv`
- `data/cost_waterfall.csv`

The 240-patient cohort is generated deterministically (seed=42) at startup.

## Wiring to the frontend

The React dashboard currently reads from `src/lib/mock-data.ts`. To consume this API instead, fetch e.g. `http://localhost:8000/api/emirates` and feed the response into the same components. CORS is open (`*`) for local dev.
