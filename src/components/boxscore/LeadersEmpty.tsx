// src/components/boxscore/LeadersEmpty.tsx
interface Props {
  message?: string;
}
export function LeadersEmpty({ message = '賽季初尚無球員數據' }: Props) {
  return (
    <div data-testid="leaders-empty" className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">🏀</div>
      <p className="text-lg text-txt-dark">{message}</p>
    </div>
  );
}
