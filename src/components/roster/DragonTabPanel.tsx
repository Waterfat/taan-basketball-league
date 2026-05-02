import { Fragment } from 'react';
import type { DragonData, DragonPlayer } from '../../types/roster';
import { isAboveThreshold, formatPlayoff } from '../../lib/roster-utils';
import { TEAM_CONFIG } from '../../config/teams';

function JudgeIcon() {
  return (
    <span data-testid="judge-icon" aria-label="裁判資格" title="裁判資格">
      ⚖️
    </span>
  );
}

interface RowProps {
  player: DragonPlayer;
  threshold: number;
}

function DragonTableRow({ player, threshold }: RowProps) {
  const above = isAboveThreshold(player.total, threshold);
  const teamConfig = TEAM_CONFIG[player.team] ?? null;

  return (
    <tr
      data-testid="dragon-player-row"
      data-above-threshold={above ? 'true' : undefined}
      className={above ? 'bg-yellow-50' : ''}
    >
      <td data-testid="dragon-rank" className="px-3 py-2 font-condensed">{player.rank}</td>
      <td data-testid="dragon-name" className="px-3 py-2 font-medium">
        {player.name}
        {player.tag === '裁' && <JudgeIcon />}
      </td>
      <td className="px-3 py-2">
        <span style={{ color: teamConfig?.color ?? '#999' }}>{player.team}</span>
      </td>
      <td className="px-3 py-2">{player.att}</td>
      <td className="px-3 py-2">{player.duty}</td>
      <td className="px-3 py-2">{player.mop}</td>
      <td data-testid="dragon-playoff" className="px-3 py-2">{formatPlayoff(player.playoff)}</td>
      <td className="px-3 py-2 font-bold text-orange">{player.total}</td>
      <td className="px-3 py-2 sr-only">{player.tag === '裁' ? '裁判' : ''}</td>
    </tr>
  );
}

function CivilianDividerRow({ threshold, colSpan }: { threshold: number; colSpan: number }) {
  return (
    <tr data-testid="civilian-divider">
      <td colSpan={colSpan} className="px-3 py-1 text-center text-xs text-txt-mid border-y border-dashed border-warm-2">
        ── 平民線（{threshold} 分）──
      </td>
    </tr>
  );
}

function DragonCard({ player, threshold }: RowProps) {
  const above = isAboveThreshold(player.total, threshold);
  const teamConfig = TEAM_CONFIG[player.team] ?? null;

  return (
    <div
      data-testid="dragon-player-card"
      data-above-threshold={above ? 'true' : undefined}
      className={[
        'rounded-lg border p-3',
        above ? 'border-yellow-300 bg-yellow-50' : 'border-warm-2 bg-white',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-condensed text-lg text-txt-mid">{player.rank}</span>
          <span data-testid="dragon-name" className="font-bold">{player.name}</span>
          {player.tag === '裁' && <JudgeIcon />}
          <span style={{ color: teamConfig?.color ?? '#999' }} className="text-sm">{player.team}</span>
        </div>
        <span className="font-display text-2xl text-orange">{player.total}</span>
      </div>
      <div className="grid grid-cols-4 gap-1 text-xs text-txt-mid">
        <div><span className="block font-medium text-txt-dark">出席</span>{player.att}</div>
        <div><span className="block font-medium text-txt-dark">輪值</span>{player.duty}</div>
        <div><span className="block font-medium text-txt-dark">拖地</span>{player.mop}</div>
        <div>
          <span className="block font-medium text-txt-dark">季後賽</span>
          <span data-testid="dragon-playoff">{formatPlayoff(player.playoff)}</span>
        </div>
      </div>
    </div>
  );
}

const COL_SPAN = 9;

interface Props {
  data: DragonData;
}

export function DragonTabPanel({ data }: Props) {
  if (!data.players || data.players.length === 0) {
    return (
      <div data-testid="dragon-tab-panel" className="px-4 md:px-8 py-4 max-w-6xl mx-auto">
        <div data-testid="dragon-empty" className="py-12 text-center text-txt-mid">
          龍虎榜資料尚未產生
        </div>
      </div>
    );
  }

  const { players, civilianThreshold } = data;
  const dividerIdx = players.findIndex((p) => !isAboveThreshold(p.total, civilianThreshold));

  return (
    <div data-testid="dragon-tab-panel" className="px-4 md:px-8 py-4 max-w-6xl mx-auto">
      <div className="hidden md:block overflow-x-auto">
        <table
          data-testid="dragon-table"
          className="w-full text-sm bg-white rounded-2xl border-collapse overflow-hidden"
        >
          <thead className="bg-warm-1 text-txt-mid text-left">
            <tr>
              {['#', '球員', '隊', '出席', '輪值', '拖地', '季後賽', '總分', ''].map((h, i) => (
                <th key={i} className={`px-3 py-2 font-bold${h === '' ? ' sr-only' : ''}`}>{h || '裁判'}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => (
              <Fragment key={player.rank}>
                {idx === dividerIdx && dividerIdx > 0 && (
                  <CivilianDividerRow threshold={civilianThreshold} colSpan={COL_SPAN} />
                )}
                <DragonTableRow player={player} threshold={civilianThreshold} />
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-2">
        {players.map((player, idx) => (
          <Fragment key={player.rank}>
            {idx === dividerIdx && dividerIdx > 0 && (
              <div
                data-testid="civilian-divider"
                className="text-center text-xs text-txt-mid py-1 border-y border-dashed border-warm-2"
              >
                ── 平民線（{civilianThreshold} 分）──
              </div>
            )}
            <DragonCard player={player} threshold={civilianThreshold} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
