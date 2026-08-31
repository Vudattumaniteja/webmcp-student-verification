import { GraduationCap, CheckCircle2, AlertCircle, User } from 'lucide-react';

export interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  hasWebMCP?: boolean;
  activePersona?: {
    name: string;
    university: string;
    avatarInitials?: string;
  };
}

interface NavItem {
  id: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'directory', label: 'Perks Directory' },
  { id: 'vault', label: 'Student Vault' },
  { id: 'agent', label: 'AI Agent Workspace' },
];

export default function Header({
  activeTab,
  onSelectTab,
  hasWebMCP,
  activePersona = {
    name: 'Alex Chen',
    university: 'Stanford University',
    avatarInitials: 'AC',
  },
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/90 bg-[#FAF9F6]/90 backdrop-blur-md transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => onSelectTab('directory')}
          className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
        >
          <div className="h-9 w-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                data-testid="blue-dot-indicator"
                className="w-2 h-2 rounded-full bg-[#2563EB] inline-block"
              />
              <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-stone-900 leading-tight">
                WebMCP <span className="text-[#2563EB] font-serif italic">Student Perks</span>
              </span>
            </div>
            <span className="text-[10px] font-mono text-stone-500 tracking-wide uppercase">
              Zero-PII Verification Protocol
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeTab === item.id ||
              (activeTab === 'perks' && item.id === 'directory') ||
              (activeTab === 'directory' && item.id === 'directory');

            return (
              <button
                key={item.id}
                type="button"
                data-active={isActive ? 'true' : 'false'}
                onClick={() => onSelectTab(item.id)}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium tracking-tight rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#2563EB] text-white font-semibold shadow-sm shadow-blue-500/25'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Active Student Persona & WebMCP Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Active Student Persona Badge */}
          {activePersona && (
            <button
              type="button"
              onClick={() => onSelectTab('vault')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs text-stone-800 shadow-xs transition-all cursor-pointer group"
              title="Current Active Student Persona (Click to open Student Vault)"
            >
              <div className="h-5 w-5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center text-[10px] font-bold">
                {activePersona.avatarInitials || <User className="h-3 w-3" />}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-stone-900 leading-tight">
                  {activePersona.name}
                </span>
                <span className="text-[10px] text-stone-500 truncate max-w-[130px]">
                  {activePersona.university}
                </span>
              </div>
            </button>
          )}

          {/* WebMCP Status Badge */}
          {hasWebMCP !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-mono bg-white shadow-xs">
              {hasWebMCP ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-stone-800 hidden sm:inline">WebMCP Active</span>
                  <span className="font-semibold text-stone-800 sm:hidden">Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-semibold text-stone-600 hidden sm:inline">WebMCP Offline</span>
                  <span className="font-semibold text-stone-600 sm:hidden">Offline</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

