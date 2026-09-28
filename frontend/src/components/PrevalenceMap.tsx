import { useEffect, useRef, useState } from "react";
import type { Map as LMap } from "leaflet";
import type { Emirate } from "@/lib/types";

// Client-only Leaflet choropleth: proportional-symbol map colored by prevalence.
// No pulsing rings (they overlapped) — instead: crisp bubbles with permanent labels.
export function PrevalenceMap({ data }: { data: Emirate[] }) {
  const el = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (initialized.current || !el.current || data.length === 0) return;
    initialized.current = true;
    let map: LMap | null = null;

    (async () => {
      const L = await import("leaflet");
      if (!el.current) return;
      map = L.map(el.current, {
        center: [25.0, 55.5],
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      });
      L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=cb1_42ay_1_2853ebabed97b674e4104824",
  {
    subdomains: "abcd",
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors, © CARTO",
  }
).addTo(map);

      const min = Math.min(...data.map(e => e.prevalence));
      const max = Math.max(...data.map(e => e.prevalence));
      const color = (v: number) => {
        const t = (v - min) / (max - min);
        if (t < 0.5) return `hsl(${190 - t * 90}, 90%, 62%)`;
        return `hsl(${45 - (t - 0.5) * 90}, 92%, 60%)`;
      };

      data.forEach(e => {
        const radius = 10 + (e.prevalence - min) * 4.2;
        // solid bubble
        L.circleMarker(e.center, {
          radius,
          color: color(e.prevalence),
          weight: 2,
          fillColor: color(e.prevalence),
          fillOpacity: 0.55,
        })
          .addTo(map!)
          .bindTooltip(
            `<div style="font-family:Inter;font-size:12px;color:#e2e8f0;min-width:150px">
              <div style="font-weight:700;color:${color(e.prevalence)};margin-bottom:2px">${e.name}</div>
              <div>Prevalence: <b>${e.prevalence}%</b></div>
              <div>Screened: ${e.screened}% · Diagnosed: ${e.diagnosed}%</div>
              <div>HbA1c &lt; 7: ${e.hba1cControlled}%</div>
            </div>`,
            { direction: "top", offset: [0, -6], sticky: true }
          );

        // permanent floating label offset from the bubble so they don't overlap
        L.marker(e.center, {
          icon: L.divIcon({
            className: "emirate-label",
            html: `<div style="
              transform: translate(${radius + 6}px, -8px);
              white-space: nowrap;
              font-family: 'JetBrains Mono', monospace;
              font-size: 10px;
              color: #e2e8f0;
              background: rgba(15,23,42,0.75);
              border: 1px solid ${color(e.prevalence)};
              padding: 2px 6px;
              border-radius: 4px;
              backdrop-filter: blur(4px);
            ">${e.name} · <b style="color:${color(e.prevalence)}">${e.prevalence}%</b></div>`,
            iconSize: [1, 1],
            iconAnchor: [0, 0],
          }),
          interactive: false,
        }).addTo(map!);
      });

      // Fit bounds so all emirates are comfortably visible
      const bounds = L.latLngBounds(data.map(e => e.center));
      map.fitBounds(bounds, { padding: [40, 40] });

      setReady(true);
    })();

    return () => {
      map?.remove();
      initialized.current = false;
    };
  }, [data]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-border">
      <div ref={el} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm bg-card/40">
          Loading map…
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 glass-panel px-3 py-2 text-xs">
        <div className="text-muted-foreground mb-1">Adult prevalence</div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-16 rounded-full" style={{ background: "linear-gradient(90deg, hsl(190,90%,62%), hsl(45,92%,60%), hsl(340,90%,60%))" }} />
          <span className="font-mono">15% — 20%</span>
        </div>
      </div>
    </div>
  );
}
