import { ArchitectureNode } from '../shared/state.ts';
import { Trash2, X, Plus, Minus } from 'lucide-react';

interface Props {
  node: ArchitectureNode | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ArchitectureNode>) => void;
  onDelete: (id: string) => void;
}

export default function NodeInspector({ node, onClose, onUpdate, onDelete }: Props) {
  if (!node) return null;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="truncate">
          <h3 className="text-sm font-semibold text-slate-100 truncate">{node.name}</h3>
          <p className="text-[11px] font-mono text-indigo-400">{node.id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Tier</label>
          <select
            value={node.tier}
            onChange={(e) => onUpdate(node.id, { tier: e.target.value })}
            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Region</label>
          <select
            value={node.region}
            onChange={(e) => onUpdate(node.id, { region: e.target.value })}
            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="us-east-1">us-east-1</option>
            <option value="us-west-2">us-west-2</option>
            <option value="eu-west-1">eu-west-1</option>
            <option value="ap-southeast-1">ap-southeast-1</option>
          </select>
        </div>
      </div>

      {/* Replicas Counter */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Replicas</label>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => onUpdate(node.id, { replicas: Math.max(1, node.replicas - 1) })}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-200 cursor-pointer"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="font-mono text-sm font-semibold text-slate-100">{node.replicas}</span>
          <button
            onClick={() => onUpdate(node.id, { replicas: node.replicas + 1 })}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-200 cursor-pointer"
          >
            <Plus className="h-3 w-3" />
          </button>
          <span className="text-xs text-emerald-400 font-mono ml-auto font-medium">
            ${node.monthlyCost}/mo
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
        <button
          onClick={() => onDelete(node.id)}
          className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 rounded text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
          <span>Delete Node</span>
        </button>
      </div>
    </div>
  );
}
