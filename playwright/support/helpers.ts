import AxeBuilder from "@axe-core/playwright";
import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type UserRole = "admin" | "planner" | "viewer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const authDir = path.join(rootDir, "playwright/.auth");
export const playwrightTmpDir = path.join(rootDir, "playwright/.tmp");
const metaPath = path.join(playwrightTmpDir, "seed-meta.json");

export interface SeedMeta {
  adminOrgId: string;
  adminOrgSlug: string;
  districtId: string;
  districtSlug: string;
  emails: Record<UserRole, string>;
  seededRunId: string;
}

export function authStatePath(role: UserRole) {
  return path.join(authDir, `${role}.json`);
}

export async function readSeedMeta(): Promise<SeedMeta> {
  const content = await readFile(metaPath, "utf8");
  return JSON.parse(content) as SeedMeta;
}

export async function createRoleContext(browser: Browser, role: UserRole): Promise<BrowserContext> {
  return browser.newContext({ storageState: authStatePath(role) });
}

export async function createRolePage(browser: Browser, role: UserRole) {
  const context = await createRoleContext(browser, role);
  const page = await context.newPage();
  return { context, page };
}

export async function completeOnboardingIfVisible(page: Page) {
  while (await page.getByRole("button", { name: /next|get started/i }).isVisible().catch(() => false)) {
    const nextButton = page.getByRole("button", { name: /next|get started/i });
    const buttonText = await nextButton.textContent();
    await nextButton.click();
    if (buttonText?.match(/get started/i)) {
      break;
    }
  }
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/app");
}

export async function switchOrganization(page: Page, slug: string) {
  await page.getByTestId("org-switcher-trigger").click();
  await page.getByTestId(`org-switcher-option-${slug}`).click();
}

export async function expectNoCriticalA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious",
  );
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
}
