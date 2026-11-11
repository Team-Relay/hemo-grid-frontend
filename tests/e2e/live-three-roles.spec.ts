/**
 * Live, non-mutating browser rehearsal. Requires an externally running HemoGrid
 * frontend and backend and the public synthetic demo accounts.
 * Set HEMOGRID_LIVE_E2E=1 and PLAYWRIGHT_BASE_URL to the hosted origin.
 */
import { expect, test, type Page } from "@playwright/test";

test.describe("hosted three-role demo navigation", () => {
  test.skip(process.env.HEMOGRID_LIVE_E2E !== "1", "Opt-in: requires deployed demo");
  test.setTimeout(180_000);

  async function signIn(page: Page, role: "Hospital" | "Blood bank" | "Platform admin", workspace: string) {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 90_000 });

    if (role !== "Hospital") {
      await page.getByRole("button", { name: role, exact: true }).click();
    }
    const login = page.getByRole("button", { name: "Continue to workspace" });
    await expect(login).toBeVisible({ timeout: 30_000 });
    await login.click();
    await expect(page).toHaveURL(new RegExp(workspace + "$"), { timeout: 90_000 });
    await expect(page.locator("h1").first()).toBeVisible();
  }

  async function assertHealthyPage(page: Page) {
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(/application error: a server-side exception/i)).toHaveCount(0);
  }

  test("hospital can sign in and view request workspaces", async ({ page }) => {
    await signIn(page, "Hospital", "/hospital/dashboard");
    await page.goto("/hospital/requests", { waitUntil: "domcontentloaded" });
    await assertHealthyPage(page);
    await page.goto("/hospital/requests/new", { waitUntil: "domcontentloaded" });
    await assertHealthyPage(page);
  });

  test("blood bank can view assigned requests and inventory", async ({ page }) => {
    await signIn(page, "Blood bank", "/blood-bank/dashboard");
    await page.goto("/blood-bank/requests", { waitUntil: "domcontentloaded" });
    await assertHealthyPage(page);
    await page.goto("/blood-bank/inventory", { waitUntil: "domcontentloaded" });
    await assertHealthyPage(page);
  });

  test("coordinator can open the joint dispatch preview workspace", async ({ page }) => {
    await signIn(page, "Platform admin", "/admin/dashboard");
    await expect(page.getByRole("heading", { name: /closest blood bank is not always the right one/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open joint dispatch planner/i })).toBeVisible();
    await expect(page.getByText(/Live Network Telemetry/i)).toHaveCount(0);
    await page.goto("/admin/dispatch-planner", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Joint dispatch planner/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/Select pending requests/i)).toBeVisible();
    // Do not declare staffApproved or generate proposals without staff approval.
  });

  test("hospital dashboard fits a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, "Hospital", "/hospital/dashboard");
    await assertHealthyPage(page);
    const openNav = page.getByRole("button", { name: "Open navigation" });
    await expect(openNav).toBeVisible();
    await openNav.click();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Requests", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
    const size = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    if (size.scrollWidth > size.viewport + 3) {
      const offenders = await page.evaluate(() =>
        Array.from(document.querySelectorAll("*"))
          .map((element) => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width > 0 && rect.right > window.innerWidth + 3)
          .sort((a, b) => b.rect.right - a.rect.right)
          .slice(0, 12)
          .map(({ element, rect }) => ({
            tag: element.tagName,
            css: typeof element.className === "string" ? element.className.slice(0, 130) : "",
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          })),
      );
      console.log("Mobile overflow candidates:", JSON.stringify(offenders));
    }
    expect(size.scrollWidth, "Mobile page must not overflow horizontally").toBeLessThanOrEqual(
      size.viewport + 3,
    );
  });
});
