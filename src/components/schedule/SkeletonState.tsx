export function SkeletonState() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto animate-pulse">
      <div className="text-center mb-6">
        <div className="h-10 w-40 bg-gray-200 rounded mx-auto mb-3" />
        <div className="h-5 w-32 bg-gray-200 rounded mx-auto" />
      </div>

      <div className="flex gap-2 overflow-x-auto mb-6 pb-2 px-4 md:px-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            data-testid="skeleton-chip"
            className="h-9 w-12 md:w-20 bg-gray-200 rounded-lg flex-shrink-0"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 md:px-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            data-testid="skeleton-card"
            className="h-32 bg-gray-200 rounded-2xl"
          />
        ))}
      </div>
    </div>
  );
}
