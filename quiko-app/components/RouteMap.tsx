"use client";

// Route preview: pickup/destination markers, the Mapbox Directions polyline, and
// route line, distance and travel time. Re-fetches whenever either end changes. Optional
// `packageStops` overlays a package's pickup/drop on a traveller's route and
// reports whether they actually lie along it (core/routeCorridor).
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLng } from "@/core/geo";
import { corridorFit } from "@/core/routeCorridor";
import { fetchRoute, formatDuration, type RoadRoute } from "@/components/directions";
import { mapboxConfigured } from "@/lib/maps";
import type { MapMarker } from "@/components/MapCanvas";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

type State =
  | { s: "loading" }
  | { s: "ready"; route: RoadRoute }
  | { s: "error"; msg: string };

export function RouteMap({
  from,
  to,
  packageStops,
  heightClass = "h-40 [@media(min-height:720px)]:h-56",
}: {
  from: LatLng | null;
  to: LatLng | null;
  packageStops?: { pickup: LatLng; drop: LatLng };
  heightClass?: string;
}) {
  const [state, setState] = useState<State>({ s: "loading" });

  // Primitive deps so a re-render with equal coords doesn't refetch.
  const fLat = from?.lat, fLng = from?.lng, tLat = to?.lat, tLng = to?.lng;

  useEffect(() => {
    if (fLat == null || fLng == null || tLat == null || tLng == null) return;
    const ctl = new AbortController();
    /* eslint-disable react-hooks/set-state-in-effect */
    setState({ s: "loading" });
    /* eslint-enable react-hooks/set-state-in-effect */
    fetchRoute({ lat: fLat, lng: fLng }, { lat: tLat, lng: tLng }, ctl.signal).then((r) => {
      if (ctl.signal.aborted) return;
      if (r.ok) setState({ s: "ready", route: r.route });
      else
        setState({
          s: "error",
          msg:
            r.reason === "no-route"
              ? "No driving route found between these places."
              : "Couldn't load the route. Check your connection.",
        });
    });
    return () => ctl.abort();
  }, [fLat, fLng, tLat, tLng]);

  const route = state.s === "ready" ? state.route : null;

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = [];
    if (from) m.push({ ...from, kind: "from", label: "Start" });
    if (to) m.push({ ...to, kind: "to", label: "End" });
    if (packageStops) {
      m.push({ ...packageStops.pickup, kind: "pkgFrom", label: "Package pickup" });
      m.push({ ...packageStops.drop, kind: "pkgTo", label: "Package drop" });
    }
    return m;
  }, [from, to, packageStops]);

  const fit = useMemo(
    () => (route && packageStops ? corridorFit(route.geometry, packageStops.pickup, packageStops.drop) : null),
    [route, packageStops],
  );

  if (!mapboxConfigured()) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-line-strong bg-surface p-4 text-center text-[13px] text-muted">
        Map unavailable — Mapbox isn&apos;t configured.
      </div>
    );
  }
  if (!from || !to) {
    return (
      <div className={`grid ${heightClass} place-items-center rounded-2xl bg-surface text-[13px] text-muted`}>
        Set both locations to preview the route.
      </div>
    );
  }

  return (
    <div>
      <div className={`relative ${heightClass} overflow-hidden rounded-2xl border border-line`}>
        <MapCanvas markers={markers} line={route?.geometry} />
        {state.s === "loading" && (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-semibold shadow-card">
            Finding route…
          </span>
        )}
      </div>
      {state.s === "error" && (
        <p className="mt-2 rounded-xl bg-error-soft px-3 py-2 text-[13px] font-medium text-error">{state.msg}</p>
      )}
      {route && (
        <div className="mt-2 flex items-center gap-3 text-[14px] font-bold">
          <span>{Math.round(route.distanceKm)} km</span>
          <span className="text-muted">·</span>
          <span>{formatDuration(route.durationMin)}</span>
          <span className="ml-auto text-[12px] font-semibold text-muted">by road</span>
        </div>
      )}
      {fit && (
        <p
          className={`mt-2 rounded-xl px-3 py-2 text-[13px] font-medium ${
            fit.onRoute ? "bg-brand-soft text-ink" : "bg-surface text-muted"
          }`}
        >
          {fit.onRoute
            ? `Pickup is ${fit.pickupOffKm.toFixed(1)} km and drop ${fit.dropOffKm.toFixed(1)} km off your route.`
            : !fit.ordered
              ? "The drop comes before the pickup in your direction of travel."
              : `Pickup is ${fit.pickupOffKm.toFixed(1)} km and drop ${fit.dropOffKm.toFixed(1)} km off your route — a detour.`}
        </p>
      )}
    </div>
  );
}
