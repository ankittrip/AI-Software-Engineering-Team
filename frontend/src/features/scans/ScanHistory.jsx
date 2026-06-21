import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Shield,
} from "lucide-react";

import { useScanStore } from "../../stores/useScanStore";

const StatusBadge = ({ status }) => {
  if (status === "COMPLETED") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-medium w-fit">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Completed
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-medium w-fit">
        <XCircle className="w-3.5 h-3.5" />
        Failed
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-accent border border-blue-500/20 text-xs font-medium w-fit">
      <Clock className="w-3.5 h-3.5" />
      Pending
    </div>
  );
};

export const ScanHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    scanHistory,
    fetchDashboardData,
    isLoading,
  } = useScanStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredHistory = (scanHistory || []).filter((scan) =>
    (scan?.repoUrl || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Scan History
          </h1>
          <p className="text-sm text-muted mt-1">
            Review past AI codebase audits and security reports.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />

            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <button className="bg-surface border border-border p-2 rounded-lg text-muted hover:text-primary transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-surface border border-border rounded-xl p-10 text-center text-muted">
          Loading scan history...
        </div>
      )}

      {!isLoading && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surfaceHover/50 text-muted text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Repository</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Files Analyzed</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredHistory.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-surfaceHover/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-background border border-border flex items-center justify-center">
                          <Shield className="w-4 h-4 text-muted" />
                        </div>
                        <span className="font-mono text-primary">
                          {(scan.repoUrl || "").replace("https://github.com/", "")}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-muted">
                      {scan.createdAt
                        ? new Date(scan.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={scan.status} />
                    </td>

                    <td className="px-6 py-4 font-mono text-muted">
                      {scan.totalFilesScanned || 0} files
                    </td>

                    <td className="px-6 py-4 text-right">
                      {scan.status === "COMPLETED" && (
                        <Link
                          to={`/scans/results/${scan.id}`}
                          className="inline-flex items-center gap-1 text-accent hover:text-accent/80 font-medium transition-colors"
                        >
                          View Report
                          <ChevronRight className="w-4 h-4 translate-y-[0.5px] group-hover:translate-x-1 transition-transform" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredHistory.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-muted"
                    >
                      {searchTerm
                        ? `No scans found matching "${searchTerm}"`
                        : "No scans recorded yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};