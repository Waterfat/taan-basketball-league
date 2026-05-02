interface Props {
  baseUrl: string;
  message?: string;
}

export function EmptyState({ baseUrl, message = '賽季尚未開始 ⛹️' }: Props) {
  const rosterHref = `${baseUrl.replace(/\/$/, '')}/roster`;
  return (
    <div className="px-4 py-12 max-w-md mx-auto text-center">
      <p className="text-lg text-txt-dark mb-6">{message}</p>
      <a
        href={rosterHref}
        className="inline-block px-6 py-2 bg-navy text-white rounded-lg font-bold hover:bg-navy-2 transition"
      >
        看球員名單
      </a>
    </div>
  );
}
