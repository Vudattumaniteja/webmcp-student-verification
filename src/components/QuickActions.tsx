import { ShieldAlert, DollarSign, FileCode, PlusCircle, LayoutTemplate, RotateCcw } from 'lucide-react';
import { NodeType } from '../shared/state.ts';

interface Props {
  onAddNode: (type: NodeType) => void;
  onRunAudit: () => void;
  onEstimateCost: () => void;
  onExportTerraform: () => void;
  onLoadTemplate: (templateName: string) => void;
  totalCost: number;
}

export default function QuickActions({
  onAddNode,
  onRunAudit,
  onEstimateCost,
  onExportTerraform,
  onLoadTemplate,
  totalCost,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm">
      {/* Component Add Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1 mr-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Add:</span>
        </span>
        <button
          onClick={() => onAddNode('serverless_function')}
          className="px-2.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300 text-xs font-medium transition cursor-pointer"
        >
          + Lambda / Function
        </button>
        <button
          onClick={() => onAddNode('database')}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-xs font-medium transition cursor-pointer"
        >
          + Database
        </button>
        <button
          onClick={() => onAddNode('cache')}
          className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-medium transition cursor-pointer"
        >
          + Redis Cache
        </button>
        <button
          onClick={() => onAddNode('queue')}
          className="px-2.5 py-1.5 rounded-lg bg-pink-950/40 hover:bg-pink-900/60 border border-pink-800/50 text-pink-300 text-xs font-medium transition cursor-pointer"
        >
          + Message Queue
        </button>
      </div>

      {/* Analysis and Export Action Buttons */}
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <button
          onClick={onRunAudit}
          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
          <span>Security Audit</span>
        </button>

        <button
          onClick={onEstimateCost}
          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
          <span>Cost: ${totalCost}/mo</span>
        </button>

        <button
          onClick={onExportTerraform}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          <FileCode className="h-3.5 w-3.5" />
          <span>Terraform</span>
        </button>

        <button
          onClick={() => onLoadTemplate('ai_pipeline')}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
          title="Load AI Vector Architecture Template"
        >
          <LayoutTemplate className="h-3.5 w-3.5 text-indigo-400" />
          <span>AI Template</span>
        </button>

        <button
          onClick={() => onLoadTemplate('clear')}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/60 border border-slate-700 hover:border-red-800 text-slate-400 hover:text-red-300 text-xs transition cursor-pointer"
          title="Clear canvas"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
