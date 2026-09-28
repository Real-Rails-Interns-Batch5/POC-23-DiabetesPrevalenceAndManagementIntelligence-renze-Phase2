import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ComplicationBarChart, CostWaterfallChart, Hba1cTrendChart, ScreeningGapChart } from "@/components/Charts";
import { ControlDeckPanel } from "@/components/ControlDeckPanel";
import { fetchDashboard } from "@/lib/api";
import { cohortStats, emirates, patients } from "@/lib/mock-data";
import type { DashboardData, Emirate } from "@/lib/types";

const HeroScene = lazy(() => import("@/components/HeroScene").then(m => ({ default: m.HeroScene })));
const PrevalenceMap = lazy(() => import("@/components/PrevalenceMap").then(m => ({ default: m.PrevalenceMap })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Diabetes Prevalence & Management Intelligence" },
      { name: "description", content: "Real-time intelligence dashboard tracking diabetes prevalence, HbA1c control, complications and cost of care across the UAE — fusing IDF Atlas, WHO and Weqaya data." },
      { property: "og:title", content: "Diabetes Prevalence & Management Intelligence" },
      { property: "og:description", content: "Where diabetes management is breaking down in the Gulf — visualized." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

function Stat({ label, value, sub, delay = 0, accent }: { label: string; value: string; sub?: string; delay?: number; accent?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="glass-panel p-5"
    >
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-4xl font-bold" style={accent ? { color: accent } : undefined}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

function Panel({ title, subtitle, right, children, delay = 0 }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay }}
      className="glass-panel p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </motion.section>
  );
}

function Dashboard() {
  const mounted = useMounted();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 30_000,
  });

  const d = data ?? {
    live: { available: false, source: "mock fallback", indicator: "weightedPrevalence", country: "ARE", value: cohortStats.weightedPrevalence },
    stats: cohortStats,
    emirates: { source: "mock", data: emirates },
    hba1cTrend: { source: "mock", quarters: [], controlled: [], uncontrolled: [], target: [] },
    complications: { source: "mock", data: [] },
    costWaterfall: { source: "mock", data: [] },
    screeningGap: { source: "mock", data: [] },
    patients: { source: "mock", count: 0, data: [] },
  };

  const liveColor = d.live.available ? "#a3e635" : "#f59e0b";
  const liveLabel = d.live.available ? "LIVE · WHO GHO" : "FALLBACK · MOCK DATA";

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

      <ControlDeckPanel data={d} />

      {/* NAV */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-lg" style={{ background: "var(--gradient-primary)" }}>
            <div className="absolute inset-0 animate-pulse-ring rounded-lg" />
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-tight">GLYCEMIC.INTEL</div>
            <div className="font-mono text-[10px] text-muted-foreground">CHRONIC-DISEASE RAIL · v2.6</div>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs md:flex">
          <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: liveColor }} />
          <span className="font-mono text-muted-foreground">{liveLabel}</span>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 pb-16 pt-6 md:grid-cols-2 md:pt-12">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Gulf Region · Chronic Disease Intelligence
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Diabetes doesn't <span className="text-gradient">explain itself.</span>
            <br /> This dashboard does.
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground">
            The Gulf carries the world's highest diabetes prevalence.
            We fuse the <b className="text-foreground">IDF Diabetes Atlas</b>, <b className="text-foreground">WHO GHO</b> and
            UAE's <b className="text-foreground">Weqaya</b> screening program to show where management is breaking down —
            emirate by emirate, patient by patient.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3 text-xs">
            <div><div className="font-mono text-2xl font-bold text-primary">{d.stats.weightedPrevalence}%</div><div className="text-muted-foreground">Weighted adult prevalence</div></div>
            <div><div className="font-mono text-2xl font-bold text-accent">1 in 6</div><div className="text-muted-foreground">Adults living with T2DM</div></div>
            <div><div className="font-mono text-2xl font-bold" style={{color:"var(--magenta)"}}>{d.stats.anyComplication}%</div><div className="text-muted-foreground">Cohort with ≥1 complication</div></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0 }}
          className="relative h-[420px] md:h-[520px]"
        >
          <div className="absolute inset-0 rounded-3xl border border-primary/20 glow-cyan overflow-hidden">
            {mounted && (
              <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground text-sm">Rendering molecule…</div>}>
                <HeroScene />
              </Suspense>
            )}
          </div>
          <div className="absolute -bottom-4 left-6 right-6 flex justify-between rounded-xl border border-border bg-card/80 px-4 py-3 backdrop-blur">
            <div>
              <div className="font-mono text-[10px] text-muted-foreground">MOLECULE</div>
              <div className="text-sm font-medium">Glucose · C₆H₁₂O₆</div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-muted-foreground">TARGET HbA1c</div>
              <div className="text-sm font-medium text-primary">&lt; 7.0 %</div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-muted-foreground">COHORT n</div>
              <div className="text-sm font-medium">{d.stats.n}</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* KPI STRIP */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Adult prevalence" value={`${d.stats.weightedPrevalence}%`} sub="Weighted across 7 emirates" delay={0.05} accent="var(--cyan)" />
          <Stat label="Mean HbA1c" value={`${d.stats.meanHba1c}%`} sub={`Target < 7.0 · Cohort n=${d.stats.n}`} delay={0.1} accent="var(--amber)" />
          <Stat label="Cost / patient / yr" value={`AED ${d.stats.meanCost.toLocaleString()}`} sub="All-cause diabetes-attributable" delay={0.15} accent="var(--magenta)" />
          <Stat label="Population covered" value={`${(d.stats.totalPopulation / 1_000_000).toFixed(1)} M`} sub="UAE resident adults" delay={0.2} accent="var(--lime)" />
        </div>
      </section>

      {/* MAP + TREND */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-12">
        <div className="grid gap-6 lg:grid-cols-5">
          <div id="map" className="lg:col-span-3">
            <Panel title="Prevalence choropleth by emirate" subtitle={`Source: ${d.emirates.source}. Symbol size + hue encode adult diabetes prevalence. Hover a node.`}>
              {mounted && (
                <Suspense fallback={<div className="h-[420px] flex items-center justify-center text-muted-foreground text-sm">Loading map…</div>}>
                  <PrevalenceMap data={d.emirates.data} />
                </Suspense>
              )}
            </Panel>
          </div>
          <div id="control" className="lg:col-span-2">
            <Panel title="HbA1c control rate" subtitle={`Source: ${d.hba1cTrend.source}. % of patients under target (<7.0). WHO 2030 goal = 55%.`} delay={0.1}>
              <Hba1cTrendChart data={d.hba1cTrend} />
              <div className="mt-3 flex items-center justify-between rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-xs">
                <span className="text-amber">Gap to WHO 2030 target</span>
                <span className="font-mono font-bold" style={{color:"var(--amber)"}}>−12 pts</span>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* COMPLICATIONS + COST */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <div id="complications">
            <Panel title="Complication incidence" subtitle={`Source: ${d.complications.source}. Events per 1,000 patient-years, coded per ICD-10.`}>
              <ComplicationBarChart data={d.complications.data} />
            </Panel>
          </div>
          <div id="cost">
            <Panel title="Cost-of-diabetes waterfall" subtitle={`Source: ${d.costWaterfall.source}. AED per patient per year. Screening reclaims ~AED 1,700.`} delay={0.1}>
              <CostWaterfallChart data={d.costWaterfall.data} />
            </Panel>
          </div>
        </div>
      </section>

      {/* GAP */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-12">
        <Panel title="Screening vs Diagnosed — where does the funnel leak?" subtitle={`Source: ${d.screeningGap.source}. Weqaya reaches many adults; conversion to a formal diagnosis varies by emirate.`}>
          <ScreeningGapChart data={d.screeningGap.data} />
        </Panel>
      </section>

      {/* COHORT TABLE */}
      <section id="cohort" className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <Panel title="Synthetic patient cohort" subtitle={`Source: ${d.patients.source}. Sample of ${d.patients.data.length} of ${d.patients.count} synthetic records · HbA1c, complications, cost.`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-3 pr-4">Patient</th>
                  <th className="py-3 pr-4">Age / Sex</th>
                  <th className="py-3 pr-4">Emirate</th>
                  <th className="py-3 pr-4">HbA1c</th>
                  <th className="py-3 pr-4">Retino.</th>
                  <th className="py-3 pr-4">Nephro.</th>
                  <th className="py-3 pr-4">Neuro.</th>
                  <th className="py-3 pr-4">Screened</th>
                  <th className="py-3 pr-4 text-right">Cost (AED)</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {d.patients.data.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-card/60"
                  >
                    <td className="py-2.5 pr-4 text-primary">{p.id}</td>
                    <td className="py-2.5 pr-4">{p.age} · {p.sex}</td>
                    <td className="py-2.5 pr-4">{p.emirate}</td>
                    <td className="py-2.5 pr-4" style={{ color: p.hba1c > 9 ? "var(--destructive)" : p.hba1c > 7 ? "var(--amber)" : "var(--lime)" }}>
                      {p.hba1c.toFixed(1)}%
                    </td>
                    <td className="py-2.5 pr-4">{p.retinopathy ? "●" : "—"}</td>
                    <td className="py-2.5 pr-4">{p.nephropathy ? "●" : "—"}</td>
                    <td className="py-2.5 pr-4">{p.neuropathy ? "●" : "—"}</td>
                    <td className="py-2.5 pr-4">{p.screened ? "Y" : "N"}</td>
                    <td className="py-2.5 pr-4 text-right">{p.costAED.toLocaleString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      {/* EMIRATE CARDS */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <h2 className="mb-6 font-display text-2xl font-bold">Emirate briefing</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {d.emirates.data.map((e, i) => (
            <EmirateCard key={e.code} emirate={e} i={i} />
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground">
          <div>
            <div className="font-display text-sm text-foreground">GLYCEMIC.INTEL</div>
            <div className="mt-1">{isLoading ? "Loading dashboard data…" : `Data source: ${d.live.source}. ${d.live.available ? "Live WHO feed connected." : "Using bundled mock fallback."}`}</div>
          </div>
          
        </div>
      </footer>
    </div>
  );
}

function EmirateCard({ emirate: e, i }: { emirate: Emirate; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05, duration: 0.6 }}
      whileHover={{ y: -6, rotateX: 4, rotateY: -4 }}
      className="glass-panel p-5"
      style={{ transformStyle: "preserve-3d", perspective: 800 }}
    >
      <div className="flex items-center justify-between">
        <div className="font-display font-semibold">{e.name}</div>
        <span className="font-mono text-[10px] text-muted-foreground">{e.code}</span>
      </div>
      <div className="mt-3 font-mono text-3xl font-bold" style={{ color: e.prevalence > 18 ? "var(--destructive)" : e.prevalence > 16 ? "var(--amber)" : "var(--cyan)" }}>
        {e.prevalence}%
      </div>
      <div className="mt-1 text-xs text-muted-foreground">Adult prevalence</div>
      <div className="mt-4 space-y-2 text-xs">
        <Bar label="Screened" pct={e.screened} color="var(--cyan)" />
        <Bar label="Diagnosed" pct={e.diagnosed} color="var(--magenta)" />
        <Bar label="HbA1c ctrl" pct={e.hba1cControlled} color="var(--amber)" />
      </div>
    </motion.div>
  );
}

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ background: color, height: "100%" }}
        />
      </div>
    </div>
  );
}
