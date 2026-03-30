import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseDotenv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const outputDir = path.join(rootDir, "tmp/demo");
const accountPath = path.join(outputDir, "demo-account.json");

const mergedEnv = {};
for (const fileName of [".env", ".env.local"]) {
  const fullPath = path.join(rootDir, fileName);
  if (!existsSync(fullPath)) continue;
  Object.assign(mergedEnv, parseDotenv(readFileSync(fullPath)));
}

const baseUrl = process.env.DEMO_BASE_URL?.trim() || "http://127.0.0.1:8082";
const supabase = createClient(
  mergedEnv.VITE_SUPABASE_URL,
  mergedEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractConfirmLink(message) {
  const html = Array.isArray(message.html) ? message.html.join("\n") : "";
  const text = [message.text, html].filter(Boolean).join("\n");
  const match = text.match(/https?:\/\/[^\s"'<>]+/);
  if (!match) throw new Error("Failed to locate confirmation link in mailbox message.");
  return match[0];
}

async function tryExistingAccount() {
  if (!existsSync(accountPath) || process.argv.includes("--force-new")) return null;
  const existing = JSON.parse(await fs.readFile(accountPath, "utf8"));
  const { error } = await supabase.auth.signInWithPassword({
    email: existing.email,
    password: existing.password,
  });
  if (error) return null;
  await supabase.auth.signOut();
  return existing;
}

async function createMailbox() {
  const domainsRes = await fetch("https://api.mail.tm/domains");
  const domains = await domainsRes.json();
  const domain = domains["hydra:member"]?.find((item) => item.isActive)?.domain;
  if (!domain) throw new Error("No active mail.tm domain available.");

  const password = `DemoMail${Date.now()}!`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const email = `lifeline-demo-${Date.now()}-${attempt}@${domain}`;
    const accountRes = await fetch("https://api.mail.tm/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address: email, password }),
    });

    if (accountRes.ok) {
      const tokenRes = await fetch("https://api.mail.tm/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: email, password }),
      });
      const tokenJson = await tokenRes.json();
      if (!tokenJson.token) throw new Error("Mailbox token request failed.");
      return { email, password, token: tokenJson.token };
    }

    if (accountRes.status !== 429) {
      const failure = await accountRes.text();
      throw new Error(`mail.tm account creation failed: ${failure}`);
    }

    await sleep(attempt * 3000);
  }

  throw new Error("mail.tm rate-limited all mailbox creation attempts.");
}

async function confirmMailboxSignup(mailbox) {
  const signup = await supabase.auth.signUp({
    email: mailbox.email,
    password: mailbox.password,
    options: { data: { full_name: "Lifeline Demo User" } },
  });

  if (signup.error) throw signup.error;

  let messageId = null;
  for (let poll = 1; poll <= 24; poll++) {
    await sleep(5000);
    const messagesRes = await fetch("https://api.mail.tm/messages", {
      headers: { Authorization: `Bearer ${mailbox.token}` },
    });
    const messages = await messagesRes.json();
    if ((messages["hydra:totalItems"] ?? 0) > 0) {
      messageId = messages["hydra:member"][0].id;
      break;
    }
  }

  if (!messageId) throw new Error("Confirmation email did not arrive within 2 minutes.");

  const messageRes = await fetch(`https://api.mail.tm/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${mailbox.token}` },
  });
  const message = await messageRes.json();
  const confirmationUrl = extractConfirmLink(message);
  const confirmRes = await fetch(confirmationUrl, { redirect: "follow" });
  if (!confirmRes.ok) {
    throw new Error(`Confirmation link failed with status ${confirmRes.status}`);
  }

  await sleep(2000);
  const signIn = await supabase.auth.signInWithPassword({
    email: mailbox.email,
    password: mailbox.password,
  });
  if (signIn.error) throw signIn.error;
  await supabase.auth.signOut();

  return {
    email: mailbox.email,
    password: mailbox.password,
    mailboxProvider: "mail.tm",
    baseUrl,
    confirmedAt: new Date().toISOString(),
  };
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const existing = await tryExistingAccount();
  if (existing) {
    console.log(`Reusing demo account ${existing.email}`);
    return;
  }

  const mailbox = await createMailbox();
  const account = await confirmMailboxSignup(mailbox);
  await fs.writeFile(accountPath, `${JSON.stringify(account, null, 2)}\n`);
  console.log(`Created confirmed demo account ${account.email}`);
  console.log(`Saved credentials to ${accountPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
