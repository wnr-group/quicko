"use client";

// Thin Mapbox GL JS wrapper: markers + an optional route line, auto-fitted.
// Pure presentation — routing/matching logic lives in components/directions.ts
// and core/. Load it with next/dynamic({ ssr: false }); GL needs the browser.
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_STYLE, MAPBOX_TOKEN, mapboxConfigured } from "@/lib/maps";
import { enrichBaseMap } from "@/lib/mapStyle";
import { boundsOf, type LngLat } from "@/core/routeCorridor";
import type { LatLng } from "@/core/geo";

export type MarkerKind = "from" | "to" | "pkgFrom" | "pkgTo";
export interface MapMarker extends LatLng {
  kind: MarkerKind;
  label?: string;
}

const SRC = "route-src";
const LAYER_CASING = "route-casing";
const LAYER_LINE = "route-line";

// Same visual language as the location picker: A = ink pin, B = brand pin;
// package stops are rounded squares so they read apart from the trip's ends.
function markerEl(kind: MarkerKind, label?: string): HTMLElement {
  const el = document.createElement("div");
  const isFrom = kind === "from" || kind === "pkgFrom";
  const pkg = kind === "pkgFrom" || kind === "pkgTo";
  el.className = "grid h-7 w-7 place-items-center border-2 border-white text-[11px] font-bold shadow-pop";
  el.classList.add(pkg ? "rounded-md" : "rounded-full");
  el.classList.add(...(isFrom ? ["bg-ink", "text-brand"] : ["bg-brand", "text-ink"]));
  el.textContent = pkg ? (isFrom ? "↑" : "↓") : isFrom ? "A" : "B";
  if (label) el.title = label;
  return el;
}

export default function MapCanvas({
  markers,
  line,
  className = "h-full w-full",
  onError,
}: {
  markers: MapMarker[];
  /** Road geometry as [lng, lat] pairs. */
  line?: LngLat[] | null;
  className?: string;
  onError?: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const live = useRef<mapboxgl.Marker[]>([]);
  const [ready, setReady] = useState(false);

  // Create the map once.
  useEffect(() => {
    // mapboxConfigured() (not just a non-empty string) — a malformed token
    // would otherwise init GL and fail with a 401 storm.
    if (!box.current || !mapboxConfigured()) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: box.current,
      style: MAPBOX_STYLE,
      center: [78.9629, 20.5937], // India; fitted as soon as there are points
      zoom: 3.5,
      attributionControl: true,
      cooperativeGestures: false,
    });
    m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    m.on("load", () => {
      enrichBaseMap(m);
      setReady(true);
    });
    m.on("error", (e) => {
      // Tile/style errors (bad token, offline) — surface once, don't spam.
      if ((e.error as { status?: number } | undefined)?.status === 401) onError?.();
    });
    map.current = m;
    return () => {
      live.current.forEach((x) => x.remove());
      live.current = [];
      m.remove();
      map.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markers + route + fit, re-run when inputs change (no page refresh needed).
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;

    live.current.forEach((x) => x.remove());
    live.current = markers.map((p) =>
      new mapboxgl.Marker({ element: markerEl(p.kind, p.label) })
        .setLngLat([p.lng, p.lat])
        .addTo(m),
    );

    const data = {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: line ?? [] },
    };
    const src = m.getSource(SRC) as mapboxgl.GeoJSONSource | undefined;
    if (src) src.setData(data);
    else {
      m.addSource(SRC, { type: "geojson", data });
      m.addLayer({
        id: LAYER_CASING, type: "line", source: SRC,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ffffff", "line-width": 9 },
      });
      m.addLayer({
        id: LAYER_LINE, type: "line", source: SRC,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#000000", "line-width": 5 },
      });
    }

    const pts: LatLng[] = [
      ...markers,
      ...(line ?? []).map(([lng, lat]) => ({ lat, lng })),
    ];
    const b = boundsOf(pts);
    if (b) {
      if (pts.length === 1) m.easeTo({ center: [pts[0].lng, pts[0].lat], zoom: 13 });
      else m.fitBounds(b, { padding: 56, maxZoom: 15, duration: 600 });
    }
  }, [markers, line, ready]);

  return <div ref={box} className={className} />;
}
