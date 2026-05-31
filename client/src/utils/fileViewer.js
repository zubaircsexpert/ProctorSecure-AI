import API from "../services/api";

const getApiPath = (url) => {
  const target = String(url || "");
  if (!target) return "";

  if (target.startsWith("/api/")) return target;

  const baseUrl = String(API.defaults.baseURL || "").replace(/\/+$/, "");
  if (baseUrl && target.startsWith(`${baseUrl}/api/`)) {
    return target.slice(baseUrl.length);
  }

  return "";
};

export const openFileUrl = async (url, targetWindow = null) => {
  const apiPath = getApiPath(url);

  if (!apiPath) {
    if (targetWindow) {
      targetWindow.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    return;
  }

  const response = await API.get(apiPath, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(response.data);
  if (targetWindow) {
    targetWindow.location.href = blobUrl;
  } else {
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  }
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
};

const readApiErrorMessage = async (error) => {
  const fallback = "File could not be opened. Please upload the file again if it was created before the latest deployment.";
  const data = error.response?.data;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed.message || fallback;
    } catch {
      return fallback;
    }
  }

  return data?.message || fallback;
};

export const openFileFromClick = async (event, url) => {
  if (!url) return;
  event.preventDefault();
  const targetWindow = window.open("", "_blank", "noopener,noreferrer");

  try {
    await openFileUrl(url, targetWindow);
  } catch (error) {
    console.error("File open failed:", error);
    targetWindow?.close();
    const message = await readApiErrorMessage(error);
    console.error("Detailed error:", {
      status: error?.response?.status,
      message,
    });
    window.alert(message);
  }
};
