
Goal: make Tranzila iframe work with Handshake enabled, fix the incorrect iframe styling/payment-option flags, and make the success/failure return flow reliable.

1. Fix the Tranzila iframe request to match the documentation
- Update `src/components/TranzilaPayment.tsx` to use the documented parameter names:
  - `bit_pay=1` instead of `bit=1`
  - `google_pay=1` instead of `googlepay=1`
  - keep `cred_type=1`, `currency=1`, `tranmode=AK`, `lang`, `success_url_address`, `fail_url_address`, `notify_url_address`
- Add the documented display parameters so the Tranzila UI matches the site instead of using default teal/black styling:
  - `trBgColor`
  - `trTextColor`
  - `trButtonColor`
  - `buttonLabel`
  - optionally keep `nologo=1`
- Keep the iframe permission required by the docs for wallet payments:
  - `allow="payment"`
  - preserve current broader allow only if needed, but make sure the final markup still includes payment permission explicitly.

2. Implement the missing Handshake flow
- The current integration sends the iframe form directly, but with Handshake enabled Tranzila requires a pre-request to create a token first.
- Add a backend function that calls Tranzila Handshake API before rendering/submitting the iframe:
  - send `supplier`, `TranzilaPW`, and `sum`
  - receive `thtk`
- Then update `src/components/TranzilaPayment.tsx` to:
  - request the handshake token first
  - include `thtk` in the iframe POST
  - include `new_process=1` exactly as required by the docs
- This is the main reason for the current “Illegal Operation 275497” failure: Handshake is enabled in Tranzila, but the app is not yet sending the handshake token flow Tranzila now requires.

3. Move sensitive Tranzila credentials fully server-side
- Do not rely on terminal password from public app settings in the browser.
- Use backend-side secrets/config for the handshake request.
- Keep frontend limited to safe rendering data only.

4. Fix the return/bridge page so success and failure can actually reach the parent app
- Update `public/tranzila-bridge.html` to support both return methods described in the docs:
  - query string (`GET`)
  - form-posted body (`POST`)
- Right now it only reads `window.location.search`, so if Tranzila posts the response body to the success/fail URL, the parent page receives nothing.
- Make the bridge always post a normalized payload back to `window.parent`.

5. Make the success/failure detection more robust in the React component
- In `src/components/TranzilaPayment.tsx`, normalize Tranzila return fields from both bridge and direct iframe responses.
- Show the actual refusal reason from returned fields such as:
  - `Response`
  - `ErrorMessage`
  - `error_msg`
  - any other returned status text
- Keep the retry button visible and reset the iframe cleanly on retry.

6. Stabilize order creation vs webhook timing
- Review the current checkout flow in `src/pages/Checkout.tsx` and `supabase/functions/tranzila-webhook/index.ts`.
- Today the order is created only after the client receives success, while the webhook tries to mark an existing order as paid by `order_number`.
- That means the webhook can arrive before the order exists and get ignored.
- Adjust the flow so payment notifications are reliable, for example by:
  - creating the order before payment and marking it paid later, or
  - storing unmatched Tranzila notifications temporarily and reconciling them.
- This will prevent “paid but nothing happened” edge cases.

7. Keep the checkout UX aligned with your current payment setup
- Preserve the single combined payment method option in checkout.
- Ensure the title and explanatory text match the actual behavior of the iframe.
- If bank transfer remains exposed through Tranzila rather than a separate local flow, reflect that consistently in the labels.

Technical notes
- Docs-confirmed Handshake requirements:
  - create token via `https://api.tranzila.com/v1/handshake/create`
  - send `supplier`, `TranzilaPW`, `sum`
  - pass returned `thtk` into iframe request
  - pass `new_process=1`
- Docs-confirmed option/display params:
  - `bit_pay`
  - `google_pay`
  - `trBgColor`
  - `trTextColor`
  - `trButtonColor`
  - `buttonLabel`
- Docs-confirmed return behavior:
  - success/failure data may be returned via POST or GET to the success/failure URL, so the bridge must parse both.

Files likely to change
- `src/components/TranzilaPayment.tsx`
- `public/tranzila-bridge.html`
- `src/pages/Checkout.tsx`
- `supabase/functions/tranzila-webhook/index.ts`
- one new backend function for Handshake
- `supabase/config.toml` only if the new backend function needs non-default auth settings
