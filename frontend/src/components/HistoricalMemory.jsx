import React from 'react';
import { Database } from 'lucide-react';

const CATEGORY_CONFIG = {
  security: { label: 'Security' },
  architecture: { label: 'Architecture' },
  codeReview: { label: 'Code Review' },
  performance: { label: 'Performance' },
};

// Safe parsing helper — handles stringified JSON or already-parsed arrays
const parseContext = (raw) => {
  let data = raw;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (e) { data = []; }
  }
  return Array.isArray(data) ? data : [];
};

export default function HistoricalMemory({
  historicalSecurityContext,
  historicalArchitectureContext,
  historicalCodeReviewContext,
  historicalPerformanceContext,
}) {
  const categories = [
    { key: 'security', items: parseContext(historicalSecurityContext) },
    { key: 'architecture', items: parseContext(historicalArchitectureContext) },
    { key: 'codeReview', items: parseContext(historicalCodeReviewContext) },
    { key: 'performance', items: parseContext(historicalPerformanceContext) },
  ];

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const hasData = totalItems > 0;

  return (
    <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-xl">
      <h3 className="text-sm font-semibold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Database className="w-4 h-4" />
        Historical Memory (RAG)
      </h3>

      {!hasData ? (
        <p className="text-sm text-muted italic">No historical RAG data found for this scan.</p>
      ) : (
        <>
          <p className="text-xs text-muted mb-4">
            AI detected similar patterns from past scans:
          </p>
          <div className="space-y-4">
            {categories.map(({ key, items }) => {
              if (items.length === 0) return null;
              const { label } = CATEGORY_CONFIG[key];

              return (
                <div key={key}>
                  <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wide mb-2">
                    {label} ({items.length})
                  </p>
                  <div className="space-y-2">
                    {items.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-background p-3 rounded-lg border border-border border-l-2 border-l-indigo-500 shadow-sm text-sm"
                      >
                        <span className="text-primary text-xs leading-snug block mb-1.5">
                          {typeof item === 'string' ? item : (item.finding || 'Pattern match detected')}
                        </span>
                        <div className="flex justify-between items-center border-t border-border/50 pt-1.5 mt-1.5">
                          <span className="text-[10px] opacity-60 truncate pr-2">
                            {item.repoName || item.repoUrl?.split('/').pop() || ''}
                          </span>
                          <span className="text-[10px] opacity-50 shrink-0">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
