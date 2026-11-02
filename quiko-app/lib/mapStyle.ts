// Makes the base map show what Mapbox's vector tiles actually contain.
//
// The stock streets-v12 style already has POI, road, transit and building
// layers, but ships conservative: POI labels are thinned to the most prominent
// few (filterrank), and every building is the same grey. We loosen that — never
// add data. Everything shown is drawn by Mapbox from its own tiles (OSM-derived
// plus licensed sources), viewport-by-viewport and zoom-by-zoom, with native
// label collision handling. Nothing is invented: a building without a name in
// the tiles stays unlabelled.
import type mapboxgl from "mapbox-gl";

const RESIDENTIAL = ["apartments", "residential", "house", "detached", "semidetached_house", "terrace", "dormitory", "bungalow", "static_caravan"];
const COMMERCIAL = ["commercial", "office", "retail", "industrial", "warehouse", "hotel", "supermarket", "kiosk"];
const CIVIC = ["hospital", "school", "university", "college", "kindergarten", "government", "public", "civic", "train_station", "transportation"];
const WORSHIP = ["temple", "church", "mosque", "chapel", "cathedral", "synagogue", "shrine", "religious"];

/**
 * Call once the style has loaded. Every step is guarded, so a custom style
 * (NEXT_PUBLIC_MAPBOX_STYLE) that lacks a layer just skips that step.
 */
export function enrichBaseMap(map: mapboxgl.Map): void {
  const has = (id: string) => !!map.getLayer(id);

  // 1. More points of interest as you zoom in. Stock rule: filterrank <= 3,
  //    +1 at z16, +2 at z17. Collision handling still drops overlapping labels,
  //    so this raises density without stacking text.
  if (has("poi-label")) {
    map.setFilter("poi-label", [
      "<=", ["get", "filterrank"],
      ["+", ["step", ["zoom"], 0, 14, 1, 15, 2, 16, 3, 17, 5], 3],
    ]);
    map.setLayerZoomRange("poi-label", 12, 24);
  }

  // 2. Buildings: earlier, tinted by what the tiles say they are.
  if (has("building")) {
    const base = map.getPaintProperty("building", "fill-color") ?? "#e6e2dc";
    map.setPaintProperty("building", "fill-color", [
      "match", ["get", "type"],
      RESIDENTIAL, "#e3dcf3",
      COMMERCIAL, "#f5e2b3",
      CIVIC, "#cfe3f5",
      WORSHIP, "#f8d3b8",
      base,
    ]);
    map.setPaintProperty("building", "fill-opacity", 1);
    map.setPaintProperty("building", "fill-outline-color", "#b9b3a8");
    map.setLayerZoomRange("building", 14, 24);
  }

  // 3. House numbers a little earlier, so individual buildings read as such.
  if (has("building-number-label")) map.setLayerZoomRange("building-number-label", 16, 24);

  // 4. Street names from small lanes up, and transit stops sooner.
  if (has("road-label")) map.setLayerZoomRange("road-label", 10, 24);
  if (has("transit-label")) map.setLayerZoomRange("transit-label", 11, 24);
}

/**
 * True when the visible map has no buildings, POIs or labelled roads rendered —
 * i.e. genuinely sparse data. Only meaningful once the map is idle at a zoom
 * where those layers apply.
 */
export function isAreaSparse(map: mapboxgl.Map): boolean {
  if (map.getZoom() < 15 || !map.areTilesLoaded()) return false;
  const layers = ["building", "poi-label", "road-label", "transit-label"].filter((l) => map.getLayer(l));
  return layers.length > 0 && map.queryRenderedFeatures({ layers }).length === 0;
}
