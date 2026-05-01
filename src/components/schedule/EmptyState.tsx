interface Props {
  onPrevWeek?: () => void;
  prevDisabled?: boolean;
  message?: string;
}

export function EmptyState({
  onPrevWeek,
  prevDisabled = false,
  message = '本週無賽程，下週見',
}: Props) {
  return (
    <div className="px-4 py-12 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4" aria-hidden="true">
        ⛹️
      </div>
      <p className="text-lg text-txt-dark mb-6">{message}</p>
      {onPrevWeek && !prevDisabled && (
        <button
          onClick={onPrevWeek}
          disabled={prevDisabled}
          className="px-6 py-2 bg-navy text-white rounded-lg font-bold hover:bg-navy-2 transition disabled:opacity-40"
        >
          看上一週
        </button>
      )}
    </div>
  );
}
