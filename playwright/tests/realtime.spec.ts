import { expect, test } from "@playwright/test";
import { completeOnboardingIfVisible, createRolePage } from "../support/helpers";

test("live activity bar updates when another session saves a run", async ({ browser }) => {
  const watcher = await createRolePage(browser, "admin");
  const actor = await createRolePage(browser, "admin");

  await watcher.page.goto("/app");
  await completeOnboardingIfVisible(watcher.page);
  await expect(watcher.page.getByText(/districts/i)).toBeVisible();

  await actor.page.goto("/app/rehearsal/riverbend-east");
  await actor.page.getByRole("button", { name: /severe flash flood/i }).click();
  await actor.page.getByRole("button", { name: /temporary bridge/i }).click();
  await actor.page.getByTestId("board-anchor-j-east-crossing").click();
  await actor.page.getByTestId("board-deploy-intervention").click();
  await actor.page.getByRole("button", { name: /save run/i }).click();

  await expect(watcher.page.getByText(/saved/i)).toBeVisible();

  await watcher.context.close();
  await actor.context.close();
});
