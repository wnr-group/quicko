// Map source seam (mirrors lib/otp.ts / lib/payments.ts).
//
// Dev default: free OpenStreetMap tiles + Nominatim geocoding — no key, but
// rate-limited and NOT licensed for production traffic (Nominatim bans
// autocomplete; OSM tiles ban heavy/commercial use).
//
// Production: set NEXT_PUBLIC_MAPTILER_KEY (or an explicit tile URL) and BOTH
// the tiles and geocoding flip to the provider — no code change. Swapping to a
// different provider means editing only this file + components/geocode.ts.
//
// Note: these are NEXT_PUBLIC_ (client-exposed) because the tile URL and
// geocoding calls run in the browser. Use a domain-restricted public key.

const MAPTILER_KEY_ = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";

/** Leaflet tile layer config for the current provider. */
export function tileConfig(): { url: string; attribution: string } {
  // Explicit override wins (any provider's tile template).
  if (process.env.NEXT_PUBLIC_MAP_TILE_URL) {
    return {
      url: process.env.NEXT_PUBLIC_MAP_TILE_URL,
      attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ?? "",
    };
  }
  if (MAPTILER_KEY_) {
    return {
      url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY_}`,
      attribution: "&copy; MapTiler &copy; OpenStreetMap",
    };
  }
  // Dev default — free OSM community tiles.
  return {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap",
  };
}

export type GeocodeProviderName = "nominatim" | "maptiler";

/** Which geocoding backend to use (MapTiler when a key is set, else Nominatim). */
export function geocodeProvider(): GeocodeProviderName {
  return MAPTILER_KEY_ ? "maptiler" : "nominatim";
}

export const MAPTILER_KEY = MAPTILER_KEY_;
