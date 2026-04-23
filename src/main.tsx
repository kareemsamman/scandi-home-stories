import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
