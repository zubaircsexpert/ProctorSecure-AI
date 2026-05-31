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

export const openFileFromClick = async (event, url) => {
  if (!url) return;
  event.preventDefault();
  const targetWindow = window.open("", "_blank", "noopener,noreferrer");

  try {
    await openFileUrl(url, targetWindow);
  } catch (error) {
    console.error("File open failed:", error);
    targetWindow?.close();

    let message = error.response?.data?.message || "";
    if (!message && error.response?.data instanceof Blob) {
      try {
        const payload = JSON.parse(await error.response.data.text());
        message = payload.message || "";
      } catch {
        message = "";
      }
    }

    if (!message && error?.message) {
      message = `Error: ${error.message}`;
    }

    console.error("Detailed error:", {
      status: error?.response?.status,
      message,
    });

    window.alert(message || "File could not be opened.");
  }
};
