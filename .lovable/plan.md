
Issue summary:
- You’re likely hitting a login race condition, not just a role issue.
- `Login.tsx` navigates to `/admin` immediately after `signIn`, while `AuthProvider` may still have `user = null` for a brief moment.
- `ProtectedRoute` then sends you back to `/he/login?redirect=/admin`.
- The login page currently has no “already-authenticated” redirect guard, so you can get stuck bouncing back to login.

Do I know what the issue is?
- Yes: the auth state hydration + immediate navigation timing is causing protected-route rejection before auth context is fully ready.

Plan to fix (minimal, safe):

1) Harden login success flow (src/pages/Login.tsx)
- Remove the immediate `supabase.auth.getSession()` + direct DB role query after sign-in.
- After successful `signIn`, let `AuthProvider` become the single source of truth for `user/roles`.
- Add a redirect effect on login page:
  - If `user` is authenticated and `rolesLoaded` is true:
    - admin → `/admin`
    - worker → `/admin/orders`
    - otherwise → `redirect` query param (or locale account fallback)
- This prevents getting stuck on login if auth state arrives slightly after navigation.

2) Keep route guard strict but stable (src/components/ProtectedRoute.tsx)
- Keep the current loading checks (`loading`, then `rolesLoaded`) before authorization decision.
- Ensure unauthorized role redirects to a safe page, but authenticated users are never treated as logged out during role-fetch wait.
- No UX change, just stable guard timing.

3) Tighten auth-state lifecycle semantics (src/hooks/useAuth.tsx)
- Ensure `loading` only represents session bootstrap/auth lifecycle, not transient role fetch delays.
- Keep `TOKEN_REFRESHED` as session-only update (no profile/roles refetch).
- Ensure `rolesLoaded` is set deterministically for authenticated sessions (including fetch error fallback), so guards don’t hang or misfire.

4) Verify locale-safe redirects
- Keep admin login redirect target as `/he/login?redirect=/admin` (current behavior).
- Preserve existing locale routing for non-admin flows.

Validation checklist (end-to-end):
- Login as admin from `/he/login?redirect=%2Fadmin` → lands on `/admin` and stays there.
- Refresh `/admin` directly while logged in → remains on admin.
- Login as worker → lands on `/admin/orders`.
- Login as customer and open `/admin` → redirected to non-admin page (not stuck on login loop).
- Logout then retry protected route → redirected to login correctly.
