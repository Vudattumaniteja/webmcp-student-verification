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
import { ArrowLeft, GraduationCap, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'directory' | 'vault' | 'agent'>('directory');
  const [hasWebMCP, setHasWebMCP] = useState(false);
  const [activePersona, setActivePersona] = useState(() => {
    const profile = globalVault.getProfile();
    return {
      name: profile.fullName,
      university: profile.universityName,
      avatarInitials: `${profile.firstName[0]}${profile.lastName[0]}`,
    };
  });

  const tools = useMemo(() => createAllWebMCPTools(globalVerificationEngine, globalVault), []);

  // Listen to vault preset switches for active persona badge
  useEffect(() => {
    const unsubscribe = globalVault.subscribe((newState) => {
      setActivePersona({
        name: newState.profile.fullName,
        university: newState.profile.universityName,
        avatarInitials: `${newState.profile.firstName[0]}${newState.profile.lastName[0]}`,
      });
    });
    return () => unsubscribe();
  }, []);

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
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Modern Editorial Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
        hasWebMCP={hasWebMCP}
        activePersona={activePersona}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 font-medium text-xs text-stone-700 shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Perks Directory</span>
              </button>
            </div>

            <VaultManager vault={globalVault} />
          </div>
        )}

        {activeTab === 'agent' && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 font-medium text-xs text-stone-700 shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Perks Directory</span>
              </button>
            </div>

            <AgentChat controller={globalAgentController} />
          </div>
        )}
      </main>

      {/* Modern Editorial Footer */}
      <footer className="border-t border-stone-200 bg-[#FAF9F6] px-6 lg:px-8 py-8 text-xs font-sans text-stone-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-lg bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <span className="font-serif font-bold text-stone-900">
              WebMCP Student Perks &amp; Verification Protocol
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-600">
            <a
              href="#directory"
              onClick={(e) => {
                e.preventDefault();
                handleTabSelect('directory');
              }}
              className="hover:text-stone-900 transition cursor-pointer"
            >
              Perks Directory
            </a>
            <span>•</span>
            <a
              href="#vault"
              onClick={(e) => {
                e.preventDefault();
                handleTabSelect('vault');
              }}
              className="hover:text-stone-900 transition cursor-pointer"
            >
              Student Vault
            </a>
            <span>•</span>
            <a
              href="#agent"
              onClick={(e) => {
                e.preventDefault();
                handleTabSelect('agent');
              }}
              className="hover:text-stone-900 transition cursor-pointer"
            >
              AI Agent Workspace
            </a>
            <span>•</span>
            <a
              href="#faq"
              onClick={(e) => {
                e.preventDefault();
                handleTabSelect('faq');
              }}
              className="hover:text-stone-900 transition cursor-pointer"
            >
              Privacy &amp; Security
            </a>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-stone-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Zero-PII Client Sandboxed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

