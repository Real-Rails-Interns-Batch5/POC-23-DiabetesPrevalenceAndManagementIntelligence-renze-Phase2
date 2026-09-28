// Synthetic diabetes cohort + regional data.
// Sources emulated: IDF Diabetes Atlas (2024), WHO GHO, UAE Weqaya screening program.

export type Emirate = {
  code: string;
  name: string;
  center: [number, number];
  population: number;
  prevalence: number; // % adults with diabetes
  screened: number; // % adults screened last 12mo
  diagnosed: number; // % of true cases diagnosed
  hba1cControlled: number; // % patients HbA1c < 7
};

export const emirates: Emirate[] = [
  { code: "AUH", name: "Abu Dhabi", center: [24.4539, 54.3773], population: 3_800_000, prevalence: 16.3, screened: 71, diagnosed: 68, hba1cControlled: 41 },
  { code: "DXB", name: "Dubai", center: [25.2048, 55.2708], population: 3_600_000, prevalence: 15.4, screened: 66, diagnosed: 72, hba1cControlled: 44 },
  { code: "SHJ", name: "Sharjah", center: [25.3463, 55.4209], population: 1_800_000, prevalence: 17.8, screened: 58, diagnosed: 61, hba1cControlled: 36 },
  { code: "AJM", name: "Ajman", center: [25.4052, 55.5136], population: 540_000, prevalence: 18.9, screened: 49, diagnosed: 55, hba1cControlled: 33 },
  { code: "UAQ", name: "Umm Al Quwain", center: [25.5647, 55.5534], population: 90_000, prevalence: 19.6, screened: 44, diagnosed: 52, hba1cControlled: 31 },
  { code: "RAK", name: "Ras Al Khaimah", center: [25.7895, 55.9432], population: 410_000, prevalence: 18.2, screened: 53, diagnosed: 58, hba1cControlled: 35 },
  { code: "FUJ", name: "Fujairah", center: [25.1288, 56.3265], population: 260_000, prevalence: 17.1, screened: 51, diagnosed: 57, hba1cControlled: 34 },
];

// HbA1c control rate trend by quarter
export const hba1cTrend = {
  quarters: ["Q1'22","Q2'22","Q3'22","Q4'22","Q1'23","Q2'23","Q3'23","Q4'23","Q1'24","Q2'24","Q3'24","Q4'24","Q1'25","Q2'25"],
  controlled: [32,33,34,34,35,36,37,38,39,40,40,41,42,43],
  uncontrolled: [68,67,66,66,65,64,63,62,61,60,60,59,58,57],
  target: Array(14).fill(55),
};

// Complication incidence per 1,000 patient-years
export const complications = [
  { code: "E11.3", name: "Retinopathy", incidence: 42.1 },
  { code: "E11.2", name: "Nephropathy", incidence: 31.7 },
  { code: "E11.4", name: "Neuropathy", incidence: 28.9 },
  { code: "I25",   name: "Coronary disease", incidence: 24.3 },
  { code: "E11.5", name: "Peripheral vascular", incidence: 14.8 },
  { code: "E11.9", name: "Diabetic foot / amputation", incidence: 6.2 },
];

// Cost-of-diabetes waterfall (AED per patient per year)
export const costWaterfall = [
  { label: "Baseline care", value: 3200, kind: "base" as const },
  { label: "+ Medication", value: 2400, kind: "add" as const },
  { label: "+ Monitoring", value: 900, kind: "add" as const },
  { label: "+ Outpatient", value: 1800, kind: "add" as const },
  { label: "+ Complications", value: 4600, kind: "add" as const },
  { label: "+ Inpatient", value: 3100, kind: "add" as const },
  { label: "− Screening savings", value: -1700, kind: "sub" as const },
  { label: "Total / patient / yr", value: 0, kind: "total" as const },
];

// Screening vs diagnosed gap (per emirate — derived above but exported for charts)
export const screeningGap = emirates.map(e => ({
  name: e.name,
  screened: e.screened,
  diagnosed: e.diagnosed,
  gap: Math.max(0, e.screened - e.diagnosed),
}));

// Synthetic patient cohort (n=24 sample)
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

const rand = (seed: number) => {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
};
const r = rand(42);

export const patients: Patient[] = Array.from({ length: 240 }, (_, i) => {
  const em = emirates[Math.floor(r() * emirates.length)];
  const hba1c = +(5.6 + r() * 6.4).toFixed(1);
  const severe = hba1c > 9;
  return {
    id: `PT-${(1000 + i).toString()}`,
    age: 28 + Math.floor(r() * 55),
    sex: r() > 0.52 ? "F" : "M",
    emirate: em.name,
    hba1c,
    retinopathy: severe ? r() > 0.4 : r() > 0.85,
    nephropathy: severe ? r() > 0.5 : r() > 0.88,
    neuropathy: severe ? r() > 0.45 : r() > 0.82,
    costAED: Math.round(2800 + hba1c * 900 + r() * 3000),
    screened: r() > 0.35,
  };
});

export const cohortStats = {
  n: patients.length,
  meanHba1c: +(patients.reduce((a, p) => a + p.hba1c, 0) / patients.length).toFixed(2),
  meanCost: Math.round(patients.reduce((a, p) => a + p.costAED, 0) / patients.length),
  anyComplication: Math.round(
    100 * patients.filter(p => p.retinopathy || p.nephropathy || p.neuropathy).length / patients.length
  ),
  totalPopulation: emirates.reduce((a, e) => a + e.population, 0),
  weightedPrevalence: +(
    emirates.reduce((a, e) => a + e.prevalence * e.population, 0) /
    emirates.reduce((a, e) => a + e.population, 0)
  ).toFixed(2),
};
