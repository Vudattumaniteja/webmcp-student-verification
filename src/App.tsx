import { useState, useEffect, useMemo } from 'react';
import { globalVault } from './services/vault.ts';
import { globalVerificationEngine } from './services/verificationEngine.ts';
import { createAllWebMCPTools } from './tools/index.ts';
import { globalMerchantStore } from './services/merchantStore.ts';
import { globalAgentController } from './services/agentController.ts';
import Header from './components/Header.tsx';
import MerchantShowcase from './components/MerchantShowcase.tsx';
import VaultManager from './components/VaultManager.tsx';
import AgentChat from './components/AgentChat.tsx';

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

  // Handle Tab Switch from Header or Navigation
  const handleTabSelect = (tab: string) => {
    const safeScrollToTop = () => {
      try {
        if (
          typeof process !== 'undefined' &&
          process.env?.NODE_ENV === 'test'
        ) {
          return;
        }
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch {
        // jsdom or environment without smooth scrolling
      }
    };

    if (tab === 'directory' || tab === 'offers' || tab === 'perks') {
      setActiveTab('directory');
      safeScrollToTop();
    } else if (tab === 'vault') {
      setActiveTab('vault');
      safeScrollToTop();
    } else if (tab === 'agent') {
      setActiveTab('agent');
      safeScrollToTop();
    } else if (tab === 'faq') {
      if (activeTab !== 'directory') {
        setActiveTab('directory');
        setTimeout(() => {
          document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (tab === 'for-agents') {
      if (activeTab !== 'directory') {
        setActiveTab('directory');
        setTimeout(() => {
          document.getElementById('for-agents')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        document.getElementById('for-agents')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // UI Actions for Claiming Merchant Perks
  const handleClaimMerchant = async (merchantId: string) => {
    globalMerchantStore.claimPerk(merchantId);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] text-neutral-900 flex flex-col font-sans selection:bg-[#0066FF] selection:text-white">
      {/* Editorial Header */}

      <Header
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
        hasWebMCP={hasWebMCP}
      />

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
            <div className="flex justify-end">
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
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            <div className="flex justify-end">
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

      {/* Editorial Footer */}
      <footer className="border-t border-neutral-900/20 bg-[#F9F8F3] px-6 py-6 text-xs font-mono text-neutral-600 flex flex-col sm:flex-row items-center justify-between gap-3">
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
