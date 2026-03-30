import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { expectNoCriticalA11yViolations, signIn } from "../support/helpers";

function createServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service-role env for auth E2E test.");
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

test("sign up creates a profile and first login shows onboarding", async ({ page }) => {
  const email = `lifeline-signup-${Date.now()}@example.com`;
  const password = process.env.E2E_SIGNUP_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD ?? "Password123!";

  await page.goto("/auth");
  await page.getByRole("button", { name: /sign up/i }).click();
  await page.getByLabel("Full Name").fill("Fresh Signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^sign up$/i }).click();

  await expect(page.getByText(/check your email to confirm your account/i)).toBeVisible();

  const client = createServiceClient();
  const { data: users } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const createdUser = users.users.find((user) => user.email === email);
  expect(createdUser?.email).toBe(email);

  const { data: profile } = await client.from("profiles").select("id, full_name, default_org_id").eq("id", createdUser!.id).single();
  expect(profile?.full_name).toBe("Fresh Signup");
  expect(profile?.default_org_id).toBeTruthy();

  await signIn(page, email, password);
  await expect(page.getByRole("heading", { name: /explore your district/i })).toBeVisible();
  await expectNoCriticalA11yViolations(page);
});
