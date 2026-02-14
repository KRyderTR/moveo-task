function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow shadow-gray-300 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <Skeleton className="h-3 w-40" />

      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-10/12" />
        <Skeleton className="h-3 w-9/12" />
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-end justify-between mb-2 border-b-2 border-b-gray-100 pb-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Cards skeleton */}
      <div className="grid md:grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
