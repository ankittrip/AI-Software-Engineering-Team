import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) {
    // ⚡ FIX: Navigate ke andar state mein current location pass kar diya.
    // Isse login hone ke baad user wapas usi page par aayega jahan woh aana chahta tha.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};