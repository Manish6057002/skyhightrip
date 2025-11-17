import Header from '@/components/Header/Header'
import { ApplicationLayout } from '../application-layout'
import { Metadata } from 'next'
import { Suspense } from 'react'
import ActivityCardSkeleton from '@/components/ActivityCardSkeleton'
import ActivityFiltersSkeleton from '@/components/ActivityFiltersSkeleton'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Activities',
  description: 'Search and book activities and experiences around the world',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ApplicationLayout header={<Header hasBorderBottom={false} />}>
      <Suspense fallback={
        <div className="pb-28">
          <div className="container">
            <div className="flex flex-col gap-8 lg:flex-row">
              <aside className="w-full shrink-0 lg:w-80">
                <div className="sticky top-24">
                  <ActivityFiltersSkeleton />
                </div>
              </aside>
              <div className="flex-1">
                <div className="space-y-6">
                  {[...Array(10)].map((_, index) => (
                    <ActivityCardSkeleton key={index} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      }>
        {children}
      </Suspense>
    </ApplicationLayout>
  )
}

