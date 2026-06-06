import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const analyzeRepository = async (url) => {
  const response = await api.post("/scans/analyze", { url });
  return response.data;
};
