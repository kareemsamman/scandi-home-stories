const ADMIN_DRAFT_PREFIX = "amg-admin-draft:";

const getDraftKey = (key: string) => `${ADMIN_DRAFT_PREFIX}${key}`;

export const readAdminDraft = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getDraftKey(key));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const writeAdminDraft = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getDraftKey(key), JSON.stringify(value));
  } catch {
    // Ignore storage issues.
  }
};

export const clearAdminDraft = (key: string) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(getDraftKey(key));
  } catch {
    // Ignore storage issues.
  }
};