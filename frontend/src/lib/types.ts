export type Emirate = {
  code: string;
  name: string;
  center: [number, number];
  population: number;
  prevalence: number;
  screened: number;
  diagnosed: number;
  hba1cControlled: number;
};

export type Hba1cTrend = {
  source: string;
  quarters: string[];
  controlled: number[];
  uncontrolled: number[];
  target: number[];
};

export type Complication = {
  code: string;
  name: string;
  incidence: number;
};

export type CostWaterfallItem = {
  label: string;
  value: number;
  kind: "base" | "add" | "sub" | "total";
};

export type ScreeningGapItem = {
  name: string;
  screened: number;
  diagnosed: number;
  gap: number;
};

export type Patient = {
  id: string;
  age: number;
  sex: "M" | "F";
  emirate: string;
  hba1c: number;
  retinopathy: boolean;
  nephropathy: boolean;
  neuropathy: boolean;
  costAED: number;
  screened: boolean;
};

export type CohortStats = {
  n: number;
  meanHba1c: number;
  meanCost: number;
  anyComplication: number;
  totalPopulation: number;
  weightedPrevalence: number;
};

export type LiveStatus = {
  available: boolean;
  source: string;
  indicator: string;
  country: string;
  value: number;
};

export type DashboardData = {
  live: LiveStatus;
  stats: CohortStats;
  emirates: { source: string; data: Emirate[] };
  hba1cTrend: Hba1cTrend;
  complications: { source: string; data: Complication[] };
  costWaterfall: { source: string; data: CostWaterfallItem[] };
  screeningGap: { source: string; data: ScreeningGapItem[] };
  patients: { source: string; count: number; data: Patient[] };
};
