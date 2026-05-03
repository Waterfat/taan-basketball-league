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

interface GroupTableProps {
  players: DragonPlayer[];
  threshold: number;
  /** 第一個 group 才顯示 thead（避免奴隸區與平民區重複表頭，但保留 dragon-table testid） */
  showAsDragonTable?: boolean;
}

/** 共用：依 players 陣列渲染 PC table + Mobile cards（兩種呈現方式） */
function DragonGroupTable({ players, threshold, showAsDragonTable }: GroupTableProps) {
  if (players.length === 0) {
    return (
      <>
        <div className="hidden md:block overflow-x-auto">
          <table
            data-testid={showAsDragonTable ? 'dragon-table' : undefined}
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
              <tr>
                <td colSpan={COL_SPAN} className="px-3 py-3 text-center text-xs text-txt-mid">
                  此區尚無球員
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="md:hidden text-center text-xs text-txt-mid py-3">
          此區尚無球員
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table
          data-testid={showAsDragonTable ? 'dragon-table' : undefined}
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
            {players.map((player) => (
              <DragonTableRow key={player.rank} player={player} threshold={threshold} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-2">
        {players.map((player) => (
          <DragonCard key={player.rank} player={player} threshold={threshold} />
        ))}
      </div>
    </>
  );
}

interface Props {
  data: DragonData;
}

/**
 * 龍虎榜 tab：以 civilianThreshold 切分平民/奴隸區。
 *
 * 分組規則：
 *   - 平民（civilian）：total >= civilianThreshold（含邊界）
 *   - 奴隸（slave）：total < civilianThreshold
 *
 * Group titles 顯示「前 N 名 / 第 N+1 名起」中 N 為 civilianThreshold（不是 civilianCount），
 * 對齊 E-801/E-802 expectations（threshold=10 → 前 10 名 / 第 11 名起）。
 *
 * 既有 `civilian-divider` testid 保留（向後相容 AC-8 dragon-tab.spec），
 * 改放在兩個 group section 之間，PC 與 Mobile 皆可見。
 */
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

  const { players, civilianThreshold, rulesLink } = data;
  const civilians = players.filter((p) => p.total >= civilianThreshold);
  const slaves = players.filter((p) => p.total < civilianThreshold);
  // 是否需要顯示「平民線」分隔線（向後相容 AC-8）：兩區皆有球員時才顯示
  const showDivider = civilians.length > 0 && slaves.length > 0;

  return (
    <div data-testid="dragon-tab-panel" className="px-4 md:px-8 py-4 max-w-6xl mx-auto">
      {/* ────────── 平民區 ────────── */}
      <section
        data-testid="dragon-group-civilian"
        data-group="civilian"
        className="mb-6"
      >
        <h3
          data-testid="dragon-group-civilian-title"
          className="font-condensed text-base font-bold text-txt-dark mb-3"
        >
          🧑 平民區（前 {civilianThreshold} 名 · 可優先自由選擇加入隊伍）
        </h3>
        <DragonGroupTable
          players={civilians}
          threshold={civilianThreshold}
          showAsDragonTable
        />
      </section>

      {/* 平民線分隔（向後相容 AC-8） */}
      {showDivider && (
        <div
          data-testid="civilian-divider"
          className="text-center text-xs text-txt-mid py-2 my-2 border-y border-dashed border-warm-2"
        >
          ── 平民線（{civilianThreshold} 分）──
        </div>
      )}

      {/* ────────── 奴隸區 ────────── */}
      <section
        data-testid="dragon-group-slave"
        data-group="slave"
        className="mb-4"
      >
        <h3
          data-testid="dragon-group-slave-title"
          className="font-condensed text-base font-bold text-txt-dark mb-3"
        >
          ⛓️ 奴隸區（第 {civilianThreshold + 1} 名起 · 為聯盟貢獻過低淪為奴隸，無法自由選擇進入哪一隊）
        </h3>
        <DragonGroupTable players={slaves} threshold={civilianThreshold} />
      </section>

      {/* ────────── 規則連結（C3） ────────── */}
      {rulesLink && (
        <div className="px-4 md:px-8 py-4 text-center">
          <a
            data-testid="dragon-rules-link"
            href={rulesLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-orange hover:underline"
          >
            📋 查看完整選秀規則公告 →
          </a>
        </div>
      )}
    </div>
  );
}
