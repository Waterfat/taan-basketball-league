import { useEffect, useState, useCallback } from 'react';
import type { HomeData } from '../../types/home';
import { fetchData } from '../../lib/api';
import { SkeletonState } from './SkeletonState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { HeroBanner } from './HeroBanner';
import { MatchupsBlock } from './MatchupsBlock';
import { MiniStandings } from './MiniStandings';
import { MiniLeaders } from './MiniLeaders';
import { MiniDragon } from './MiniDragon';

type Status = 'loading' | 'error' | 'empty' | 'ok';

interface Props {
  baseUrl: string;
}

export function HomeDashboard({ baseUrl }: Props) {
  const [data, setData] = useState<HomeData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      const result = await fetchData<HomeData>('home');
      if (cancelled) return;

      if (result.source === 'error' || !result.data) {
        setStatus('error');
        return;
      }

      const home = result.data;
      setData(home);

      const hasData =
        (home.standings?.length ?? 0) > 0 ||
        (home.dragonTop10?.length ?? 0) > 0;

      if (!hasData) {
        setStatus('empty');
        return;
      }

      setStatus('ok');
    })();

    return () => { cancelled = true; };
  }, [reloadKey]);

  const handleRetry = useCallback(() => setReloadKey((k) => k + 1), []);

  if (status === 'loading') return <SkeletonState />;
  if (status === 'error') return <ErrorState onRetry={handleRetry} />;
  if (status === 'empty' || !data) return <EmptyState />;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pb-8" data-testid="home-dashboard">
      <HeroBanner
        season={data.season}
        phase={data.phase}
        currentWeek={data.currentWeek}
      />

      <MatchupsBlock
        weekMatchups={data.weekMatchups}
        scheduleInfo={data.scheduleInfo}
        baseUrl={baseUrl}
      />

      <MiniLeaders miniStats={data.miniStats} baseUrl={baseUrl} />

      {/* 戰績榜 + 龍虎榜：mobile 垂直堆疊、desktop 並排兩欄 */}
      <div className="md:grid md:grid-cols-2 md:gap-4">
        <MiniStandings teams={data.standings} baseUrl={baseUrl} />
        <MiniDragon dragonTop10={data.dragonTop10} baseUrl={baseUrl} />
      </div>
    </div>
  );
}
