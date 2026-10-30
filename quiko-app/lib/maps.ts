// Map provider seam: Mapbox (GL JS tiles, Geocoding v6, Directions v5).
//
// NEXT_PUBLIC_MAPBOX_TOKEN is a *public* token (pk.*) — it is shipped to the
// browser by design. Lock it down in the Mapbox dashboard: restrict it to the
// app's URLs and give it only the public scopes (styles:tiles, styles:read,
// fonts:read). Never put a secret token (sk.*) in a NEXT_PUBLIC_ variable.

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Map style; override with NEXT_PUBLIC_MAPBOX_STYLE (e.g. a custom Studio style). */
export const MAPBOX_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE || "mapbox://styles/mapbox/streets-v12";

/** Search is biased to India — Quiko only operates there. */
export const MAPBOX_COUNTRY = "in";

export const mapboxConfigured = () => MAPBOX_TOKEN.startsWith("pk.");
