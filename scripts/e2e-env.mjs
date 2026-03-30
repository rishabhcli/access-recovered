import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseDotenv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const tmpDir = path.join(rootDir, "playwright/.tmp");
const metaPath = path.join(tmpDir, "seed-meta.json");

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

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required E2E environment variable: ${name}`);
  }
  return value;
}

async function readSharedProjectUrl() {
  const envPath = path.join(rootDir, ".env");
  if (!existsSync(envPath)) {
    return null;
  }

  const content = await readFile(envPath, "utf8");
  return parseDotenv(content).VITE_SUPABASE_URL ?? null;
}

async function assertDedicatedProject(url) {
  const sharedUrl = await readSharedProjectUrl();
  if (sharedUrl && sharedUrl === url) {
    throw new Error("Refusing to seed the shared default .env Supabase project. Point E2E env vars at a dedicated test project.");
  }
}

function createAdminClient() {
  const url = requireEnv("VITE_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function findUserByEmail(client, email) {
  const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((user) => user.email === email) ?? null;
}

async function ensureUser(client, { email, password, fullName }) {
  const existing = await findUserByEmail(client, email);
  if (existing) {
    await client.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });
    return existing;
  }

  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });
  if (error) throw error;
  return data.user;
}

async function ensureDistrict(client) {
  const payload = {
    slug: "riverbend-east",
    name: "Riverbend East",
    description: "Dedicated E2E demo district",
    status: "published",
    version: "1.0.0",
    organization_id: null,
    is_public_demo: true,
    baseline_bundle_json: null,
    provenance_summary_json: {
      source: "e2e-seed",
    },
  };

  const { data, error } = await client
    .from("districts")
    .upsert(payload, { onConflict: "slug" })
    .select("id, slug")
    .single();
  if (error) throw error;
  return data;
}

async function ensureScenario(client, districtId, scenario) {
  const { data, error } = await client
    .from("scenarios")
    .upsert(
      {
        district_id: districtId,
        slug: scenario.slug,
        label: scenario.label,
        description: scenario.description,
        severity: scenario.severity,
        status: "published",
        default_for_demo: scenario.slug === "severe-flash-flood",
      },
      { onConflict: "district_id,slug" },
    )
    .select("id, slug")
    .single();

  if (error) throw error;
  return data;
}

async function getDefaultOrgId(client, userId) {
  const { data, error } = await client
    .from("profiles")
    .select("default_org_id")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data.default_org_id;
}

async function getOrganization(client, orgId) {
  const { data, error } = await client
    .from("organizations")
    .select("id, slug")
    .eq("id", orgId)
    .single();
  if (error) throw error;
  return data;
}

async function resetOrgState(client, adminOrgId, userIds, emails) {
  const { data: runs, error: runsError } = await client
    .from("scenario_runs")
    .select("id")
    .eq("organization_id", adminOrgId);
  if (runsError) throw runsError;

  const runIds = (runs ?? []).map((run) => run.id);
  if (runIds.length > 0) {
    const { error: eventsError } = await client
      .from("scenario_run_events")
      .delete()
      .in("run_id", runIds);
    if (eventsError) throw eventsError;
  }

  const { error: runDeleteError } = await client
    .from("scenario_runs")
    .delete()
    .eq("organization_id", adminOrgId);
  if (runDeleteError) throw runDeleteError;

  const { error: auditError } = await client
    .from("audit_logs")
    .delete()
    .eq("organization_id", adminOrgId);
  if (auditError) throw auditError;

  const { error: inviteError } = await client
    .from("invitations")
    .delete()
    .eq("organization_id", adminOrgId)
    .in("email", emails);
  if (inviteError) throw inviteError;

  const { error: membershipError } = await client
    .from("user_roles")
    .delete()
    .eq("organization_id", adminOrgId)
    .in("user_id", userIds);
  if (membershipError) throw membershipError;
}

async function insertSeededRun(client, adminOrgId, adminUserId, districtId, scenarioId) {
  const { data: run, error } = await client
    .from("scenario_runs")
    .insert({
      organization_id: adminOrgId,
      district_id: districtId,
      scenario_id: scenarioId,
      created_by: adminUserId,
      title: "E2E Seeded Run",
      status: "resolved",
      baseline_metrics_json: {
        totalHouseholds: 612,
        householdsWithAccess: 612,
        isolatedClusters: 0,
      },
      flooded_metrics_json: {
        totalHouseholds: 612,
        householdsWithAccess: 328,
        isolatedClusters: 2,
      },
      resolved_metrics_json: {
        totalHouseholds: 612,
        householdsWithAccess: 612,
        isolatedClusters: 0,
      },
      selected_intervention_slug: "temporary-bridge",
      selected_anchor_id: "j-east-crossing",
      result_summary_json: {
        narrative: "Seeded replay narrative for public and detail page checks.",
        householdsRestored: 284,
        clustersReconnected: 2,
      },
      board_snapshot_before_json: [],
      board_snapshot_after_json: [],
      notes: "Seeded note for run detail tests.",
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: eventsError } = await client
    .from("scenario_run_events")
    .insert([
      { run_id: run.id, event_type: "baseline", created_by: adminUserId, payload_json: { phase: "baseline" } },
      { run_id: run.id, event_type: "flooded", created_by: adminUserId, payload_json: { phase: "flooded" } },
      { run_id: run.id, event_type: "intervention_applied", created_by: adminUserId, payload_json: { phase: "resolved" } },
      { run_id: run.id, event_type: "resolved", created_by: adminUserId, payload_json: { phase: "resolved" } },
    ]);
  if (eventsError) throw eventsError;

  return run.id;
}

async function seed() {
  const url = requireEnv("VITE_SUPABASE_URL");
  await assertDedicatedProject(url);

  const client = createAdminClient();

  const adminUser = await ensureUser(client, {
    email: requireEnv("E2E_ADMIN_EMAIL"),
    password: requireEnv("E2E_ADMIN_PASSWORD"),
    fullName: "Lifeline Admin",
  });
  const plannerUser = await ensureUser(client, {
    email: requireEnv("E2E_PLANNER_EMAIL"),
    password: requireEnv("E2E_PLANNER_PASSWORD"),
    fullName: "Lifeline Planner",
  });
  const viewerUser = await ensureUser(client, {
    email: requireEnv("E2E_VIEWER_EMAIL"),
    password: requireEnv("E2E_VIEWER_PASSWORD"),
    fullName: "Lifeline Viewer",
  });

  const adminOrgId = await getDefaultOrgId(client, adminUser.id);
  const adminOrg = await getOrganization(client, adminOrgId);
  const district = await ensureDistrict(client);
  const severeScenario = await ensureScenario(client, district.id, {
    slug: "severe-flash-flood",
    label: "Severe Flash Flood",
    description: "E2E seeded severe scenario",
    severity: "severe",
  });
  await ensureScenario(client, district.id, {
    slug: "moderate-river-rise",
    label: "Moderate River Rise",
    description: "E2E seeded moderate scenario",
    severity: "moderate",
  });

  await resetOrgState(
    client,
    adminOrgId,
    [plannerUser.id, viewerUser.id],
    [requireEnv("E2E_PLANNER_EMAIL"), requireEnv("E2E_VIEWER_EMAIL")],
  );

  const seededRunId = await insertSeededRun(client, adminOrgId, adminUser.id, district.id, severeScenario.id);

  await mkdir(tmpDir, { recursive: true });
  await writeFile(
    metaPath,
    JSON.stringify(
      {
        adminOrgId,
        adminOrgSlug: adminOrg.slug,
        districtId: district.id,
        districtSlug: district.slug,
        emails: {
          admin: requireEnv("E2E_ADMIN_EMAIL"),
          planner: requireEnv("E2E_PLANNER_EMAIL"),
          viewer: requireEnv("E2E_VIEWER_EMAIL"),
        },
        seededRunId,
      },
      null,
      2,
    ),
  );

  console.log(`Seeded E2E environment. Run: ${seededRunId}`);
}

const command = process.argv[2] ?? "seed";

if (command === "seed") {
  await seed();
} else {
  throw new Error(`Unknown command: ${command}`);
}
