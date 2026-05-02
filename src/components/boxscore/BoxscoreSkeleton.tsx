// src/components/boxscore/BoxscoreSkeleton.tsx
export function BoxscoreSkeleton() {
  return (
    <div data-testid="bs-skeleton" className="px-4 md:px-8 py-6 animate-pulse">
      {/* chip timeline 骨架 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 w-12 md:w-20 bg-gray-200 rounded-lg flex-shrink-0" />
        ))}
      </div>
      {/* 球場卡片骨架（2 場示意，避免太長）*/}
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl p-4 space-y-3">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
