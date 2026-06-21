import { create } from 'zustand';
import { io } from 'socket.io-client';

const socket = io(
  import.meta.env.VITE_SOCKET_URL ||
  "https://ai-software-engineering-api.onrender.com",
  {
    autoConnect: false, 
    withCredentials: true,
  }
);

export const useScanStore = create((set, get) => ({
  isScanning: false,
  activeScanUrl: null,
  scanResults: null,
  recentLogs: [],
  scanHistory: [], 
  
  dashboardStats: {
    totalReposScanned: 0,
    avgSecurityScore: 100,
    criticalIssues: 0,
    agentsOnline: "5/5"
  },

  currentJobId: null,
  scanProgressMessage: "Awaiting Instructions...",

  initializeSocketListeners: () => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.off("connect");
    socket.off("disconnect");
    socket.off("scan-progress");
    socket.off("scan-complete");
    socket.off("scan-failed");

    socket.on("connect", () => {
      console.log("🟢 Socket Connected:", socket.id);
      
      const activeJobId = get().currentJobId;
      if (activeJobId) {
        console.log("🔄 Rejoining active scan room:", activeJobId);
        socket.emit("join-room", activeJobId);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket Disconnected");
    });

    socket.on("scan-progress", (data) => {
      console.log("📡 Progress Received:", data);
      if (get().currentJobId === data.jobId) {
        set({ scanProgressMessage: data.message });
      }
    });

    socket.on("scan-complete", (data) => {
      console.log("✅ Scan Complete:", data);
      if (get().currentJobId === data.jobId) {
        set({
          isScanning: false,
          activeScanUrl: null,
          currentJobId: null,
          scanProgressMessage: "Scan Complete! Report is ready.",
        });
        get().fetchDashboardData();
      }
    });

    socket.on("scan-failed", (data) => {
      console.log("❌ Scan Failed:", data);
      if (get().currentJobId === data.jobId) {
        set({
          isScanning: false,
          activeScanUrl: null,
          currentJobId: null,
          scanProgressMessage: `Error: ${data.error}`,
        });
      }
    });
  },

  disconnectSocket: () => {
    if (socket.connected) {
      socket.disconnect();
    }
  },

  fetchScanById: async (id) => {
    set({ isScanning: true, scanProgressMessage: "Fetching detailed report..." }); 
    try {
      const token = localStorage.getItem('token'); 
      if (!token) throw new Error('Authentication token missing');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/scans/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch scan details');
      
      const result = await response.json();
      
      if (result.status === 'success') {
        const scan = result.data;
        
        const safeParse = (data) => {
          if (!data) return null;
          try {
            return typeof data === 'string' ? JSON.parse(data) : data;
          } catch (e) {
            console.error("JSON Parse error:", e);
            return null;
          }
        };

        set({
          scanResults: {
            repository: scan.repoUrl,
            scannedFiles: scan.totalFilesScanned,
            status: scan.status,
            overallScore: scan.overallScore,
            riskLevel: scan.riskLevel,
            summary: scan.summary,
            strengths: safeParse(scan.strengths),
            weaknesses: safeParse(scan.weaknesses),
            recommendations: safeParse(scan.recommendations),
            architecture: safeParse(scan.architectureMetrics),
            security: safeParse(scan.securityFindings),
            codeReview: safeParse(scan.codeReviewNotes),
            performance: safeParse(scan.performanceData),
            dependencies: safeParse(scan.dependencyData),
            
            historicalSecurityContext: safeParse(scan.historicalSecurityContext),
            historicalArchitectureContext: safeParse(scan.historicalArchitectureContext),
            historicalCodeReviewContext: safeParse(scan.historicalCodeReviewContext),
            historicalPerformanceContext: safeParse(scan.historicalPerformanceContext),
            
            securityComparison: safeParse(scan.securityComparison),
            scanComparison: safeParse(scan.scanComparison),
          },
          isScanning: false
        });
      }
    } catch (error) {
      console.error("Error fetching scan details:", error);
      set({ 
        isScanning: false, 
        scanProgressMessage: "Failed to load report. Please try again." 
      });
    }
  },

  fetchDashboardData: async () => {
    try {
      const token = localStorage.getItem('token'); 
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/scans`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        const formattedLogs = data.history.map(scan => ({
          id: scan.id,
          action: scan.status === 'COMPLETED' ? 'Scan Completed' : `Scan ${scan.status}`,
          repo: scan.repoUrl.replace('https://github.com/', ''),
          time: new Date(scan.createdAt).toLocaleDateString(), 
          status: (scan.riskLevel === 'CRITICAL' || scan.riskLevel === 'HIGH') ? 'danger' : 'success'
        })).slice(0, 5); 

        set({
          dashboardStats: data.stats,
          recentLogs: formattedLogs,
          scanHistory: data.history 
        });
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  },

  startGlobalScan: (url, jobId) => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join-room", jobId);
    
    set({ 
      isScanning: true, 
      activeScanUrl: url, 
      scanResults: null,
      currentJobId: jobId,
      scanProgressMessage: "Initializing AI Swarm..."
    });
  },
  
  completeGlobalScan: () => set({ 
    isScanning: false, 
    activeScanUrl: null,
    currentJobId: null
  }),
  
  setScanResult: (result) => set({ scanResults: result }),
  
  addLog: (log) => set((state) => ({ 
    recentLogs: [log, ...state.recentLogs],
    dashboardStats: {
      ...state.dashboardStats,
      totalReposScanned: state.dashboardStats.totalReposScanned + 1
    }
  }))
}));