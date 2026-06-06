import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import { Dashboard } from './features/dashboard/Dashboard';
import { Settings } from './features/settings/Settings';
import { NewScan } from './features/scans/NewScan'; 
import { ScanResults } from './features/scans/ScanResults';
import { ScanHistory } from './features/scans/ScanHistory';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors theme="dark" />
      <Routes>
        
        {/* PUBLIC ROUTES */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* 🔒 PROTECTED ROUTES */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Everything inside here is wrapped by the Sidebar and is now SECURE */}
          <Route index element={<Dashboard />} />
          <Route path="scans/new" element={<NewScan />} />
          <Route path="scans/results/:id" element={<ScanResults />} />
          <Route path="scans/history" element={<ScanHistory />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* CATCH ALL - Agar koi random URL daale toh usko wapas sahi jagah bhej do */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  );
}

export default App;