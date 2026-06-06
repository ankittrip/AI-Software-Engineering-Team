import React from 'react';
import { Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-4 shadow-lg">
          <Shield className="w-7 h-7 text-accent" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-primary tracking-tight">
          AI Engine
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-surface border border-border py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};