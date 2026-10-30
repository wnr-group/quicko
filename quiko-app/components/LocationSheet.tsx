"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PinnedLocation } from "@/core/geo";
import { endSearchSession, reverseGeocode, searchPlaces, type Place } from "@/components/geocode";
import { MAPBOX_STYLE, MAPBOX_TOKEN, mapboxConfigured } from "@/lib/maps";
import { IconArrowLeft, IconSearch, IconLocate, IconX, IconMapPin } from "@/components/icons";

const DEFAULT: PinnedLocation = { lat: 13.0827, lng: 80.2707, label: "Chennai" };

function geoMessage(err: GeolocationPositionError | null): string {
  if (!err) return "Location isn't available on this device.";
  if (err.code === err.PERMISSION_DENIED)
    return "Location permission is off. Allow it in your browser settings, or search for a place.";
  if (err.code === err.TIMEOUT) return "Couldn't get your location in time. Try again or search.";
  return "Your location is unavailable right now. Search for a place instead.";
}

export default function LocationSheet({
  which,
  initial,
  onConfirm,
  onClose,
}: {
  which: "from" | "to";
  initial: PinnedLocation | null;
  onConfirm: (loc: PinnedLocation) => void;
  onClose: () => void;
}) {
  const start = initial ?? DEFAULT;
  const box = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sel, setSel] = useState<PinnedLocation>(start);
  const [labelBusy, setLabelBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const revTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleReverse(lat: number, lng: number) {
    if (revTimer.current) clearTimeout(revTimer.current);
    setLabelBusy(true);
    revTimer.current = setTimeout(async () => {
      const label = await reverseGeocode(lat, lng);
      setSel({ lat, lng, label });
      setLabelBusy(false);
    }, 350);
  }

  // Create the map once; the pin is fixed at the centre, so a pan = a new pick.
  useEffect(() => {
    if (!box.current || !mapboxConfigured()) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: box.current,
      style: MAPBOX_STYLE,
      center: [start.lng, start.lat],
      zoom: 14,
    });
    m.on("moveend", () => {
      const c = m.getCenter();
      scheduleReverse(c.lat, c.lng);
    });
    m.on("load", () => {
      setMap(m);
      // No starting pin → try current location (quietly; the button is explicit).
      if (!initial) locate(true, m);
    });
    return () => {
      if (revTimer.current) clearTimeout(revTimer.current);
      m.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function locate(silent: boolean, m: mapboxgl.Map | null = map) {
    if (!("geolocation" in navigator)) {
      if (!silent) setNotice(geoMessage(null));
      return;
    }
    setLocating(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocating(false);
        m?.flyTo({ center: [lng, lat], zoom: 15 });
        setSel({ lat, lng, label: "Current location" });
        scheduleReverse(lat, lng);
      },
      (err) => {
        setLocating(false);
        if (!silent) setNotice(geoMessage(err));
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  // Debounced autocomplete; a newer keystroke aborts the older request.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      const c = map?.getCenter();
      const r = await searchPlaces(q, {
        near: c ? { lat: c.lat, lng: c.lng } : undefined,
        signal: ctl.signal,
      });
      if (ctl.signal.aborted) return;
      setResults(r);
      setSearching(false);
    }, 300);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query, map]);

  function pick(p: Place) {
    setSel(p);
    setQuery("");
    setResults([]);
    endSearchSession();
    // The fly-to ends in a moveend that would reverse-geocode the centre and
    // replace the label the user just picked — cancel that and keep theirs.
    if (revTimer.current) clearTimeout(revTimer.current);
    map?.once("moveend", () => {
      if (revTimer.current) clearTimeout(revTimer.current);
      setLabelBusy(false);
      setSel(p);
    });
    map?.flyTo({ center: [p.lng, p.lat], zoom: 15 });
  }

  const locateMe = () => locate(false);

  const isFrom = which === "from";

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/20">
    <div className="flex h-full w-full max-w-[430px] flex-col bg-white">
      {/* Header + search */}
      <div className="pt-safe px-4 pb-3 shadow-sm">
        <div className="flex items-center gap-3 py-1">
          <button onClick={onClose} aria-label="Close"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface active:scale-95">
            <IconArrowLeft />
          </button>
          <h2 className="text-[17px] font-bold">
            {isFrom ? "Set pickup location" : "Set destination"}
          </h2>
        </div>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <IconSearch width={17} height={17} />
          </span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} autoFocus={false}
            placeholder="Search area, locality, landmark…"
            className="w-full rounded-xl border border-line bg-white py-3 pl-9 pr-10 text-[14px] outline-none focus:border-ink" />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
              <IconX width={16} height={16} />
            </button>
          )}
          {query.trim().length >= 3 && !searching && results.length === 0 && (
            <div className="absolute z-[600] mt-1 w-full rounded-xl border border-line bg-white px-3 py-3 text-[14px] text-muted shadow-pop">
              No places found. Try a nearby landmark or locality.
            </div>
          )}
          {results.length > 0 && (
            <ul className="absolute z-[600] mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-pop">
              {results.map((r, i) => (
                <li key={i}>
                  <button onClick={() => pick(r)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[14px] hover:bg-brand-soft">
                    <IconMapPin width={15} height={15} className="shrink-0 text-muted" />
                    <span className="line-clamp-2">{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Map with fixed center pin */}
      <div className="relative min-h-0 flex-1">
        {mapboxConfigured() ? (
          <div ref={box} className="h-full w-full" />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-sm text-muted">
            Map unavailable — set NEXT_PUBLIC_MAPBOX_TOKEN to enable maps and search.
          </div>
        )}

        {/* Center pin (fixed over map) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full">
          <svg width="36" height="48" viewBox="0 0 30 40">
            <path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 25 15 25s15-15 15-25C30 6.7 23.3 0 15 0Z"
              fill={isFrom ? "#000000" : "#fddc2b"} />
            <circle cx="15" cy="15" r="5" fill={isFrom ? "#fff" : "#000000"} />
          </svg>
        </div>

        <button onClick={locateMe} aria-label="Use current location" disabled={locating}
          className={`absolute bottom-4 right-4 z-[500] grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-pop active:scale-95 ${locating ? "animate-pulse" : ""}`}>
          <IconLocate />
        </button>
        {notice && (
          <div role="alert" className="absolute inset-x-3 top-3 z-[500] flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-[13px] font-medium shadow-pop">
            <span className="flex-1">{notice}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss" className="shrink-0 text-muted">
              <IconX width={15} height={15} />
            </button>
          </div>
        )}
      </div>

      {/* Confirm bar */}
      <div className="pb-safe border-t border-line px-5 pt-3">
        <div className="mb-3 flex items-start gap-2.5">
          <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${isFrom ? "bg-ink text-brand" : "bg-brand text-ink"}`}>
            {isFrom ? "A" : "B"}
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted">
              {isFrom ? "Pickup" : "Destination"}
            </div>
            <div className="break-words text-[15px] font-semibold">
              {labelBusy ? "Locating…" : sel.label}
            </div>
          </div>
        </div>
        <button onClick={() => onConfirm(sel)}
          className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-white active:scale-[0.98]">
          {isFrom ? "Confirm pickup" : "Confirm destination"}
        </button>
      </div>
    </div>
    </div>
  );
}
