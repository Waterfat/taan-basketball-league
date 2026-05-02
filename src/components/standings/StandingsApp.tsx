import { useEffect, useState, useCallback } from 'react';
import type { StandingsData } from '../../types/standings';
import { fetchData } from '../../lib/api';
import { sortStandings } from '../../lib/standings-utils';
import { SkeletonState } from './SkeletonState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { StandingsHero } from './StandingsHero';
import { StandingsCard, StandingsTableRow } from './StandingsRow';

type Status = 'loading' | 'error' | 'empty' | 'ok';

interface Props {
  baseUrl: string;
}

export function StandingsApp({ baseUrl }: Props) {
  const [data, setData] = useState<StandingsData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      const result = await fetchData<StandingsData>('standings');
      if (cancelled) return;

      if (result.source === 'error' || !result.data) {
        setStatus('error');
        return;
      }

      const standings = result.data;
      setData(standings);

      if (!standings.teams || standings.teams.length === 0) {
        setStatus('empty');
        return;
      }

      setStatus('ok');
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRetry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  if (status === 'loading') return <SkeletonState />;
  if (status === 'error') return <ErrorState onRetry={handleRetry} />;
  if (status === 'empty' || !data) return <EmptyState baseUrl={baseUrl} />;

  const teams = sortStandings(data.teams);

  return (
    <div className="max-w-6xl mx-auto pb-8" data-testid="standings-container">
      <StandingsHero season={data.season} phase={data.phase} currentWeek={data.currentWeek} />

      {/* Mobile：每隊一張卡片堆疊 */}
      <section className="md:hidden px-4 space-y-3">
        {teams.map((team) => (
          <StandingsCard key={team.team} team={team} baseUrl={baseUrl} />
        ))}
      </section>

      {/* Desktop：橫排 table */}
      <section className="hidden md:block px-8 mt-4">
        <table className="w-full border-collapse bg-white rounded-2xl overflow-hidden">
          <thead className="bg-warm-1 text-left text-sm text-txt-mid">
            <tr>
              <th className="px-4 py-2 font-bold">#</th>
              <th className="px-4 py-2 font-bold">隊伍</th>
              <th className="px-4 py-2 font-bold">勝</th>
              <th className="px-4 py-2 font-bold">敗</th>
              <th className="px-4 py-2 font-bold">勝率</th>
              <th className="px-4 py-2 font-bold">最近 6 場</th>
              <th className="px-4 py-2 font-bold">連勝紀錄</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <StandingsTableRow key={team.team} team={team} baseUrl={baseUrl} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
