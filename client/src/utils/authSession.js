const TOKEN_KEY = "token";
const USER_KEY = "user";

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
