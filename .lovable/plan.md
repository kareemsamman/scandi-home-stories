

## Root Cause Analysis

There are two cascading bugs causing the admin redirect:

### Bug 1: Token refresh storm triggers 429 rate limit
The auth logs show **~50 token refresh requests in 2 seconds** from the same user, eventually hitting a **429 rate limit**. The `onAuthStateChange` handler ignores the event type — it treats `TOKEN_REFRESHED` the same as `SIGNED_IN`, firing new `fetchProfile` + `fetchRoles` queries each time. Each of these authenticated queries can trigger yet another token refresh, creating a cascade.

### Bug 2: Failed token refresh causes session loss → redirect to login
When the 429 hits, the token refresh fails. The Supabase client then emits a `SIGNED_OUT` event. The `onAuthStateChange` handler sets `user = null` and `roles = []`. ProtectedRoute sees `!user` and redirects to `/he/login`.

```text
Login → onAuthStateChange fires → TOKEN_REFRESHED (x20) →
fetchProfile+fetchRoles (x20) → more token refreshes →
429 rate limit → session invalidated →
SIGNED_OUT event → user=null → redirect to /login
```

---

## Plan (2 files)

### 1. Fix `src/hooks/useAuth.tsx` — Stop the token refresh storm

- **Check `_event` type** in `onAuthStateChange`:
  - On `SIGNED_IN` / `USER_UPDATED`: fetch profile and roles (via setTimeout as before)
  - On `TOKEN_REFRESHED`: only update session/user objects, do NOT re-fetch profile/roles (they haven't changed)
  - On `SIGNED_OUT`: clear profile and roles
  - On `INITIAL_SESSION`: skip (handled by `getSession()` below)
- This eliminates the cascade of unnecessary DB queries during token refresh

### 2. Fix `src/components/ProtectedRoute.tsx` — Add `rolesLoaded` safety

- Add a `rolesLoaded` boolean to `AuthContextType` (set to `true` after the first successful roles fetch, only reset on sign-out)
- In ProtectedRoute, use `rolesLoaded` instead of `roles.length === 0` to decide whether to show the spinner
- This prevents a brief `roles = []` state from causing issues if roles are ever momentarily cleared

---

## Technical Details

**useAuth.tsx changes:**
```typescript
// Before (broken — fires on every event including TOKEN_REFRESHED)
async (_event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
  if (session?.user) {
    setTimeout(() => { fetchProfile(...); fetchRoles(...); }, 0);
  } else {
    setProfile(null); setRoles([]);
  }
}

// After (only refetch on meaningful events)
async (event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
  
  if (event === 'SIGNED_OUT') {
    setProfile(null);
    setRoles([]);
    setRolesLoaded(false);
  } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
    setTimeout(() => {
      fetchProfile(session!.user.id);
      fetchRoles(session!.user.id);
    }, 0);
  }
  // TOKEN_REFRESHED / INITIAL_SESSION: just update session, skip DB queries
  setLoading(false);
}
```

**ProtectedRoute.tsx change:**
```typescript
// Before: roles.length === 0 (ambiguous — empty vs not-yet-loaded)
// After:  !rolesLoaded (explicit flag from AuthContext)
if (!rolesLoaded) {
  return <Loader2 spinner />;
}
```

