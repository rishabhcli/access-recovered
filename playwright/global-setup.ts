import { chromium, type FullConfig } from "@playwright/test";
import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { authStatePath, playwrightTmpDir } from "./support/helpers";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required E2E environment variable: ${name}`);
  }
  return value;
}

async function seedEnvironment() {
  const rootDir = path.resolve(__dirname, "..");
  await execFileAsync(
    process.execPath,
    [path.join(rootDir, "scripts/e2e-env.mjs"), "seed"],
    {
      cwd: rootDir,
      env: process.env,
    },
  );
}

async function createStorageState(baseURL: string, email: string, password: string, targetPath: string) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/auth`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/app");
  await context.storageState({ path: targetPath });

  await browser.close();
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (typeof baseURL !== "string") {
    throw new Error("Playwright baseURL is required for global setup.");
  }

  await mkdir(playwrightTmpDir, { recursive: true });
  await seedEnvironment();

  await createStorageState(baseURL, requireEnv("E2E_ADMIN_EMAIL"), requireEnv("E2E_ADMIN_PASSWORD"), authStatePath("admin"));
  await createStorageState(baseURL, requireEnv("E2E_PLANNER_EMAIL"), requireEnv("E2E_PLANNER_PASSWORD"), authStatePath("planner"));
  await createStorageState(baseURL, requireEnv("E2E_VIEWER_EMAIL"), requireEnv("E2E_VIEWER_PASSWORD"), authStatePath("viewer"));
}
