interface Props {
  onRetry: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message = '無法載入賽程' }: Props) {
  return (
    <div className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">
        ⚠️
      </div>
      <p className="text-lg text-txt-dark mb-2">{message}</p>
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
