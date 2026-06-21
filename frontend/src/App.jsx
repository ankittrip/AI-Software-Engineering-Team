import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Settings = lazy(() => import('./features/settings/Settings').then(m => ({ default: m.Settings })));
const NewScan = lazy(() => import('./features/scans/NewScan').then(m => ({ default: m.NewScan })));
const ScanResults = lazy(() => import('./features/scans/ScanResults').then(m => ({ default: m.ScanResults })));
const ScanHistory = lazy(() => import('./features/scans/ScanHistory').then(m => ({ default: m.ScanHistory })));
const Login = lazy(() => import('./features/auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./features/auth/Register').then(m => ({ default: m.Register })));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-900">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

function App() {
  return (
    <>
      <Toaster position="top-right" richColors theme="dark" />
      
      <Suspense fallback={<PageLoader />}>
        <Routes>
          
          {/* PUBLIC ROUTES */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* PROTECTED ROUTES */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="scans/new" element={<NewScan />} />
            <Route path="scans/results/:id" element={<ScanResults />} />
            <Route path="scans/history" element={<ScanHistory />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* CATCH ALL */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>
    </>
  );
}

export default App;