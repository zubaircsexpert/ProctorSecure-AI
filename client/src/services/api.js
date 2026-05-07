import axios from "axios";
import { clearAuthSession, getAuthToken } from "../utils/authSession";

const browserHost = typeof window !== "undefined" ? window.location.hostname : "";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (browserHost === "localhost" || browserHost === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://proctorsecure-ai-jkc2.onrender.com");

const API = axios.create({ baseURL });

API.interceptors.request.use((request) => {
  const token = getAuthToken();

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();
    }
    return Promise.reject(error);
  }
);

export default API;
