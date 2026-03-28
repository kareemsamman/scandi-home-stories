

## Problem

The `X-Frame-Options: SAMEORIGIN` header in `public/_headers` (line 3) blocks the site from being embedded in the Lovable preview iframe, since the preview domain differs from the published domain. This causes a blank preview.

## Fix

Remove the `X-Frame-Options` line from `public/_headers`. The other security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Robots-Tag`) are safe to keep.

### File: `public/_headers`

Updated content:
```text
/*
  X-Robots-Tag: index, follow
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/registerSW.js
  Cache-Control: public, max-age=0, must-revalidate
```

Single line removal — no other files affected.

