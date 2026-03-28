
Goal: eliminate the persistent preview failure (`[plugin:vite:import-analysis] Failed to resolve import "@/components/ui/toaster"`) and the related module/chunk instability.

What I found (from code inspection):
1. `src/components/ui/toaster.tsx` exists and is valid.
2. `src/App.tsx` import path is syntactically correct.
3. Required dependencies (`@tanstack/react-query`, `lucide-react`, `framer-motion`, Radix, etc.) are declared in `package.json`.
4. The app currently registers a service worker even in development (`src/main.tsx`), which can keep stale bundles/chunks alive and cause repeated “module/chunk not found” behavior.
5. The repo has multiple lockfile formats (`package-lock.json`, `bun.lock`, `bun.lockb`), which can cause inconsistent install behavior across environments.

Do I know what the issue is?
Yes: this is most likely an environment/module-resolution consistency problem (lockfile/runtime + cached assets), not a missing `toaster.tsx` file.

Implementation plan (step-by-step):
1. Standardize dependency resolution
   - Keep one package manager path (npm) for deterministic installs.
   - Remove Bun lockfiles (`bun.lock`, `bun.lockb`) so preview/build does not pick a different resolver.
   - Keep `package-lock.json` as the single source of dependency versions.

2. Harden alias resolution
   - Add `baseUrl: "."` in TypeScript config used by app builds (`tsconfig.app.json`, and root `tsconfig.json` if needed).
   - Add `vite-tsconfig-paths` plugin in `vite.config.ts` so Vite resolves `@/...` exactly from TS paths.
   - Keep existing explicit alias (`@ -> ./src`) as fallback.

3. Remove dev-time stale cache behavior
   - Update `src/main.tsx` to register service worker only in production (`import.meta.env.PROD`).
   - In development, explicitly unregister existing service workers (and optionally clear app caches) so old hashed chunks/import maps are not reused.

4. Add a safe fallback for the entry shell (optional hardening)
   - If needed, convert only `App.tsx` critical imports to relative paths as a temporary safety net during recovery.
   - Keep app-wide alias usage after resolver fix is confirmed.

5. Validate end-to-end
   - Open preview `/ar` and confirm no Vite overlay.
   - Navigate lazy routes (shop/product/admin categories) to ensure no dynamic import fetch errors.
   - Confirm toast systems mount (`Toaster` + `Sonner`) without import failures.
   - Run type/build checks to confirm TS2307 cascade is gone.
   - Hard refresh + reopen preview once to verify no stale-cache regression.

Technical details (files to change):
- `src/main.tsx`
  - gate SW registration to production
  - add dev unregister logic
- `vite.config.ts`
  - add `vite-tsconfig-paths` plugin
  - keep alias fallback
- `tsconfig.app.json` (and possibly `tsconfig.json`)
  - add `baseUrl`
  - retain `paths` mapping
- `package.json`
  - add `vite-tsconfig-paths` dev dependency
- repository root
  - remove `bun.lock` and `bun.lockb` (keep `package-lock.json`)

No backend/database changes are needed for this fix.
