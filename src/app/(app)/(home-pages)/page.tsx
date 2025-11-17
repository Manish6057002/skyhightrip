import HeroSectionWithSearchForm1 from '@/components/hero-sections/HeroSectionWithSearchForm1'
import { FlightSearchForm } from '@/components/HeroSearchForm/FlightSearchForm'
import { getFlightCategoryByHandle } from '@/data/categories'
import convertNumbThousand from '@/utils/convertNumbThousand'
import { AirplaneTakeOff01Icon, MapPinpoint02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Book Flights',
  description: 'Explore all flights around the world',
}

async function Page() {
  const category = await getFlightCategoryByHandle('all')

  if (!category) {
    return (
      <div className="pb-28">
        <div className="container">
          <div className="py-20 text-center">
            <p className="text-lg text-neutral-600 dark:text-neutral-400">Category not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-28">
      {/* Hero section */}
      <div className="container">
        <HeroSectionWithSearchForm1
          heading={category.name}
          image={category.coverImage}
          imageAlt={category.name}
          searchForm={
            <Suspense fallback={<div className="h-20 w-full" />}>
              <FlightSearchForm formStyle="default" />
            </Suspense>
          }
          description={
            <div className="flex items-center sm:text-lg">
              <HugeiconsIcon icon={MapPinpoint02Icon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">{category.region} </span>
              <span className="mx-5"></span>
              <HugeiconsIcon icon={AirplaneTakeOff01Icon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">{convertNumbThousand(category.count)} flights</span>
            </div>
          }
        />
      </div>
    </div>
  )
}

export default Page
