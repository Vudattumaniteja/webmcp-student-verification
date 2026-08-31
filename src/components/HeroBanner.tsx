import { ArrowRight, Plus, HelpCircle } from 'lucide-react';

export interface HeroBannerProps {
  offerCount?: number;
  universityCount?: string;
  onOpenVault?: () => void;
  onRegistrarMatch?: () => void;
}

export default function HeroBanner({
  offerCount = 12,
  universityCount = '4,200+',
  onOpenVault,
  onRegistrarMatch,
}: HeroBannerProps) {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-8 overflow-hidden">
      {/* Decorative Blueprint / Tower Line Illustration in Background */}
      <div className="absolute right-0 top-0 w-96 h-96 opacity-25 pointer-events-none select-none hidden md:block">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full text-blue-400 stroke-current"
          fill="none"
          strokeWidth="0.75"
        >
          <circle cx="100" cy="100" r="80" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="55" />
          <circle cx="100" cy="100" r="30" />
          <line x1="100" y1="10" x2="100" y2="190" strokeDasharray="2 2" />
          <line x1="10" y1="100" x2="190" y2="100" strokeDasharray="2 2" />
          <polygon points="100,20 120,70 100,65 80,70" />
          <line x1="100" y1="20" x2="100" y2="0" />
        </svg>
      </div>

      {/* Main Hero Header */}
      <div className="max-w-3xl mb-8">
        <h1 className="font-serif-editorial text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-neutral-900 leading-[1.1] mb-4">
          The <span className="text-[#0066FF] italic">Student Perks</span>
          <br />
          Directory.
        </h1>
        <p className="text-base sm:text-lg text-neutral-700 font-sans max-w-xl">
          Browse verified student discounts agents and students can claim.
        </p>
      </div>

      {/* Brutalist Stats & Quick Actions Bar */}
      <div className="w-full bg-white border border-black shadow-[4px_4px_0px_0px_#000000] grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-black">
        {/* Metric 1: Verified Offers */}
        <div className="md:col-span-2 p-4 sm:p-5 flex flex-col justify-center">
          <div className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
            {offerCount}
          </div>
          <div className="font-mono text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-wider mt-1">
            VERIFIED OFFERS
          </div>
        </div>

        {/* Metric 2: Accredited Universities */}
        <div className="md:col-span-3 p-4 sm:p-5 flex flex-col justify-center">
          <div className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
            {universityCount}
          </div>
          <div className="font-mono text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-wider mt-1">
            ACCREDITED UNIVERSITIES
          </div>
        </div>

        {/* Metric 3: Tool Mix Breakdown */}
        <div className="md:col-span-4 p-4 sm:p-5 flex flex-col justify-center">
          <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-600 uppercase tracking-wider mb-2">
            <span>TOOL MIX</span>
            <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
          </div>

          {/* Segmented Bar */}
          <div className="h-3.5 w-full bg-neutral-200 border border-black flex overflow-hidden">
            <div className="bg-[#22c55e] h-full" style={{ width: '46%' }} title="Answer 46%" />
            <div className="bg-[#f97316] h-full" style={{ width: '49%' }} title="Action 49%" />
            <div className="bg-[#dc2626] h-full" style={{ width: '5%' }} title="Sensitive Action 5%" />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] font-mono text-neutral-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-[#22c55e] inline-block" />
              Answer 46%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-[#f97316] inline-block" />
              Action 49%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-[#dc2626] inline-block" />
              Sensitive Action 5%
            </span>
          </div>
        </div>

        {/* Metric 4 / CTA 1: Instant Registrar Match */}
        <button
          type="button"
          onClick={onRegistrarMatch}
          className="md:col-span-3 p-4 sm:p-5 bg-white hover:bg-neutral-50 transition-colors flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full border border-black flex items-center justify-center text-xs font-mono text-black group-hover:bg-neutral-100">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest">
                VERIFICATION BRIDGE
              </div>
              <div className="font-mono text-xs font-bold text-neutral-900 group-hover:text-[#0066FF] transition-colors">
                Instant Registrar Match -&gt;
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Additional Primary Blue CTA Action */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onOpenVault}
          className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white border border-black shadow-[3px_3px_0px_0px_#000000] font-mono text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-2 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
        >
          <span>Open Student Vault</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
