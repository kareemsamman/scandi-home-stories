

## Fix: Product Edit form state loss on navigation

### Problem
The `hydratedProductIdRef` guard is already in place, **but** the query has no `staleTime`, so when the user navigates away and back, the component remounts, React Query considers the cached data "stale" and re-fetches. During re-fetch, `isLoading` may briefly be true (showing a spinner), and if the query returns a new object reference, the hydration guard only prevents overwriting if the ref hasn't been reset — but the `useEffect` on `[productId]` **resets** `hydratedProductIdRef` to `null`, so when data arrives again, it **does** overwrite.

**Root cause**: The `useEffect` that resets `hydratedProductIdRef.current = null` on `[productId]` fires every time the component remounts (even with the same productId), allowing the populate effect to run again.

### Fix (2 changes in `ProductEdit.tsx`)

1. **Add `staleTime` to the query** — Set `staleTime: 5 * 60 * 1000` (5 minutes) on the `admin_product_edit` query. This prevents re-fetching when remounting if cached data is fresh, eliminating the loading flash entirely.

2. **Fix the hydration guard** — Change the reset effect so it only clears `hydratedProductIdRef` when the productId actually changes (not on every mount):
   ```tsx
   useEffect(() => {
     // Only reset if navigating to a DIFFERENT product
     if (hydratedProductIdRef.current && hydratedProductIdRef.current !== productId) {
       hydratedProductIdRef.current = null;
     }
   }, [productId]);
   ```
   This way, remounting with the same productId won't reset the guard, so cached data won't overwrite local edits.

3. **Add unsaved-changes warning** — Use `beforeunload` event and track a `dirty` flag to warn users before leaving with unsaved changes (optional enhancement).

### Files to modify
- `src/pages/admin/ProductEdit.tsx` — staleTime on query + fix hydration guard reset logic

