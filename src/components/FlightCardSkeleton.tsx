import { FC } from 'react'

interface FlightCardSkeletonProps {
  className?: string
}

const FlightCardSkeleton: FC<FlightCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`relative space-y-6 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      <div className="flex flex-col gap-y-6 sm:gap-y-0 md:flex-row md:items-center">
        {/* LOGO SKELETON */}
        <div className="w-24 shrink-0 lg:w-32">
          <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* FOR MOBILE RESPONSIVE */}
        <div className="block space-y-1 lg:hidden">
          <div className="flex font-semibold">
            <div className="h-6 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <span className="flex w-12 justify-center"></span>
            <div className="h-6 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="mt-0.5 h-4 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* TIME - NAME SKELETON */}
        <div className="hidden min-w-[150px] flex-4 lg:block">
          <div className="h-6 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mt-0.5 h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* ROUTE SKELETON */}
        <div className="hidden flex-4 whitespace-nowrap lg:block">
          <div className="h-6 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mt-0.5 h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* STOP SKELETON */}
        <div className="hidden flex-4 whitespace-nowrap lg:block">
          <div className="h-6 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mt-0.5 h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* PRICE SKELETON */}
        <div className="flex-4 whitespace-nowrap sm:text-right">
          <div className="ml-auto h-6 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="ml-auto mt-0.5 h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    </div>
  )
}

export default FlightCardSkeleton

