# Diabetes Insights 3D

An interactive 3D diabetes intelligence dashboard for exploring diabetes prevalence, management indicators, and regional health insights.

## Overview

**Diabetes Insights 3D** combines an interactive 3D visualization with health-data indicators to make diabetes-related information easier to explore and understand.

The dashboard is designed around a Gulf-region chronic-disease intelligence use case and references data sources including:

- WHO Global Health Observatory (WHO GHO)
- IDF Diabetes Atlas
- UAE Weqaya screening/program context

The application supports live-data status detection with a fallback mode when the live data source is unavailable.

## Features

- Interactive 3D diabetes visualization
- Diabetes prevalence and management indicators
- Gulf-region focused dashboard
- Live data status indicator
- Automatic fallback to mock data when live data is unavailable
- Per-chart data-source information
- Separate frontend and backend architecture

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Interactive 3D/web visualization

### Backend

- Python
- FastAPI
- Uvicorn

## Project Structure

```text
diabetes-insights-3d/
├── backend/
│   ├── app/
│   ├── data/
│   ├── README.md
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
└── README.md