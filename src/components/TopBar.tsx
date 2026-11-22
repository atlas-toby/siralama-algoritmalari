import { Download } from 'lucide-react';
import { AppSection } from '../types/algorithm';

interface TopBarProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  onQuickDownloadReport: () => void;
}

const NAV_ITEMS: { id: AppSection; label: string }[] = [
  { id: 'simulation', label: 'Simülasyon' },
  { id: 'data', label: 'Veri Stüdyosu' },
  { id: 'analytics', label: 'Canlı Analitik' },
  { id: 'reports', label: 'Raporlar' },
];

export function TopBar({
  activeSection,
  onSelectSection,
  onQuickDownloadReport,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectSection('simulation')}
          className="m3-focus font-display text-lg font-bold tracking-tight text-[var(--md-sys-color-on-surface)] whitespace-nowrap shrink-0 cursor-pointer"
        >
          SıraLab
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Ana gezinme"
          className="flex items-center gap-1 overflow-x-auto sm:gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`m3-focus relative px-2.5 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[var(--md-sys-color-primary)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute right-2 left-2 -bottom-[13px] h-[2.5px] rounded-t-full bg-[var(--md-sys-color-primary)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action CTA */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onQuickDownloadReport}
            className="m3-focus inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-primary)] px-4 py-2 text-sm font-medium text-[var(--md-sys-color-on-primary)] transition-transform duration-150 hover:opacity-95 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Rapor İndir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
