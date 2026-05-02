// src/components/boxscore/SubTabs.tsx
import type { BoxscoreTab } from '../../lib/boxscore-deep-link';

interface Props {
  activeTab: BoxscoreTab;
  onSelect: (tab: BoxscoreTab) => void;
}

const TABS: Array<{ id: BoxscoreTab; label: string }> = [
  { id: 'leaders', label: '領先榜' },
  { id: 'boxscore', label: '逐場 Box' },
];

export function SubTabs({ activeTab, onSelect }: Props) {
  return (
    <div role="tablist" aria-label="數據分頁" className="flex gap-2 px-4 md:px-8 border-b border-warm-2">
      {TABS.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            data-testid="sub-tab"
            data-tab={t.id}
            data-active={isActive}
            onClick={() => onSelect(t.id)}
            className={[
              'px-4 py-3 font-condensed font-bold transition border-b-2',
              isActive
                ? 'text-orange border-orange'
                : 'text-txt-mid border-transparent hover:text-orange/80',
            ].join(' ')}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
