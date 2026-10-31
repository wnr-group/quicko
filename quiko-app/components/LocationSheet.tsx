"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PinnedLocation } from "@/core/geo";
import {
  endSearchSession, retrievePlace, reverseGeocode, searchPlaces, type Place, type Suggestion,
} from "@/components/geocode";
import { parseMapsInput } from "@/core/mapsLink";
import { MAPBOX_STYLE, MAPBOX_TOKEN, mapboxConfigured } from "@/lib/maps";
import { enrichBaseMap, isAreaSparse } from "@/lib/mapStyle";
import { IconArrowLeft, IconSearch, IconLocate, IconX, IconMapPin } from "@/components/icons";

// Street level: building footprints, house numbers and shop/landmark labels are visible.
const STREET_ZOOM = 16;

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
  const isFrom = which === "from";
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const reqId = useRef(0); // newest placement wins; stale reverse-geocodes are dropped
  const [ready, setReady] = useState(false);
  // True only when the visible area has no mapped buildings/POIs/roads at all.
  const [sparse, setSparse] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sel, setSel] = useState<PinnedLocation>(start);
  const [labelBusy, setLabelBusy] = useState(false);
  // The input shows the resolved address until the user starts typing.
  const [typing, setTyping] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  // Search request failed (offline, API error) — distinct from "nothing matched".
  const [searchFailed, setSearchFailed] = useState(false);
  // "reading" while a pasted link is resolved; an error string if it can't be.
  const [paste, setPaste] = useState<"reading" | string | null>(null);

  /**
   * The one way a location is chosen (search, paste, GPS, click, drag). Moves the
   * marker, optionally flies there, and resolves the address unless one is given.
   * Panning/zooming the map never calls this, so browsing can't change the pick.
   */
  function setPoint(lat: number, lng: number, o: { label?: string; fly?: boolean } = {}) {
    const id = ++reqId.current;
    const m = mapRef.current;
    markerRef.current?.setLngLat([lng, lat]);
    if (o.fly && m) m.flyTo({ center: [lng, lat], zoom: Math.max(m.getZoom(), STREET_ZOOM) });
    if (o.label) {
      setSel({ lat, lng, label: o.label });
      setLabelBusy(false);
      return;
    }
    setSel((p) => ({ lat, lng, label: p.label }));
    setLabelBusy(true);
    reverseGeocode(lat, lng).then((label) => {
      if (id !== reqId.current) return;
      setSel({ lat, lng, label });
      setLabelBusy(false);
    });
  }

  // Create the map + draggable marker once.
  useEffect(() => {
    if (!box.current || !mapboxConfigured()) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: box.current,
      style: MAPBOX_STYLE,
      center: [start.lng, start.lat],
      zoom: STREET_ZOOM,
    });
    mapRef.current = m;
    m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const el = document.createElement("div");
    el.innerHTML = `<svg width="36" height="48" viewBox="0 0 30 40" style="display:block;cursor:grab">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 25 15 25s15-15 15-25C30 6.7 23.3 0 15 0Z" fill="${isFrom ? "#000000" : "#fddc2b"}"/>
      <circle cx="15" cy="15" r="5" fill="${isFrom ? "#fff" : "#000000"}"/></svg>`;
    const marker = new mapboxgl.Marker({ element: el, anchor: "bottom", draggable: true })
      .setLngLat([start.lng, start.lat])
      .addTo(m);
    markerRef.current = marker;
    marker.on("dragend", () => {
      const p = marker.getLngLat();
      setPoint(p.lat, p.lng);
    });
    m.on("click", (e) => setPoint(e.lngLat.lat, e.lngLat.lng));
    m.on("idle", () => setSparse(isAreaSparse(m)));
    m.on("load", () => {
      enrichBaseMap(m);
      setReady(true);
      // No starting pin → try current location (quietly; the button is explicit).
      if (!initial) locate(true);
    });
    return () => {
      // Deliberate: bumping the counter is how an in-flight reverse-geocode is
      // invalidated on unmount. The lint rule assumes we are READING a possibly
      // stale ref; here the whole point is to mutate the live one.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      reqId.current++;
      marker.remove();
      m.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function locate(silent: boolean) {
    if (!("geolocation" in navigator)) {
      if (!silent) setNotice(geoMessage(null));
      return;
    }
    setLocating(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setPoint(pos.coords.latitude, pos.coords.longitude, { fly: true });
      },
      (err) => {
        setLocating(false);
        if (!silent) setNotice(geoMessage(err));
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function recenter() {
    const m = mapRef.current;
    if (m) m.flyTo({ center: [sel.lng, sel.lat], zoom: Math.max(m.getZoom(), STREET_ZOOM) });
  }

  function choose(p: Place) {
    setTyping(false);
    setQuery("");
    setResults([]);
    endSearchSession();
    setPoint(p.lat, p.lng, { label: p.label, fly: true });
  }

  async function pickSuggestion(sg: Suggestion) {
    setSearching(true);
    const p = await retrievePlace(sg);
    setSearching(false);
    if (!p) {
      setNotice("Couldn't load that place. Try another result.");
      return;
    }
    choose(p);
  }

  // Debounced autocomplete; a newer keystroke aborts the older request.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setResults([]);
      setSearching(false);
      setSearchFailed(false);
      setPaste(null);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    const ctl = new AbortController();
    const near = () => {
      const c = mapRef.current?.getCenter();
      return c ? { lat: c.lat, lng: c.lng } : undefined;
    };

    // A pasted Google Maps link or "lat, lng" is a location, not a search.
    const pasted = parseMapsInput(q);
    if (pasted) {
      setResults([]);
      setSearching(false);
      setPaste("reading");
      (async () => {
        try {
          let loc: { lat: number; lng: number; name?: string } | null = null;
          let text: string | undefined;
          if (pasted.kind === "coords") loc = pasted;
          else if (pasted.kind === "query") text = pasted.query;
          else {
            const r = await fetch(`/api/maps/resolve?url=${encodeURIComponent(pasted.url)}`, { signal: ctl.signal });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || "Couldn't read that link.");
            if (typeof d.lat === "number") loc = d;
            else text = d.query;
          }
          // No coordinates in the link: find the named place with search instead.
          if (!loc && text) {
            const [hit] = (await searchPlaces(text, { near: near(), signal: ctl.signal })) ?? [];
            const p = hit && (await retrievePlace(hit, ctl.signal));
            if (ctl.signal.aborted) return;
            if (!p) throw new Error(`Couldn't find "${text}" on the map. Search for it by name instead.`);
            setPaste(null);
            choose(p);
            return;
          }
          if (!loc || ctl.signal.aborted) return;
          const label = loc.name || (await reverseGeocode(loc.lat, loc.lng));
          if (ctl.signal.aborted) return;
          setPaste(null);
          choose({ lat: loc.lat, lng: loc.lng, label });
        } catch (e) {
          if (!ctl.signal.aborted) setPaste(e instanceof Error ? e.message : "Couldn't read that link.");
        }
      })();
      return () => ctl.abort();
    }

    setPaste(null);
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await searchPlaces(q, { near: near(), signal: ctl.signal });
      if (ctl.signal.aborted) return;
      setSearchFailed(r === null);
      setResults(r ?? []);
      setSearching(false);
    }, 300);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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
          <input
            value={typing ? query : labelBusy ? "" : sel.label}
            onChange={(e) => { setTyping(true); setQuery(e.target.value); }}
            onFocus={(e) => { if (!typing) e.currentTarget.select(); }}
            onBlur={() => { if (!query.trim()) setTyping(false); }}
            aria-label="Search for a place"
            placeholder={labelBusy ? "Finding address…" : "Search shop, street, landmark — or paste a Google Maps link"}
            className="w-full rounded-xl border border-line bg-white py-3 pl-9 pr-10 text-[14px] outline-none focus:border-ink" />
          {(!typing || query) && (
            <button
              onClick={() => { setTyping(true); setQuery(""); setResults([]); setPaste(null); }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
              <IconX width={16} height={16} />
            </button>
          )}
          {searching && (
            <span className="absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-line-strong border-t-ink" />
          )}
          {paste && (
            <div className="absolute z-[600] mt-1 w-full rounded-xl border border-line bg-white px-3 py-3 text-[14px] text-muted shadow-pop">
              {paste === "reading" ? "Reading location from link…" : paste}
            </div>
          )}
          {!paste && query.trim().length >= 3 && !searching && results.length === 0 && (
            <div className="absolute z-[600] mt-1 w-full rounded-xl border border-line bg-white px-3 py-3 text-[14px] text-muted shadow-pop">
              {searchFailed
                ? "Couldn't reach search right now. Check your connection, or tap the map to drop a pin."
                : "No places found. Try a nearby landmark or locality."}
            </div>
          )}
          {results.length > 0 && (
            <ul className="absolute z-[600] mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-pop">
              {results.map((r) => (
                <li key={r.id}>
                  {/* mousedown-preventDefault keeps the input from blurring first. */}
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => pickSuggestion(r)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[14px] hover:bg-brand-soft">
                    <IconMapPin width={15} height={15} className="shrink-0 text-muted" />
                    <span className="min-w-0">
                      <span className="line-clamp-1 block font-semibold">{r.label}</span>
                      {r.detail && <span className="line-clamp-1 block text-[12px] text-muted">{r.detail}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Map: draggable marker; tap the map to move it */}
      <div className="relative min-h-0 flex-1">
        {mapboxConfigured() ? (
          <div ref={box} className="h-full w-full" />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-sm text-muted">
            Map unavailable right now. You can still confirm the location below,
            or type an address in the search box.
          </div>
        )}
        {mapboxConfigured() && !ready && (
          <div className="absolute inset-0 grid place-items-center bg-surface/70 text-[13px] font-semibold text-muted">
            Loading map…
          </div>
        )}

        <div className="absolute bottom-4 right-4 z-[500] flex flex-col gap-2">
          <button onClick={recenter} aria-label="Recenter on selected location"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-pop active:scale-95">
            <IconMapPin />
          </button>
          <button onClick={() => locate(false)} aria-label="Use current location" disabled={locating}
            className={`grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-pop active:scale-95 ${locating ? "animate-pulse" : ""}`}>
            <IconLocate />
          </button>
        </div>
        {sparse && !notice && (
          <div className="pointer-events-none absolute left-3 right-[68px] top-3 z-[500] rounded-xl bg-white/95 px-3 py-2 text-[12px] font-medium text-ink-soft shadow-pop">
            No buildings or places are mapped here yet. You can still tap the map or drag the pin to choose this spot.
          </div>
        )}
        {notice && (
          <div role="alert" className="absolute bottom-4 left-3 right-[68px] z-[500] flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-[13px] font-medium shadow-pop">
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
            <div className="mt-0.5 text-[12px] text-muted">Drag the pin or tap the map to adjust.</div>
          </div>
        </div>
        <button onClick={() => onConfirm(sel)} disabled={labelBusy}
          className="w-full rounded-2xl bg-ink py-4 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-60">
          {isFrom ? "Confirm pickup" : "Confirm destination"}
        </button>
      </div>
    </div>
    </div>
  );
}
