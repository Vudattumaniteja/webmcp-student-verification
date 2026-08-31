import { useState, useEffect } from 'react';
import {
  MerchantStore,
  globalMerchantStore,
} from '../services/merchantStore';
import {
  MerchantPerk,
  MerchantCategory,
} from '../types/merchants';
import {
  Sparkles,
  Bot,
  Music,
  Cloud,
  FileText,
  Play,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  Tag,
  Gift,
  Zap,
  Award,
  Loader2,
  Search,
} from 'lucide-react';

interface MerchantShowcaseProps {
  store?: MerchantStore;
  onClaim?: (merchantId: string) => void | Promise<void>;
  onRetry?: (merchantId: string) => void | Promise<void>;
  onCodeCopied?: (merchantId: string, code: string) => void;
}

const CATEGORIES: MerchantCategory[] = [
  'All',
  'AI & Research',
  'Music & Audio',
  'Cloud & DevOps',
  'Productivity',
  'Streaming',
];

export default function MerchantShowcase({
  store = globalMerchantStore,
  onClaim,
  onRetry,
  onCodeCopied,
}: MerchantShowcaseProps) {
  const [merchants, setMerchants] = useState<MerchantPerk[]>(store.getMerchants());
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const unsubscribe = store.subscribe((updated) => {
      setMerchants(updated);
    });
    return () => unsubscribe();
  }, [store]);

  const handleClaim = async (merchantId: string) => {
    store.claimPerk(merchantId);
    if (onClaim) {
      await onClaim(merchantId);
    }
  };

  const handleRetry = async (merchantId: string) => {
    store.claimPerk(merchantId);
    if (onRetry) {
      await onRetry(merchantId);
    } else if (onClaim) {
      await onClaim(merchantId);
    }
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

  const filteredMerchants = merchants.filter((m) => {
    const matchesCategory =
      activeCategory === 'All' ||
      m.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
      (activeCategory === 'Cloud & DevOps' && m.category.includes('Cloud')) ||
      (activeCategory === 'Music & Audio' && m.category.includes('Music')) ||
      (activeCategory === 'AI & Research' && m.category.includes('AI'));

    const matchesSearch =
      searchQuery.trim() === '' ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const renderBrandIcon = (logoIcon: string) => {
    switch (logoIcon) {
      case 'bot':
        return <Bot className="h-5 w-5 text-emerald-400" />;
      case 'music':
        return <Music className="h-5 w-5 text-green-400" />;
      case 'cloud':
        return <Cloud className="h-5 w-5 text-amber-400" />;
      case 'file-text':
        return <FileText className="h-5 w-5 text-indigo-400" />;
      case 'play':
        return <Play className="h-5 w-5 text-rose-400 fill-current" />;
      default:
        return <Gift className="h-5 w-5 text-cyan-400" />;
    }
  };

  const getStatusBadge = (status: MerchantPerk['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[11px] font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Approved</span>
          </div>
        );
      case 'VERIFYING':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 text-[11px] font-semibold animate-pulse">
            <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            <span>Verifying with WebMCP</span>
          </div>
        );
      case 'ERROR':
      case 'ACTION_NEEDED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-700/80 text-rose-300 text-[11px] font-semibold">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>Action Needed</span>
          </div>
        );
      case 'UNVERIFIED':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[11px] font-medium">
            <Zap className="h-3.5 w-3.5 text-slate-500" />
            <span>Unverified</span>
          </div>
        );
    }
  };

  const approvedCount = merchants.filter((m) => m.status === 'APPROVED').length;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-indigo-800/60 rounded-2xl p-5 shadow-lg shadow-indigo-950/20 backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">
                Multi-Merchant Student Perks Hub
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-300 border border-indigo-700 font-mono">
                WebMCP Automated
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Claim exclusive student discounts with one click. In-browser AI agent verifies student identity with zero PII leakage.
            </p>
          </div>
        </div>

        {/* Verification Summary Counter */}
        <div className="flex items-center gap-3 bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800/80 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Unlocked Perks
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {approvedCount} of {merchants.length} Claimed
            </span>
          </div>
          <div className="h-7 w-px bg-slate-800" />
          <button
            type="button"
            onClick={() => store.reset()}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition flex items-center gap-1 cursor-pointer p-1"
            title="Reset all merchant statuses back to unverified"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/50 border border-slate-800 p-2.5 rounded-xl">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search perks or brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Perk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMerchants.map((merchant) => {
          const isApproved = merchant.status === 'APPROVED';
          const isVerifying = merchant.status === 'VERIFYING';
          const isError = merchant.status === 'ERROR' || merchant.status === 'ACTION_NEEDED';

          return (
            <div
              key={merchant.id}
              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-lg ${
                isApproved
                  ? 'bg-gradient-to-b from-emerald-950/30 via-slate-900/90 to-slate-950 border-emerald-800/80 ring-1 ring-emerald-500/20'
                  : isVerifying
                  ? 'bg-gradient-to-b from-cyan-950/30 via-slate-900/90 to-slate-950 border-cyan-800/80 ring-1 ring-cyan-500/20 animate-in'
                  : isError
                  ? 'bg-gradient-to-b from-rose-950/30 via-slate-900/90 to-slate-950 border-rose-800/80 ring-1 ring-rose-500/20'
                  : 'bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner shrink-0">
                      {renderBrandIcon(merchant.logoIcon)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 leading-tight">
                        {merchant.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {merchant.brand}
                      </span>
                    </div>
                  </div>

                  {getStatusBadge(merchant.status)}
                </div>

                {/* Tagline */}
                <p className="text-xs text-slate-300 leading-snug">
                  {merchant.tagline}
                </p>

                {/* Pricing & Discount Highlights */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 line-through font-mono">
                        {merchant.regularPrice}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold uppercase">
                        {merchant.discountValue}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {merchant.studentPrice}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {merchant.category}
                  </span>
                </div>

                {/* Perks Bullet List */}
                <div className="flex flex-col gap-1.5 text-xs text-slate-300 pt-1">
                  {merchant.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{perk}</span>
                    </div>
                  ))}
                </div>

                {/* Category Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {merchant.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800/80 flex items-center gap-1"
                    >
                      <Tag className="h-2.5 w-2.5 text-slate-500" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer / Action Section */}
              <div className="p-4 bg-slate-950/90 border-t border-slate-800/80 flex flex-col gap-2">
                {/* 1. Approved State */}
                {isApproved && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-300 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Discount Applied</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Ready to Redeem
                      </span>
                    </div>

                    {/* Unlocked Reward Code Box */}
                    <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-700/80 p-2 rounded-xl">
                      <div className="flex-1 font-mono text-xs font-bold text-emerald-300 px-1 truncate">
                        {merchant.rewardCode || 'EDU-VERIFIED-CODE'}
                      </div>
                      <button
                        type="button"
                        aria-label="Copy Code"
                        onClick={() => handleCopyCode(merchant)}
                        className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
                        title="Copy promo code"
                      >
                        {copiedCodeId === merchant.id ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Verifying State */}
                {isVerifying && (
                  <div className="flex flex-col gap-2 py-1">
                    <div className="flex items-center justify-between text-xs text-cyan-300">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Verifying with WebMCP...</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">Vault Handshake</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1.5 rounded-full animate-pulse w-3/4" />
                    </div>
                    <p className="text-[10px] text-slate-400 italic text-center">
                      Resolving zero-PII student handle from local sandbox...
                    </p>
                  </div>
                )}

                {/* 3. Error / Action Needed State */}
                {isError && (
                  <div className="flex flex-col gap-2.5">
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/80 text-[11px] text-rose-300 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <p className="leading-snug">
                        {merchant.errorMessage || 'Verification failed. Please review your vault document.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRetry(merchant.id)}
                      className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-rose-600/20"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retry Verification</span>
                    </button>
                  </div>
                )}

                {/* 4. Unverified State */}
                {!isApproved && !isVerifying && !isError && (
                  <button
                    type="button"
                    onClick={() => handleClaim(merchant.id)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/20 group"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-cyan-200 group-hover:rotate-12 transition-transform" />
                    <span>Claim with WebMCP</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
