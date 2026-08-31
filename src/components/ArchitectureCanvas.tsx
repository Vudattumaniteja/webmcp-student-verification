import { ArchitectureNode, ArchitectureConnection } from '../shared/state.ts';
import {
  Server,
  Database,
  Layers,
  Cpu,
  ShieldCheck,
  HardDrive,
  Network,
  Workflow,
} from 'lucide-react';

interface Props {
  nodes: ArchitectureNode[];
  connections: ArchitectureConnection[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onDeleteNode: (id: string) => void;
}

const ICONS = {
  api_gateway: Network,
  serverless_function: Cpu,
  database: Database,
  cache: Layers,
  load_balancer: Workflow,
  storage_bucket: HardDrive,
  auth_service: ShieldCheck,
  queue: Server,
};

const COLORS = {
  api_gateway: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400',
  serverless_function: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
  database: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
  cache: 'border-red-500/40 bg-red-950/20 text-red-400',
  load_balancer: 'border-blue-500/40 bg-blue-950/20 text-blue-400',
  storage_bucket: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-400',
  auth_service: 'border-purple-500/40 bg-purple-950/20 text-purple-400',
  queue: 'border-pink-500/40 bg-pink-950/20 text-pink-400',
};

export default function ArchitectureCanvas({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
}: Props) {
  // Compute line coordinates for SVG connections
  const getNodeCenter = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return { x: 0, y: 0 };
    return {
      x: node.position.x + 85,
      y: node.position.y + 45,
    };
  };

  return (
    <div className="relative w-full h-[420px] bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-hidden shadow-inner">
      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#64748b 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* SVG Connection Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
          </marker>
        </defs>

        {connections.map((conn) => {
          const from = getNodeCenter(conn.source);
          const to = getNodeCenter(conn.target);
          if (from.x === 0 || to.x === 0) return null;

          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          return (
            <g key={conn.id}>
              <path
                d={`M ${from.x} ${from.y} Q ${midX} ${midY - 15} ${to.x} ${to.y}`}
                fill="none"
                stroke={conn.encrypted ? '#0ea5e9' : '#f59e0b'}
                strokeWidth="2"
                strokeDasharray={conn.protocol === 'websocket' ? '4,4' : undefined}
                markerEnd="url(#arrow)"
                className="opacity-70"
              />
              <rect
                x={midX - 22}
                y={midY - 20}
                width="44"
                height="15"
                rx="3"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={midX}
                y={midY - 9}
                fill="#94a3b8"
                fontSize="9"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {conn.protocol}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Interactive Nodes Layer */}
      <div className="absolute inset-0 p-4 z-10">
        {nodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Workflow className="h-10 w-10 stroke-[1.2] mb-2 opacity-50" />
            <p className="text-sm">Canvas is empty</p>
            <p className="text-xs text-slate-600">Ask the agent to add infrastructure nodes or choose a template below.</p>
          </div>
        ) : (
          nodes.map((node) => {
            const Icon = ICONS[node.type] || Server;
            const isSelected = selectedNodeId === node.id;
            const colorClass = COLORS[node.type] || 'border-slate-700 bg-slate-900 text-slate-300';

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                style={{
                  transform: `translate(${node.position.x}px, ${node.position.y}px)`,
                }}
                className={`absolute w-44 rounded-lg border p-2.5 cursor-pointer select-none transition-all shadow-md backdrop-blur-sm ${colorClass} ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-400 scale-[1.03] shadow-indigo-500/20'
                    : 'hover:border-slate-500 hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-semibold truncate text-slate-100">{node.name}</span>
                  </div>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-slate-900/80 border border-slate-700/50 text-slate-400">
                    x{node.replicas}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/40 pt-1.5 mt-1 font-mono">
                  <span>{node.region}</span>
                  <span className="font-medium text-emerald-400">${node.monthlyCost}/mo</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
