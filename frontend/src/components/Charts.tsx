import ReactECharts from "echarts-for-react";
import type { Complication, CostWaterfallItem, Hba1cTrend, ScreeningGapItem } from "@/lib/types";

const axis = {
  axisLine: { lineStyle: { color: "#475569" } },
  axisLabel: { color: "#94a3b8", fontFamily: "Inter" },
  splitLine: { lineStyle: { color: "rgba(148,163,184,0.1)" } },
};
const tooltip = {
  backgroundColor: "rgba(15,23,42,0.95)",
  borderColor: "#22d3ee",
  textStyle: { color: "#e2e8f0", fontFamily: "Inter" },
};

export function Hba1cTrendChart({ data }: { data: Hba1cTrend }) {
  const opt = {
    tooltip: { trigger: "axis", ...tooltip },
    legend: { textStyle: { color: "#cbd5e1" }, top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: "category", data: data.quarters, ...axis },
    yAxis: { type: "value", max: 100, axisLine: axis.axisLine, splitLine: axis.splitLine, axisLabel: { ...axis.axisLabel, formatter: "{value}%" } },
    series: [
      {
        name: "Controlled (HbA1c < 7)",
        type: "line", smooth: true, symbol: "circle", symbolSize: 8,
        data: data.controlled,
        lineStyle: { width: 3, color: "#22d3ee" },
        itemStyle: { color: "#22d3ee" },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(34,211,238,0.5)" }, { offset: 1, color: "rgba(34,211,238,0)" }] } },
      },
      {
        name: "Uncontrolled",
        type: "line", smooth: true, symbol: "circle", symbolSize: 6,
        data: data.uncontrolled,
        lineStyle: { width: 2, color: "#e879f9" },
        itemStyle: { color: "#e879f9" },
      },
      {
        name: "WHO target",
        type: "line", data: data.target, symbol: "none",
        lineStyle: { type: "dashed", color: "#f59e0b", width: 2 },
      },
    ],
  };
  return <ReactECharts option={opt} style={{ height: 320 }} />;
}

export function ComplicationBarChart({ data }: { data: Complication[] }) {
  const opt = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, ...tooltip,
      formatter: (p: { name: string; value: number }[]) => `<b>${p[0].name}</b><br/>${p[0].value} per 1,000 patient-years` },
    grid: { left: 140, right: 40, top: 10, bottom: 30 },
    xAxis: { type: "value", ...axis },
    yAxis: { type: "category", data: data.map(c => c.name), ...axis, inverse: true },
    series: [{
      type: "bar",
      data: data.map((c, i) => ({
        value: c.incidence,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [
            { offset: 0, color: i < 3 ? "#22d3ee" : i < 5 ? "#f59e0b" : "#f43f5e" },
            { offset: 1, color: i < 3 ? "#0891b2" : i < 5 ? "#d97706" : "#be123c" },
          ]},
        },
      })),
      barWidth: 22,
      label: { show: true, position: "right", color: "#cbd5e1", formatter: "{c}" },
    }],
  };
  return <ReactECharts option={opt} style={{ height: 320 }} />;
}

export function CostWaterfallChart({ data }: { data: CostWaterfallItem[] }) {
  const items = data;
  const helper: number[] = [];
  const positive: (number | "-")[] = [];
  const negative: (number | "-")[] = [];
  const total: (number | "-")[] = [];
  let running = 0;
  items.forEach((it) => {
    if (it.kind === "total") {
      helper.push(0);
      positive.push("-");
      negative.push("-");
      total.push(running);
    } else if (it.value >= 0) {
      helper.push(running);
      positive.push(it.value);
      negative.push("-");
      total.push("-");
      running += it.value;
    } else {
      const v = -it.value;
      running += it.value;
      helper.push(running);
      positive.push("-");
      negative.push(v);
      total.push("-");
    }
  });
  const opt = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, ...tooltip },
    grid: { left: 50, right: 20, top: 20, bottom: 60 },
    xAxis: { type: "category", data: items.map(i => i.label), axisLine: axis.axisLine, splitLine: axis.splitLine,
      axisLabel: { ...axis.axisLabel, rotate: 25, fontSize: 11 } },
    yAxis: { type: "value", axisLine: axis.axisLine, splitLine: axis.splitLine, axisLabel: { ...axis.axisLabel, formatter: "{value} AED" } },
    series: [
      { name: "helper", type: "bar", stack: "t", itemStyle: { borderColor: "transparent", color: "transparent" }, emphasis: { itemStyle: { color: "transparent" } }, data: helper },
      { name: "Add", type: "bar", stack: "t", itemStyle: { color: "#22d3ee", borderRadius: [4,4,0,0] }, data: positive, label: { show: true, position: "top", color: "#22d3ee" } },
      { name: "Save", type: "bar", stack: "t", itemStyle: { color: "#84cc16", borderRadius: [4,4,0,0] }, data: negative, label: { show: true, position: "top", color: "#84cc16", formatter: (p: { value: number }) => `−${p.value}` } },
      { name: "Total", type: "bar", stack: "t", itemStyle: { color: "#f59e0b", borderRadius: [4,4,0,0] }, data: total, label: { show: true, position: "top", color: "#f59e0b", fontWeight: 700 } },
    ],
  };
  return <ReactECharts option={opt} style={{ height: 340 }} />;
}

export function ScreeningGapChart({ data }: { data: ScreeningGapItem[] }) {
  const opt = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, ...tooltip },
    legend: { textStyle: { color: "#cbd5e1" }, top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    xAxis: { type: "category", data: data.map(s => s.name), axisLine: axis.axisLine, splitLine: axis.splitLine, axisLabel: { ...axis.axisLabel, rotate: 20, fontSize: 11 } },
    yAxis: { type: "value", max: 100, axisLine: axis.axisLine, splitLine: axis.splitLine, axisLabel: { ...axis.axisLabel, formatter: "{value}%" } },
    series: [
      { name: "Screened", type: "bar", data: data.map(s => s.screened), itemStyle: { color: "#22d3ee", borderRadius: [6,6,0,0] }, barGap: 0 },
      { name: "Diagnosed", type: "bar", data: data.map(s => s.diagnosed), itemStyle: { color: "#e879f9", borderRadius: [6,6,0,0] } },
      { name: "Gap", type: "line", smooth: true, data: data.map(s => s.gap),
        lineStyle: { width: 3, color: "#f59e0b" }, itemStyle: { color: "#f59e0b" }, symbol: "diamond", symbolSize: 10 },
    ],
  };
  return <ReactECharts option={opt} style={{ height: 320 }} />;
}
