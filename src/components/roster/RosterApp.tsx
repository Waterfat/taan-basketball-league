import { useCallback, useEffect, useRef, useState } from 'react';
import type { RosterData, DragonData, RosterTab } from '../../types/roster';
import { fetchData } from '../../lib/api';
import { parseRosterQuery, resolveRosterTab } from '../../lib/roster-utils';
import { SkeletonState } from './SkeletonState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { RosterHero } from './RosterHero';
import { SubTabs } from './SubTabs';
import { RosterTabPanel } from './RosterTabPanel';
import { DragonTabPanel } from './DragonTabPanel';
import { AttendanceLegend } from './AttendanceLegend';
import { TeamFilterChips, type TeamFilterValue } from './TeamFilterChips';

type Status = 'loading' | 'error' | 'empty' | 'ok';

interface Props {
  baseUrl: string;
}

const EMPTY_DRAGON: DragonData = {
  season: 25,
  phase: '賽季進行中',
  civilianThreshold: 36,
  columns: [],
  players: [],
};

function readUrlState() {
  if (typeof window === 'undefined') {
    return { tab: null as RosterTab | null, team: null as string | null };
  }
  return parseRosterQuery(window.location.search);
}

export function RosterApp({ baseUrl }: Props) {
  const initial = readUrlState();
  const [activeTab, setActiveTab] = useState<RosterTab>(resolveRosterTab(initial.tab));
  const [highlightTeam, setHighlightTeam] = useState<string | null>(initial.team);
  // 隊伍切換 chip：純 client-side state，預設「全部」（不從 URL 讀，避免與 deep-link `?team=<id>` 衝突）
  const [selectedTeam, setSelectedTeam] = useState<TeamFilterValue>('all');
  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [dragonData, setDragonData] = useState<DragonData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  // deep link tab switch 只在首次載入完成後執行一次
  const deepLinkApplied = useRef(false);

  useEffect(() => {
    const handler = () => {
      const s = readUrlState();
      setActiveTab(resolveRosterTab(s.tab));
      setHighlightTeam(s.team);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    Promise.all([
      fetchData<RosterData>('roster'),
      fetchData<DragonData>('dragon'),
    ]).then(([rosterResult, dragonResult]) => {
      if (cancelled) return;

      if (rosterResult.source === 'error' || !rosterResult.data) {
        setStatus('error');
        return;
      }

      setRosterData(rosterResult.data);
      setDragonData(dragonResult.data);

      if (!rosterResult.data.teams || rosterResult.data.teams.length === 0) {
        setStatus('empty');
        return;
      }

      setStatus('ok');
    });

    return () => { cancelled = true; };
  }, [reloadKey]);

  useEffect(() => {
    if (highlightTeam && status === 'ok' && !deepLinkApplied.current) {
      deepLinkApplied.current = true;
      setActiveTab('roster');
    }
  }, [highlightTeam, status]);

  const handleRetry = useCallback(() => setReloadKey((k) => k + 1), []);

  const handleSelectTab = useCallback((tab: RosterTab) => {
    setActiveTab(tab);
    const base = baseUrl.replace(/\/$/, '');
    const url = `${base}/roster?tab=${tab}`;
    window.history.replaceState(null, '', url);
  }, [baseUrl]);

  const handleSelectTeamChip = useCallback((next: TeamFilterValue) => {
    setSelectedTeam(next);
  }, []);

  if (status === 'loading') return <SkeletonState />;
  if (status === 'error') return <ErrorState onRetry={handleRetry} />;
  if (status === 'empty' || !rosterData) return <EmptyState />;

  const dragon = dragonData ?? EMPTY_DRAGON;

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <RosterHero
        season={dragon.season}
        phase={dragon.phase}
        civilianThreshold={dragon.civilianThreshold}
        activeTab={activeTab}
      />
      <SubTabs activeTab={activeTab} onSelect={handleSelectTab} />
      {activeTab === 'roster' ? (
        <>
          <AttendanceLegend />
          <TeamFilterChips selected={selectedTeam} onSelect={handleSelectTeamChip} />
          <RosterTabPanel
            data={rosterData}
            highlightTeamId={highlightTeam}
            selectedTeam={selectedTeam}
          />
        </>
      ) : (
        <DragonTabPanel data={dragon} />
      )}
    </div>
  );
}
