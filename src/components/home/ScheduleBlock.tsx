import type { HomeData } from '../../types/home';

interface Props {
  scheduleInfo: HomeData['scheduleInfo'];
  baseUrl: string;
}

export function ScheduleBlock({ scheduleInfo, baseUrl }: Props) {
  const href = `${baseUrl.replace(/\/$/, '')}/schedule`;
  return (
    <section
      className="bg-white border border-warm-2 rounded-2xl p-5 mb-4"
      data-testid="home-schedule"
    >
      <h2 className="font-condensed font-bold text-navy text-lg mb-2">📅 本週賽程</h2>
      <p className="text-txt-dark mb-1">
        下次比賽：{scheduleInfo.date}
      </p>
      <p className="text-txt-mid text-sm mb-3">📍 {scheduleInfo.venue}</p>
      <a
        href={href}
        className="inline-block text-sm font-bold text-orange hover:underline"
      >
        看本週對戰 →
      </a>
    </section>
  );
}
