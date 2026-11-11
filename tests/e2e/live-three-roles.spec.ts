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

  test("sign-in cannot submit credentials before hydration", async ({ browser }) => {
    const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await noScriptContext.newPage();
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      const form = page.locator("form").first();
      await expect(form).toHaveAttribute("method", "post");
      await expect(page.getByRole("button", { name: "Continue to workspace" })).toBeDisabled();
      await expect(page).toHaveURL(/\/login$/);
    } finally {
      await noScriptContext.close();
    }
  });

  test("login communicates the dispatch problem and keeps all demo roles accessible", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 90_000 });
    await expect(page.getByRole("heading", {
      name: "The closest blood bank is not always the right one.",
    })).toBeVisible();
    await expect(page.getByText("Emergency blood dispatch", { exact: true })).toBeVisible();
    await expect(page.getByText(/Credentials are prefilled\. Choose a role and click Continue/)).toBeVisible();
    await expect(page.getByText("Already filled")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue to workspace" })).toBeEnabled();

    await page.getByRole("button", { name: "Blood bank", exact: true }).click();
    await expect(page.locator("#email")).toHaveValue("bank.demo@hemogrid.local");
    await page.getByRole("button", { name: "Platform admin", exact: true }).click();
    await expect(page.locator("#email")).toHaveValue("admin.demo@hemogrid.local");

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByText(
      "The closest blood bank is not always the right one.",
      { exact: true },
    ).last()).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue to workspace" })).toBeVisible();

    const size = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(size.scrollWidth, "Login must not overflow on mobile").toBeLessThanOrEqual(
      size.viewport + 3,
    );
  });

  test("minimal login fits desktop and mobile without page scrolling", async ({ page }) => {
    const sizes = [
      { width: 1706, height: 788 },
      { width: 1366, height: 720 },
      { width: 390, height: 844 },
      { width: 375, height: 667 },
      { width: 360, height: 640 },
    ];
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await expect(page.getByRole("button", { name: "Continue to workspace" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Continue to workspace" })).toBeEnabled();

      const geometry = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        const submit = document.querySelector('form button[type="submit"]');
        const submitRect = submit?.getBoundingClientRect();
        return {
          documentHeight: Math.max(root.scrollHeight, body.scrollHeight),
          viewportHeight: root.clientHeight,
          documentWidth: Math.max(root.scrollWidth, body.scrollWidth),
          viewportWidth: root.clientWidth,
          submitBottom: submitRect?.bottom,
          submitTop: submitRect?.top,
        };
      });
      expect(
        geometry.documentWidth,
        "Login horizontal overflow at " + size.width + "x" + size.height,
      ).toBeLessThanOrEqual(geometry.viewportWidth + 2);
      expect(
        geometry.documentHeight,
        "Login page scroll at " + size.width + "x" + size.height,
      ).toBeLessThanOrEqual(geometry.viewportHeight + 2);
      expect(geometry.submitTop).toBeGreaterThanOrEqual(0);
      expect(geometry.submitBottom).toBeLessThanOrEqual(geometry.viewportHeight - 2);
    }
  });

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

  test("planner outage gives staff a safe individual workflow, without reserving stock", async ({ page }) => {
    await signIn(page, "Platform admin", "/admin/dashboard");
    await page.goto("/admin/dispatch-planner", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Joint dispatch planner/i })).toBeVisible();
    const requests = page.locator('button[aria-pressed="false"]');
    await expect(requests.first()).toBeVisible();
    await requests.first().click();
    await requests.first().click();
    await page.getByRole("checkbox").check();

    // Deliberately disconnect only the joint-preview endpoint. Do not alter
    // provider selection, inventory or the hosted database.
    await page.route(/\/api\/v1\/dispatch-plans\/preview$/, (route) =>
      route.abort("failed"),
    );
    await page.getByRole("button", { name: /Preview dispatch plan/i }).click();
    const fallback = page.getByRole("region", { name: "Manual dispatch fallback" });
    await expect(fallback).toBeVisible({ timeout: 30_000 });
    await expect(fallback).toContainText("No supplier has been approved or reserved");
    await expect(fallback).toContainText("cold-chain-verified");
    await expect(fallback).toContainText("telephone/manual verification");
    await fallback.getByRole("button", { name: /Sign out and choose hospital or blood-bank workspace/i }).click();

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await page.getByRole("button", { name: "Continue to workspace" }).click();
    await expect(page).toHaveURL(/\/hospital\/dashboard$/, { timeout: 90_000 });
    await page.goto("/hospital/requests", { waitUntil: "domcontentloaded" });
    await assertHealthyPage(page);
    // Full create/select/accept/deliver + inventory reconciliation is
    // independently tested in the backend when the planner is forced to fail.
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
