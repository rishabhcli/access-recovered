import fs from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

const fps = 30;
const python = path.join(rootDir, ".venv312-video/bin/python");
const outputRoot = path.join(rootDir, "output/demo");
const rawDir = path.join(outputRoot, "raw");
const stillsDir = path.join(outputRoot, "stills");
const finalDir = path.join(outputRoot, "final");
const publicAssetsDir = path.join(rootDir, "public/demo-assets");
const publicClipsDir = path.join(publicAssetsDir, "clips");
const publicAudioDir = path.join(publicAssetsDir, "audio");
const publicStillsDir = path.join(publicAssetsDir, "stills");
const generatedDataPath = path.join(rootDir, "video/src/generatedDemoData.ts");
const narrationTextPath = path.join(finalDir, "lifeline-demo-script.txt");
const captionsPath = path.join(finalDir, "lifeline-demo-captions.srt");
const finalVideoPath = path.join(finalDir, "lifeline-demo-final.mp4");

const narrationVoice = process.env.DEMO_KOKORO_VOICE || "af_bella";
const narrationSpeed = Number(process.env.DEMO_KOKORO_SPEED || "1.02");

const segments = [
  {
    id: "hook",
    title: "One bridge. Two clusters back online.",
    eyebrow: "Hook",
    callout: "+284 households restored",
    clip: "hook-resolved",
    targetSeconds: 12,
    script:
      "A flash flood cuts off two neighborhoods. One temporary bridge brings 284 households back online.",
  },
  {
    id: "what-is",
    title: "Flood-access rehearsal for municipal teams",
    eyebrow: "What Lifeline Is",
    callout: "Scenario rehearsal, not live prediction",
    clip: "landing",
    targetSeconds: 18,
    script:
      "Lifeline is a rehearsal tool for flood-access planning. Instead of pretending to predict the future, it lets a municipal team test one intervention, watch the network change, and see who regains critical access to shelter and care first.",
  },
  {
    id: "problem",
    title: "The east crossing fails first",
    eyebrow: "Problem Setup",
    clip: "problem-setup",
    targetSeconds: 65,
    script:
      "We start in Riverbend East. The district is compact, but it has one fragile link: the east crossing. As soon as the severe flash flood scenario is applied, access drops from six hundred and twelve households to three hundred and twenty eight. Two east-side clusters lose reachable paths to both the shelter and the clinic. And what I like here is that the app makes the failure legible fast. You can click the isolated clusters, inspect the side panel, and see that this is not just a red map. It is a concrete service-access problem.",
  },
  {
    id: "wow",
    title: "Here’s the cool part",
    eyebrow: "Wow Moment",
    callout: "East Crossing · Temporary Bridge",
    clip: "hook-resolved",
    trimStartSeconds: 1,
    targetSeconds: 35,
    script:
      "Here’s the cool part. Instead of making the team guess, Lifeline lets them arm a single deployable action and place it exactly where it matters. In this case, a temporary bridge at East Crossing. The board reruns immediately, the metric strip jumps back up, and both isolated clusters reconnect. That is the payoff: one action, visible network recovery, and a quantified result.",
  },
  {
    id: "run-detail",
    title: "A saved artifact, not a disposable sim",
    eyebrow: "Run Detail",
    callout: "Metrics, notes, export, replay",
    clip: "hero-run-detail",
    trimStartSeconds: 5,
    targetSeconds: 45,
    script:
      "And the app does not stop at a visual result. The run can be saved immediately. That lands on a detailed report with the board snapshot, baseline versus flooded versus resolved metrics, the generated narrative, editable notes, and exportable JSON. So this becomes something a team can reference later, compare against other rehearsals, or hand to someone who never touched the board in the first place.",
  },
  {
    id: "public-replay",
    title: "Share the outcome without sharing edit access",
    eyebrow: "Public Replay",
    callout: "Read-only replay link",
    clip: "public-run",
    targetSeconds: 40,
    script:
      "That saved run also turns into a public replay. So the output can travel outside the workspace as a clean, read-only artifact. The result stays understandable, the timeline stays visible, and nobody needs a planner account just to understand what happened. For a hackathon demo, this is a big deal, because the proof does not disappear when the person driving the app stops talking.",
  },
  {
    id: "analytics",
    title: "Operational memory starts to build up",
    eyebrow: "Secondary Proof",
    callout: "Runs, interventions, audit feed",
    clip: "analytics-settings",
    targetSeconds: 45,
    script:
      "Once a team has more than one rehearsal, the product starts to feel more operational. Analytics shows run volume over time and which interventions are actually getting used. Settings and the recent activity feed show that this is built for a team environment, not just a solo simulation toy. In other words, the value compounds. Every run adds context, every run is auditable, and the organization can start to build a playbook instead of one-off screenshots.",
  },
  {
    id: "behind-scenes",
    title: "Deterministic network logic under the hood",
    eyebrow: "Behind The Scenes",
    callout: "Edges change. Access is recalculated.",
    stills: ["flooded-board.png", "resolved-board.png", "run-detail.png", "analytics.png"],
    targetSeconds: 30,
    script:
      "Under the hood, this is a deterministic network simulation. A scenario changes edge states from normal to degraded or blocked. An intervention adds or restores a path at a valid anchor. Then the app recalculates access cluster by cluster against the shelter and clinic thresholds. That is why the story feels credible. The visuals are clean, but the numbers are grounded in an explicit model.",
  },
  {
    id: "close",
    title: "Faster rehearsal. Clearer tradeoffs.",
    eyebrow: "Close",
    callout: "Built for judge-friendly proof",
    clip: "public-run",
    trimStartSeconds: 8,
    targetSeconds: 15,
    script:
      "For a team planning under pressure, that means faster rehearsal, clearer tradeoffs, and a result they can actually share.",
  },
];

function formatSrtTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 1000);
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":") + `,${String(milliseconds).padStart(3, "0")}`;
}

function chunkScript(script) {
  return script
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toTs(value, indent = 0) {
  const spacing = "  ".repeat(indent);
  if (Array.isArray(value)) {
    return `[\n${value.map((item) => `${"  ".repeat(indent + 1)}${toTs(item, indent + 1)}`).join(",\n")}\n${spacing}]`;
  }
  if (value && typeof value === "object") {
    return `{\n${Object.entries(value)
      .map(([key, item]) => `${"  ".repeat(indent + 1)}${key}: ${toTs(item, indent + 1)}`)
      .join(",\n")}\n${spacing}}`;
  }
  return JSON.stringify(value);
}

async function run(command, args) {
  await execFileAsync(command, args, { cwd: rootDir });
}

async function ffprobeDuration(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  return Number(stdout.trim());
}

async function transcodeClips() {
  await fs.mkdir(publicClipsDir, { recursive: true });
  for (const clip of readdirSync(rawDir).filter((file) => file.endsWith(".webm"))) {
    const baseName = clip.replace(/\.webm$/, "");
    await run("ffmpeg", [
      "-y",
      "-i",
      path.join(rawDir, clip),
      "-vf",
      "scale=1920:1080,fps=30",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      path.join(publicClipsDir, `${baseName}.mp4`),
    ]);
  }
}

async function copyStills() {
  await fs.mkdir(publicStillsDir, { recursive: true });
  for (const still of readdirSync(stillsDir).filter((file) => file.endsWith(".png"))) {
    await fs.copyFile(path.join(stillsDir, still), path.join(publicStillsDir, still));
  }
}

async function generateNarration() {
  await fs.mkdir(publicAudioDir, { recursive: true });
  const scripts = [];
  const generated = [];

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    const order = String(index + 1).padStart(2, "0");
    const textPath = path.join(outputRoot, `${order}-${segment.id}.txt`);
    const audioPath = path.join(publicAudioDir, `${order}-${segment.id}.wav`);
    await fs.writeFile(textPath, `${segment.script}\n`);
    await run(python, [
      "-m",
      "kokoro",
      "-i",
      textPath,
      "-o",
      audioPath,
      "-m",
      narrationVoice,
      "-s",
      String(narrationSpeed),
    ]);
    const audioSeconds = await ffprobeDuration(audioPath);
    const durationSeconds = Math.max(segment.targetSeconds, audioSeconds + 0.75);
    const captions = chunkScript(segment.script);
    generated.push({
      ...segment,
      audioSrc: `demo-assets/audio/${order}-${segment.id}.wav`,
      audioSeconds,
      durationSeconds,
      durationFrames: Math.round(durationSeconds * fps),
      trimStartFrames: Math.round((segment.trimStartSeconds ?? 0) * fps),
      clipSrc: segment.clip ? `demo-assets/clips/${segment.clip}.mp4` : null,
      stillsSrc: segment.stills?.map((still) => `demo-assets/stills/${still}`) ?? [],
      captions,
    });
    scripts.push(`${order}. ${segment.script}`);
  }

  await fs.writeFile(narrationTextPath, `${scripts.join("\n\n")}\n`);
  return generated;
}

async function writeCaptions(generatedSegments) {
  let currentSeconds = 0;
  let counter = 1;
  const lines = [];

  for (const segment of generatedSegments) {
    const perChunk = segment.durationSeconds / Math.max(segment.captions.length, 1);
    for (const caption of segment.captions) {
      const start = currentSeconds;
      const end = start + perChunk;
      lines.push(`${counter}`);
      lines.push(`${formatSrtTime(start)} --> ${formatSrtTime(end)}`);
      lines.push(caption);
      lines.push("");
      currentSeconds = end;
      counter += 1;
    }
  }

  await fs.writeFile(captionsPath, lines.join("\n"));
}

async function writeGeneratedData(generatedSegments) {
  const totalFrames = generatedSegments.reduce((sum, segment) => sum + segment.durationFrames, 0);
  const fileContents = `export const FPS = ${fps};\nexport const WIDTH = 1920;\nexport const HEIGHT = 1080;\nexport const TOTAL_FRAMES = ${totalFrames};\nexport const SEGMENTS = ${toTs(generatedSegments)} as const;\n`;
  await fs.writeFile(generatedDataPath, fileContents);
}

async function renderVideo() {
  await run("npx", [
    "remotion",
    "render",
    path.join("video/src/index.ts"),
    "LifelineDemo",
    finalVideoPath,
    "--codec=h264",
    "--audio-codec=aac",
    "--overwrite",
  ]);
}

async function main() {
  if (!existsSync(path.join(rootDir, ".venv312-video/bin/python"))) {
    throw new Error("Missing .venv312-video. Create the Kokoro environment before rendering.");
  }
  if (!existsSync(rawDir)) {
    throw new Error("Missing output/demo/raw. Run npm run demo:capture first.");
  }

  await fs.mkdir(finalDir, { recursive: true });
  await transcodeClips();
  await copyStills();
  const generatedSegments = await generateNarration();
  await writeCaptions(generatedSegments);
  await writeGeneratedData(generatedSegments);
  await renderVideo();
  console.log(`Rendered final video to ${finalVideoPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
