// src/components/boxscore/LeadersError.tsx
interface Props {
  onRetry: () => void;
}
export function LeadersError({ onRetry }: Props) {
  return (
    <div data-testid="leaders-error" className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
      <p className="text-lg text-txt-dark mb-2">無法載入領先榜</p>
      <p className="text-sm text-txt-mid mb-6">請檢查網路連線或稍後再試</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-orange text-white rounded-lg font-bold hover:bg-orange-2 transition"
      >
        重試
      </button>
    </div>
  );
}
