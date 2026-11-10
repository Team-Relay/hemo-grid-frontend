/** Covers the browser-close scenario that previously sent valid users back to login. */

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("a valid hospital session survives closing a tab and root navigation", async ({ context }) => {
  const loginPage = await context.newPage();
  await loginPage.goto("/login");
  await loginPage.getByRole("button", { name: "Continue to workspace" }).click();
  await expect(loginPage).toHaveURL(/\/hospital\/dashboard$/);

  await loginPage.close();

  const restoredPage = await context.newPage();
  await restoredPage.goto("/");
  await expect(restoredPage).toHaveURL(/\/hospital\/dashboard$/);

  await restoredPage.goto("/login");
  await expect(restoredPage).toHaveURL(/\/hospital\/dashboard$/);

  const accessibility = await new AxeBuilder({ page: restoredPage })
    .disableRules(["color-contrast"])
    .analyze();
  expect(accessibility.violations).toEqual([]);

  // Use the non-polling network route so a dashboard refresh cannot remount an
  // open profile menu while the test is locating the explicit logout control.
  await restoredPage.goto("/hospital/network");
  await expect(restoredPage.getByRole("heading", { name: "Regional blood network" })).toBeVisible();
  await restoredPage.getByRole("button", { name: "Open user menu" }).click();
  const signOutButton = restoredPage.getByRole("button", { name: "Sign out" });
  await expect(signOutButton).toBeVisible();
  await signOutButton.click();
  await expect(restoredPage).toHaveURL(/\/login$/);

  await restoredPage.goto("/");
  await expect(restoredPage).toHaveURL(/\/login$/);
});
