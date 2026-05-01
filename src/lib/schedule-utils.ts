import type {
  Game,
  GameWeek,
  ScheduleData,
  ScheduleWeek,
  SuspendedWeek,
  Winner,
} from '../types/schedule';

export function getCurrentWeek(data: ScheduleData): GameWeek | null {
  const found = data.allWeeks.find(
    (w): w is GameWeek => w.type === 'game' && w.week === data.currentWeek,
  );
  return found ?? null;
}

export function findPreviousWeekWithData(
  data: ScheduleData,
  fromWeek: number,
): GameWeek | null {
  for (let i = data.allWeeks.length - 1; i >= 0; i--) {
    const w = data.allWeeks[i];
    if (w.type === 'game' && w.week < fromWeek) return w;
  }
  return null;
}

export function getWinner(game: Game): Winner {
  if (game.homeScore == null || game.awayScore == null) return 'none';
  if (game.homeScore > game.awayScore) return 'home';
  if (game.awayScore > game.homeScore) return 'away';
  return 'tie';
}

export function isSuspended(week: ScheduleWeek): week is SuspendedWeek {
  return week.type === 'suspended';
}

export function hasStaff(staff: Record<string, string[]>): boolean {
  return Object.values(staff).some((arr) => arr.length > 0);
}
