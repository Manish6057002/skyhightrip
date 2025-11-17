import { FC } from 'react'

interface ActivityCardSkeletonProps {
  className?: string
}

const ActivityCardSkeleton: FC<ActivityCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      <div className="relative z-10 flex min-h-[220px] flex-col md:min-h-[260px] md:flex-row">
        {/* IMAGE SKELETON */}
        <div className="relative h-full min-h-[220px] w-full shrink-0 overflow-hidden rounded-l-2xl bg-neutral-200 dark:bg-neutral-700 md:w-72 md:min-h-[260px]">
          <div className="h-full w-full animate-pulse bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* CONTENT SKELETON */}
        <div className="flex grow flex-col p-4 sm:p-6">
          <div className="flex-1 space-y-3">
            {/* Activity Name */}
            <div>
              <div className="h-7 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-2 h-5 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
            
            {/* Location */}
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />

            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>

            {/* Categories/Tags */}
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-6 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-6 w-18 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          </div>
        </div>

        {/* PRICE SECTION SKELETON */}
        <div className="flex shrink-0 flex-col items-end justify-between border-l border-neutral-200 p-4 sm:p-6 dark:border-neutral-700">
          <div className="w-full text-right">
            <div className="h-8 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-2 h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="mt-4 h-10 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700 sm:w-32" />
        </div>
      </div>
    </div>
  )
}

export default ActivityCardSkeleton

