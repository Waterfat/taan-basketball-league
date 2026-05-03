// src/components/boxscore/LeadersPanel.tsx
import { useEffect, useState, useCallback } from 'react';
import type { LeaderData } from '../../types/leaders';
import { LEADER_CATEGORIES_ORDERED } from '../../types/leaders';
import { fetchData } from '../../lib/api';
import { getCurrentSeasonKey } from '../../lib/leaders-format';
import { LeadersSkeleton } from './LeadersSkeleton';
import { LeadersError } from './LeadersError';
import { LeadersEmpty } from './LeadersEmpty';
import { LeaderCard } from './LeaderCard';
import { TeamLeadersSection } from './TeamLeadersSection';

type Status = 'loading' | 'error' | 'empty' | 'ok';

export function LeadersPanel() {
  const [data, setData] = useState<LeaderData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      const result = await fetchData<LeaderData>('stats');
      if (cancelled) return;
      if (result.source === 'error' || !result.data) {
        setStatus('error');
        return;
      }
      const leaders = result.data;
      const seasonKey = getCurrentSeasonKey(leaders);
      if (!seasonKey) {
        setStatus('empty');
        return;
      }
      const season = leaders[seasonKey];
      const allEmpty = LEADER_CATEGORIES_ORDERED.every(
        (c) => (season[c]?.length ?? 0) === 0,
      );
      if (allEmpty) {
        setData(leaders);
        setStatus('empty');
        return;
      }
      setData(leaders);
      setStatus('ok');
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRetry = useCallback(() => setReloadKey((k) => k + 1), []);

  if (status === 'loading') return <LeadersSkeleton />;
  if (status === 'error') return <LeadersError onRetry={handleRetry} />;
  if (status === 'empty' || !data) return <LeadersEmpty />;

  const seasonKey = getCurrentSeasonKey(data);
  if (!seasonKey) return <LeadersEmpty />;
  const season = data[seasonKey];

  return (
    <>
      <div
        data-testid="leaders-panel"
        className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {LEADER_CATEGORIES_ORDERED.map((c) => (
          <LeaderCard key={c} category={c} entries={season[c] ?? []} />
        ))}
      </div>
      <TeamLeadersSection season={season} />
    </>
  );
}
