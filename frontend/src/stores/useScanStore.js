import { create } from 'zustand';
import { io } from 'socket.io-client';

const socket = io(
  import.meta.env.VITE_SOCKET_URL ||
  "https://ai-software-engineering-api.onrender.com",
  {
    autoConnect: true,
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

  // ⚡ NAYE WEBSOCKET FIELDS
  currentJobId: null,
  scanProgressMessage: "Awaiting Instructions...",

 // ⚡ NAYA FUNCTION: Socket Listeners Setup
initializeSocketListeners: () => {

  // Duplicate listeners remove karo
  socket.off("scan-progress");
  socket.off("scan-complete");
  socket.off("scan-failed");

  socket.on("connect", () => {
    console.log("🟢 Socket Connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket Disconnected");
  });

  // Live Progress
  socket.on("scan-progress", (data) => {
    console.log("📡 Progress Received:", data);

    if (get().currentJobId === data.jobId) {
      set({
        scanProgressMessage: data.message,
      });
    }
  });

  // Scan Complete
  socket.on("scan-complete", (data) => {
    console.log("✅ Scan Complete:", data);

    if (get().currentJobId === data.jobId) {
      set({
        isScanning: false,
        activeScanUrl: null,
        currentJobId: null,
        scanProgressMessage:
          "Scan Complete! Report is ready.",
      });

      // Dashboard auto refresh
      get().fetchDashboardData();
    }
  });

  // Scan Failed
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

  // ID se specific scan fetch karne ke liye (Secure)
  fetchScanById: async (id) => {
    set({ isScanning: true, scanProgressMessage: "Fetching detailed report..." }); 
    try {
      const token = localStorage.getItem('token'); 
      
      const response = await fetch(
  `${import.meta.env.VITE_API_URL}/scans/${id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);


      
      if (!response.ok) throw new Error('Failed to fetch scan details');
      
      const result = await response.json();
      
      if (result.status === 'success') {
        const scan = result.data;
        
        // 🛡️ Helper: React ko crash hone se bachane ke liye safe JSON parser
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
            
            // 🎯 Orchestrator ke Master Fields
            overallScore: scan.overallScore,
            riskLevel: scan.riskLevel,
            summary: scan.summary,
            strengths: safeParse(scan.strengths),
            weaknesses: safeParse(scan.weaknesses),
            recommendations: safeParse(scan.recommendations),

            // 🤖 5-Agent Raw Outputs (Deep dive ke liye)
            architecture: safeParse(scan.architectureMetrics),
            security: safeParse(scan.securityFindings),
            codeReview: safeParse(scan.codeReviewNotes),
            performance: safeParse(scan.performanceData),
            dependencies: safeParse(scan.dependencyData)
          },
          isScanning: false
        });
      }
    } catch (error) {
      console.error("Error fetching scan details:", error);
      set({ isScanning: false });
    }
  },

  // Dashboard ka data fetch karne ke liye (Secure)
  fetchDashboardData: async () => {
    try {
      const token = localStorage.getItem('token'); 

      const response = await fetch(
  `${import.meta.env.VITE_API_URL}/scans`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

  // ⚡ UPDATE: Ab yeh ek Job ID bhi accept karega
  startGlobalScan: (url, jobId) => set({ 
    isScanning: true, 
    activeScanUrl: url, 
    scanResults: null,
    currentJobId: jobId,
    scanProgressMessage: "Initializing AI Swarm..."
  }),
  
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