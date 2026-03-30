import { expect, test } from "@playwright/test";
import { expectNoCriticalA11yViolations, readSeedMeta } from "../support/helpers";

test("landing, redirect, and public replay work while signed out", async ({ page }) => {
  const meta = await readSeedMeta();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /map the path/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Demo" })).toBeVisible();
  await expectNoCriticalA11yViolations(page);

  await page.goto("/app");
  await expect(page).toHaveURL(/\/auth$/);

  await page.goto(`/replay/${meta.seededRunId}`);
  await expect(page.getByRole("heading", { name: /e2e seeded run/i })).toBeVisible();
  await expect(page.getByText(/public replay/i)).toBeVisible();
  await expect(page.getByText(/seeded replay narrative/i)).toBeVisible();

  await page.goto("/replay/bridge-reconnect");
  await expect(page.getByText(/before flooding/i)).toBeVisible();
  await page.getByRole("button", { name: /next/i }).click();
  await expect(page.getByText(/east crossing fails/i)).toBeVisible();
});
