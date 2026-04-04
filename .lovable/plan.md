
Goal: stop unsaved admin edits from being wiped on remount, starting with Product Edit and then applying the same pattern across the admin editors that currently re-hydrate from query data on every mount.

1. Fix ProductEdit exactly as requested
- Replace the current `hydratedProductIdRef` logic with a true `hasInitialized` guard plus `prevProductId` ref.
- Reset the guard only when `productId` actually changes.
- Keep the existing state-population code, but gate it with:
  `if (!productData || hasInitialized.current) return;`
- Keep the existing query `staleTime`, but treat it only as a performance improvement, not the bug fix.

2. Apply the same anti-reset pattern to other affected admin pages
I found multiple pages with the same root problem: local state is repopulated from query data every mount, which will wipe unsaved edits after route changes.
Priority pages:
- `src/pages/admin/ContactPage.tsx`
- `src/pages/admin/Settings.tsx`
- `src/pages/admin/HomePage.tsx`
- `src/pages/admin/AboutPage.tsx`
- `src/pages/admin/SiteContent.tsx`
- `src/pages/admin/WelcomePopup.tsx`
- `src/pages/admin/Pages.tsx`

Implementation pattern:
- Add an initialization ref/flag per page.
- Populate local state from fetched data only once per record/locale/page context.
- Reset the guard only when the true source context changes, such as:
  - `productId`
  - admin `locale`
  - selected page id
  - selected settings tab dataset if needed

3. Clean up the particularly risky Pages editor logic
- `src/pages/admin/Pages.tsx` currently sets state during render:
  `if (trans && !initialized) { setTitle(...); ... }`
- Move that into a guarded `useEffect`.
- Reset initialization when page id or locale changes.
- This is important because render-time state writes can contribute to unstable behavior and repeated renders.

4. Fix the repeated auth/profile/role loading
Root cause found:
- `src/hooks/useAuth.tsx` bootstraps auth in two paths:
  - `supabase.auth.onAuthStateChange(...)`
  - `supabase.auth.getSession().then(...)`
- Both can call `loadUserState`, which duplicates `profiles` and `user_roles` requests.
- Network evidence already shows repeated matching requests.

Planned auth fix:
- Use a single controlled bootstrap path for initial session hydration.
- Ignore duplicate initialization from the auth listener during first load.
- Add a guard ref so `loadUserState` is not called repeatedly for the same user/session during bootstrap.
- Only reload roles/profile when:
  - auth user actually changes
  - explicit `refreshProfile()` is called
  - sign-in/sign-out transitions occur

5. Stabilize AuthProvider output
- Memoize the context value returned by `AuthProvider`.
- Keep callback identities stable.
- This reduces avoidable re-renders across all consumers and lowers the chance of cascading effect churn in admin pages.

6. Verification checklist after implementation
- Product Edit: type changes, go to another admin page, come back, unsaved edits stay.
- Product Edit: switch browser tab and return, no reset.
- Contact / Settings / Home / About / Site Content / Welcome Popup / Pages: same unsaved-draft check.
- Auth: confirm `profiles` and `user_roles` are not requested repeatedly in loops on normal navigation.
- Confirm role-protected routes still work for admin and worker users.

Technical notes
- No database changes are needed.
- This is a frontend state hydration bug plus an auth initialization duplication issue.
- The broad rule to apply is:
  “Query data may hydrate local form state once per editing context, not on every remount.”
