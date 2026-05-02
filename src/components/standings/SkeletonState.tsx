export function SkeletonState() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto animate-pulse">
      {/* Hero skeleton */}
      <div data-testid="skeleton-hero" className="text-center mb-6">
        <div className="h-10 w-40 bg-gray-200 rounded mx-auto mb-3" />
        <div className="h-5 w-32 bg-gray-200 rounded mx-auto" />
      </div>

      {/* 6 列灰塊 — mobile 每張卡 / desktop 每列 */}
      <div className="space-y-3 md:space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            data-testid="skeleton-row"
            className="h-16 md:h-12 bg-gray-200 rounded-2xl md:rounded"
          />
        ))}
      </div>
    </div>
  );
}
