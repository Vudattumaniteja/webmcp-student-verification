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
import HeroBanner from './HeroBanner';
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
  Code2,
  BookOpen,
  Music,
  Bot,
  Play,
  Cloud,
  FileText,
  Code,
  PenTool,
  Sparkle,
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
  { id: 'ALL', label: 'All Offers' },
  { id: 'AI_DEV', label: 'AI & Dev Tools' },
  { id: 'MUSIC_STREAMING', label: 'Music & Streaming' },
  { id: 'PRODUCTIVITY_CLOUD', label: 'Productivity & Cloud' },
];

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'How does zero-PII student verification work?',
    answer:
      'All student credentials, IDs, and enrollment documents are stored locally inside your browser sandbox (IndexedDB). When verifying an offer, the WebMCP vault issues opaque, short-lived claim-check handles (under 300 characters). External AI agents and merchants never receive your raw personal documents or unredacted PII.',
  },
  {
    question: 'What is Instant Registrar Match vs. Document Proof?',
    answer:
      'Institutions supporting Instant Match (such as MIT) verify student enrollment automatically via official registrar domain matching (@mit.edu), immediately unlocking reward promo codes. Other universities (such as Stanford, Harvard, and UC Berkeley) use pre-signed cryptographic proof uploads (Student ID, Tuition Receipt, or Transcript).',
  },
  {
    question: 'How do autonomous AI agents discover and claim perks with WebMCP?',
    answer:
      'WebMCP registers structured verification tools directly on window.document.modelContext. In-browser AI agents query school search tools, retrieve student credentials with explicit human consent, and execute pre-signed verification streams without manual form filling.',
  },
  {
    question: 'What happens if a student ID is expired or illegible?',
    answer:
      'Our autonomous verification engine detects rejection codes (such as EXPIRED_DOCUMENT or ILLEGIBLE_DOCUMENT) in real time and offers 1-click intelligent recovery remedies, automatically re-verifying with valid replacement assets like Tuition Receipts or Official Transcripts.',
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
  const [apiSnippetCopied, setApiSnippetCopied] = useState(false);

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
      setCopiedCodeId(null), 2000;
    });
  };

  const handleResetDirectory = () => {
    store.reset();
  };

  // Helper for brand icons
  const getBrandIcon = (merchant: MerchantPerk) => {
    switch (merchant.logoIcon) {
      case 'music':
        return <Music className="h-5 w-5" />;
      case 'bot':
        return <Bot className="h-5 w-5" />;
      case 'play':
        return <Play className="h-5 w-5 fill-current" />;
      case 'cloud':
        return <Cloud className="h-5 w-5" />;
      case 'file-text':
        return <FileText className="h-5 w-5" />;
      case 'code':
        return <Code className="h-5 w-5" />;
      case 'figma':
        return <PenTool className="h-5 w-5" />;
      case 'sparkles':
        return <Sparkles className="h-5 w-5" />;
      default:
        return <Sparkle className="h-5 w-5" />;
    }
  };

  // Helper for brand badge styling
  const getBrandColorStyles = (merchant: MerchantPerk) => {
    switch (merchant.accentColor) {
      case 'green':
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rose':
      case 'red':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber':
      case 'orange':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'indigo':
      case 'teal':
      case 'cyan':
      case 'sky':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  // Category filter counts
  const matchesCategoryFilter = (catId: string, merchantCategory: string) => {
    const c = merchantCategory.toUpperCase();
    if (catId === 'ALL') return true;
    if (catId === 'AI_DEV') return c.includes('AI') || c.includes('DEV') || c.includes('RESEARCH');
    if (catId === 'MUSIC_STREAMING') return c.includes('MUSIC') || c.includes('STREAMING') || c.includes('AUDIO');
    if (catId === 'PRODUCTIVITY_CLOUD') return c.includes('PRODUCTIVITY') || c.includes('CLOUD') || c.includes('INFRA') || c.includes('DESIGN');
    return false;
  };

  const getCategoryCount = (catId: string) => {
    return merchants.filter((m) => matchesCategoryFilter(catId, m.category)).length;
  };

  // Filtered merchants
  const filteredMerchants = merchants.filter((m) => {
    const matchesCat = matchesCategoryFilter(activeCategory, m.category);

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      m.name.toLowerCase().includes(query) ||
      m.brand.toLowerCase().includes(query) ||
      (m.domain && m.domain.toLowerCase().includes(query)) ||
      m.tagline.toLowerCase().includes(query) ||
      m.tags.some((t) => t.toLowerCase().includes(query));

    return matchesCat && matchesSearch;
  });

  const handleCopyApiSnippet = () => {
    const snippet = `// WebMCP In-Browser Student Verification Invocation
const tools = await window.document.modelContext.getTools();
const result = await window.document.modelContext.executeTool('submit_student_verification', {
  studentName: 'Alex Chen',
  schoolId: 'sch_stanford_002',
  documentId: 'doc_stan_id_2026'
});`;
    navigator.clipboard?.writeText(snippet);
    setApiSnippetCopied(true);
    setTimeout(() => setApiSnippetCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto font-sans text-stone-900 pb-16">
      {/* Hero Banner with Editorial Headline & Badges */}
      <HeroBanner
        offerCount={merchants.length}
        onOpenVault={onOpenVault}
        onRegistrarMatch={() => {
          const mit = merchants.find((m) => m.id === 'openai_chatgpt_plus') || merchants[0];
          if (mit) handleOpenWizard(mit);
        }}
      />

      {/* Search Bar & Category Filter Navigation */}
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="h-4 w-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student discounts (Spotify, ChatGPT, YouTube, AWS, Notion...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-stone-900 placeholder-stone-400 font-sans focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-sm transition-all"
          />
        </div>

        {/* Category Filter Pills & Reset Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORY_TABS.map((tab) => {
              const count = getCategoryCount(tab.id);
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/20 font-semibold'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-xs'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <span className="text-xs font-mono text-stone-500">
              {filteredMerchants.length} offers available
            </span>
            <button
              type="button"
              onClick={handleResetDirectory}
              title="Reset perks status"
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Student Perks Cards / Rows Showcase */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm divide-y divide-stone-100 overflow-hidden">
        {filteredMerchants.length === 0 ? (
          <div className="py-16 text-center text-stone-500 text-sm font-sans">
            <p>No student discounts found matching &quot;{searchQuery}&quot;.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('ALL');
              }}
              className="mt-3 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredMerchants.map((merchant) => {
            const isApproved = merchant.status === 'APPROVED';
            const isVerifying = merchant.status === 'VERIFYING';
            const isActionNeeded = merchant.status === 'ERROR' || merchant.status === 'ACTION_NEEDED';

            return (
              <div
                key={merchant.id}
                className="p-4 sm:p-5.5 hover:bg-[#FAF9F6]/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left: Brand Icon & Domain Identity */}
                <div className="flex items-center gap-3.5 min-w-[210px] shrink-0">
                  <div
                    className={`h-11 w-11 rounded-xl border flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${getBrandColorStyles(
                      merchant,
                    )}`}
                  >
                    {getBrandIcon(merchant)}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-stone-900">
                        {merchant.domain || `${merchant.id}.com`}
                      </span>
                      <Lock className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-xs text-stone-500 font-medium">
                      {merchant.name}
                    </span>
                  </div>
                </div>

                {/* Center-Left: Category Tag */}
                <div className="min-w-[130px] shrink-0 hidden lg:block">
                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-600 font-medium">
                    {merchant.category}
                  </span>
                </div>

                {/* Center: Offer Tagline & Pricing Comparison */}
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
                    {merchant.tagline}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-stone-400 line-through font-mono">
                      {merchant.regularPrice}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      {merchant.studentPrice}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {merchant.discountValue}
                    </span>
                  </div>
                </div>

                {/* Right: Verification Status Badge & Action Button */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {/* Status Badges */}
                  {isApproved && (
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Approved</span>
                    </span>
                  )}

                  {isVerifying && (
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center gap-1.5 animate-pulse shadow-xs">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2563EB]" />
                      <span>Verifying...</span>
                    </span>
                  )}

                  {isActionNeeded && (
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-1.5 shadow-xs">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      <span>Action Needed</span>
                    </span>
                  )}

                  {/* Actions: Unlocked Promo Code vs Claim Button */}
                  {isApproved && merchant.rewardCode ? (
                    <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-stone-200 p-1.5 rounded-xl shadow-xs">
                      <span className="font-mono text-xs font-bold text-stone-900 px-2.5 select-all">
                        {merchant.rewardCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(merchant)}
                        aria-label="Copy Code"
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                        title="Copy promotional discount code"
                      >
                        {copiedCodeId === merchant.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : isActionNeeded ? (
                    <button
                      type="button"
                      onClick={() => handleOpenWizard(merchant)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retry Verification</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenWizard(merchant)}
                      className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:shadow transition cursor-pointer active:scale-98"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Verify &amp; Claim</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Frequently Asked Section with Modern Editorial Styling */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Everything you need to know about WebMCP zero-PII student verification.
            </p>
          </div>
        </div>

        <div className="divide-y divide-stone-100 border-t border-b border-stone-100">
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedFaqIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-serif text-base sm:text-lg font-medium text-stone-900 hover:text-[#2563EB] transition cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-stone-500 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-stone-500 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <p className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed font-sans animate-in fade-in duration-150">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* In-Browser WebMCP API for AI Agents Section */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                WebMCP Protocol for AI Agents
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Automate student perk verification directly via <code className="font-mono text-[#2563EB]">document.modelContext</code>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyApiSnippet}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-[#FAF9F6] hover:bg-stone-100 text-xs font-mono text-stone-800 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            {apiSnippetCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied Code</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-stone-500" />
                <span>Copy WebMCP Example</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans">
          All 7 WebMCP tools (<code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded text-stone-800">search_school</code>, <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded text-stone-800">submit_student_verification</code>, <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded text-stone-800">upload_vault_document</code>, <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded text-stone-800">check_verification_status</code>, <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded text-stone-800">list_vault_documents</code>) are actively registered on the browser model context with strict JSON schemas.
        </p>

        {/* Code Snippet Box */}
        <pre className="p-4 bg-stone-900 text-stone-100 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto border border-stone-800 shadow-inner">
          <code>{`// In-Browser Autonomous Agent Invocation
const tools = await document.modelContext.getTools();
const res = await document.modelContext.executeTool('submit_student_verification', {
  schoolId: 'sch_stanford_002',
  firstName: 'Alex',
  lastName: 'Chen',
  email: 'alex.chen@stanford.edu',
  merchantId: 'spotify_premium'
});`}</code>
        </pre>
      </div>

      {/* Multi-Step Verification Wizard Modal */}
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

