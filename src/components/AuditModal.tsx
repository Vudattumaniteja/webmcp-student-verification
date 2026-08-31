import { SecurityIssue } from '../shared/state.ts';
import { ShieldCheck, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  score: number;
  issues: SecurityIssue[];
  onClose: () => void;
}

export default function AuditModal({ isOpen, score, issues, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Security & Architecture Audit</h2>
              <p className="text-xs text-slate-400">Automated topology & encryption scan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Score Header */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Overall Security Score</span>
            <div className="text-2xl font-bold font-mono mt-0.5 text-slate-100">
              {score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              score >= 80
                ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                : score >= 50
                ? 'bg-amber-950 border border-amber-800 text-amber-300'
                : 'bg-red-950 border border-red-800 text-red-300'
            }`}
          >
            {score >= 80 ? 'Grade A - Robust' : score >= 50 ? 'Grade B - Warnings' : 'Grade C - Vulnerable'}
          </div>
        </div>

        {/* Findings List */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Detected Issues ({issues.length})
          </h3>
          {issues.length === 0 ? (
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-emerald-300 text-xs text-center">
              No security vulnerabilities detected! Topology adheres to best practices.
            </div>
          ) : (
            issues.map((issue, idx) => (
              <div
                key={idx}
                className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3.5 flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2">
                  {issue.severity === 'high' ? (
                    <AlertOctagon className="h-4 w-4 text-red-400 shrink-0" />
                  ) : issue.severity === 'medium' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-400 shrink-0" />
                  )}
                  <h4 className="text-xs font-semibold text-slate-200">{issue.title}</h4>
                  <span
                    className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ml-auto ${
                      issue.severity === 'high'
                        ? 'bg-red-950 text-red-400'
                        : issue.severity === 'medium'
                        ? 'bg-amber-950 text-amber-400'
                        : 'bg-blue-950 text-blue-400'
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{issue.description}</p>
                <div className="bg-slate-900/90 rounded p-2 text-[11px] text-slate-300 font-mono border border-slate-800">
                  <span className="text-emerald-400 font-semibold">Remediation: </span>
                  {issue.remediation}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
