import { FC } from 'react'

interface ActivityFiltersSkeletonProps {
  className?: string
}

const ActivityFiltersSkeleton: FC<ActivityFiltersSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>

      {/* Price Range Skeleton */}
      <div>
        <div className="mb-4 h-5 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-2 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="mt-2 flex items-center justify-between">
          <div className="h-3 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-3 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>

      {/* Rating Skeleton */}
      <div>
        <div className="mb-4 h-5 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="space-y-2">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded border border-neutral-200 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700" />
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
      </div>

      {/* Categories Skeleton */}
      <div>
        <div className="mb-4 h-5 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="space-y-2">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded border border-neutral-200 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700" />
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
      </div>

      {/* Duration Skeleton */}
      <div>
        <div className="mb-4 h-5 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="space-y-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded border border-neutral-200 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700" />
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ActivityFiltersSkeleton

