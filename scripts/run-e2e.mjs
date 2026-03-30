import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseDotenv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const mergedEnv = {};

for (const fileName of [".env", ".env.local", ".env.e2e.local"]) {
  const fullPath = path.join(rootDir, fileName);
  if (!existsSync(fullPath)) {
    continue;
  }

  Object.assign(mergedEnv, parseDotenv(readFileSync(fullPath)));
}

for (const [key, value] of Object.entries(mergedEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

function commandName(base) {
  return process.platform === "win32" ? `${base}.cmd` : base;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: process.env,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

const playwrightArgs = process.argv.slice(2);

await run(commandName("npm"), ["run", "build"]);
await run(commandName("npx"), ["playwright", "test", ...playwrightArgs]);
