import axios from "axios";

const browserHost = typeof window !== "undefined" ? window.location.hostname : "";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (browserHost === "localhost" || browserHost === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://proctorsecure-ai-jkc2.onrender.com");

const API = axios.create({ baseURL });

API.interceptors.request.use((request) => {
  const token = localStorage.getItem("token");

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

export default API;
