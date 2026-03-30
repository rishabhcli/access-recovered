import { expect, test } from "@playwright/test";
import {
  completeOnboardingIfVisible,
  createRolePage,
  expectNoCriticalA11yViolations,
  readSeedMeta,
  signIn,
  switchOrganization,
} from "../support/helpers";

test("admin can run a rehearsal, save a run, and use run detail actions", async ({ browser, page }) => {
  const { context, page: adminPage } = await createRolePage(browser, "admin");

  await adminPage.goto("/app");
  await completeOnboardingIfVisible(adminPage);
  await expect(adminPage.getByText(/districts/i)).toBeVisible();
  await expectNoCriticalA11yViolations(adminPage);

  await adminPage.getByRole("link", { name: /riverbend east/i }).click();
  await adminPage.getByRole("link", { name: /open rehearsal board/i }).click();

  await adminPage.getByRole("button", { name: /severe flash flood/i }).click();
  await expect(adminPage.getByText(/disruption active/i)).toBeVisible();

  await adminPage.getByRole("button", { name: /temporary bridge/i }).click();
  await adminPage.getByTestId("board-anchor-j-east-crossing").click();
  await adminPage.getByTestId("board-deploy-intervention").click();

  await expect(adminPage.getByRole("button", { name: /save run/i })).toBeVisible();
  await adminPage.getByRole("button", { name: /save run/i }).click();
  await adminPage.waitForURL(/\/app\/runs\//);

  await expect(adminPage.getByRole("heading", { name: /riverbend east/i })).toBeVisible();
  await adminPage.getByLabel(/notes/i).fill("E2E run notes");
  await adminPage.getByRole("button", { name: /save notes/i }).click();
  await expect(adminPage.getByText(/saved/i)).toBeVisible();

  const downloadPromise = adminPage.waitForEvent("download");
  await adminPage.getByRole("button", { name: /export json/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/lifeline-run-.*\.json/);

  await adminPage.getByRole("button", { name: /copy link/i }).click();
  await expect(adminPage.getByRole("button", { name: /copied/i })).toBeVisible();

  await adminPage.getByRole("button", { name: /print report/i }).click();

  const runUrl = adminPage.url();
  await page.goto(runUrl.replace("/app/runs/", "/replay/"));
  await expect(page.getByText(/read-only replay/i)).toBeVisible();

  await context.close();
});

test("admin invitation flow updates settings and live activity", async ({ browser }) => {
  const meta = await readSeedMeta();
  const { context: dashboardContext, page: dashboardPage } = await createRolePage(browser, "admin");

  await dashboardPage.goto("/app");
  await completeOnboardingIfVisible(dashboardPage);
  await dashboardPage.getByRole("link", { name: /settings/i }).click();
  await dashboardPage.getByPlaceholder("colleague@city.gov").fill(meta.emails.planner);
  await dashboardPage.getByRole("button", { name: /send invitation/i }).click();
  await expect(dashboardPage.getByText(new RegExp(meta.emails.planner, "i"))).toBeVisible();

  const plannerContext = await browser.newContext();
  const plannerPage = await plannerContext.newPage();
  await signIn(plannerPage, process.env.E2E_PLANNER_EMAIL!, process.env.E2E_PLANNER_PASSWORD!);
  await completeOnboardingIfVisible(plannerPage);
  await switchOrganization(plannerPage, meta.adminOrgSlug);
  await expect(plannerPage.getByText(/districts/i)).toBeVisible();

  await dashboardPage.reload();
  await expect(dashboardPage.getByText(/lifeline planner/i)).toBeVisible();
  await dashboardPage.getByLabel(/role for lifeline planner/i).selectOption("viewer");
  await expect(dashboardPage.getByText(/role updated/i)).toBeVisible();
  await dashboardPage.getByRole("button", { name: /remove lifeline planner/i }).click();
  await expect(dashboardPage.getByText(/member removed/i)).toBeVisible();

  await dashboardContext.close();
  await plannerContext.close();
});
