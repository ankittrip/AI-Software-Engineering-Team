import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generatePDF } from "../../utils/pdfGenerator";
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
  Box,           // <-- Missing Icon
  Activity,      // <-- Missing Icon
  Code,          // <-- Missing Icon
  TrendingDown,  // <-- Missing Icon
  TrendingUp     // <-- Missing Icon
} from 'lucide-react';

import { useScanStore } from '../../stores/useScanStore';

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

  // Orchestrator Data setup with fallback defaults
  const { 
    repository = 'Unknown', 
    scannedFiles = 0,
    overallScore = 0,
    riskLevel = 'UNKNOWN',
    summary = 'No summary provided.',
    strengths = [],
    weaknesses = [],
    recommendations = [],
    architecture = {},
    security = {},
    codeReview = {},
    performance = {},
    dependencies = {}
  } = scanResults;

  console.log("SCAN RESULTS", scanResults);

  const repoName = repository.replace('https://github.com/', '');

  return (
    <div id="print-section" className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Print CSS */}
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
      
      {/* Header Area */}
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

      {/* Tabs Navigation */}
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

      {/* Content Area */}
      <div className="bg-surface border border-border rounded-xl p-6 min-h-[400px]">
        
        {/* EXECUTIVE SUMMARY TAB */}
        {activeTab === 'executive' && (
          <div className="space-y-8 animate-in fade-in duration-300">
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
                      <li key={i} className="flex gap-2 text-sm text-primary"><span className="text-emerald-500">•</span> {str}</li>
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
                      <li key={i} className="flex gap-2 text-sm text-primary"><span className="text-red-500">•</span> {wk}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No critical weaknesses recorded.</p>
                )}
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
                         <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No recommendations available for this scan.</p>
                )}
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <h2 className="text-xl font-bold text-primary mb-4">Security Agent Analysis</h2>
             <div className="space-y-4">
                {security?.criticalThreats?.length > 0 ? (
                  security.criticalThreats.map((threat, idx) => (
                    <div key={idx} className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <div className="flex gap-3">
                         <Shield className="w-5 h-5 text-red-500 shrink-0" />
                         <p className="text-sm text-primary">{threat}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 border border-border rounded-lg bg-background">
                    <p className="text-emerald-500">No critical threats found or data unavailable!</p>
                  </div>
                )}
             </div>
             
             {security?.minorWarnings?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-yellow-500 mb-3">Minor Warnings</h3>
                  <ul className="space-y-2">
                    {security.minorWarnings.map((warn, i) => (
                      <li key={i} className="text-sm text-muted bg-background p-2 rounded border border-border">• {warn}</li>
                    ))}
                  </ul>
                </div>
             )}
          </div>
        )}

        {/* ARCHITECTURE TAB */}
{activeTab === 'architecture' && (
  <div className="space-y-6 animate-in fade-in duration-300">
    <div className="flex items-center gap-3 mb-6">
      <Box className="w-6 h-6 text-accent" />
      <h2 className="text-xl font-bold text-primary">
        System Architecture
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

    <div className="bg-background border border-border p-6 rounded-xl">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-emerald-500" />
        Architectural Observations
      </h3>

      {architecture?.architecturalObservations?.length >
      0 ? (
        <ul className="space-y-4">
          {architecture.architecturalObservations.map(
            (obs, i) => {
              const observationText =
                typeof obs === "string"
                  ? obs
                  : obs?.observation ||
                    obs?.finding ||
                    JSON.stringify(obs);

              return (
                <li
                  key={i}
                  className="flex gap-3 text-sm text-primary"
                >
                  <span className="text-emerald-500 font-bold mt-0.5">
                    ›
                  </span>

                  <span className="leading-relaxed">
                    {observationText}
                  </span>
                </li>
              );
            }
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

        {/* CODE REVIEW TAB */}
        {activeTab === 'codeReview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex items-center justify-between bg-surface border border-border p-5 rounded-xl">
               <div className="flex items-center gap-3">
                 <Code className="w-6 h-6 text-accent" />
                 <h2 className="text-xl font-bold text-primary">Code Quality Analysis</h2>
               </div>
               <div className="text-right">
                 <p className="text-sm text-muted">Quality Rating</p>
                 <p className={`text-xl font-bold uppercase ${codeReview?.codeQualityRating === 'Good' || codeReview?.codeQualityRating === 'Excellent' ? 'text-emerald-500' : 'text-orange-500'}`}>
                   {codeReview?.codeQualityRating || 'N/A'}
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
                          <span className="text-emerald-500">•</span> {practice}
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
                          <span className="text-orange-500">•</span> {smell}
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
                      // Support both string arrays and object arrays from LLM
                      const text = typeof suggestion === 'string' ? suggestion : suggestion.action || suggestion.finding;
                      const priority = suggestion.priority || null;
                      
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

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex items-center justify-between bg-surface border border-border p-5 rounded-xl">
               <div className="flex items-center gap-3">
                 <Zap className="w-6 h-6 text-accent" />
                 <h2 className="text-xl font-bold text-primary">Performance Profile</h2>
               </div>
               <div className="text-right">
                 <p className="text-sm text-muted">Speed Score</p>
                 <p className={`text-xl font-bold uppercase ${performance?.performanceScore === 'Excellent' ? 'text-emerald-500' : performance?.performanceScore === 'Moderate' ? 'text-yellow-500' : 'text-red-500'}`}>
                   {performance?.performanceScore || 'N/A'}
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
                      {performance.bottlenecks.map((bottleneck, i) => (
                        <li key={i} className="text-sm text-primary flex gap-2">
                          <span className="text-red-500 font-bold mt-0.5">›</span> <span className="leading-relaxed">{bottleneck}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No significant bottlenecks detected.</p>
                  )}
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-xl h-full">
                  <h3 className="text-emerald-500 font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Optimization Tips
                  </h3>
                  {performance?.optimizationTips?.length > 0 ? (
                    <ul className="space-y-3">
                      {performance.optimizationTips.map((tip, i) => (
                        <li key={i} className="text-sm text-primary flex gap-2">
                          <span className="text-emerald-500 font-bold mt-0.5">›</span> <span className="leading-relaxed">{tip}</span>
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

        {/* DEPENDENCIES TAB */}
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
          {dependencies?.dependencyHealthScore ?? 0}/100
        </p>
      </div>
    </div>

    {/* Strengths */}
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
              {item.finding}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          No strengths detected.
        </p>
      )}
    </div>

    {/* Security Risks */}
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
              {risk.finding}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          No dependency security risks detected.
        </p>
      )}
    </div>

    {/* Missing Essentials */}
    <div className="bg-yellow-500/5 border border-yellow-500/20 p-5 rounded-xl">
      <h3 className="text-yellow-500 font-semibold mb-4">
        Missing Essentials
      </h3>

      {dependencies?.missingEssentials?.length > 0 ? (
        <ul className="space-y-2">
          {dependencies.missingEssentials.map((item, i) => (
            <li
              key={i}
              className="text-sm text-primary flex gap-2"
            >
              <span className="text-yellow-500">•</span>
              <span>
                <strong>{item.package}</strong> — {item.reason}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          No missing essentials detected.
        </p>
      )}
    </div>

    {/* Observations */}
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
              {obs}
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