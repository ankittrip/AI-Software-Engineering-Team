import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Loader2, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScanStore } from '../../stores/useScanStore';
import { analyzeRepository } from "../../services/scanService";
import { toast } from 'sonner'; 

const GithubIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const NewScan = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  
  const {
    isScanning,
    startGlobalScan,
    completeGlobalScan,
    scanProgressMessage, 
    initializeSocketListeners 
  } = useScanStore();
  
useEffect(() => {
  initializeSocketListeners();
}, []);

  const handleStartScan = async (e) => {
    e.preventDefault();

    if (!url.includes("github.com")) {
      toast.error("Invalid URL", {
        description: "Please enter a valid GitHub repository URL."
      });
      return;
    }

    try {
      toast.success("Swarm Deployed", {
        description: `Initializing agents for ${url.replace("https://github.com/", "")}`,
      });

      // 1. API Call: Ab yeh background job queue mein daalega aur turant Job ID dega
      const response = await analyzeRepository(url);
      
      // Assume karte hain API { status: 'success', jobId: '123' } bhej rahi hai
      const jobId = response?.jobId || response?.data?.jobId;

      if (!jobId) throw new Error("Failed to retrieve Job ID from backend.");

      // 2. Zustand Store ko active karein aur Job ID bind karein
      startGlobalScan(url, jobId);

    } catch (error) {
      console.error(error);
      completeGlobalScan();
      toast.error("Scan Failed", {
        description: error?.response?.data?.message || error.message || "Something went wrong.",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center pt-10">
      
      {!isScanning ? (
        <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">Initialize AI Code Audit</h2>
            <p className="text-muted text-sm max-w-md">
              Deploy our swarm of specialized AI agents to analyze your repository for architecture flaws, security vulnerabilities, and code quality.
            </p>
          </div>

          <form onSubmit={handleStartScan} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <GithubIcon className="h-5 w-5 text-muted" />
              </div>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/your-org/your-repo"
                className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-4 text-primary placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-primary text-background hover:bg-primary/90 font-medium rounded-xl py-4 flex items-center justify-center gap-2 transition-colors"
            >
              Deploy Agent Swarm
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        // 📡 LIVE WEBSOCKET TERMINAL
        <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl p-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full"></div>
            <Loader2 className="w-14 h-14 text-accent animate-spin relative z-10" />
          </div>
          
          <h2 className="text-2xl font-bold text-primary mb-2">Swarm Analysis Active</h2>
          <p className="text-muted text-sm font-mono mb-8">{url}</p>
          
          <div className="w-full bg-background border border-border rounded-xl p-6 text-left relative overflow-hidden">
             <div className="flex items-center gap-2 mb-3 border-b border-border/50 pb-3">
               <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
               <span className="text-xs font-semibold text-muted uppercase tracking-wider">Live Telemetry Feed</span>
             </div>
             
             {/* Yahan aapke Worker ke updates WebSockets se direct aayenge */}
             <p className="font-mono text-accent text-sm animate-pulse flex items-center gap-3">
               <span className="text-emerald-500 font-bold">›</span> {scanProgressMessage}
             </p>
          </div>
          
          <p className="text-xs text-muted mt-8 opacity-70">
            Please do not close this window. You will be automatically redirected upon completion.
          </p>
        </div>
      )}
      
    </div>
  );
};