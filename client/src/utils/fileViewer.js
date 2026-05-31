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
    
    let errorMsg = "File could not be opened.";
    
    if (error?.response?.data?.message) {
      errorMsg = error.response.data.message;
    } else if (error?.message) {
      errorMsg = `Error: ${error.message}`;
    } else if (error?.status) {
      errorMsg = `Server error (${error.status}): Unable to fetch file.`;
    }
    
    console.error("Detailed error:", {
      status: error?.response?.status,
      message: error?.response?.data?.message,
      errorMsg
    });
    
    window.alert(errorMsg);
  }
};
