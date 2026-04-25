import { Skeleton } from '@/components/ui/skeleton'

/**
 * Per-section loading state. Closes part of R-004 / Fix-016.
 * Replaces blank screen during data fetches with a skeleton.
 */
export default function SectionLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64 w-full mt-2" />
    </div>
  )
}
