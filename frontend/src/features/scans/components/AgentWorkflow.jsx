import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react';

const agents = [
  { key: 'repository', label: 'Repository Agent' },
  { key: 'architecture', label: 'Architecture Agent' },
  { key: 'security', label: 'Security Agent' },
  { key: 'codeReview', label: 'Code Review Agent' },
  { key: 'projectManager', label: 'Project Manager Agent' },
];

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'completed': 
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    case 'running': 
      return <Loader2 className="w-5 h-5 text-accent animate-spin" />;
    case 'failed': 
      return <XCircle className="w-5 h-5 text-red-500" />;
    default: 
      return <Circle className="w-5 h-5 text-border" />;
  }
};

export const AgentWorkflow = ({ workflow }) => {
  if (!workflow) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-2xl max-w-md w-full">
      <h3 className="text-primary text-sm font-semibold mb-6 tracking-wide uppercase">
        Live Agent Execution
      </h3>
      <div className="relative space-y-6">
        {/* Connecting Line */}
        <div className="absolute left-2.5 top-3 bottom-3 w-[1px] bg-border z-0" />

        {agents.map((agent, index) => {
          const status = workflow[agent.key] || 'idle';
          const isRunning = status === 'running';

          return (
            <motion.div 
              key={agent.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative z-10 flex items-center space-x-4"
            >
              <div className="bg-surface rounded-full">
                <StatusIcon status={status} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${status === 'idle' ? 'text-muted' : 'text-primary'}`}>
                  {agent.label}
                </p>
                {isRunning && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-accent mt-0.5"
                  >
                    Analyzing codebase...
                  </motion.p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};