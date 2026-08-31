import { useState, useEffect, useMemo } from 'react';
import { globalStore, ArchitectureState, NodeType, SecurityIssue } from './shared/state.ts';
import { createArchitectureTools } from './shared/tools.ts';
import { globalVault } from './services/vault.ts';
import { createVaultTools } from './services/vaultTools.ts';
import { globalVerificationEngine } from './services/verificationEngine.ts';
import { createVerificationTools } from './tools/verificationTools.ts';
import { globalMerchantStore } from './services/merchantStore.ts';
import VaultManager from './components/VaultManager.tsx';
import MerchantShowcase from './components/MerchantShowcase.tsx';
import ArchitectureCanvas from './components/ArchitectureCanvas.tsx';
import NodeInspector from './components/NodeInspector.tsx';
import QuickActions from './components/QuickActions.tsx';
import AuditModal from './components/AuditModal.tsx';
import TerraformModal from './components/TerraformModal.tsx';
import {
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  HelpCircle,
  ShieldCheck,
  LayoutGrid,
  Gift,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'vault' | 'perks' | 'canvas'>('vault');
  const [state, setState] = useState<ArchitectureState>(globalStore.getState());
  const [hasWebMCP, setHasWebMCP] = useState(false);
  const [registeredToolNames, setRegisteredToolNames] = useState<string[]>([]);
  const [selectedToolForTest, setSelectedToolForTest] = useState<string>('list_vault_documents');
  const [testArgumentsJson, setTestArgumentsJson] = useState<string>('{}');

  // Modals state
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditScore, setAuditScore] = useState(100);
  const [auditIssues, setAuditIssues] = useState<SecurityIssue[]>([]);
  const [terraformModalOpen, setTerraformModalOpen] = useState(false);
  const [terraformCode, setTerraformCode] = useState('');

  const archTools = useMemo(() => createArchitectureTools(), []);
  const vaultTools = useMemo(() => createVaultTools(globalVault), []);
  const verificationTools = useMemo(() => createVerificationTools(globalVerificationEngine), []);

  const allTools = useMemo(() => {
    return [
      ...verificationTools.map((vt) => ({
        ...vt,
        execute: async (input: any, _store?: any, callerSource: 'WebMCP' | 'UI' = 'WebMCP') => {
          const res = await vt.execute(input);
          globalStore.addLog(callerSource, `[${vt.name}] ${res}`);
          return res;
        },
      })),
      ...vaultTools.map((vt) => ({
        ...vt,
        execute: async (input: any, _store?: any, callerSource: 'WebMCP' | 'UI' = 'WebMCP') => {
          const res = await vt.execute(input);
          globalStore.addLog(callerSource, `[${vt.name}] ${res}`);
          return res;
        },
      })),
      ...archTools,
    ];
  }, [archTools, vaultTools, verificationTools]);

  // 1. Subscribe to Store State Updates
  useEffect(() => {
    const unsubscribe = globalStore.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  // 2. Register WebMCP Tools in Browser DOM (document.modelContext)
  useEffect(() => {
    const isSupported = typeof document !== 'undefined' && 'modelContext' in document && !!document.modelContext;
    setHasWebMCP(isSupported);

    if (isSupported && document.modelContext) {
      const abortController = new AbortController();

      // Register all WebMCP Tools
      Promise.all(
        allTools.map((tool) =>
          document.modelContext!.registerTool(
            {
              name: tool.name,
              title: tool.title,
              description: tool.description,
              inputSchema: tool.inputSchema,
              execute: async (input) => {
                return await tool.execute(input, globalStore, 'WebMCP');
              },
              annotations: tool.annotations,
            },
            { signal: abortController.signal },
          ),
        ),
      )
        .then(() => {
          setRegisteredToolNames(allTools.map((t) => t.name));
          globalStore.addLog('WebMCP', `Registered ${allTools.length} WebMCP tools in browser model context.`);
        })
        .catch((err) => {
          console.error('[WebMCP Registration Error]', err);
        });

      return () => {
        abortController.abort();
      };
    }
  }, [allTools]);

  // UI Actions for Claiming Merchant Perks
  const handleClaimMerchant = async (merchantId: string) => {
    globalStore.addLog('UI', `Initiated WebMCP verification for perk "${merchantId}"`);
    globalMerchantStore.updateMerchantStatus(merchantId, 'VERIFYING');

    try {
      const profile = globalVault.getState().profile;
      const submission = globalVerificationEngine.submitPersonalInfo({
        schoolId: profile.universityId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        merchantId,
      });

      if (submission.status === 'APPROVED' && submission.rewardCode) {
        globalMerchantStore.updateMerchantStatus(merchantId, 'APPROVED', submission.rewardCode);
        globalStore.addLog(
          'WebMCP',
          `[Perk Unlocked] Instant registrar match approved for ${merchantId}. Promo Code: ${submission.rewardCode}`,
        );
        return;
      }

      if (submission.status === 'PENDING_DOCS') {
        const documents = globalVault.getState().documents;
        if (documents.length === 0) {
          const errMsg = 'No proof documents found in vault. Please add a document to proceed.';
          globalMerchantStore.updateMerchantStatus(merchantId, 'ERROR', undefined, errMsg);
          globalStore.addLog('WebMCP', `[Perk Claim Failed] ${errMsg}`);
          return;
        }

        // Pick first document in vault
        const doc = documents[0];
        const docBlob = await globalVault.getDocumentBlob(doc.id);
        if (!docBlob) {
          const errMsg = `Document binary missing in sandbox for handle ${doc.id}.`;
          globalMerchantStore.updateMerchantStatus(merchantId, 'ERROR', undefined, errMsg);
          return;
        }

        const uploadResult = globalVerificationEngine.uploadDocumentDirect(submission.verificationId, docBlob, doc);
        if (uploadResult.status === 'APPROVED' && uploadResult.rewardCode) {
          globalMerchantStore.updateMerchantStatus(merchantId, 'APPROVED', uploadResult.rewardCode);
          globalStore.addLog(
            'WebMCP',
            `[Perk Unlocked] Vault document verified for ${merchantId}. Promo Code: ${uploadResult.rewardCode}`,
          );
        } else {
          const errorMsg = uploadResult.remedyText
            ? `${uploadResult.rejectionReason} ${uploadResult.remedyText}`
            : uploadResult.rejectionReason || 'Document rejected by verification authority.';
          globalMerchantStore.updateMerchantStatus(merchantId, 'ERROR', undefined, errorMsg);
          globalStore.addLog('WebMCP', `[Perk Rejected] Document rejected for ${merchantId}: ${errorMsg}`);
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Verification workflow error';
      globalMerchantStore.updateMerchantStatus(merchantId, 'ERROR', undefined, errorMsg);
      globalStore.addLog('WebMCP', `[Perk Claim Error] ${errorMsg}`);
    }
  };

  // UI Actions for Architecture Studio
  const handleAddNode = (type: NodeType) => {
    const defaultNames: Record<NodeType, string> = {
      api_gateway: 'Edge API Gateway',
      serverless_function: 'Worker Function',
      database: 'PostgreSQL Instance',
      cache: 'Redis Cache Cluster',
      load_balancer: 'Application Load Balancer',
      storage_bucket: 'Asset Storage Bucket',
      auth_service: 'Auth & Identity Service',
      queue: 'Async Message Queue',
    };

    globalStore.addNode({
      type,
      name: defaultNames[type] || 'New Node',
    });
    globalStore.addLog('UI', `Manually added ${type} component`);
  };

  const handleUpdateNode = (id: string, updates: any) => {
    globalStore.updateNode(id, updates);
  };

  const handleDeleteNode = (id: string) => {
    globalStore.removeNode(id);
  };

  const handleRunAudit = () => {
    const result = globalStore.runSecurityAudit();
    setAuditScore(result.score);
    setAuditIssues(result.issues);
    setAuditModalOpen(true);
    globalStore.addLog('UI', `Executed Security Audit. Score: ${result.score}/100`);
  };

  const handleEstimateCost = () => {
    const { totalMonthlyCost, breakdown } = globalStore.estimateCost();
    alert(`Estimated Total Monthly Cost: $${totalMonthlyCost}/mo\n\n${breakdown.map((b) => `• ${b.name}: $${b.cost}/mo`).join('\n')}`);
    globalStore.addLog('UI', `Calculated budget: $${totalMonthlyCost}/mo`);
  };

  const handleExportTerraform = () => {
    const code = globalStore.exportTerraform();
    setTerraformCode(code);
    setTerraformModalOpen(true);
    globalStore.addLog('UI', 'Exported architecture to Terraform HCL');
  };

  const handleLoadTemplate = (templateName: string) => {
    globalStore.reset(templateName);
    globalStore.addLog('UI', `Reset workspace to template "${templateName}"`);
  };

  // Test Runner Handler
  const handleExecuteToolTest = async () => {
    const target = allTools.find((t) => t.name === selectedToolForTest);
    if (!target) return;

    try {
      const parsedArgs = JSON.parse(testArgumentsJson || '{}');
      const result = await target.execute(parsedArgs, globalStore, 'UI');
      globalStore.addLog('UI', `Ran tool test "${target.name}": ${typeof result === 'string' ? result : JSON.stringify(result)}`);
    } catch (e: any) {
      alert(`Execution Error: ${e.message}`);
    }
  };

  const selectedNode = state.nodes.find((n) => n.id === state.selectedNodeId) || null;
  const totalCost = state.nodes.reduce((acc, n) => acc + n.monthlyCost, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-slate-100">
                WebMCP Architecture Studio
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono">
                WebMCP Native
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Student Identity Vault, Multi-Merchant Perks & Autonomous Verification Suite
            </p>
          </div>
        </div>

        {/* Navigation Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vault'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Student Vault</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('perks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'perks'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gift className="h-3.5 w-3.5" />
            <span>Perks Showcase</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'canvas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Architecture Canvas</span>
          </button>
        </div>

        {/* WebMCP Connection Badge */}
        <div className="flex items-center gap-2.5 text-xs">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
              hasWebMCP
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
                : 'bg-amber-950/50 border-amber-800/80 text-amber-300'
            }`}
            title={hasWebMCP ? 'WebMCP enabled in browser (document.modelContext active)' : 'Enable chrome://flags/#enable-webmcp-testing'}
          >
            {hasWebMCP ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span className="font-medium">{hasWebMCP ? 'WebMCP (Browser Agent Active)' : 'WebMCP Flag Needed'}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Center Column (8 cols) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          {activeTab === 'vault' && (
            <VaultManager vault={globalVault} />
          )}

          {activeTab === 'perks' && (
            <MerchantShowcase
              store={globalMerchantStore}
              onClaim={handleClaimMerchant}
              onRetry={handleClaimMerchant}
            />
          )}

          {activeTab === 'canvas' && (
            <>
              {/* Quick Action Bar */}
              <QuickActions
                onAddNode={handleAddNode}
                onRunAudit={handleRunAudit}
                onEstimateCost={handleEstimateCost}
                onExportTerraform={handleExportTerraform}
                onLoadTemplate={handleLoadTemplate}
                totalCost={totalCost}
              />

              {/* Visual Topology Canvas */}
              <ArchitectureCanvas
                nodes={state.nodes}
                connections={state.connections}
                selectedNodeId={state.selectedNodeId}
                onSelectNode={(id) => globalStore.selectNode(id)}
                onDeleteNode={handleDeleteNode}
              />
            </>
          )}

          {/* Activity Log Feed */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs uppercase tracking-wider">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <h2>Real-Time Activity Feed</h2>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Live WebMCP tool execution log</span>
            </div>

            <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 min-h-[140px] max-h-[180px] overflow-y-auto border border-slate-800/80 flex flex-col gap-2">
              {state.logs.length === 0 ? (
                <span className="text-slate-600 italic">No activity yet.</span>
              ) : (
                state.logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-600 shrink-0 text-[11px]">{log.timestamp}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0 ${
                        log.source === 'WebMCP'
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                          : 'bg-slate-800 border border-slate-700 text-slate-300'
                      }`}
                    >
                      {log.source}
                    </span>
                    <span className="text-slate-200 break-words">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Node Inspector & Tool Test Runner (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          {/* Node Inspector or Canvas Helper when on canvas */}
          {activeTab === 'canvas' && selectedNode && (
            <NodeInspector
              node={selectedNode}
              onClose={() => globalStore.selectNode(null)}
              onUpdate={handleUpdateNode}
              onDelete={handleDeleteNode}
            />
          )}

          {/* Registered Tools Directory */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                <Bot className="h-4 w-4 text-indigo-400" />
                <h2>Exposed Agent Tools ({registeredToolNames.length || allTools.length})</h2>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">WebMCP</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
              {allTools.map((tool) => (
                <div
                  key={tool.name}
                  onClick={() => setSelectedToolForTest(tool.name)}
                  className={`p-2 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                    selectedToolForTest === tool.name
                      ? 'border-indigo-500/80 bg-indigo-950/40 text-indigo-200'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300'
                  }`}
                >
                  <span className="font-mono text-[11px] truncate">{tool.name}</span>
                  <span className="text-[10px] text-slate-500">{tool.annotations.readOnlyHint ? 'Read-only' : 'Mutating'}</span>
                </div>
              ))}
            </div>

            {/* Test Tool Runner Console */}
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold">Test In-App Runner:</span>
                <span className="font-mono text-indigo-400 truncate max-w-[140px]">{selectedToolForTest}</span>
              </div>

              <textarea
                value={testArgumentsJson}
                onChange={(e) => setTestArgumentsJson(e.target.value)}
                placeholder='JSON arguments e.g. {"presetId": "HARVARD_EXPIRED"}'
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="button"
                onClick={handleExecuteToolTest}
                className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Execute Tool</span>
              </button>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-3.5 text-xs text-slate-400 flex items-start gap-2.5">
            <HelpCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <span className="font-semibold text-slate-300">How to use with AI Agents:</span>
              <p className="mt-1">
                AI agents query <code className="text-cyan-300 font-mono">list_vault_documents</code> to receive sanitized claim-check handles under 300 characters, maintaining zero-PII privacy while keeping full binary assets in the client vault sandbox.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      <AuditModal
        isOpen={auditModalOpen}
        score={auditScore}
        issues={auditIssues}
        onClose={() => setAuditModalOpen(false)}
      />

      <TerraformModal
        isOpen={terraformModalOpen}
        code={terraformCode}
        onClose={() => setTerraformModalOpen(false)}
      />
    </div>
  );
}
