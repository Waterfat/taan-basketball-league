export function SkeletonState() {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto animate-pulse" data-testid="home-skeleton">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="h-10 w-48 bg-gray-200 rounded mx-auto mb-2" />
        <div className="h-5 w-32 bg-gray-200 rounded mx-auto" />
      </div>
      {/* 4 區塊 */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-2xl mb-4" />
      ))}
    </div>
  );
}
