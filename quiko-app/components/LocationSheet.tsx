"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import type { PinnedLocation } from "@/core/geo";
import { reverseGeocode, searchPlaces, type Place } from "@/components/geocode";
import { tileConfig } from "@/lib/maps";
import { IconArrowLeft, IconSearch, IconLocate, IconX, IconMapPin } from "@/components/icons";

const DEFAULT: PinnedLocation = { lat: 13.0827, lng: 80.2707, label: "Chennai" };

function MoveTracker({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onMove(c.lat, c.lng);
    },
  });
  return null;
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
  const [map, setMap] = useState<LeafletMap | null>(null);
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

  // If we opened without a starting pin, try current location.
  useEffect(() => {
    if (initial || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        map?.flyTo([lat, lng], 15);
        setSel({ lat, lng, label: "Current location" });
        scheduleReverse(lat, lng);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Debounced place search.
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim();
      setResults(q.length < 3 ? [] : await searchPlaces(q));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function pick(p: Place) {
    setSel(p);
    setQuery("");
    setResults([]);
    map?.flyTo([p.lat, p.lng], 15);
  }

  function locateMe() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        map?.flyTo([lat, lng], 15);
        setSel({ lat, lng, label: "Current location" });
        scheduleReverse(lat, lng);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

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
        <MapContainer ref={setMap} center={[start.lat, start.lng]} zoom={14}
          zoomControl={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution={tileConfig().attribution} url={tileConfig().url} />
          <MoveTracker onMove={scheduleReverse} />
        </MapContainer>

        {/* Center pin (fixed over map) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full">
          <svg width="36" height="48" viewBox="0 0 30 40">
            <path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 25 15 25s15-15 15-25C30 6.7 23.3 0 15 0Z"
              fill={isFrom ? "#000000" : "#fddc2b"} />
            <circle cx="15" cy="15" r="5" fill={isFrom ? "#fff" : "#000000"} />
          </svg>
        </div>

        <button onClick={locateMe} aria-label="Use current location"
          className="absolute bottom-4 right-4 z-[500] grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-pop active:scale-95">
          <IconLocate />
        </button>
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
