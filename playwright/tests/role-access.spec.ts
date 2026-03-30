import { expect, test } from "@playwright/test";
import { createRolePage, expectNoCriticalA11yViolations } from "../support/helpers";

test("planner and viewer can access core routes without admin-only crashes", async ({ browser }) => {
  const planner = await createRolePage(browser, "planner");
  await planner.page.goto("/app");
  await expect(planner.page.getByText(/districts/i)).toBeVisible();
  await planner.page.goto("/app/settings");
  await expect(planner.page.getByText(/organization admins only/i)).toBeVisible();
  await planner.page.goto("/app/analytics");
  await expect(planner.page.getByText(/organization admins only/i)).toBeVisible();
  await expectNoCriticalA11yViolations(planner.page);

  const viewer = await createRolePage(browser, "viewer");
  await viewer.page.goto("/app");
  await expect(viewer.page.getByText(/districts/i)).toBeVisible();
  await viewer.page.goto("/app/settings");
  await expect(viewer.page.getByText(/organization admins only/i)).toBeVisible();

  await planner.context.close();
  await viewer.context.close();
});
