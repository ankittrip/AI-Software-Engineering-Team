import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  Zap, 
  Activity, 
  GitBranch, 
  Loader2 
} from 'lucide-react';

import { useScanStore } from '../../stores/useScanStore';
import { useAuthStore } from '../../stores/useAuthStore';

export const Dashboard = () => {
  const isScanning = useScanStore((state) => state.isScanning);
  const activeScanUrl = useScanStore((state) => state.activeScanUrl);
  const recentLogs = useScanStore((state) => state.recentLogs);
  const dashboardStats = useScanStore((state) => state.dashboardStats);
  const scanProgressMessage = useScanStore((state) => state.scanProgressMessage);
  
  const fetchDashboardData = useScanStore((state) => state.fetchDashboardData);
  const initializeSocketListeners = useScanStore((state) => state.initializeSocketListeners);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchDashboardData();
    initializeSocketListeners();
  }, [fetchDashboardData, initializeSocketListeners]);

  const stats = [
    { 
      label: 'Total Repos Scanned', 
      value: dashboardStats?.totalReposScanned || 0, 
      icon: Terminal, 
      color: 'text-accent', 
      bg: 'bg-accent/10 border-accent/20' 
    },
    { 
      label: 'Avg. Security Score', 
      value: dashboardStats?.avgSecurityScore || 100, 
      icon: ShieldCheck, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10 border-emerald-500/20' 
    },
    { 
      label: 'Critical Issues Open', 
      value: dashboardStats?.criticalIssues || 0, 
      icon: ShieldAlert, 
      color: 'text-red-500', 
      bg: 'bg-red-500/10 border-red-500/20' 
    },
    { 
      label: 'AI Agents Online', 
      value: dashboardStats?.agentsOnline || "5/5", 
      icon: Zap, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10 border-amber-500/20' 
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-border p-8 rounded-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-primary mb-2">
            Welcome back, {user?.name || 'Engineer'}
          </h1>
          <p className="text-muted text-sm max-w-lg">
            Your AI agent swarm is fully operational. You have {dashboardStats?.criticalIssues || 0} critical vulnerabilities that require your attention today.
          </p>
        </div>
        
        <Link
          to="/scans/new"
          className="relative z-10 bg-primary text-background hover:bg-primary/90 font-medium rounded-xl px-6 py-3 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          <Zap className="w-4 h-4" /> Run New Scan
        </Link>

        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-surface border border-border p-6 rounded-xl hover:border-border/80 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${stat.bg} ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm text-muted font-medium">{stat.label}</p>
              </div>
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" /> Swarm Activity
            </h2>
            <span className={`flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full border ${
              isScanning
                ? 'bg-accent/10 text-accent border-accent/20'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-accent animate-pulse' : 'bg-emerald-500'}`}></span>
              {isScanning ? 'Scan in Progress' : 'Systems Nominal'}
            </span>
          </div>

          <div className="h-64 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted p-8 text-center bg-background">
            {isScanning ? (
              <>
                <Loader2 className="w-8 h-8 mb-4 text-accent animate-spin" />
                <p className="font-medium text-primary text-lg animate-pulse">
                  {scanProgressMessage}
                </p>
                <p className="text-sm mt-2 text-muted">
                  Target: <span className="font-mono text-accent">{activeScanUrl}</span>
                </p>
                <Link to="/scans/new" className="mt-6 text-xs font-medium bg-surface border border-border px-4 py-2 rounded-lg hover:text-primary transition-colors">
                  View Live Feed
                </Link>
              </>
            ) : (
              <>
                <Activity className="w-8 h-8 mb-3 opacity-50" />
                <p className="font-medium text-primary">Awaiting Instructions</p>
                <p className="text-sm mt-1">Initiate a new scan to see live telemetry from the agent swarm.</p>
              </>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-primary">Recent Logs</h2>
            <Link to="/scans/history" className="text-xs font-medium text-accent hover:text-accent/80 transition-colors">
              View All
            </Link>
          </div>

          <div className="space-y-6">
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== recentLogs.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-border"></div>
                  )}

                  <div className="relative z-10 mt-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                      log.status === 'danger'
                        ? 'bg-red-500/10 border-red-500/20 text-red-500'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    }`}>
                      <GitBranch className="w-3 h-3" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-primary leading-none mb-1.5">{log.action}</p>
                    <p className="text-xs text-muted font-mono mb-1">{log.repo}</p>
                    <p className="text-xs text-muted/60">{log.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted text-center mt-10">No recent scans found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};