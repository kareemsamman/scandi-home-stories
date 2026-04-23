Apple Pay domain verification
=============================

Apple Pay requires a verification file to be served from this exact path:

  https://YOUR-DOMAIN/.well-known/apple-developer-merchantid-domain-association

What to do
----------
1. Download the verification file from Interspace / Tranzila:
     https://ng.interspace.net/dl.php?type=d&id=774
   (login to Interspace required)

2. If it comes as a .zip, extract it. The file name MUST be exactly:
     apple-developer-merchantid-domain-association
   (no extension, no suffix)

3. Place it next to this README, so the path becomes:
     public/.well-known/apple-developer-merchantid-domain-association

4. Commit and deploy.

5. Verify it loads at:
     https://YOUR-DOMAIN/.well-known/apple-developer-merchantid-domain-association
   It should return the file contents as plain text, not an HTML page.

Notes
-----
- The SPA fallback in netlify.toml explicitly excludes /.well-known/* so
  this file will not be rewritten to index.html.
- The file does NOT have an extension on purpose — Apple requires the
  exact file name shown above.
