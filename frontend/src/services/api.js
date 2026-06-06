import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-software-engineering-api.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const analyzeRepository = async (url) => {
  const response = await api.post("/scans/analyze", { url });
  return response.data;
};