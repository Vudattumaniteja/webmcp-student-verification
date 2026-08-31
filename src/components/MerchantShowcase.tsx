import { useState, useEffect } from 'react';
import {
  MerchantStore,
  globalMerchantStore,
} from '../services/merchantStore';
import {
  MerchantPerk,
} from '../types/merchants';
import { StudentVault, globalVault } from '../services/vault';
import { VerificationEngine, globalVerificationEngine } from '../services/verificationEngine';
import VerificationWizardModal from './VerificationWizardModal';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
} from 'lucide-react';

interface MerchantShowcaseProps {
  store?: MerchantStore;
  vault?: StudentVault;
  engine?: VerificationEngine;
  onClaim?: (merchantId: string) => void | Promise<void>;
  onRetry?: (merchantId: string) => void | Promise<void>;
  onCodeCopied?: (merchantId: string, code: string) => void;
  onOpenVault?: () => void;
}

const CATEGORY_TABS = [
  'ALL',
  'AI & DEV',
  'MUSIC & STREAMING',
  'CLOUD & INFRA',
  'PRODUCTIVITY',
];

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'What is WebMCP Student Verification?',
    answer:
      'WebMCP Student Verification is an in-browser zero-PII student discount protocol. It enables human students and autonomous AI agents to discover, verify, and claim exclusive higher-education student discounts directly through browser model context (document.modelContext) without leaking sensitive personal documents to third parties.',
  },
  {
    question: 'How does Zero-PII Vault verification work?',
    answer:
      'All student identity credentials and document binary Blobs remain sandboxed locally inside your browser (IndexedDB). Agents and external sites only receive opaque, sanitized claim-check handles under 300 characters, verifying enrollment while maintaining complete data confidentiality.',
  },
  {
    question: 'How is Instant Match different from Document Proof?',
    answer:
      'Institutions supporting Instant Match (such as MIT) verify enrollment automatically via official registrar domain matching (@mit.edu), instantly unlocking reward promo codes. Other universities require uploading proof of enrollment (Student ID, Class Schedule, Tuition Receipt, or Transcript).',
  },
  {
    question: 'Can AI agents and crawlers read this directory programmatically?',
    answer:
      'Yes! All tools (search_school, submit_student_verification, upload_vault_document, check_verification_status, list_vault_documents) are actively registered in document.modelContext according to the WebMCP standard.',
  },
];

export default function MerchantShowcase({
  store = globalMerchantStore,
  vault = globalVault,
  engine = globalVerificationEngine,
  onClaim,
  onRetry,
  onCodeCopied,
  onOpenVault,
}: MerchantShowcaseProps) {
  const [merchants, setMerchants] = useState<MerchantPerk[]>(store.getMerchants());
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Verification Wizard Modal State
  const [activeWizardMerchant, setActiveWizardMerchant] = useState<MerchantPerk | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = store.subscribe((updated) => {
      setMerchants(updated);
    });
    return () => unsubscribe();
  }, [store]);

  const handleOpenWizard = (merchant: MerchantPerk) => {
    setActiveWizardMerchant(merchant);
    setIsWizardOpen(true);
    if (merchant.status === 'ERROR' || merchant.status === 'ACTION_NEEDED') {
      if (onRetry) {
        void onRetry(merchant.id);
      } else if (onClaim) {
        void onClaim(merchant.id);
      }
    } else if (onClaim) {
      void onClaim(merchant.id);
    }
  };

  const handleCloseWizard = () => {
    setIsWizardOpen(false);
    setActiveWizardMerchant(null);
  };

  const handleCopyCode = (merchant: MerchantPerk) => {
    if (!merchant.rewardCode) return;
    navigator.clipboard?.writeText(merchant.rewardCode);
    setCopiedCodeId(merchant.id);
    if (onCodeCopied) {
      onCodeCopied(merchant.id, merchant.rewardCode);
    }
    setTimeout(() => {
      setCopiedCodeId(null);
    }, 2000);
  };

  const handleResetDirectory = () => {
    store.reset();
  };

  // Category counts calculation
  const getCategoryCount = (cat: string) => {
    if (cat === 'ALL') return merchants.length;
    return merchants.filter((m) => {
      const c = m.category.toUpperCase();
      if (cat === 'AI & DEV') return c.includes('AI') || c.includes('DEV') || c.includes('RESEARCH');
      if (cat === 'MUSIC & STREAMING') return c.includes('MUSIC') || c.includes('STREAMING') || c.includes('AUDIO');
      if (cat === 'CLOUD & INFRA') return c.includes('CLOUD') || c.includes('INFRA') || c.includes('DEVOPS');
      if (cat === 'PRODUCTIVITY') return c.includes('PRODUCTIVITY');
      return c === cat;
    }).length;
  };

  // Filtered merchants
  const filteredMerchants = merchants.filter((m) => {
    const normalizedCat = activeCategory.toUpperCase();
    const mCat = m.category.toUpperCase();

    const matchesCategory =
      normalizedCat === 'ALL' ||
      (normalizedCat === 'AI & DEV' && (mCat.includes('AI') || mCat.includes('DEV') || mCat.includes('RESEARCH'))) ||
      (normalizedCat === 'MUSIC & STREAMING' && (mCat.includes('MUSIC') || mCat.includes('STREAMING') || mCat.includes('AUDIO'))) ||
      (normalizedCat === 'CLOUD & INFRA' && (mCat.includes('CLOUD') || mCat.includes('INFRA') || mCat.includes('DEVOPS'))) ||
      (normalizedCat === 'PRODUCTIVITY' && mCat.includes('PRODUCTIVITY')) ||
      mCat === normalizedCat;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      m.name.toLowerCase().includes(query) ||
      m.brand.toLowerCase().includes(query) ||
      (m.domain && m.domain.toLowerCase().includes(query)) ||
      m.tagline.toLowerCase().includes(query) ||
      m.tags.some((t) => t.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  const verifiedCount = merchants.filter((m) => m.status === 'APPROVED').length;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto font-sans text-neutral-900 pb-16">
      {/* Editorial Title Section */}
      <div className="flex flex-col gap-2 pt-2">
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-neutral-900 leading-tight">
          The <span className="text-[#0284c7] font-serif italic">WebMCP</span> Directory.
        </h1>
        <p className="font-serif text-lg sm:text-xl text-neutral-600 font-light">
          Browse verified student perks & websites agents can use.
        </p>
      </div>

      {/* Hero Stats Card matching PNG */}
      <div className="bg-white border-2 border-neutral-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
        {/* Stat Counters */}
        <div className="flex items-center gap-8 divide-x-2 divide-neutral-900 pr-2">
          <div className="flex flex-col">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 leading-none">
              {merchants.length}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 mt-1">
              VERIFIED PERKS
            </span>
          </div>

          <div className="flex flex-col pl-8">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 leading-none">
              {verifiedCount}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 mt-1">
              PERKS CLAIMED
            </span>
          </div>
        </div>

        {/* Verification Mix Visual Progress */}
        <div className="flex-1 max-w-xs flex flex-col gap-1 px-2">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-neutral-600">
            <span>VERIFICATION MIX</span>
            <span className="text-neutral-400">?</span>
          </div>
          <div className="w-full h-3 bg-neutral-200 border border-neutral-900 rounded-sm overflow-hidden flex">
            <div className="bg-emerald-500 h-full w-[46%]" title="Instant Match 46%" />
            <div className="bg-amber-500 h-full w-[49%]" title="Document Vault 49%" />
            <div className="bg-rose-500 h-full w-[5%]" title="Recovery 5%" />
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-600">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-emerald-500 inline-block" /> Instant 46%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-amber-500 inline-block" /> Vault 49%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-xs bg-rose-500 inline-block" /> Recovery 5%
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {onOpenVault && (
            <button
              type="button"
              onClick={onOpenVault}
              className="px-3.5 py-2 rounded-lg border-2 border-neutral-900 bg-[#FAF7F2] hover:bg-neutral-100 font-mono text-xs font-bold text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center gap-1.5"
            >
              <span>STUDENT VAULT →</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetDirectory}
            title="Reset directory statuses"
            className="p-2 rounded-lg border-2 border-neutral-900 bg-white hover:bg-neutral-100 text-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Clean Search Bar matching PNG */}
      <div className="relative w-full">
        <Search className="h-4 w-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search sites, tools, or categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border-2 border-neutral-900 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 font-sans focus:outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        />
      </div>

      {/* Category Count Filter Pills matching PNG */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_TABS.map((cat) => {
            const count = getCategoryCount(cat);
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1 rounded-full border border-neutral-900 text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white hover:bg-neutral-100 text-neutral-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-bold ${
                    isActive ? 'text-amber-300' : 'text-neutral-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs font-mono text-neutral-500 shrink-0">
          {filteredMerchants.length} perks indexed
        </span>
      </div>

      {/* Perks Directory Table / Rows matching PNG */}
      <div className="bg-white border-2 border-neutral-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] divide-y divide-neutral-200 overflow-hidden">
        {filteredMerchants.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-sm font-mono">
            No student perks found matching &quot;{searchQuery}&quot;.
          </div>
        ) : (
          filteredMerchants.map((merchant) => {
            const isApproved = merchant.status === 'APPROVED';
            const isVerifying = merchant.status === 'VERIFYING';
            const isActionNeeded = merchant.status === 'ERROR' || merchant.status === 'ACTION_NEEDED';

            return (
              <div
                key={merchant.id}
                className="p-4 sm:p-5 hover:bg-[#FAF7F2] transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left: Favicon & Domain */}
                <div className="flex items-center gap-3.5 min-w-[200px] shrink-0">
                  <div className="h-9 w-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                    {merchant.brand[0]}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs sm:text-sm font-bold text-neutral-900">
                        {merchant.domain || `${merchant.id}.com`}
                      </span>
                      <Lock className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-[11px] text-neutral-500 font-sans">
                      {merchant.name}
                    </span>
                  </div>
                </div>

                {/* Center-Left: Category Badge */}
                <div className="min-w-[130px] shrink-0 hidden lg:block">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-100 border border-neutral-300 text-neutral-700">
                    {merchant.category}
                  </span>
                </div>

                {/* Center: Offer Summary Description & Pricing */}
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs sm:text-sm text-neutral-800 leading-snug font-sans font-medium line-clamp-2">
                    {merchant.tagline}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-neutral-400 line-through font-mono">
                      {merchant.regularPrice}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      {merchant.studentPrice}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                      {merchant.discountValue}
                    </span>
                  </div>
                </div>

                {/* Right: Status Badge & Action Button */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {/* Status Badge */}
                  {isApproved && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-800 text-emerald-900 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>APPROVED</span>
                    </span>
                  )}

                  {isVerifying && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-100 border border-cyan-800 text-cyan-900 flex items-center gap-1 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin text-cyan-600" />
                      <span>VERIFYING</span>
                    </span>
                  )}

                  {isActionNeeded && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 border border-rose-800 text-rose-900 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-rose-600" />
                      <span>ACTION NEEDED</span>
                    </span>
                  )}

                  {/* Unlocked Reward Box or Verify Button */}
                  {isApproved && merchant.rewardCode ? (
                    <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-neutral-900 p-1.5 rounded-lg">
                      <span className="font-mono text-xs font-bold text-neutral-900 px-2 select-all">
                        {merchant.rewardCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(merchant)}
                        aria-label="Copy Code"
                        className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1"
                        title="Copy promo code"
                      >
                        {copiedCodeId === merchant.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : isActionNeeded ? (
                    <button
                      type="button"
                      onClick={() => handleOpenWizard(merchant)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white border border-neutral-900 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retry Verification</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenWizard(merchant)}
                      className="px-3.5 py-1.5 bg-white hover:bg-neutral-900 hover:text-white text-neutral-900 border border-neutral-900 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>Verify & Claim</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Frequently Asked Section matching PNG */}
      <div className="bg-white border-2 border-neutral-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 flex flex-col gap-4">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
          — FREQUENTLY ASKED
        </span>

        <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200">
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedFaqIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-serif text-base sm:text-lg font-medium text-neutral-900 hover:text-neutral-700 transition cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-neutral-500 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <p className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans animate-in fade-in duration-150">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* For Agents API Section matching PNG */}
      <div className="bg-white border-2 border-neutral-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
            — API FOR AGENTS
          </span>
          <span className="text-xs font-mono font-bold text-neutral-900 flex items-center gap-1 hover:underline cursor-pointer">
            Full API docs ↗
          </span>
        </div>

        <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-sans">
          Query the directory programmatically — list perks, inspect each tool&apos;s input schema, probe student vault with <code className="font-mono text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">list_vault_documents</code>, or execute autonomous verification. Read-only discovery with zero PII leakage.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-[#FAF7F2] border border-neutral-900 rounded-lg flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-neutral-900">GET /api/v1/lookup?url=...</span>
            <span className="text-neutral-500 text-[11px]">Does this site have student discount? ↗</span>
          </div>

          <div className="p-3 bg-[#FAF7F2] border border-neutral-900 rounded-lg flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-neutral-900">GET /api/v1/perks?type=live</span>
            <span className="text-neutral-500 text-[11px]">List live WebMCP perks ↗</span>
          </div>

          <div className="p-3 bg-[#FAF7F2] border border-neutral-900 rounded-lg flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-neutral-900">GET /api/v1/vault/documents</span>
            <span className="text-neutral-500 text-[11px]">Inspect sanitized vault handles ↗</span>
          </div>

          <div className="p-3 bg-[#FAF7F2] border border-neutral-900 rounded-lg flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-neutral-900">GET /api/v1/stats</span>
            <span className="text-neutral-500 text-[11px]">Directory-wide counts ↗</span>
          </div>
        </div>

        <div className="pt-2 text-[11px] font-mono text-neutral-500">
          OpenAPI 3.1 spec at <code className="text-neutral-800">/api/openapi.json</code> • full reference at <code className="text-neutral-800">/api-docs</code>
        </div>
      </div>

      {/* Authentic Multi-Step Verification Modal */}
      {activeWizardMerchant && (
        <VerificationWizardModal
          merchant={activeWizardMerchant}
          isOpen={isWizardOpen}
          onClose={handleCloseWizard}
          engine={engine}
          vault={vault}
          store={store}
        />
      )}
    </div>
  );
}
