'use client'

import ActivityCard from '@/components/ActivityCard'
import ActivityCardSkeleton from '@/components/ActivityCardSkeleton'
import ActivityFilters from '@/components/ActivityFilters'
import ActivityFiltersSkeleton from '@/components/ActivityFiltersSkeleton'
import HeroSectionWithSearchForm1 from '@/components/hero-sections/HeroSectionWithSearchForm1'
import { ExperiencesSearchForm } from '@/components/HeroSearchForm/ExperiencesSearchForm'
import { HotAirBalloonFreeIcons, MapPinpoint02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Pagination, PaginationList, PaginationNext, PaginationPage, PaginationPrevious, PaginationGap } from '@/shared/Pagination'

const ACTIVITIES_PER_PAGE = 10

interface Activity {
  id: string
  name: string
  address?: string
  city?: string
  country?: string
  rating?: number
  reviewCount?: number
  price?: number
  currency?: string
  image?: string
  images?: string[]
  description?: string
  duration?: string
  category?: string
  categories?: string[]
  fullData?: any
}

const ActivitiesPageContent = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  // Track the last search data to avoid re-fetching on pagination
  const [lastSearchData, setLastSearchData] = useState<string | null>(null)

  useEffect(() => {
    const searchData = searchParams.get('data')

    if (!searchData) {
      setLoading(false)
      setError(null)
      setActivities([])
      setFilteredActivities([])
      // Redirect to experience search page if no search data
      router.replace('/experience')
      return
    }

    // Only fetch if search data has changed (not just page)
    if (searchData === lastSearchData) {
      return // Don't re-fetch if search parameters haven't changed
    }

    setLastSearchData(searchData)
    setLoading(true)
    setError(null)

    try {
      const parsedData = JSON.parse(decodeURIComponent(searchData))
      const { destinationCode, dateFrom, dateTo, paxes } = parsedData

      // Validate that destination code is provided
      if (!destinationCode) {
        setError('Destination code is required. Please select a destination from the suggestions.')
        setLoading(false)
        return
      }

      if (!dateFrom || !dateTo) {
        setError('Missing required parameters: dateFrom, dateTo')
        setLoading(false)
        return
      }

      // Search for activities using Hotelbeds API
      fetch('/api/hotelbeds/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationCode,
          dateFrom,
          dateTo,
          paxes: paxes || [{ type: 'AD' }],
        }),
      })
        .then(async (res) => {
          const data = await res.json()
          if (!res.ok) {
            throw new Error(data.error || `HTTP error! status: ${res.status}`)
          }
          return data
        })
        .then((data) => {
          if (data.error) {
            setError(data.error)
            setLoading(false)
            return
          }
          
          // Transform Hotelbeds activities data to our format
          // API route returns: { data: activities[], total: number, pagination: {...} }
          // Hotelbeds API returns: { activities: [...], pagination: {...}, ... }
          const activitiesArray = Array.isArray(data.data) ? data.data : (Array.isArray(data.activities) ? data.activities : [])
          
          if (activitiesArray.length === 0) {
            setError('No activities found in the response')
            setLoading(false)
            return
          }
          
          const transformedActivities: Activity[] = activitiesArray.map((activity: any, index: number) => {
            // Extract price from amountsFrom array (get adult price)
            // amountsFrom can be at root level or in modalities
            let price: number | undefined
            const amountsFrom = activity.amountsFrom || (activity.modalities?.[0]?.amountsFrom)
            if (amountsFrom && Array.isArray(amountsFrom) && amountsFrom.length > 0) {
              // Find adult price first, or use first available price
              const adultPrice = amountsFrom.find((amt: any) => amt.paxType === 'ADULT')
              const firstPrice = amountsFrom[0]
              const priceObj = adultPrice || firstPrice
              if (priceObj && priceObj.amount !== undefined) {
                price = parseFloat(priceObj.amount)
              }
            }

            // Extract currency
            const currency = activity.currency || activity.currencyName || 'EUR'

            // Extract images from content.media.images
            let image: string | undefined
            let images: string[] = []
            if (activity.content?.media?.images && Array.isArray(activity.content.media.images)) {
              // Each image has urls array with different sizes, get XLARGE or LARGE
              activity.content.media.images.forEach((img: any) => {
                if (img.urls && Array.isArray(img.urls)) {
                  // Prefer XLARGE, then LARGE, then LARGE2, then first available
                  const xlarge = img.urls.find((u: any) => u.sizeType === 'XLARGE')
                  const large = img.urls.find((u: any) => u.sizeType === 'LARGE')
                  const large2 = img.urls.find((u: any) => u.sizeType === 'LARGE2')
                  const url = xlarge?.resource || large?.resource || large2?.resource || img.urls[0]?.resource
                  if (url) {
                    images.push(url)
                  }
                }
              })
              image = images[0]
            }

            // Extract categories from modalities or segments
            const categories: string[] = []
            if (activity.modalities && Array.isArray(activity.modalities)) {
              activity.modalities.forEach((mod: any) => {
                if (mod.name) categories.push(mod.name)
              })
            }
            // Also check content for categories/segments
            if (activity.content && activity.content.segmentationGroups && Array.isArray(activity.content.segmentationGroups)) {
              activity.content.segmentationGroups.forEach((seg: any) => {
                if (seg.segmentValueName) categories.push(seg.segmentValueName)
              })
            }

            // Extract duration from modalities
            let duration = ''
            if (activity.modalities && Array.isArray(activity.modalities) && activity.modalities.length > 0) {
              const firstModality = activity.modalities[0]
              if (firstModality.duration) {
                const durValue = firstModality.duration.value || ''
                const durMetric = firstModality.duration.metric || ''
                if (durValue && durMetric) {
                  duration = `${durValue} ${durMetric.toLowerCase()}`
                }
              }
            }

            // Extract location information
            const country = activity.country?.name || ''
            const city = activity.country?.destinations?.[0]?.name || activity.country?.destinations?.[0]?.code || ''
            const address = activity.country?.destinations?.[0]?.name || ''

            // Extract description from content
            const description = activity.content?.description || activity.content?.summary || ''

            // Extract rating (may not be in response)
            const rating = activity.rating ? parseFloat(activity.rating) : undefined
            const reviewCount = activity.reviewCount || activity.reviewsCount || 0

            return {
              id: String(activity.activityCode || activity.code || activity.id || `activity-${index}`),
              name: activity.name || activity.content?.name || 'Activity',
              address: address,
              city: city,
              country: country,
              rating: rating,
              reviewCount: reviewCount,
              price: price,
              currency: currency,
              image: image,
              images: images,
              description: description,
              duration: duration,
              category: categories[0],
              categories: categories,
              fullData: activity, // Store full data for detail page
            }
          })

          setActivities(transformedActivities)
          setFilteredActivities(transformedActivities)
          
          // Store activities in sessionStorage for detail page access
          try {
            sessionStorage.setItem('activities', JSON.stringify(transformedActivities))
            // Also store search data for booking page to get destinationCode
            // Extract adults, children, infants from paxes array
            const paxes = parsedData?.paxes || []
            const adultsCount = paxes.filter((pax: any) => pax.type === 'AD' || pax.type === 'ADULT').length
            const childrenCount = paxes.filter((pax: any) => pax.type === 'CH' || pax.type === 'CHILD').length
            const infantsCount = paxes.filter((pax: any) => pax.type === 'INF' || pax.type === 'INFANT').length
            const adults = adultsCount > 0 ? adultsCount : 1
            const children = childrenCount
            const infants = infantsCount
            sessionStorage.setItem('lastActivitySearch', JSON.stringify({
              destinationCode: destinationCode,
              dateFrom: dateFrom,
              dateTo: dateTo,
              adults: adults,
              children: children,
              infants: infants,
            }))
          } catch (e) {
            console.error('Failed to store activities in sessionStorage:', e)
          }
          
          setLoading(false)
          
          // Reset to page 1 if we have activities and we're not on page 1
          if (transformedActivities.length > 0 && currentPage > 1) {
            const newParams = new URLSearchParams(searchParams.toString())
            newParams.set('page', '1')
            router.replace(`?${newParams.toString()}`, { scroll: false })
          }
        })
        .catch((err) => {
          console.error('Activity search error:', err)
          setError(err.message || 'Failed to search activities')
          setLoading(false)
        })
    } catch (err) {
      console.error('Parse error:', err)
      setError('Invalid search parameters')
      setLoading(false)
    }
  }, [searchParams, lastSearchData, currentPage, router])

  // Get search parameters for pre-filling form
  const getSearchParams = () => {
    const searchData = searchParams.get('data')
    if (!searchData) return null
    try {
      return JSON.parse(decodeURIComponent(searchData))
    } catch {
      return null
    }
  }

  const searchParamsData = getSearchParams()
  const destination = searchParamsData?.destination || searchParamsData?.destinationName || ''
  const destinationCode = searchParamsData?.destinationCode || ''
  const dateFrom = searchParamsData?.dateFrom || ''
  const dateTo = searchParamsData?.dateTo || ''

  return (
    <div className="pb-28">
      {/* Hero section */}
      <div className="container">
        <HeroSectionWithSearchForm1
          heading="Activity Search Results"
          image="https://images.unsplash.com/photo-1551882547-27421c4d62f4?w=1260&h=750&fit=crop&auto=format"
          imageAlt="Activity Search"
          searchForm={
            <ExperiencesSearchForm 
              formStyle="default"
              initialValues={{
                from: destination,
                fromCode: destinationCode,
                departureDate: dateFrom,
                returnDate: dateTo,
                adults: searchParamsData?.adults || 1,
                children: searchParamsData?.children || 0,
                infants: searchParamsData?.infants || 0,
              }}
            />
          }
          formClassName="!mt-[28rem]"
          description={
            <div className="flex items-center sm:text-lg">
              <HugeiconsIcon icon={MapPinpoint02Icon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">
                {destination || 'Search activities'}
              </span>
              <span className="mx-5"></span>
              <HugeiconsIcon icon={HotAirBalloonFreeIcons} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">{activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} found</span>
            </div>
          }
        />
      </div>

      {/* Content */}
      <div className="relative container mt-14 lg:mt-24">
        {loading && (
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left Sidebar - Filters Skeleton */}
            <aside className="w-full shrink-0 lg:w-80">
              <div className="sticky top-24">
                <ActivityFiltersSkeleton />
              </div>
            </aside>

            {/* Right Side - Activity Cards Skeleton */}
            <div className="flex-1">
              <div className="space-y-6">
                {[...Array(10)].map((_, index) => (
                  <ActivityCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">{error}</div>
              <button
                onClick={() => router.push('/experience')}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
              >
                Go back to search
              </button>
            </div>
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">No activities found. Try adjusting your search criteria.</div>
              <button
                onClick={() => router.push('/experience')}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
              >
                Start a new search
              </button>
            </div>
          </div>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left Sidebar - Filters */}
            <aside className="w-full shrink-0 lg:w-80">
              <div className="sticky top-24">
                <ActivityFilters activities={activities} onFilterChange={setFilteredActivities} />
              </div>
            </aside>

            {/* Right Side - Activity Cards */}
            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Showing {Math.min((currentPage - 1) * ACTIVITIES_PER_PAGE + 1, filteredActivities.length)} - {Math.min(currentPage * ACTIVITIES_PER_PAGE, filteredActivities.length)} of {filteredActivities.length} activit{filteredActivities.length !== 1 ? 'ies' : 'y'}
                  {filteredActivities.length !== activities.length && (
                    <span className="ml-2">(filtered from {activities.length} total)</span>
                  )}
                </div>
              </div>

              {filteredActivities.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-lg text-neutral-600 dark:text-neutral-400">
                    No activities match your filters. Try adjusting your search criteria.
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {filteredActivities
                      .slice((currentPage - 1) * ACTIVITIES_PER_PAGE, currentPage * ACTIVITIES_PER_PAGE)
                      .map((activity) => (
                        <ActivityCard 
                          key={activity.id} 
                          data={activity}
                          searchParams={{
                            dateFrom,
                            dateTo,
                            destinationCode: destinationCode,
                            adults: searchParamsData?.adults || 1,
                            children: searchParamsData?.children || 0,
                            infants: searchParamsData?.infants || 0,
                          }}
                        />
                      ))}
                  </div>
                  
                  {/* Pagination */}
                  {filteredActivities.length > ACTIVITIES_PER_PAGE && (
                    <div className="mt-16 flex justify-center">
                      <Pagination>
                        <PaginationPrevious 
                          href={currentPage > 1 ? `?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(currentPage - 1) }).toString()}` : null}
                        />
                        <PaginationList>
                          {(() => {
                            const totalPages = Math.ceil(filteredActivities.length / ACTIVITIES_PER_PAGE)
                            const pages: (number | 'gap')[] = []
                            
                            if (totalPages <= 7) {
                              for (let i = 1; i <= totalPages; i++) {
                                pages.push(i)
                              }
                            } else {
                              pages.push(1)
                              
                              if (currentPage > 3) {
                                pages.push('gap')
                              }
                              
                              const start = Math.max(2, currentPage - 1)
                              const end = Math.min(totalPages - 1, currentPage + 1)
                              
                              for (let i = start; i <= end; i++) {
                                pages.push(i)
                              }
                              
                              if (currentPage < totalPages - 2) {
                                pages.push('gap')
                              }
                              
                              pages.push(totalPages)
                            }
                            
                            return pages.map((page, index) => {
                              if (page === 'gap') {
                                return <PaginationGap key={`gap-${index}`} />
                              }
                              const pageUrl = `?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(page) }).toString()}`
                              return (
                                <PaginationPage
                                  key={page}
                                  href={pageUrl}
                                  current={page === currentPage}
                                >
                                  {page}
                                </PaginationPage>
                              )
                            })
                          })()}
                        </PaginationList>
                        <PaginationNext 
                          href={currentPage < Math.ceil(filteredActivities.length / ACTIVITIES_PER_PAGE) ? `?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(currentPage + 1) }).toString()}` : null}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={
      <div className="pb-28">
        <div className="container mt-14 lg:mt-24">
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
      <ActivitiesPageContent />
    </Suspense>
  )
}

