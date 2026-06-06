import axios from 'axios';

export const analyzeRepository = async (repoUrl) => {
  // 1. Token nikalna
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error("No authentication token found. Please log in again.");
  }

  // 2. Naye URL (/new) par request bhejna with Headers
  const response = await axios.post(
    'http://localhost:8000/api/scans/new', 
    { repoUrl },
    {
      headers: {
        'Authorization': `Bearer ${token}`, // 🔒 Yeh bouncer ko pass dikhayega
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
};