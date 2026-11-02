// E2E: current-location pickup + full-screen sheet for destination → geo-match.
// Geolocation + geocoding mocked (coord-aware) for determinism.
import { chromium } from "playwright";

const DIR = process.env.SHOT_DIR || "/tmp";
const shot = (page, name) => page.screenshot({ path: `${DIR}/p1-${name}.png` });
const log = (m) => console.log("•", m);

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

try {
  await page.goto("http://localhost:3000");
  // Landing "Get Started" opens the tour (it always has); the tour's Skip goes
  // to /app, which bounces a signed-out visitor to /login. Walking the real
  // entry path rather than jumping straight to /login.
  await page.getByRole("link", { name: "Get Started" }).click();
  await page.waitForURL("**/tour");
  await page.getByRole("link", { name: "Skip" }).click();
  await page.waitForURL("**/login");
  await page.getByRole("button", { name: "Send Code" }).click();
  await page.locator('input[inputmode="numeric"]').fill("345678");
  await page.getByRole("button", { name: "Verify & Continue" }).click();
  await page.waitForURL("**/app");
  log("logged in");

  // The home CTA now opens the newer multi-step /app/send flow; this script
  // exercises the single-page package form, which still lives here.
  await page.goto("http://localhost:3000/app/packages/new");
  await page.waitForURL("**/packages/new");
  await page.getByText("T. Nagar, Chennai").waitFor();
  log("pickup = current location (Chennai)");

  // Open destination sheet, search, confirm
  await page.getByText("Where to?").click();
  await page.getByLabel("Search for a place").waitFor();
  log("destination map sheet opened");
  await page.getByLabel("Search for a place").fill("Mumbai");
  await page.locator("ul li button").first().click();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /Confirm destination/ }).click();
  await page.waitForTimeout(400);
  log("destination confirmed");

  await page.getByRole("button", { name: /Post & Find Travelers/ }).click();
  await page.waitForURL("**/travelers");
  await page.getByText("Arjun Nair").waitFor();
  const names = await page.locator("text=/Arjun Nair|Raj Kumar|Meera Iyer/").allInnerTexts();
  log("travelers matched: " + names.join(", "));

  await page.getByRole("button", { name: /^Request for/ }).first().click();
  await page.getByRole("button", { name: /Request sent/ }).first().waitFor();
  await page.getByRole("link", { name: /View request status/ }).click();
  await page.waitForURL(/\/packages\/[0-9a-f-]+$/);
  await page.getByRole("button", { name: /Simulate traveler accept/ }).click();
  await page.getByText(/it.s a match/i).waitFor();
  log("MATCHED — OTP " + (await page.locator("text=/^[0-9]{4}$/").first().innerText()));

  console.log("\n✅ Sheet-based location flow PASSED");
} catch (err) {
  await shot(page, "ERROR");
  console.error("\n❌ FAILED:", err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
