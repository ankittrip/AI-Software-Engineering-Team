import React from 'react';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

const toText = (val, ...keys) => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  for (const k of keys) {
    if (val[k]) return val[k];
  }
  return JSON.stringify(val);
};

export default function SecurityEvolution({ securityComparison }) {
  let comparisonData = securityComparison;
  if (typeof comparisonData === 'string') {
    try { comparisonData = JSON.parse(comparisonData); } catch(e) { comparisonData = {}; }
  }

  const resolvedFindings = comparisonData?.resolvedFindings || [];
  const newFindings = comparisonData?.newFindings || [];
  const recurringFindings = comparisonData?.recurringFindings || [];

  const hasData = resolvedFindings.length > 0 || newFindings.length > 0 || recurringFindings.length > 0;

  return (
    <div className="bg-surface border border-border p-5 rounded-xl">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-accent" />
        Security Evolution
      </h3>
      
      {!hasData ? (
        <p className="text-sm text-muted italic">No comparison data available for this scan.</p>
      ) : (
        <div className="space-y-4">
          {resolvedFindings.length > 0 && (
            <div>
              <h4 className="flex items-center text-emerald-500 font-medium mb-2 text-sm">
                <ShieldCheck className="w-4 h-4 mr-2" /> Resolved Issues
              </h4>
              <ul className="space-y-1 text-sm text-primary bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
                {resolvedFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{toText(finding, 'finding', 'description')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {newFindings.length > 0 && (
            <div>
              <h4 className="flex items-center text-blue-500 font-medium mb-2 text-sm">
                <span className="text-lg mr-2">🆕</span> New Threats
              </h4>
              <ul className="space-y-1 text-sm text-primary bg-blue-500/5 p-3 rounded-lg border border-blue-500/20">
                {newFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{toText(finding, 'finding', 'description')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recurringFindings.length > 0 && (
            <div>
              <h4 className="flex items-center text-orange-500 font-medium mb-2 text-sm">
                <ShieldAlert className="w-4 h-4 mr-2" /> Recurring (Needs Attention)
              </h4>
              <ul className="space-y-1 text-sm text-primary bg-orange-500/5 p-3 rounded-lg border border-orange-500/20">
                {recurringFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{toText(finding, 'finding', 'description')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}