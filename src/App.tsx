import { useState, useEffect, useMemo } from 'react';
import { globalVault } from './services/vault.ts';
import { globalVerificationEngine } from './services/verificationEngine.ts';
import { createAllWebMCPTools } from './tools/index.ts';
import { globalMerchantStore } from './services/merchantStore.ts';
import { globalAgentController } from './services/agentController.ts';
import VaultManager from './components/VaultManager.tsx';
import MerchantShowcase from './components/MerchantShowcase.tsx';
import AgentChat from './components/AgentChat.tsx';
import {
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'directory' | 'vault' | 'agent'>('directory');
  const [hasWebMCP, setHasWebMCP] = useState(false);

  const tools = useMemo(() => createAllWebMCPTools(globalVerificationEngine, globalVault), []);

  // Register WebMCP Tools in Browser DOM (document.modelContext)
  useEffect(() => {
    const isSupported =
      typeof document !== 'undefined' &&
      'modelContext' in document &&
      Boolean(document.modelContext);
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
                return await tool.execute(input);
              },
              annotations: tool.annotations,
            },
            { signal: abortController.signal },
          ),
        ),
      ).catch((err) => {
        console.error('[WebMCP Registration Error]', err);
      });

      return () => {
        abortController.abort();
      };
    }
  }, [tools]);

  // UI Actions for Claiming Merchant Perks
  const handleClaimMerchant = async (merchantId: string) => {
    globalMerchantStore.claimPerk(merchantId);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex flex-col font-sans selection:bg-amber-200">
      {/* Top Editorial Navigation Bar matching PNG */}
      <header className="border-b border-neutral-900/20 bg-[#FAF7F2]/90 backdrop-blur-xs px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0284c7] inline-block shadow-sm" />
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className="font-mono font-bold text-xs sm:text-sm tracking-wider uppercase text-neutral-900 hover:opacity-80 transition cursor-pointer"
          >
            WEBMCP.COM
          </button>
        </div>

        {/* Editorial Nav Links */}
        <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`transition cursor-pointer ${
              activeTab === 'directory'
                ? 'font-bold text-[#0284c7] underline underline-offset-4'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            /directory
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`transition cursor-pointer ${
              activeTab === 'vault'
                ? 'font-bold text-[#0284c7] underline underline-offset-4'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            /vault
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agent')}
            className={`transition cursor-pointer ${
              activeTab === 'agent'
                ? 'font-bold text-[#0284c7] underline underline-offset-4'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            /agent
          </button>

          <span className="text-neutral-400 hidden md:inline">/resources</span>
          <span className="text-neutral-400 hidden lg:inline">/benchmark</span>
          <span className="text-neutral-400 hidden lg:inline">/about</span>
        </nav>

        {/* WebMCP Connection Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-900 text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              hasWebMCP
                ? 'bg-emerald-100 text-emerald-950'
                : 'bg-amber-100 text-amber-950'
            }`}
            title={
              hasWebMCP
                ? 'WebMCP enabled in browser (document.modelContext active)'
                : 'Enable chrome://flags/#enable-webmcp-testing or browser agent'
            }
          >
            {hasWebMCP ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            )}
            <span className="hidden sm:inline">
              {hasWebMCP ? 'WebMCP Native Active' : 'WebMCP Flag Ready'}
            </span>
            <span className="sm:hidden font-mono">WebMCP</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'directory' && (
          <MerchantShowcase
            store={globalMerchantStore}
            vault={globalVault}
            engine={globalVerificationEngine}
            onClaim={handleClaimMerchant}
            onRetry={handleClaimMerchant}
            onOpenVault={() => setActiveTab('vault')}
          />
        )}

        {activeTab === 'vault' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-3xl font-bold text-neutral-900">
                  Student Identity Vault
                </h2>
                <p className="text-xs text-neutral-600 font-mono mt-0.5">
                  Sandboxed client document store • Zero-PII claim-check registry
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="px-3.5 py-1.5 rounded-lg border-2 border-neutral-900 bg-white hover:bg-neutral-100 font-mono text-xs font-bold text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
              >
                ← Back to Directory
              </button>
            </div>

            <VaultManager vault={globalVault} />
          </div>
        )}

        {activeTab === 'agent' && (
          <div className="flex flex-col gap-5 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-3xl font-bold text-neutral-900">
                  Autonomous Verification Agent
                </h2>
                <p className="text-xs text-neutral-600 font-mono mt-0.5">
                  In-browser autonomous verification & recovery assistant
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="px-3.5 py-1.5 rounded-lg border-2 border-neutral-900 bg-white hover:bg-neutral-100 font-mono text-xs font-bold text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
              >
                ← Back to Directory
              </button>
            </div>

            <AgentChat controller={globalAgentController} />
          </div>
        )}
      </main>

      {/* Editorial Footer matching PNG */}
      <footer className="border-t border-neutral-900/20 bg-[#FAF7F2] px-6 py-6 text-xs font-mono text-neutral-600 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>© 2026 WebMCP</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">/api-docs</span>
          <span>•</span>
          <span className="hover:underline cursor-pointer">/privacy</span>
        </div>

        <div>
          <span>updated as new sites ship WebMCP —</span>
        </div>
      </footer>
    </div>
  );
}
