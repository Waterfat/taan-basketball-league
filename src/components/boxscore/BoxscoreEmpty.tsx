// src/components/boxscore/BoxscoreEmpty.tsx
export function BoxscoreEmpty() {
  return (
    <div data-testid="bs-empty" className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">📋</div>
      <p className="text-lg text-txt-dark">該週尚無 Box Score</p>
    </div>
  );
}
