
Issue confirmed and root cause identified:

- The upload request is being sent to:
  `POST /storage/v1/object/receipts/receipts/#99716_1.jpg`
- The response is:
  `403 Unauthorized: new row violates row-level security policy`
- In checkout, file path is built from `orderNumber`, and `orderNumber` includes `#` (example: `#99716`).
- Using `#` inside the storage object path is the core bug here. It creates an invalid/fragmented key in the request URL, which causes uploads to fail (and collide with bad keys like `receipts/`).

What I will implement:

1. Fix file-path generation in `src/pages/Checkout.tsx`
- Keep `orderNumber` with `#` for display/order UI.
- Create a separate **storage-safe** identifier for filenames (no `#`, ASCII-safe only).
- Build receipt paths with only safe characters + uniqueness suffix.
- Example target format:
  `receipts/99716_1710781234567_1.jpg`

2. Stop using upsert for receipt upload
- Change upload to `upsert: false` so each upload is a clean insert.
- This avoids accidental updates/collisions on malformed existing keys.

3. Improve upload diagnostics
- Log upload errors with path + message for faster future debugging.
- Keep existing user-facing toast, but with clearer fallback handling.

4. (Recommended cleanup) Normalize storage policies
- You currently have multiple overlapping receipt upload/update policies.
- I will clean duplicates and keep one clear insert policy for this bucket/path.
- Since we’ll stop upsert, open update policy is no longer required for checkout uploads.

5. (Optional but useful) Legacy broken-receipt handling
- Old orders already saved with paths containing `#` may remain unreadable.
- I can add a small admin-side fallback message for these legacy entries so the team knows to request re-upload when needed.

Technical details:

- Files to update:
  - `src/pages/Checkout.tsx`
  - (optional cleanup) new SQL migration under `supabase/migrations/*`
  - (optional UX) `src/pages/admin/OrderDetail.tsx`
- Key code changes in checkout upload flow:
  - Introduce helper to sanitize order number for storage key:
    - strip `#`
    - replace non `[a-zA-Z0-9_-]`
  - generate unique filename segment (`Date.now()` or UUID short suffix)
  - upload via `supabase.storage.from("receipts").upload(path, file, { upsert: false })`
- No change to business order number shown to customer/admin.

Validation plan after implementation:

1. Checkout on mobile (same viewport you’re using), upload JPG/PNG, click submit.
2. Confirm upload request URL no longer contains `#`.
3. Confirm storage upload returns success (not 400/403).
4. Confirm order is created and `receipt_url` is saved.
5. Open admin order detail and verify receipt preview via signed URL.
6. Repeat with multiple files and with guest vs logged-in customer.
