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
context.route(/nominatim\.openstreetmap\.org\/reverse/, (route) => {
  const lat = parseFloat(new URL(route.request().url()).searchParams.get("lat"));
  const body = lat > 16 ? { address: { suburb: "Bandra", city: "Mumbai" } } : { address: { suburb: "T. Nagar", city: "Chennai" } };
  route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
});
context.route(/nominatim\.openstreetmap\.org\/search/, (route) =>
  route.fulfill({ contentType: "application/json", body: JSON.stringify([{ lat: "19.0760", lon: "72.8777", display_name: "Mumbai", address: { city: "Mumbai", state: "Maharashtra" } }]) }),
);
const page = await context.newPage();
page.setDefaultTimeout(15000);

try {
  await page.goto("http://localhost:3000");
  await page.getByRole("link", { name: "Get Started" }).click();
  await page.waitForURL("**/login");
  await page.getByRole("button", { name: "Send Code" }).click();
  await page.locator('input[inputmode="numeric"]').fill("3456");
  await page.getByRole("button", { name: "Verify & Continue" }).click();
  await page.waitForURL("**/app");
  log("logged in");

  await page.getByRole("link", { name: /Send a Package/ }).click();
  await page.waitForURL("**/packages/new");
  await page.getByText("T. Nagar, Chennai").waitFor();
  log("pickup = current location (Chennai)");

  // Open destination sheet, search, confirm
  await page.getByText("Where to?").click();
  await page.getByPlaceholder(/Search area/i).waitFor();
  log("destination map sheet opened");
  await page.getByPlaceholder(/Search area/i).fill("Mumbai");
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
