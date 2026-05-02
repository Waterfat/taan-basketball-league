import type { RosterTab } from '../../types/roster';

interface Props {
  activeTab: RosterTab;
  onSelect: (tab: RosterTab) => void;
}

const TABS: Array<{ id: RosterTab; label: string }> = [
  { id: 'roster', label: '球員名單' },
  { id: 'dragon', label: '積分龍虎榜' },
];

export function SubTabs({ activeTab, onSelect }: Props) {
  return (
    <div role="tablist" aria-label="球員分頁" className="flex gap-2 px-4 md:px-8 border-b border-warm-2">
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
