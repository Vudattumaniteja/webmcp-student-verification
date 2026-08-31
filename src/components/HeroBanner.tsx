import { ArrowRight, ShieldCheck, Zap, Lock, Sparkles } from 'lucide-react';

export interface HeroBannerProps {
  offerCount?: number;
  universityCount?: string;
  onOpenVault?: () => void;
  onRegistrarMatch?: () => void;
}

export default function HeroBanner({
  offerCount = 8,
  universityCount = 'Stanford, Harvard, Berkeley, MIT',
  onOpenVault,
  onRegistrarMatch,
}: HeroBannerProps) {
  return (
    <section className="relative w-full max-w-7xl mx-auto pt-4 pb-6 overflow-hidden">
      {/* Editorial Headline & Subtitle */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>In-Browser WebMCP Student Verification</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-stone-900 leading-[1.12] mb-4">
          Every Student Perk,{' '}
          <span className="text-[#2563EB] font-serif italic">Instantly Verified.</span>
        </h1>

        <p className="text-base sm:text-lg text-stone-600 font-sans leading-relaxed max-w-2xl">
          Browse and claim educational discounts across AI tools, streaming, and cloud services. Your academic identity stays securely sandboxed in your browser.
        </p>
      </div>

      {/* Modern Editorial Stats & Verification Badges Grid */}
      <div className="w-full bg-white border border-stone-200 rounded-2xl shadow-sm p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Verified Student Offers */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              {offerCount}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB] border border-blue-100">
              Live
            </span>
          </div>
          <div className="text-xs font-medium text-stone-700 mt-1.5">
            Student Offers Available
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Spotify, OpenAI, AWS, Notion, GitHub & more
          </p>
        </div>

        {/* Metric 2: University Presets */}
        <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-stone-100 sm:pl-5">
          <div className="flex items-center gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              4
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
              Accredited
            </span>
          </div>
          <div className="text-xs font-medium text-stone-700 mt-1.5">
            University Presets ({universityCount})
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Pre-loaded with test scenarios &amp; documents
          </p>
        </div>

        {/* Metric 3: Zero-PII Security */}
        <div className="flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-stone-100 lg:pl-5">
          <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span>Zero-PII Claim-Check Architecture</span>
          </div>
          <p className="text-xs text-stone-600 mt-1.5 leading-snug">
            Raw files never leak to third-party LLMs. Compact opaque handles keep data sandboxed.
          </p>
        </div>

        {/* Metric 4: Instant Registrar Match CTA */}
        <div className="flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-stone-100 lg:pl-5">
          <button
            type="button"
            onClick={onRegistrarMatch}
            className="text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm group-hover:text-[#2563EB] transition-colors">
              <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Zap className="h-4 w-4" />
              </div>
              <span>Instant Registrar Match Enabled</span>
            </div>
            <p className="text-xs text-stone-600 mt-1.5 group-hover:text-stone-900 transition-colors leading-snug">
              Direct verification for partner domains (@mit.edu) without document uploads.
            </p>
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Client Sandbox • IndexedDB Protected</span>
        </div>

        <div className="flex items-center gap-3">
          {onOpenVault && (
            <button
              type="button"
              onClick={onOpenVault}
              className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm hover:shadow-md font-medium text-xs sm:text-sm tracking-wide flex items-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <span>Open Student Vault</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

