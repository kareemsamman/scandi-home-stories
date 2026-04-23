import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Tranzila sometimes redirects with the query string fully URL-encoded
// (e.g. ".../tranzila-return%3FResponse%3D000%26..."), which the browser
// treats as part of the path — leading to a blank/404 page. Detect that
// case as early as possible and rewrite it to a real query string before
// React Router boots.
(() => {
  try {
    const { pathname, hash, href } = window.location;
    const lower = pathname.toLowerCase();
    const idx = lower.indexOf("%3f");
    if (idx === -1) return;

    const realPath = pathname.substring(0, idx);
    let tail = pathname.substring(idx + 3);
    try { tail = decodeURIComponent(tail); } catch { /* ignore */ }

    const newUrl = `${realPath}?${tail}${hash || ""}`;
    if (newUrl !== href.replace(window.location.origin, "")) {
      window.history.replaceState(null, "", newUrl);
    }
  } catch {
    // ignore
  }
})();

createRoot(document.getElementById("root")!).render(<App />);

const shouldRegisterServiceWorker =
  import.meta.env.PROD && !window.location.hostname.includes("--");
const previewCacheResetKey = "amg-preview-sw-reset";

const unregisterServiceWorkers = async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  let hadCachedData = registrations.length > 0;

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    hadCachedData = hadCachedData || cacheKeys.length > 0;
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  }

  return hadCachedData;
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (shouldRegisterServiceWorker) {
      sessionStorage.removeItem(previewCacheResetKey);
      navigator.serviceWorker.register("/registerSW.js", { scope: "/" });
      return;
    }

    void (async () => {
      const clearedCachedPreview = await unregisterServiceWorkers();

      if (clearedCachedPreview && !sessionStorage.getItem(previewCacheResetKey)) {
        sessionStorage.setItem(previewCacheResetKey, "1");
        window.location.reload();
        return;
      }

      sessionStorage.removeItem(previewCacheResetKey);
    })();
  });
}
