

## Issues Found

### 1. "Low stock only" filter broken
`isProductLow()` (line 516) only checks DB inventory rows. Products with **no** DB rows use phantom rows (qty=0), but those aren't checked — so products that are truly at zero stock are invisible to the filter.

### 2. Duplicate length rows per color
Line 616: `dbItems.length > 0 ? dbItems : deriveRows(product)` — if **any** DB inventory rows exist for a product, ALL DB rows are shown. If the DB contains stale rows for lengths no longer configured on the product, they appear as extra unexplained rows. The fix is to merge DB rows with the expected phantom rows, using DB data where available and filtering out stale keys.

---

## Plan

### File: `src/pages/admin/Inventory.tsx`

**Fix 1 — `isProductLow` must also consider phantom rows**

Update `isProductLow` (line 516) to check the same merged set of rows that the UI renders, not just DB rows. Products with no inventory at all (qty=0 phantoms) should count as low.

**Fix 2 — Merge DB + phantom rows, discard stale DB entries**

Replace the simple `dbItems.length > 0 ? dbItems : deriveRows(product)` logic (line 616) with a merge function used in both rendering and filtering:
1. Generate expected phantom rows from the product's current color/length config
2. For each expected row, use the matching DB row if it exists (match on `variation_key`)
3. Discard DB rows whose `variation_key` doesn't match any current product configuration

This ensures:
- Only configured lengths appear per color
- DB stock values are preserved
- Stale/orphaned inventory rows are hidden
- The low-stock filter works correctly on the merged set

### Technical Detail

```
mergeInventory(product, dbItems):
  expected = deriveRows(product)        // phantoms for current config
  dbMap = Map(dbItems by variation_key)
  return expected.map(phantom =>
    dbMap.get(phantom.variation_key) || phantom
  )
```

Both `isProductLow` and the render loop will call `mergeInventory()` so they use the same data.

