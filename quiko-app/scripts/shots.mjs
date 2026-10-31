// Capture the sheet-based location flow. Throwaway.
import { chromium } from "playwright";

const DIR = process.env.SHOT_DIR || "/tmp";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  permissions: ["geolocation"],
  geolocation: { latitude: 13.0827, longitude: 80.2707 },
});
// NOTE: search and the map need a Mapbox token at BUILD time — NEXT_PUBLIC_* is
// inlined by next build, so it cannot be injected here. Build the app under test
// with a dummy public token, e.g.
//   NEXT_PUBLIC_MAPBOX_TOKEN=pk.test npm run build && npm start
// Every Mapbox endpoint the app calls is mocked below, so the token is never used
// against the real API.
// Mapbox reverse geocoding mocked (coord-aware) for determinism.
const feat = (name, place, lat, lng) => ({
  geometry: { coordinates: [lng, lat] },
  properties: { name, place_formatted: place, coordinates: { latitude: lat, longitude: lng } },
});
context.route(/api\.mapbox\.com\/search\/geocode\/v6\/reverse/, (route) => {
  const lat = parseFloat(new URL(route.request().url()).searchParams.get("latitude"));
  const f = lat > 16 ? feat("Bandra", "Mumbai", lat, 72.83) : feat("T. Nagar", "Chennai", lat, 80.23);
  route.fulfill({ contentType: "application/json", body: JSON.stringify({ features: [f] }) });
});
// Autocomplete goes through the Search Box API (not geocode/v6/forward), in two
// steps: /suggest returns names with no coordinates, /retrieve resolves the
// picked one. Mock both or the picker has nothing to list.
const SUGGESTIONS = [
  { id: "mb.mumbai", name: "Mumbai", place: "Maharashtra", lat: 19.076, lng: 72.8777 },
  { id: "mb.colaba", name: "Colaba", place: "Mumbai", lat: 18.922, lng: 72.8347 },
];
context.route(/api\.mapbox\.com\/search\/searchbox\/v1\/suggest/, (route) =>
  route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      suggestions: SUGGESTIONS.map((s) => ({
        mapbox_id: s.id, name: s.name, place_formatted: s.place,
      })),
    }),
  }),
);
context.route(/api\.mapbox\.com\/search\/searchbox\/v1\/retrieve/, (route) => {
  const id = decodeURIComponent(new URL(route.request().url()).pathname.split("/").pop());
  const s = SUGGESTIONS.find((x) => x.id === id) ?? SUGGESTIONS[0];
  route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ features: [feat(s.name, s.place, s.lat, s.lng)] }),
  });
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
const shot = (n) => page.screenshot({ path: `${DIR}/ui-${n}.png` });

await page.goto("http://localhost:3000/login");
await page.getByRole("button", { name: "Send Code" }).click();
await page.locator('input[inputmode="numeric"]').fill("345678");
await page.getByRole("button", { name: "Verify & Continue" }).click();
await page.waitForURL("**/app");

await page.getByRole("link", { name: /Send a Package/ }).click();
await page.waitForURL("**/packages/new");
await page.getByText("T. Nagar, Chennai").waitFor();
await shot("5-create"); // fields only, no map

await page.getByText("Where to?").click();
await page.getByLabel("Search for a place").waitFor();
await page.waitForTimeout(2500); // tiles
await shot("5b-sheet"); // full-screen map + center pin

await page.getByLabel("Search for a place").fill("Mumbai");
await page.locator("ul li button").first().waitFor();
await shot("5c-search"); // search results in sheet

await page.locator("ul li button").first().click();
await page.waitForTimeout(2000);
await shot("5d-confirm"); // pin over Mumbai, confirm bar

await page.getByRole("button", { name: /Confirm destination/ }).click();
await page.waitForTimeout(1500);
await shot("5e-route"); // back on form, both set + distance

console.log("captured");
await browser.close();
