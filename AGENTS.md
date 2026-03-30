# Repository Guidelines

## Project Structure & Module Organization
This repository is a Vite + React + TypeScript app.

- `src/`: application source.
  - `src/pages/` for routes and screens.
  - `src/components/` for UI modules (`components/ui` contains shared primitives).
  - `src/lib/` for domain services, utilities, and integrations.
  - `src/stores/` for app state.
  - `src/hooks/` for reusable hooks.
  - `src/data/` for seeds and reference fixtures.
  - `src/test/` for Vitest setup and tests.
- `public/`: static assets.
- `supabase/`: Supabase config and migration SQL.
- Root configs: `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `vitest.config.ts`, `playwright.config.ts`.

## Build, Test, and Development Commands
Run these commands from the repository root:

- `npm install` (or `bun install`): install dependencies.
- `npm run dev`: start local app at `http://localhost:8080`.
- `npm run build`: production build to `dist/`.
- `npm run build:dev`: development build.
- `npm run lint`: run ESLint checks.
- `npm run test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run preview`: preview a production build locally.

## Coding Style & Naming Conventions
- Language: TypeScript with React function components.
- Use path alias `@/` for imports from `src/`.
- Prefer typed component props, small scoped files, and explicit returns where readability improves clarity.
- Components/pages: `PascalCase` filenames (for example, `AuthPage.tsx`, `RunDetailPage.tsx`).
- Hooks: `useXxx` naming (`use-mobile.tsx`).
- Keep formatting lint-clean and consistent with existing ESLint rules.
- Shared primitives in `components/ui` may use kebab-case names per existing convention.

## Testing Guidelines
- Framework: Vitest + Testing Library (`@testing-library/react`) with jsdom.
- Tests follow `*.test.{ts,tsx}` or `*.spec.{ts,tsx}` and are discovered under `src/**/*`.
- Shared setup is in `src/test/setup.ts`.
- Keep tests close to the code they cover, especially for `lib/` and `stores/` logic.
- Prefer running `npm run test` before merging behavior changes.

## Commit & Pull Request Guidelines
- No explicit repo-level commit convention is documented, so use Conventional Commit format (e.g., `feat: add rehearsal board filters`, `fix: handle null auth state`).
- Use imperative, concise commit subjects and mention impact in the body.
- PRs should include:
  - Summary and rationale.
  - Validation commands run.
  - Linked issue/task references.
  - Screenshots or GIFs for UI updates.

## Security & Configuration Tips
- Required environment variables are loaded from `.env`, including Supabase keys/URLs (such as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`).
- Do not check real credentials into commits or paste them into comments.
- Use environment-variable management for team members and deployment platforms.
