// Geocoding seam. Default = OpenStreetMap Nominatim (free, no key, dev only).
// Set NEXT_PUBLIC_MAPTILER_KEY to flip to MapTiler for production (see lib/maps.ts).
import { geocodeProvider, MAPTILER_KEY } from "@/lib/maps";

export type Place = { lat: number; lng: number; label: string };

interface GeocodeBackend {
  reverse(lat: number, lng: number): Promise<string>;
  search(q: string): Promise<Place[]>;
}

const coordFallback = (lat: number, lng: number) => `${lat.toFixed(3)}, ${lng.toFixed(3)}`;

// ---- Nominatim (default) --------------------------------------------------

type NomItem = {
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
};

export function shortLabel(x: NomItem): string {
  const a = x.address ?? {};
  const primary =
    x.name || a.suburb || a.neighbourhood || a.road || a.town || a.village || a.city;
  const city = a.city || a.state_district || a.state;
  const parts = [...new Set([primary, city].filter(Boolean))].slice(0, 2);
  return parts.join(", ") || (x.display_name ?? "").split(",").slice(0, 2).join(",");
}

const nominatim: GeocodeBackend = {
  async reverse(lat, lng) {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=16&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "en" } },
      );
      return shortLabel(await r.json()) || coordFallback(lat, lng);
    } catch {
      return coordFallback(lat, lng);
    }
  },
  async search(q) {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`,
        { headers: { "Accept-Language": "en" } },
      );
      const d: NomItem[] = await r.json();
      return d.map((x) => ({ lat: +x.lat!, lng: +x.lon!, label: shortLabel(x) }));
    } catch {
      return [];
    }
  },
};

// ---- MapTiler (production) ------------------------------------------------

type MtFeature = { center: [number, number]; place_name?: string; text?: string };

const maptiler: GeocodeBackend = {
  async reverse(lat, lng) {
    try {
      const r = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_KEY}&language=en`,
      );
      const d = (await r.json()) as { features?: MtFeature[] };
      const f = d.features?.[0];
      return f?.text || f?.place_name?.split(",").slice(0, 2).join(",") || coordFallback(lat, lng);
    } catch {
      return coordFallback(lat, lng);
    }
  },
  async search(q) {
    try {
      const r = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${MAPTILER_KEY}&country=in&limit=6&language=en`,
      );
      const d = (await r.json()) as { features?: MtFeature[] };
      return (d.features ?? []).map((f) => ({
        lat: f.center[1],
        lng: f.center[0],
        label: f.text || (f.place_name ?? "").split(",").slice(0, 2).join(","),
      }));
    } catch {
      return [];
    }
  },
};

// ---- Dispatch -------------------------------------------------------------

function backend(): GeocodeBackend {
  return geocodeProvider() === "maptiler" ? maptiler : nominatim;
}

export const reverseGeocode = (lat: number, lng: number) => backend().reverse(lat, lng);
export const searchPlaces = (q: string) => backend().search(q);
