# Lifeline

Lifeline is a Vite + React + TypeScript rehearsal tool for flood-access planning. The app lets municipal teams explore a district, apply flood scenarios, place one intervention, save the resulting run, and share public replays.

## Setup

1. Install dependencies with `npm install`.
2. Copy the existing `.env` values or your own Supabase credentials into a local env file.
3. Start the app with `npm run dev`.

## Scripts

- `npm run dev`: start the Vite dev server on port `8080`.
- `npm run lint`: run ESLint.
- `npm run typecheck`: run the TypeScript project build in no-emit mode.
- `npm run test` or `npm run test:unit`: run the Vitest suite with coverage output.
- `npm run test:e2e`: build the app with the dedicated E2E env and run the Playwright suite.
- `npm run test:e2e:headed`: run the Chromium E2E suite headed.
- `npm run test:e2e:seed`: seed the dedicated Supabase test project without launching Playwright.
- `npm run test:ci`: local parity command for lint, typecheck, unit, and E2E coverage.

## Test Environment

The browser suite is designed for a dedicated Supabase test project only.

1. Copy [`.env.e2e.example`](./.env.e2e.example) to `.env.e2e.local`.
2. Fill in the dedicated project URL, anon key, service-role key, and fixed E2E credentials.
3. Run `npm run test:e2e:seed` to prepare the database state.
4. Run `npm run test:e2e`.

`scripts/e2e-env.mjs` refuses to seed the default shared `.env` project. Point `VITE_SUPABASE_URL` at a dedicated test project or CI secret set.

## Coverage Strategy

- Vitest covers simulation logic, store transitions, service wrappers, auth/org providers, route protection, and route-level page behavior.
- Playwright covers sign-up, protected route redirects, admin run creation, run detail actions, invitation/member management, role-aware UI, realtime activity, public replay, accessibility smoke, and the mobile viewport.
- Shared shadcn primitives and generated Supabase types are intentionally excluded from first-pass direct coverage.

## Manual QA

The release checklist lives in [`docs/manual-qa-checklist.md`](./docs/manual-qa-checklist.md).
