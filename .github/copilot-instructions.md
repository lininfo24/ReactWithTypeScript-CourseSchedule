# Copilot repository instructions — ReactWithTypeScript-CourseSchedule

Purpose: repository-level guidance for Copilot agents operating on this project. Keep this file focused on actionable commands, architecture and repo-specific conventions.

---

## Quick commands (run from repo root)
Most scripts live in the `reactwithtypescript` subproject. Prepend `cd reactwithtypescript` or use the working-directory option in CI.

- Start dev server:  cd reactwithtypescript && npm run dev
- Build (type-check + bundle):  cd reactwithtypescript && npm run build
  - Note: `build` runs `tsc -b && vite build` — run `tsc -b` alone to debug TypeScript project-reference errors.
- Preview production build: cd reactwithtypescript && npm run preview
- Install dependencies (CI): cd reactwithtypescript && npm ci

Linting
- Run full lint: cd reactwithtypescript && npm run lint
- Run eslint on a single file: cd reactwithtypescript && npx eslint src/path/to/file.tsx --config eslint.config.js --ext .ts,.tsx

Unit tests (Vitest)
- Run all unit tests: cd reactwithtypescript && npm run test
- Run a single test file: cd reactwithtypescript && npx vitest src/path/to/file.test.tsx
- Run a specific test by name: cd reactwithtypescript && npx vitest -t "test name"
- CI uses: working-directory: reactwithtypescript && npx vitest

End-to-end (Playwright)
- Install browsers (first time): cd reactwithtypescript && npx playwright install
- Run E2E tests: cd reactwithtypescript && npx playwright test
- Playwright is configured to start the dev server (webServer) — ensure `npm run dev` is usable on port 5173 before running E2E.

---

## High-level architecture (big picture)
- Mono-repo-like layout: the actual app lives in `reactwithtypescript/` (Vite + React + TypeScript).  The top-level repo holds CI/workflows and project scaffolding.
- Build tool: Vite (dev server) + TypeScript project references (`tsconfig.json` references `tsconfig.app.json` and `tsconfig.node.json`). The `build` script runs `tsc -b` then `vite build`.
- Frontend: React + React Router. Routes are declared in `src/App.tsx` and organized under `src/pages/`.
- State: app-wide state is implemented with React Context + useReducer. Provider lives at `src/context/AppContext.tsx` and typed reducer/actions in `src/context/AppContextData.ts`.
- UI: small component library under `src/components/` (including `demo/` examples and `errorboundaries/`). Reusable hooks are under `src/hooks/` (e.g., `useLocalStorage`, `useWindowSize`).
- Observability: Microsoft Application Insights is wired in `src/appInsights.ts` using Vite env var `VITE_APPINSIGHTS_CONNECTION_STRING` (see `src/config.ts`).
- Tests: unit tests use Vitest + Testing Library (`src/**/*.test.tsx`), E2E tests use Playwright under `tests/e2e`.

---

## Key conventions and repo-specific patterns
- Working-directory: Nearly all dev/build/test commands run from `reactwithtypescript/`. CI workflows use that directory as working-directory.
- TypeScript strictness: tsconfig enables `strict` and multiple safety checks — prefer type-safe changes and run `tsc -b` when adding new types.
- State/actions: reducer actions are discriminated unions (see `AppContextData.ts`). Dispatch payloads follow exact shapes (e.g., `ADD_QUANTITY`, `RED_QUANTITY`, `DELETE_ITEM`, `CHG_LOCATION`, `SET_COURSES`). Use those names when dispatching.
- Hooks: custom hooks follow `useXxx` naming and live in `src/hooks/`; prefer the existing hooks (useLocalStorage, useEventListener, useWindowSize) for consistency.
- Tests: unit tests rely on `vitest/globals` types (configured in tsconfig). Test setup is in `src/setupTests.ts`. Use Testing Library queries in component tests for resilience.
- ESLint: project uses a JS-based ESLint config at `reactwithtypescript/eslint.config.js` and CI runs `npx eslint . --config eslint.config.js --ext .js,.jsx,.ts,.tsx` from that directory.
- Env vars: Vite requires `VITE_` prefix for env variables exposed to client code (see `src/config.ts`). Do not commit secrets.
- Playwright: config expects the dev server on `http://localhost:5173` and reuses an existing server when available (`reuseExistingServer`).

---

## Where to look for more context
- Source: `reactwithtypescript/src/` (pages, components, hooks, context)
- Tests: `reactwithtypescript/src/*.test.*` and `reactwithtypescript/tests/e2e`
- CI: `.github/workflows/*.yml` (vitest, eslint)

---

## Existing AI/assistant instruction files found
- None detected in the repo root or .github. (If you keep repo-level `CLAUDE.md`, `AGENTS.md` or other assistant rules, include any non-obvious instructions here.)

---

If adjustments are needed (more examples, commands for Windows PowerShell, or extra conventions to surface), edit this file or run `/init` in the Copilot CLI to scaffold interactive prompts.
