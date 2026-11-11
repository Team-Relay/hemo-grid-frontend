/**
 * Capture a real HemoGrid Network Mission Control screenshot, not a mockup.
 * It logs into the PUBLIC SYNTHETIC DEMO as the platform coordinator.
 * Does not create/edit requests, change inventory or run planner previews.
 *
 * Run only in a trusted ephemeral CI runner:
 *   npm ci
 *   npx playwright install --with-deps chromium
 *   node scripts/capture-mission-control.mjs
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const origin = "https://hemogrid-eight.vercel.app";
const outputPath = "public/judges/mission-control.png";

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1500, height: 960 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    locale: "en-KE",
    timezoneId: "Africa/Nairobi",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(origin + "/login", { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.getByRole("button", { name: "Platform admin", exact: true }).click();
  const signIn = page.getByRole("button", { name: "Continue to workspace" });
  await signIn.waitFor({ state: "visible" });
  await signIn.click();
  await page.waitForURL(/\/admin\/dashboard$/, { timeout: 90_000 });

  const hero = page.getByRole("heading", {
    name: "The closest blood bank is not always the right one.",
  });
  await hero.waitFor({ state: "visible", timeout: 60_000 });
  await page.getByRole("link", { name: /Open joint dispatch planner/i }).waitFor({
    state: "visible",
  });
  await page.evaluate(async () => { await document.fonts.ready; });

  const pageError = page.getByText(/Application error: a server-side exception/i);
  if (await pageError.count()) throw new Error("Hosted coordinator dashboard has an application error");

  // Screenshot the actual coordinator workspace. Do not include login credentials
  // or browser address bar. No patient or donor data exists in this demo.
  await mkdir(dirname(outputPath), { recursive: true });
  await page.screenshot({
    path: outputPath,
    fullPage: false,
    animations: "disabled",
    caret: "hide",
  });
  console.log("PASS published-screen capture: authenticated Mission Control dashboard");
  console.log("Screenshot: " + outputPath);
  await context.close();
} finally {
  await browser.close();
}
