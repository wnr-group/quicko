// Capture the sheet-based location flow. Throwaway.
import { chromium } from "playwright";

const DIR = process.env.SHOT_DIR || "/tmp";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  permissions: ["geolocation"],
  geolocation: { latitude: 13.0827, longitude: 80.2707 },
});
context.route(/nominatim\.openstreetmap\.org\/reverse/, (route) => {
  const lat = parseFloat(new URL(route.request().url()).searchParams.get("lat"));
  const body = lat > 16 ? { address: { suburb: "Bandra", city: "Mumbai" } } : { address: { suburb: "T. Nagar", city: "Chennai" } };
  route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
});
context.route(/nominatim\.openstreetmap\.org\/search/, (route) =>
  route.fulfill({ contentType: "application/json", body: JSON.stringify([
    { lat: "19.0760", lon: "72.8777", display_name: "Mumbai", address: { city: "Mumbai", state: "Maharashtra" } },
    { lat: "18.9220", lon: "72.8347", display_name: "Colaba, Mumbai", address: { suburb: "Colaba", city: "Mumbai" } },
  ]) }),
);
const page = await context.newPage();
page.setDefaultTimeout(15000);
const shot = (n) => page.screenshot({ path: `${DIR}/ui-${n}.png` });

await page.goto("http://localhost:3000/login");
await page.getByRole("button", { name: "Send Code" }).click();
await page.locator('input[inputmode="numeric"]').fill("3456");
await page.getByRole("button", { name: "Verify & Continue" }).click();
await page.waitForURL("**/app");

await page.getByRole("link", { name: /Send a Package/ }).click();
await page.waitForURL("**/packages/new");
await page.getByText("T. Nagar, Chennai").waitFor();
await shot("5-create"); // fields only, no map

await page.getByText("Where to?").click();
await page.getByPlaceholder(/Search area/i).waitFor();
await page.waitForTimeout(2500); // tiles
await shot("5b-sheet"); // full-screen map + center pin

await page.getByPlaceholder(/Search area/i).fill("Mumbai");
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
