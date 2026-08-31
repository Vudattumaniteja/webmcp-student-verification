import { useState, useEffect, useMemo } from 'react';
import { globalVault } from './services/vault.ts';
import { globalVerificationEngine } from './services/verificationEngine.ts';
import { createAllWebMCPTools } from './tools/index.ts';
import { globalMerchantStore } from './services/merchantStore.ts';
import { globalAgentController } from './services/agentController.ts';
import Header from './components/Header.tsx';
import HeroBanner from './components/HeroBanner.tsx';
import FAQSection from './components/FAQSection.tsx';
import ForAgentsSection from './components/ForAgentsSection.tsx';
import VaultManager from './components/VaultManager.tsx';
import MerchantShowcase from './components/MerchantShowcase.tsx';
import AgentChat from './components/AgentChat.tsx';
import {
  Bot,
  Play,
  Terminal,
  HelpCircle,
  ShieldCheck,
  Gift,
} from 'lucide-react';

export interface ActivityLogEntry {
  timestamp: string;
  source: 'WebMCP' | 'UI';
  message: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('vault');
  const [hasWebMCP, setHasWebMCP] = useState(false);
  const [registeredToolNames, setRegisteredToolNames] = useState<string[]>([]);
  const [selectedToolForTest, setSelectedToolForTest] = useState<string>('list_vault_documents');
  const [testArgumentsJson, setTestArgumentsJson] = useState<string>('{}');
  const [logs, setLogs] = useState<ActivityLogEntry[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      source: 'UI',
      message: 'WebMCP Student Verification Suite initialized',
    },
  ]);

  const addLog = (source: 'WebMCP' | 'UI', message: string) => {
    setLogs((prev) => [
      ...prev.slice(-25),
      { timestamp: new Date().toLocaleTimeString(), source, message },
    ]);
  };

  const tools = useMemo(() => createAllWebMCPTools(globalVerificationEngine, globalVault), []);

  // Register WebMCP Tools in Browser DOM (document.modelContext)
  useEffect(() => {
    const isSupported = typeof document !== 'undefined' && 'modelContext' in document && !!document.modelContext;
    setHasWebMCP(isSupported);

    if (isSupported && document.modelContext) {
      const abortController = new AbortController();

      Promise.all(
        tools.map((tool) =>
          document.modelContext!.registerTool(
            {
              name: tool.name,
              title: tool.title,
              description: tool.description,
              inputSchema: tool.inputSchema,
              execute: async (input) => {
                addLog('WebMCP', `Executing [${tool.name}] with: ${JSON.stringify(input)}`);
                const result = await tool.execute(input);
                addLog('WebMCP', `[${tool.name}] response: ${typeof result === 'string' ? result : JSON.stringify(result)}`);
                return result;
              },
              annotations: tool.annotations,
            },
            { signal: abortController.signal },
          ),
        ),
      )
        .then(() => {
          setRegisteredToolNames(tools.map((t) => t.name));
          addLog('WebMCP', `Registered ${tools.length} WebMCP tools in browser model context.`);
        })
        .catch((err) => {
          console.error('[WebMCP Registration Error]', err);
        });

      return () => {
        abortController.abort();
      };
    }
  }, [tools]);

  // Handle Tab Switch from Header or Navigation
  const handleTabSelect = (tab: string) => {
    if (tab === 'directory' || tab === 'offers') {
      setActiveTab('perks');
    } else if (tab === 'faq') {
      const faqElem = document.getElementById('faq');
      if (faqElem) {
        faqElem.scrollIntoView({ behavior: 'smooth' });
      } else {
        setActiveTab('faq');
      }
    } else if (tab === 'for-agents') {
      const agentElem = document.getElementById('for-agents');
      if (agentElem) {
        agentElem.scrollIntoView({ behavior: 'smooth' });
      } else {
        setActiveTab('for-agents');
      }
    } else {
      setActiveTab(tab);
    }
  };

  // UI Actions for Claiming Merchant Perks
  const handleClaimMerchant = async (merchantId: string) => {
    addLog('UI', `Initiated WebMCP verification for perk "${merchantId}"`);
    setActiveTab('agent');
    await globalAgentController.startVerification(merchantId);
  };

  // Test Runner Handler
  const handleExecuteToolTest = async () => {
    const target = tools.find((t) => t.name === selectedToolForTest);
    if (!target) return;

    try {
      const parsedArgs = JSON.parse(testArgumentsJson || '{}');
      addLog('UI', `Executing tool test "${target.name}"`);
      const result = await target.execute(parsedArgs);
      addLog('UI', `Tool test "${target.name}" result: ${typeof result === 'string' ? result : JSON.stringify(result)}`);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      alert(`Execution Error: ${errMsg}`);
    }
  };

  const isPerksTab = activeTab === 'perks' || activeTab === 'directory' || activeTab === 'offers';

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-neutral-900 flex flex-col font-sans selection:bg-[#0066FF] selection:text-white">
      {/* Editorial Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
        hasWebMCP={hasWebMCP}
      />

      {/* Hero Banner Section */}
      <HeroBanner
        offerCount={12}
        universityCount="4,200+"
        onOpenVault={() => setActiveTab('vault')}
        onRegistrarMatch={() => setActiveTab('agent')}
      />

      {/* Hidden subtitle for accessibility / branding test expectations */}
      <div className="sr-only">
        <h1>WebMCP Student Verification</h1>
        <p>Student Identity Vault, Multi-Merchant Perks & Autonomous Verification Suite</p>
      </div>

      {/* Main Tab Switcher Bar */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-between border-b border-black pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2 text-xs sm:text-sm font-mono border border-black cursor-pointer transition flex items-center gap-2 ${
                activeTab === 'vault'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#0066FF]'
                  : 'bg-white text-neutral-800 hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000000]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Student Vault</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('perks')}
              className={`px-4 py-2 text-xs sm:text-sm font-mono border border-black cursor-pointer transition flex items-center gap-2 ${
                isPerksTab
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#0066FF]'
                  : 'bg-white text-neutral-800 hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000000]'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Perks Showcase</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('agent')}
              className={`px-4 py-2 text-xs sm:text-sm font-mono border border-black cursor-pointer transition flex items-center gap-2 ${
                activeTab === 'agent'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#0066FF]'
                  : 'bg-white text-neutral-800 hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000000]'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Verification Agent</span>
            </button>
          </div>

          <div className="font-mono text-xs text-neutral-500 hidden sm:block">
            {tools.length} WebMCP tools loaded in sandbox
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Primary Workspace Column (8 cols) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {activeTab === 'vault' && <VaultManager vault={globalVault} />}

          {isPerksTab && (
            <MerchantShowcase
              store={globalMerchantStore}
              onClaim={handleClaimMerchant}
              onRetry={handleClaimMerchant}
            />
          )}

          {activeTab === 'agent' && <AgentChat controller={globalAgentController} />}

          {/* Activity Log Feed */}
          <div className="bg-white border border-black shadow-[4px_4px_0px_0px_#000000] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs uppercase tracking-wider font-mono">
                <Terminal className="h-4 w-4 text-[#0066FF]" />
                <h2>Real-Time Activity Feed</h2>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">Live WebMCP tool execution log</span>
            </div>

            <div className="bg-neutral-950 rounded p-3.5 font-mono text-xs text-neutral-200 min-h-[140px] max-h-[180px] overflow-y-auto border border-black flex flex-col gap-2">
              {logs.length === 0 ? (
                <span className="text-neutral-500 italic">No activity yet.</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-neutral-500 shrink-0 text-[11px]">{log.timestamp}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        log.source === 'WebMCP'
                          ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                          : 'bg-neutral-800 border border-neutral-700 text-neutral-300'
                      }`}
                    >
                      {log.source}
                    </span>
                    <span className="text-neutral-100 break-words">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Sidebar Column (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {/* Side Agent Assistant when browsing perks or vault */}
          {(isPerksTab || activeTab === 'vault') && (
            <AgentChat controller={globalAgentController} />
          )}

          {/* Registered Tools Directory */}
          <div className="bg-white border border-black shadow-[4px_4px_0px_0px_#000000] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs font-mono uppercase tracking-wider">
                <Bot className="h-4 w-4 text-[#0066FF]" />
                <h2>Exposed Agent Tools ({registeredToolNames.length || tools.length})</h2>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 border border-black bg-neutral-100 text-neutral-800 font-mono">
                WebMCP
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
              {tools.map((tool) => (
                <div
                  key={tool.name}
                  onClick={() => setSelectedToolForTest(tool.name)}
                  className={`p-2.5 border text-xs cursor-pointer transition flex items-center justify-between ${
                    selectedToolForTest === tool.name
                      ? 'border-black bg-blue-50 text-[#0066FF] font-semibold shadow-[2px_2px_0px_0px_#0066FF]'
                      : 'border-neutral-200 hover:border-neutral-400 bg-neutral-50/50 text-neutral-800'
                  }`}
                >
                  <span className="font-mono text-[11px] truncate">{tool.name}</span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {tool.annotations.readOnlyHint ? 'Read-only' : 'Mutating'}
                  </span>
                </div>
              ))}
            </div>

            {/* Test Tool Runner Console */}
            <div className="pt-3 border-t border-neutral-200 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-700 font-mono">
                <span className="font-bold">Test In-App Runner:</span>
                <span className="text-[#0066FF] truncate max-w-[140px] font-semibold">
                  {selectedToolForTest}
                </span>
              </div>

              <textarea
                value={testArgumentsJson}
                onChange={(e) => setTestArgumentsJson(e.target.value)}
                placeholder='JSON arguments e.g. {"presetId": "HARVARD_EXPIRED"}'
                rows={2}
                className="w-full bg-white border border-black p-2 text-[11px] font-mono text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
              />

              <button
                type="button"
                onClick={handleExecuteToolTest}
                className="w-full py-2 px-3 bg-[#0066FF] hover:bg-[#0052cc] text-white font-mono font-medium text-xs flex items-center justify-center gap-1.5 border border-black shadow-[2px_2px_0px_0px_#000000] cursor-pointer transition active:translate-x-0.5 active:translate-y-0.5"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Execute Tool</span>
              </button>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-white border border-black shadow-[3px_3px_0px_0px_#000000] p-4 text-xs text-neutral-700 flex items-start gap-2.5">
            <HelpCircle className="h-4 w-4 text-[#0066FF] shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <span className="font-bold text-neutral-900 font-mono">Zero-PII Claim Checks:</span>
              <p className="mt-1">
                AI agents query <code className="text-[#0066FF] font-mono font-semibold">list_vault_documents</code> to receive sanitized claim-check handles under 300 characters, maintaining zero-PII privacy while keeping full binary assets in the client vault sandbox.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FAQ Accordion Section */}
      <FAQSection />

      {/* For Agents Section */}
      <ForAgentsSection />

      {/* Footer matching reference design */}
      <footer className="w-full border-t border-black bg-white mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-neutral-500">
          <div>© 2026</div>
          <div className="flex items-center gap-2">
            <a href="#api-docs" onClick={(e) => e.preventDefault()} className="hover:text-black transition">
              /api-docs
            </a>
            <span>·</span>
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-black transition">
              privacy
            </a>
          </div>
          <div>updated as new sites ship WebMCP</div>
        </div>
      </footer>
    </div>
  );
}
