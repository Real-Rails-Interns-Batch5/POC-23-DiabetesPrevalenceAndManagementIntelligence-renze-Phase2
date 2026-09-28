import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { DashboardData } from "@/lib/types";

export function ControlDeckPanel({ data }: { data: DashboardData }) {
  const [open, setOpen] = useState(false);

  const emirates = data.emirates.data;
  const complications = data.complications.data;
  const screeningGap = data.screeningGap.data;
  const patients = data.patients.data;
  const stats = data.stats;

  const leadingComplication = complications.length > 0
    ? [...complications].sort((a, b) => b.incidence - a.incidence)[0]
    : null;
  const latestControlled = data.hba1cTrend.controlled.at(-1) ?? 0;
  const biggestGap = screeningGap.length > 0
    ? [...screeningGap].sort((a, b) => (b.screened - b.diagnosed) - (a.screened - a.diagnosed))[0]
    : null;
  const liveColor = data.live.available ? "var(--lime)" : "var(--amber)";

  const downloadCsv = () => {
    if (patients.length === 0) return;
    const header = ["id", "age", "sex", "emirate", "hba1c", "retinopathy", "nephropathy", "neuropathy", "screened", "costAED"];
    const rows = patients.map(p => [p.id, p.age, p.sex, p.emirate, p.hba1c, p.retinopathy, p.nephropathy, p.neuropathy, p.screened, p.costAED].join(","));
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diabetes-cohort.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Close on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Floating trigger — fixed so it never disturbs layout */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-primary/40 bg-card/80 px-4 py-2 text-xs font-medium text-primary backdrop-blur transition hover:bg-card md:right-6 md:top-6"
        aria-label="Open Control Deck"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Control Deck
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            />
            {/* Panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-border bg-card/95 backdrop-blur-xl"
            >
              <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: liveColor }} />
                    System Rails Profile
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <h2 className="font-display text-3xl font-bold leading-tight">
                  Chronic Disease<br />Control Deck
                </h2>

                <div className="mt-4 rounded-lg border border-border bg-background/40 p-3 text-xs">
                  <div className="text-muted-foreground font-mono uppercase tracking-widest">Live data source</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: liveColor }} />
                    <span>{data.live.available ? "WHO GHO connected" : "Using mock fallback"}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{data.live.source}</div>
                </div>

                <Section title="Who controls this rail">
                  Governed under a chronic-disease surveillance framework aligned to
                  <b className="text-foreground"> IDF Diabetes Atlas</b> methodology,
                  <b className="text-foreground"> WHO Eastern Mediterranean</b> NCD reporting, and
                  UAE Ministry of Health &amp; Prevention / <b className="text-foreground">Abu Dhabi Weqaya</b> screening protocols.
                </Section>

                <Section title="Why this matters">
                  Gulf states report among the highest diabetes prevalence rates in the world.
                  This rail quantifies the burden by emirate and surfaces exactly where
                  screening, diagnosis, and glycemic control are breaking down before
                  complications compound cost.
                </Section>

                <Section title="System insights summary">
                  <ul className="space-y-3">
                    <Insight color="var(--amber)">
                      <b style={{ color: "var(--amber)" }}>{stats.weightedPrevalence}%</b> diagnosed prevalence across the sampled
                      cohort — consistent with IDF high-burden GCC bands.
                    </Insight>
                    <Insight color="var(--lime)">
                      <b style={{ color: "var(--lime)" }}>{latestControlled}%</b> of diagnosed patients are at glycemic target
                      (HbA1c &lt;7.0%), up from the earliest tracked quarter.
                    </Insight>
                    {leadingComplication && (
                      <Insight color="var(--destructive)">
                        <b style={{ color: "var(--destructive)" }}>{leadingComplication.name}</b> is the leading complication at{" "}
                        <b>{leadingComplication.incidence}</b> per 1,000 patient-years.
                      </Insight>
                    )}
                    {biggestGap && (
                      <Insight color="var(--amber)">
                        Largest screening-to-diagnosis gap:{" "}
                        <b style={{ color: "var(--amber)" }}>{biggestGap.name}</b> at an estimated{" "}
                        <b>{biggestGap.screened - biggestGap.diagnosed} pts</b> undiagnosed.
                      </Insight>
                    )}
                  </ul>
                </Section>

                <Section title="Data sources">
                  <div className="flex flex-wrap gap-2">
                    {["IDF Diabetes Atlas", "WHO NCD-CD", "UAE Weqaya", "Synthetic Cohort"].map(s => (
                      <span key={s} className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </Section>

                <button
                  onClick={downloadCsv}
                  className="mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  ↓ Download Cohort Data (.CSV)
                </button>

                <div className="mt-6 rounded-lg border border-border bg-background/40 p-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Rail v2.6 · {emirates.length} emirates · n={stats.n}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="text-sm leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}

function Insight({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1.5 h-0 w-0 shrink-0" style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${color}` }} />
      <span className="text-sm leading-relaxed text-foreground/85">{children}</span>
    </li>
  );
}
