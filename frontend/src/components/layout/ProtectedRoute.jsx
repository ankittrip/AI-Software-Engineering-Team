import React from 'react';
import { Navigate } from 'react-router-dom';
// 👇 NAYA: Purane AuthContext ki jagah naya Zustand store import kiya
import { useAuthStore } from '../../stores/useAuthStore.js';

export const ProtectedRoute = ({ children }) => {
  // 👇 Zustand se check kiya ki user logged in hai ya nahi
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    // Agar login nahi hai, toh seedha login page par bhej do
    return <Navigate to="/login" replace />;
  }
  
  // Agar login hai, toh usko andar jaane do
  return children;
};