import { FC } from 'react'

interface FlightFiltersSkeletonProps {
  className?: string
}

const FlightFiltersSkeleton: FC<FlightFiltersSkeletonProps> = ({ className = '' }) => {
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

      {/* Stops Skeleton */}
      <div>
        <div className="mb-4 h-5 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="space-y-2">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded border border-neutral-200 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700" />
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
      </div>

      {/* Airlines Skeleton */}
      <div>
        <div className="mb-4 h-5 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="max-h-48 space-y-2 overflow-hidden">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded border border-neutral-200 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700" />
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
      </div>

      {/* Departure Time Skeleton */}
      <div>
        <div className="mb-4 h-5 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="px-2">
          <div className="h-2 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <div className="mt-4 flex justify-between gap-x-5">
          <div className="flex-1">
            <div className="ps-4 h-3 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-0.5 h-10 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="flex-1">
            <div className="ps-4 h-3 w-8 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-0.5 h-10 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      </div>

      {/* Return Time Skeleton */}
      <div>
        <div className="mb-4 h-5 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="px-2">
          <div className="h-2 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <div className="mt-4 flex justify-between gap-x-5">
          <div className="flex-1">
            <div className="ps-4 h-3 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-0.5 h-10 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="flex-1">
            <div className="ps-4 h-3 w-8 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-0.5 h-10 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      </div>

      {/* Sort By Skeleton */}
      <div>
        <div className="mb-4 h-5 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-10 w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  )
}

export default FlightFiltersSkeleton

