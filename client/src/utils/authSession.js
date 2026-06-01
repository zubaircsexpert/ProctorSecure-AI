const TOKEN_KEY = "token";
const USER_KEY = "user";
const BACKGROUND_AT_KEY = "backgroundedAt";
const MAX_BACKGROUND_MS = 5 * 60 * 1000;

const hasBrowserStorage = () => typeof window !== "undefined";

export const clearLegacyAuthStorage = () => {
  if (!hasBrowserStorage()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};

export const saveAuthSession = (token, user) => {
  if (!hasBrowserStorage()) return;
  clearLegacyAuthStorage();
  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  if (!hasBrowserStorage()) return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(BACKGROUND_AT_KEY);
  clearLegacyAuthStorage();
};

export const getAuthToken = () => {
  if (!hasBrowserStorage()) return "";
  clearLegacyAuthStorage();
  return window.sessionStorage.getItem(TOKEN_KEY) || "";
};

export const getAuthUser = () => {
  if (!hasBrowserStorage()) return null;
  clearLegacyAuthStorage();

  try {
    const rawUser = window.sessionStorage.getItem(USER_KEY);
    if (!rawUser || rawUser === "undefined") {
      return null;
    }
    return JSON.parse(rawUser);
  } catch (error) {
    console.error("Stored user parse error:", error);
    clearAuthSession();
    return null;
  }
};

export const updateStoredUser = (user) => {
  if (!hasBrowserStorage()) return;
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const markSessionBackgrounded = () => {
  if (!hasBrowserStorage()) return;
  window.sessionStorage.setItem(BACKGROUND_AT_KEY, String(Date.now()));
};

export const clearSessionBackgrounded = () => {
  if (!hasBrowserStorage()) return;
  window.sessionStorage.removeItem(BACKGROUND_AT_KEY);
};

export const hasBackgroundSessionExpired = () => {
  if (!hasBrowserStorage()) return false;
  const backgroundedAt = Number(window.sessionStorage.getItem(BACKGROUND_AT_KEY) || 0);
  return Boolean(backgroundedAt && Date.now() - backgroundedAt > MAX_BACKGROUND_MS);
};
