// src/components/boxscore/LeadersSkeleton.tsx
export function LeadersSkeleton() {
  return (
    <div
      data-testid="leaders-skeleton"
      className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-2xl p-4 space-y-2">
          <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
          {Array.from({ length: 10 }).map((__, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}
