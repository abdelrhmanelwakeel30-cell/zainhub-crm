export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted" />
      </div>
      {/* KPI skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border bg-card" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-lg border bg-card" />
        <div className="h-64 rounded-lg border bg-card" />
      </div>
      <div className="h-80 rounded-lg border bg-card" />
    </div>
  )
}
