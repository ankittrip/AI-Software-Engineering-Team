import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://ai-software-engineering-api.onrender.com/api";

export const analyzeRepository = async (repoUrl) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("No authentication token found. Please log in again.");
  }

  const response = await axios.post(
    `${API_URL}/scans/new`,
    { repoUrl },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};