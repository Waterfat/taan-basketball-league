export function SkeletonState() {
  return (
    <div data-testid="roster-skeleton" className="px-4 md:px-8 py-6 max-w-6xl mx-auto animate-pulse">
      <div className="text-center mb-6">
        <div className="h-10 w-48 bg-gray-200 rounded mx-auto mb-3" />
        <div className="h-5 w-40 bg-gray-200 rounded mx-auto" />
      </div>
      <div className="flex gap-2 mb-4 border-b border-warm-2 px-2 pb-1">
        <div className="h-8 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-20 bg-gray-200 rounded" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
