import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generatePDF } from "../../utils/pdfGenerator.js";
import { 
  AlertTriangle, 
  Server, 
  Database, 
  Layout, 
  Shield, 
  ArrowLeft, 
  Terminal, 
  Download, 
  CheckCircle, 
  Zap, 
  Package, 
  Box,          
  Activity,      
  Code,          
  TrendingDown,  
  TrendingUp     
} from 'lucide-react';

import { useScanStore } from '../../stores/useScanStore.js';

import SecurityEvolution from '../../components/SecurityEvolution.jsx';
import HistoricalMemory from '../../components/HistoricalMemory.jsx';

const toText = (val, ...keys) => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  for (const k of keys) {
    if (val[k]) return val[k];
  }
  return JSON.stringify(val);
};

const getSeverityStyles = (severity) => {
  if (!severity) return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  switch (severity.toUpperCase()) {
    case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'LOW': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};

export const ScanResults = () => {
  const { id } = useParams();
  const { scanResults, isScanning, fetchScanById } = useScanStore();
  const [activeTab, setActiveTab] = useState('executive');

  useEffect(() => {
    if (id) fetchScanById(id);
  }, [id, fetchScanById]);

  const handleDownloadPdf = () => window.print();

  if (isScanning || !scanResults) {
    return (
      <div className="max-w-6xl mx-auto h-[60vh] flex flex-col items-center justify-center space-y-4">
         <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
         <p className="text-primary font-medium">Synthesizing multi-agent report...</p>
      </div>
    );
  }

  const resultsToUse = scanResults.data || scanResults;

  const {
    repository = resultsToUse.repository || resultsToUse.repoUrl || "Unknown",
    overallScore = resultsToUse.overallScore || 0,
    riskLevel = resultsToUse.riskLevel || "UNKNOWN",
    summary = resultsToUse.summary || "No summary provided.",
    strengths = resultsToUse.strengths || [],
    weaknesses = resultsToUse.weaknesses || [],
    recommendations = resultsToUse.recommendations || [],
    architecture = resultsToUse.architecture || {},
    security = resultsToUse.security || {},
    codeReview = resultsToUse.codeReview || {},
    performance = resultsToUse.performance || {},
    dependencies = resultsToUse.dependencies || {},

    historicalSecurityContext = resultsToUse.historicalSecurityContext || [],
    historicalArchitectureContext = resultsToUse.historicalArchitectureContext || [],
    historicalCodeReviewContext = resultsToUse.historicalCodeReviewContext || [],
    historicalPerformanceContext = resultsToUse.historicalPerformanceContext || [],
    securityComparison = resultsToUse.securityComparison || null,
    scanComparison = resultsToUse.scanComparison || null,
  } = resultsToUse;

  console.log("SCAN RESULTS", scanResults);

  const repoName = repository.replace('https://github.com/', '');

  return (
    <div id="print-section" className="max-w-6xl mx-auto space-y-6 pb-12">
      
      <style>{`
        @media print {
          @page { margin: 0; }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background-color: #0b0f19 !important; 
          }
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section {
            position: absolute; left: 0; top: 0; width: 100%; padding: 2rem !important;
          }
        }
      `}</style>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-surface border border-border p-6 rounded-xl gap-4">
        <div>
          <Link to="/dashboard" className="text-muted hover:text-primary flex items-center gap-2 text-sm mb-2 transition-colors print:hidden">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-3 flex-wrap">
            Report: <span className="font-mono text-accent text-lg md:text-xl">{repoName}</span>
          </h1>
        </div>
        <div className="flex items-center gap-6 text-right">
          <button 
            onClick={() => generatePDF(scanResults)}
            className="flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-background px-4 py-2 rounded-lg text-sm font-medium transition-all print:hidden"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <div className="w-px h-10 bg-border hidden md:block"></div>
          <div>
            <p className="text-sm text-muted">Risk Level</p>
            <p className={`text-xl font-bold px-2 py-1 mt-1 rounded border ${getSeverityStyles(riskLevel)}`}>
              {riskLevel}
            </p>
          </div>
          <div className="w-px h-10 bg-border"></div>
          <div>
            <p className="text-sm text-muted">Overall Score</p>
            <p className={`text-3xl font-bold ${overallScore >= 80 ? 'text-emerald-500' : overallScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
              {overallScore}/100
            </p>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 p-1 bg-surface border border-border rounded-lg print:hidden">
        {[
          { id: 'executive', icon: Shield, label: 'Executive Summary' },
          { id: 'architecture', icon: Layout, label: 'Architecture' },
          { id: 'security', icon: AlertTriangle, label: 'Security' },
          { id: 'codeReview', icon: Terminal, label: 'Code Review' },
          { id: 'performance', icon: Zap, label: 'Performance' },
          { id: 'dependencies', icon: Package, label: 'Dependencies' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id ? 'bg-primary text-background' : 'text-muted hover:text-primary hover:bg-background'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 min-h-[400px]">
        
        {activeTab === 'executive' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            
            <div className="lg:col-span-2 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    label: "Architecture",
                    score: architecture?.architectureScore ?? 0,
                    icon: Layout,
                  },
                  {
                    label: "Security",
                    score: security?.securityScore ?? 0,
                    icon: Shield,
                  },
                  {
                    label: "Code Review",
                    score: codeReview?.codeQualityScore ?? 0,
                    icon: Code,
                  },
                  {
                    label: "Performance",
                    score: performance?.performanceScore ?? 0,
                    icon: Zap,
                  },
                  {
                    label: "Dependencies",
                    score: dependencies?.healthScore ?? 0,
                    icon: Package,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-background border border-border rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <item.icon className="w-5 h-5 text-accent" />
                      <span
                        className={`font-bold ${
                          item.score >= 80
                            ? "text-emerald-500"
                            : item.score >= 50
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {item.score}/100
                      </span>
                    </div>

                    <p className="text-sm text-muted mb-2">{item.label}</p>

                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.score >= 80
                            ? "bg-emerald-500"
                            : item.score >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-xl font-bold text-primary mb-2">Orchestrator Verdict</h2>
                <p className="text-muted leading-relaxed">{summary}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-background border border-border rounded-xl">
                  <h3 className="text-emerald-500 font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Architectural Strengths
                  </h3>
                  {strengths?.length > 0 ? (
                    <ul className="space-y-3">
                      {strengths.map((str, i) => (
                        <li key={i} className="flex gap-2 text-sm text-primary"><span className="text-emerald-500">•</span> {toText(str, 'finding', 'observation')}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No structural strengths recorded.</p>
                  )}
                </div>
                <div className="p-5 bg-background border border-border rounded-xl">
                  <h3 className="text-red-500 font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Critical Weaknesses
                  </h3>
                  {weaknesses?.length > 0 ? (
                    <ul className="space-y-3">
                      {weaknesses.map((wk, i) => (
                        <li key={i} className="flex gap-2 text-sm text-primary"><span className="text-red-500">•</span> {toText(wk, 'finding', 'observation')}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No critical weaknesses recorded.</p>
                  )}
                </div>
              </div>

              <div className="bg-background border border-border rounded-xl p-5">
                <h3 className="text-primary font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Top Findings
                </h3>

                <div className="space-y-3">
                  {[
                    ...(weaknesses || []).slice(0, 5),
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="p-3 border border-border rounded-lg bg-surface text-sm text-primary"
                    >
                      {toText(item, "finding", "description", "observation")}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-accent/5 border border-accent/20 rounded-xl">
                 <h3 className="text-accent font-semibold mb-4 flex items-center gap-2">
                    <Terminal className="w-5 h-5" /> Actionable Recommendations
                  </h3>
                  {recommendations?.length > 0 ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-primary bg-background p-3 rounded border border-border">
                           <span className="text-accent font-mono shrink-0">{i+1}.</span> 
                           <span>{toText(rec, 'action', 'finding')}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No recommendations available for this scan.</p>
                  )}
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <SecurityEvolution securityComparison={securityComparison} />
              <HistoricalMemory 
                historicalSecurityContext={historicalSecurityContext}
                historicalArchitectureContext={historicalArchitectureContext}
                historicalCodeReviewContext={historicalCodeReviewContext}
                historicalPerformanceContext={historicalPerformanceContext}
              />
              
              {scanComparison && (
                <div className="bg-background border border-border p-5 rounded-xl text-center">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Scan Comparison</h3>
                  <div className="flex justify-around items-center mt-4">
                    <div>
                      <div className="text-2xl font-bold text-red-500">{scanComparison.introduced?.length || 0}</div>
                      <div className="text-xs text-muted">New Issues</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-500">{scanComparison.improved?.length || 0}</div>
                      <div className="text-xs text-muted">Improved</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
        
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <h2 className="text-xl font-bold text-primary mb-4">Security Agent Analysis</h2>
             <div className="space-y-4">
                {security?.criticalThreats?.length > 0 ? (
                  security.criticalThreats.map((threat, idx) => (
                    <div key={idx} className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <div className="flex gap-3">
                         <Shield className="w-5 h-5 text-red-500 shrink-0" />
                         <p className="text-sm text-primary">{toText(threat, 'finding', 'issue')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 border border-border rounded-lg bg-background">
                    <p className="text-emerald-500">No critical threats found or data unavailable!</p>
                  </div>
                )}
             </div>

             {security?.securityScore != null && (
               <div className="flex items-center gap-3 text-sm text-muted">
                 <span>Security Score:</span>
                 <span className="font-bold text-primary">{security.securityScore}/100</span>
               </div>
             )}

             {security?.securityObservations?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-primary mb-3">Observations</h3>
                  <ul className="space-y-2">
                    {security.securityObservations.map((obs, i) => (
                      <li key={i} className="text-sm text-muted bg-background p-2 rounded border border-border">• {toText(obs, 'finding')}</li>
                    ))}
                  </ul>
                </div>
             )}
             
             {security?.minorWarnings?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-yellow-500 mb-3">Minor Warnings</h3>
                  <ul className="space-y-2">
                    {security.minorWarnings.map((warn, i) => (
                      <li key={i} className="text-sm text-muted bg-background p-2 rounded border border-border">• {toText(warn, 'finding')}</li>
                    ))}
                  </ul>
                </div>
             )}

             {security?.securityRecommendations?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-accent mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {security.securityRecommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-muted bg-background p-2 rounded border border-border">• {toText(rec, 'finding', 'action')}</li>
                    ))}
                  </ul>
                </div>
             )}
          </div>
        )}

        {activeTab === 'architecture' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Box className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold text-primary">
                System Architecture
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-surface border border-border p-5 rounded-xl flex flex-col items-center justify-center text-center">
                <Layout className="w-8 h-8 text-accent mb-3 opacity-80" />
                <p className="text-sm text-muted mb-1">
                  Detected Pattern
                </p>
                <p className="font-semibold text-primary">
                  {architecture?.architecturePattern ||
                    "Unknown Pattern"}
                </p>
              </div>

              <div className="bg-surface border border-border p-5 rounded-xl flex flex-col items-center justify-center text-center">
                <Activity className="w-8 h-8 text-emerald-500 mb-3 opacity-80" />
                <p className="text-sm text-muted mb-1">
                  Architecture Score
                </p>
                <p
                  className={`text-2xl font-bold ${
                    (architecture?.architectureScore ?? 0) >= 80
                      ? "text-emerald-500"
                      : (architecture?.architectureScore ?? 0) >= 50
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {architecture?.architectureScore ?? 0}/100
                </p>
              </div>

              <div className="md:col-span-2 bg-surface border border-border p-5 rounded-xl">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
                  Tech Stack Discovered
                </h3>

                <div className="flex flex-wrap gap-2">
                  {architecture?.techStack?.length > 0 ? (
                    architecture.techStack.map(
                      (tech, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent rounded-full text-sm font-medium"
                        >
                          {tech}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-sm text-muted">
                      No specific stack detected.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-xl">
                <h3 className="text-emerald-500 font-semibold mb-4">Strengths</h3>
                {architecture?.strengths?.length > 0 ? (
                  <ul className="space-y-2">
                    {architecture.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-primary flex gap-2">
                        <span className="text-emerald-500">•</span> {toText(s, 'finding')}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No strengths recorded.</p>
                )}
              </div>
              <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-xl">
                <h3 className="text-red-500 font-semibold mb-4">Risks</h3>
                {architecture?.risks?.length > 0 ? (
                  <ul className="space-y-2">
                    {architecture.risks.map((r, i) => (
                      <li key={i} className="text-sm text-primary flex gap-2">
                        <span className="text-red-500">•</span> {toText(r, 'finding', 'description')}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No risks recorded.</p>
                )}
              </div>
            </div>

            <div className="bg-background border border-border p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Architectural Observations
              </h3>

              {architecture?.architecturalObservations?.length >
              0 ? (
                <ul className="space-y-4">
                  {architecture.architecturalObservations.map(
                    (obs, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm text-primary"
                      >
                        <span className="text-emerald-500 font-bold mt-0.5">
                          ›
                        </span>
                        <span className="leading-relaxed">
                          {toText(obs, 'observation', 'finding')}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  No deep observations recorded.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'codeReview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex items-center justify-between bg-surface border border-border p-5 rounded-xl">
               <div className="flex items-center gap-3">
                 <Code className="w-6 h-6 text-accent" />
                 <h2 className="text-xl font-bold text-primary">Code Quality Analysis</h2>
               </div>
               <div className="text-right">
                 <p className="text-sm text-muted">Quality Rating</p>
                 <p className={`text-xl font-bold uppercase ${codeReview?.qualityRating === 'Good' || codeReview?.qualityRating === 'Excellent' ? 'text-emerald-500' : 'text-orange-500'}`}>
                   {codeReview?.qualityRating || 'N/A'}
                   {codeReview?.codeQualityScore != null && (
                     <span className="text-sm text-muted normal-case ml-2">({codeReview.codeQualityScore}/100)</span>
                   )}
                 </p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-xl">
                  <h3 className="text-emerald-500 font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Best Practices Observed
                  </h3>
                  {codeReview?.bestPracticesObserved?.length > 0 ? (
                    <ul className="space-y-2">
                      {codeReview.bestPracticesObserved.map((practice, i) => (
                        <li key={i} className="text-sm text-primary flex gap-2">
                          <span className="text-emerald-500">•</span> {toText(practice, 'finding')}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted opacity-70">No standard best practices highlighted.</p>
                  )}
                </div>

                <div className="bg-orange-500/5 border border-orange-500/20 p-5 rounded-xl">
                  <h3 className="text-orange-500 font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Code Smells Detected
                  </h3>
                  {codeReview?.codeSmells?.length > 0 ? (
                    <ul className="space-y-2">
                      {codeReview.codeSmells.map((smell, i) => (
                        <li key={i} className="text-sm text-primary flex gap-2">
                          <span className="text-orange-500">•</span> 
                          <span>{toText(smell, 'finding')}</span>
                          {(typeof smell !== 'string' && smell?.isRecurring) && (
                            <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded ml-1 font-bold">
                              RECURRING
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted opacity-70">No major code smells found.</p>
                  )}
                </div>
             </div>

             <div className="bg-background border border-border p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-accent" /> Refactoring Suggestions
                </h3>
                {codeReview?.refactoringSuggestions?.length > 0 ? (
                  <div className="space-y-3">
                    {codeReview.refactoringSuggestions.map((suggestion, i) => {
                      const text = toText(suggestion, 'action', 'finding');
                      const priority = typeof suggestion === 'object' ? suggestion?.priority : null;
                      
                      return (
                        <div key={i} className="bg-surface p-4 rounded-lg border border-border flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                           <span className="text-sm text-primary leading-relaxed">{text}</span>
                           {priority && (
                             <span className={`text-xs px-2 py-1 rounded border uppercase shrink-0 ${priority === 'HIGH' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                               {priority}
                             </span>
                           )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted">No refactoring required.</p>
                )}
             </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex items-center justify-between bg-surface border border-border p-5 rounded-xl">
               <div className="flex items-center gap-3">
                 <Zap className="w-6 h-6 text-accent" />
                 <h2 className="text-xl font-bold text-primary">Performance Profile</h2>
               </div>
               <div className="text-right">
                 <p className="text-sm text-muted">Speed Score</p>
                 <p className={`text-xl font-bold uppercase ${
                   performance?.performanceRating === 'Excellent' ? 'text-emerald-500' 
                   : (performance?.performanceRating === 'Fair' || performance?.performanceRating === 'Moderate') ? 'text-yellow-500' 
                   : 'text-red-500'
                 }`}>
                   {performance?.performanceRating || 'N/A'}
                   {performance?.performanceScore != null && (
                     <span className="text-sm text-muted normal-case ml-2">({performance.performanceScore}/100)</span>
                   )}
                 </p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-xl h-full">
                  <h3 className="text-red-500 font-semibold mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" /> Identified Bottlenecks
                  </h3>
                  {performance?.bottlenecks?.length > 0 ? (
                    <ul className="space-y-3">
                      {performance.bottlenecks.map((bottleneck, i) => {
                        const text = toText(bottleneck, 'issue', 'finding');
                        const impact = typeof bottleneck === 'object' ? bottleneck?.impact : null;
                        return (
                          <li key={i} className="text-sm text-primary flex flex-col gap-1">
                            <span className="flex gap-2">
                              <span className="text-red-500 font-bold mt-0.5">›</span>
                              <span className="leading-relaxed">{text}</span>
                            </span>
                            {impact && (
                              <span className="text-xs text-muted ml-5">Impact: {impact}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No significant bottlenecks detected.</p>
                  )}
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-xl h-full">
                  <h3 className="text-emerald-500 font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Optimization Opportunities
                  </h3>
                  {performance?.optimizationOpportunities?.length > 0 ? (
                    <ul className="space-y-3">
                      {performance.optimizationOpportunities.map((tip, i) => (
                        <li key={i} className="text-sm text-primary flex gap-2">
                          <span className="text-emerald-500 font-bold mt-0.5">›</span>
                          <span className="leading-relaxed">{toText(tip, 'suggestion', 'finding')}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">Application is highly optimized.</p>
                  )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'dependencies' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            <div className="flex items-center justify-between bg-surface border border-border p-5 rounded-xl">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-bold text-primary">
                  Dependency Analysis
                </h2>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted">
                  Dependency Health
                </p>
                <p className="text-2xl font-bold text-emerald-500">
                  {dependencies?.healthScore ?? 0}/100
                </p>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-xl">
              <h3 className="text-emerald-500 font-semibold mb-4">
                Strengths
              </h3>

              {dependencies?.strengths?.length > 0 ? (
                <ul className="space-y-2">
                  {dependencies.strengths.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-primary flex gap-2"
                    >
                      <span className="text-emerald-500">•</span>
                      {toText(item, 'finding')}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  No strengths detected.
                </p>
              )}
            </div>

            <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-xl">
              <h3 className="text-red-500 font-semibold mb-4">
                Security Risks
              </h3>

              {dependencies?.securityRisks?.length > 0 ? (
                <ul className="space-y-2">
                  {dependencies.securityRisks.map((risk, i) => (
                    <li
                      key={i}
                      className="text-sm text-primary flex gap-2"
                    >
                      <span className="text-red-500">•</span>
                      {toText(risk, 'finding')}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  No dependency security risks detected.
                </p>
              )}
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/20 p-5 rounded-xl">
              <h3 className="text-yellow-500 font-semibold mb-4">
                Issues
              </h3>

              {dependencies?.issues?.length > 0 ? (
                <ul className="space-y-2">
                  {dependencies.issues.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-primary flex gap-2"
                    >
                      <span className="text-yellow-500">•</span>
                      {typeof item === 'string' ? (
                        <span>{item}</span>
                      ) : item.package ? (
                        <span>
                          <strong>{item.package}</strong> — {item.reason || item.finding}
                        </span>
                      ) : (
                        <span>{toText(item, 'finding', 'reason')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  No dependency issues detected.
                </p>
              )}
            </div>

            <div className="bg-background border border-border p-5 rounded-xl">
              <h3 className="text-primary font-semibold mb-4">
                Observations
              </h3>

              {dependencies?.observations?.length > 0 ? (
                <ul className="space-y-2">
                  {dependencies.observations.map((obs, i) => (
                    <li
                      key={i}
                      className="text-sm text-primary flex gap-2"
                    >
                      <span className="text-accent">•</span>
                      {toText(obs, 'finding')}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  No observations recorded.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};