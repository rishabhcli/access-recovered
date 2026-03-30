import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

const baseUrl = process.env.DEMO_BASE_URL?.trim() || "http://127.0.0.1:8082";
const viewport = { width: 1600, height: 900 };
const onboardingStorageKey = "lifeline-onboarding-completed";

const tmpDir = path.join(rootDir, "tmp/demo");
const accountPath = path.join(tmpDir, "demo-account.json");
const authStatePath = path.join(tmpDir, "auth-state.json");
const outputRoot = path.join(rootDir, "output/demo");
const rawDir = path.join(outputRoot, "raw");
const stillsDir = path.join(outputRoot, "stills");
const finalDir = path.join(outputRoot, "final");
const captureMetaPath = path.join(outputRoot, "capture-meta.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDemoAccount() {
  if (!existsSync(accountPath)) {
    throw new Error("Missing tmp/demo/demo-account.json. Run npm run demo:bootstrap first.");
  }
  return JSON.parse(await fs.readFile(accountPath, "utf8"));
}

async function clickBoardTarget(page, testId) {
  await page.getByTestId(testId).click({ force: true });
}

async function completeOnboarding(page) {
  for (let step = 0; step < 5; step++) {
    const button = page.getByRole("button", { name: /next|get started/i });
    if (!(await button.isVisible().catch(() => false))) break;
    await button.click();
    await page.waitForTimeout(400);
  }
}

async function createAuthedContext(browser, options = {}) {
  const context = await browser.newContext({
    viewport,
    storageState: authStatePath,
    ...options,
  });
  await context.addInitScript((storageKey) => {
    window.localStorage.setItem(storageKey, "true");
  }, onboardingStorageKey);
  return context;
}

async function signInAndSaveState(browser, account) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/auth`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(`${baseUrl}/app`);
  await completeOnboarding(page);
  await page.evaluate((storageKey) => {
    window.localStorage.setItem(storageKey, "true");
  }, onboardingStorageKey);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(stillsDir, "workspace-home.png"), fullPage: true });
  await context.storageState({ path: authStatePath });
  await context.close();
}

async function moveVideo(page, context, clipName) {
  const video = page.video();
  const sourcePathPromise = video ? video.path() : Promise.resolve(null);
  await context.close();
  const sourcePath = await sourcePathPromise;
  if (!sourcePath) throw new Error(`No recorded video for clip ${clipName}`);
  const target = path.join(rawDir, `${clipName}.webm`);
  await fs.rename(sourcePath, target);
  return target;
}

async function recordClip(browser, clipName, useAuth, runCapture) {
  const context = useAuth
    ? await createAuthedContext(browser, { recordVideo: { dir: rawDir, size: viewport } })
    : await browser.newContext({
        viewport,
        recordVideo: { dir: rawDir, size: viewport },
      });
  const page = await context.newPage();
  const result = await runCapture(page);
  const videoPath = await moveVideo(page, context, clipName);
  return { ...(result ?? {}), videoPath };
}

async function recordLanding(browser) {
  return recordClip(browser, "landing", false, async (page) => {
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(stillsDir, "landing.png"), fullPage: true });
    await page.mouse.move(820, 520);
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, 640);
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, -640);
    await page.waitForTimeout(1500);
  });
}

async function recordScriptedReplay(browser) {
  return recordClip(browser, "scripted-replay", false, async (page) => {
    await page.goto(`${baseUrl}/replay/bridge-reconnect`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(stillsDir, "scripted-replay-baseline.png"), fullPage: true });
    for (const shot of ["flooded", "armed", "resolved"]) {
      await page.getByRole("button", { name: /next/i }).click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(stillsDir, `scripted-replay-${shot}.png`), fullPage: true });
    }
    await page.waitForTimeout(1800);
  });
}

async function createRun(page, config, { recorded = false } = {}) {
  await page.goto(`${baseUrl}/app/rehearsal/riverbend-east`, { waitUntil: "networkidle" });
  await page.waitForTimeout(recorded ? 1200 : 500);
  await page.getByRole("button", { name: config.scenario }).click();
  await page.waitForTimeout(recorded ? 1200 : 500);
  await page.getByRole("button", { name: config.intervention }).click();
  await page.waitForTimeout(recorded ? 800 : 300);
  await clickBoardTarget(page, `board-anchor-${config.anchorId}`);
  await page.waitForTimeout(recorded ? 800 : 300);
  if (config.beforeDeployScreenshot) {
    await page.screenshot({ path: path.join(stillsDir, config.beforeDeployScreenshot), fullPage: true });
  }
  await page.getByTestId("board-deploy-intervention").click();
  await page.waitForTimeout(recorded ? 1800 : 700);
  if (config.afterDeployScreenshot) {
    await page.screenshot({ path: path.join(stillsDir, config.afterDeployScreenshot), fullPage: true });
  }
  await page.getByRole("button", { name: /save run/i }).click();
  await page.waitForURL(/\/app\/runs\//);
  await page.waitForTimeout(recorded ? 1200 : 400);
  return new URL(page.url()).pathname.split("/").pop();
}

async function seedAnalyticsRuns(browser) {
  const context = await createAuthedContext(browser);
  const page = await context.newPage();
  const runs = [
    {
      scenario: /moderate river rise/i,
      intervention: /barrier line/i,
      anchorId: "north-drain-corridor",
    },
    {
      scenario: /severe flash flood/i,
      intervention: /mobile clinic/i,
      anchorId: "east-school-lot",
    },
  ];

  for (const run of runs) {
    await createRun(page, run);
  }

  await context.close();
}

async function recordHookResolved(browser) {
  return recordClip(browser, "hook-resolved", true, async (page) => {
    await page.goto(`${baseUrl}/app/rehearsal/riverbend-east`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: /severe flash flood/i }).click();
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: /temporary bridge/i }).click();
    await page.waitForTimeout(600);
    await clickBoardTarget(page, "board-anchor-j-east-crossing");
    await page.waitForTimeout(500);
    await page.getByTestId("board-deploy-intervention").click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(stillsDir, "hook-resolved.png"), fullPage: true });
    await page.waitForTimeout(1500);
  });
}

async function recordProblemSetup(browser) {
  return recordClip(browser, "problem-setup", true, async (page) => {
    await page.goto(`${baseUrl}/app`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.locator('a[href="/app/districts/riverbend-east"]').first().click();
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(stillsDir, "district-overview.png"), fullPage: true });
    await page.getByRole("link", { name: /open rehearsal board/i }).click();
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: /severe flash flood/i }).click();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(stillsDir, "flooded-board.png"), fullPage: true });
    await clickBoardTarget(page, "board-cluster-cluster-east-a");
    await page.waitForTimeout(1500);
    await clickBoardTarget(page, "board-cluster-cluster-east-b");
    await page.waitForTimeout(1800);
    await page.getByRole("button", { name: /temporary bridge/i }).click();
    await page.waitForTimeout(1000);
    await clickBoardTarget(page, "board-anchor-j-east-crossing");
    await page.waitForTimeout(1500);
  });
}

async function recordHeroRunDetail(browser) {
  return recordClip(browser, "hero-run-detail", true, async (page) => {
    const runId = await createRun(page, {
      scenario: /severe flash flood/i,
      intervention: /temporary bridge/i,
      anchorId: "j-east-crossing",
      beforeDeployScreenshot: "armed-bridge.png",
      afterDeployScreenshot: "resolved-board.png",
    }, { recorded: true });

    await page.screenshot({ path: path.join(stillsDir, "run-detail.png"), fullPage: true });
    await page.getByLabel("Notes").fill("Hero run for the Lifeline hackathon walkthrough.");
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /save notes/i }).click();
    await page.waitForTimeout(1200);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /export json/i }).click();
    await downloadPromise;
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: /copy link/i }).click();
    await page.waitForTimeout(1400);
    return { heroRunId: runId };
  });
}

async function recordPublicRun(browser, runId) {
  return recordClip(browser, "public-run", false, async (page) => {
    await page.goto(`${baseUrl}/replay/${runId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(stillsDir, "public-run.png"), fullPage: true });
    await page.mouse.wheel(0, 720);
    await page.waitForTimeout(1800);
    await page.mouse.wheel(0, -480);
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: /share/i }).click();
    await page.waitForTimeout(1600);
  });
}

async function recordAnalyticsSettings(browser) {
  return recordClip(browser, "analytics-settings", true, async (page) => {
    await page.goto(`${baseUrl}/app/analytics`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(stillsDir, "analytics.png"), fullPage: true });
    await page.mouse.wheel(0, 820);
    await page.waitForTimeout(1700);
    await page.goto(`${baseUrl}/app/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(stillsDir, "settings.png"), fullPage: true });
    await page.mouse.wheel(0, 680);
    await page.waitForTimeout(1600);
  });
}

async function main() {
  await fs.rm(rawDir, { force: true, recursive: true });
  await fs.rm(stillsDir, { force: true, recursive: true });
  await fs.mkdir(rawDir, { recursive: true });
  await fs.mkdir(stillsDir, { recursive: true });
  await fs.mkdir(finalDir, { recursive: true });

  const account = await ensureDemoAccount();
  const browser = await chromium.launch({ headless: true });
  try {
    await signInAndSaveState(browser, account);
    await seedAnalyticsRuns(browser);
    const clips = {};
    clips.landing = await recordLanding(browser);
    clips.scriptedReplay = await recordScriptedReplay(browser);
    clips.hookResolved = await recordHookResolved(browser);
    clips.problemSetup = await recordProblemSetup(browser);
    clips.heroRunDetail = await recordHeroRunDetail(browser);
    clips.publicRun = await recordPublicRun(browser, clips.heroRunDetail.heroRunId);
    clips.analyticsSettings = await recordAnalyticsSettings(browser);

    const metadata = {
      createdAt: new Date().toISOString(),
      baseUrl,
      accountEmail: account.email,
      heroRunId: clips.heroRunDetail.heroRunId,
      clips,
    };

    await fs.writeFile(captureMetaPath, `${JSON.stringify(metadata, null, 2)}\n`);
    console.log(`Saved capture metadata to ${captureMetaPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
