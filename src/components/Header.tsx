import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface HeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  hasWebMCP?: boolean;
}

interface NavItem {
  id: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'directory', label: '/directory' },
  { id: 'vault', label: '/vault' },
  { id: 'agent', label: '/agent' },
  { id: 'faq', label: '/faq' },
  { id: 'for-agents', label: '/for-agents' },
];

export default function Header({
  activeTab,
  onSelectTab,
  hasWebMCP,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-black bg-[#F9F8F3]/95 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => onSelectTab('directory')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <span
            data-testid="blue-dot-indicator"
            className="w-2.5 h-2.5 rounded-full bg-[#0066FF] shadow-sm transition-transform group-hover:scale-125 inline-block"
          />
          <span className="font-mono text-sm sm:text-base font-bold tracking-wider text-black">
            <span>WEBMCP.COM</span>
            <span className="sr-only">WEBMCP.STUDENT</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar">
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
                className={`px-2.5 py-1 text-xs sm:text-sm font-mono tracking-tight transition-all rounded cursor-pointer ${
                  isActive
                    ? 'text-[#0066FF] font-semibold underline underline-offset-4 decoration-2 decoration-[#0066FF]'
                    : 'text-neutral-600 hover:text-black hover:bg-black/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* WebMCP Status Badge */}
        {hasWebMCP !== undefined && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-black text-[11px] font-mono bg-white shadow-[2px_2px_0px_0px_#000000]">
            {hasWebMCP ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium text-black">WebMCP Active</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium text-neutral-700">WebMCP Offline</span>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
