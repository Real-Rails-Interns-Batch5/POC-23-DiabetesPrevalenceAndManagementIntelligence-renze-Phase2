import {
  cohortStats,
  complications,
  costWaterfall,
  emirates,
  hba1cTrend,
  patients,
  screeningGap,
} from "./mock-data";
import type { DashboardData } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const cache: { data: DashboardData | null; at: number } = { data: null, at: 0 };
const CACHE_MS = 5_000;

const fallbackPayload: DashboardData = {
  live: {
    available: false,
    source: "mock fallback (backend unreachable)",
    indicator: "weightedPrevalence",
    country: "ARE",
    value: cohortStats.weightedPrevalence,
  },
  stats: cohortStats,
  emirates: { source: "mock (bundled fallback)", data: emirates },
  hba1cTrend: { source: "mock (bundled fallback)", ...hba1cTrend },
  complications: { source: "mock (bundled fallback)", data: complications },
  costWaterfall: { source: "mock (bundled fallback)", data: costWaterfall },
  screeningGap: { source: "mock (bundled fallback)", data: screeningGap },
  patients: { source: "mock (bundled fallback)", count: patients.length, data: patients.slice(0, 12) },
};

export async function fetchDashboard(): Promise<DashboardData> {
  const now = Date.now();
  if (cache.data && now - cache.at < CACHE_MS) return cache.data;

  try {
    const res = await fetch(`${API_URL}/api/dashboard`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Backend returned ${res.status}`);
    const data = (await res.json()) as DashboardData;
    cache.data = data;
    cache.at = now;
    return data;
  } catch (err) {
    // If backend is unreachable, serve the bundled mock payload so the UI never blanks.
    cache.data = fallbackPayload;
    cache.at = now;
    return fallbackPayload;
  }
}
