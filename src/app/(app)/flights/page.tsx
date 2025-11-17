'use client'

import FlightCard from '@/components/FlightCard'
import FlightCardSkeleton from '@/components/FlightCardSkeleton'
import FlightFilters from '@/components/FlightFilters'
import FlightFiltersSkeleton from '@/components/FlightFiltersSkeleton'
import HeroSectionWithSearchForm1 from '@/components/hero-sections/HeroSectionWithSearchForm1'
import { FlightSearchForm } from '@/components/HeroSearchForm/FlightSearchForm'
import { TFlightListing } from '@/data/listings'
import { transformAmadeusFlights } from '@/utils/transformAmadeusFlights'
import { transformDuffelFlights } from '@/utils/transformDuffelFlights'
import { AirplaneTakeOff01Icon, MapPinpoint02Icon, FilterVerticalIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Pagination, PaginationList, PaginationNext, PaginationPage, PaginationPrevious, PaginationGap } from '@/shared/Pagination'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import ButtonClose from '@/shared/ButtonClose'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonThird from '@/shared/ButtonThird'
import { Button } from '@/shared/Button'
import T from '@/utils/getT'

const FLIGHTS_PER_PAGE = 10

const FlightsPageContent = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [flights, setFlights] = useState<TFlightListing[]>([])
  const [filteredFlights, setFilteredFlights] = useState<TFlightListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  // Track the last search data to avoid re-fetching on pagination
  const [lastSearchData, setLastSearchData] = useState<string | null>(null)
  const [lastSearchType, setLastSearchType] = useState<string | null>(null)

  useEffect(() => {
    const searchType = searchParams.get('type')
    const searchData = searchParams.get('data')

    if (!searchData) {
      setLoading(false)
      setError('No search parameters provided')
      return
    }

    // Only fetch if search data or type has changed (not just page)
    // This prevents re-fetching when only the page parameter changes
    if (searchData === lastSearchData && searchType === lastSearchType) {
      return // Don't re-fetch if search parameters haven't changed
    }

    setLastSearchData(searchData)
    setLastSearchType(searchType)
    setLoading(true)
    setError(null)

    try {
      const parsedData = JSON.parse(decodeURIComponent(searchData))
      
      if (searchType === 'multi-city') {
        // Handle multi-city search
        fetch('/api/amadeus/multi-city-flights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedData),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setError(data.error)
              setLoading(false)
              return
            }
            const transformedFlights = transformAmadeusFlights(data.data || [], data.dictionaries)
            setFlights(transformedFlights)
            setFilteredFlights(transformedFlights)
            setLoading(false)
            
            // Reset to page 1 if we have flights and we're not on page 1
            if (transformedFlights.length > 0 && currentPage > 1) {
              const newParams = new URLSearchParams(searchParams.toString())
              newParams.set('page', '1')
              router.replace(`?${newParams.toString()}`, { scroll: false })
            }
          })
          .catch((err) => {
            console.error('Flight search error:', err)
            setError('Failed to search flights')
            setLoading(false)
          })
      } else {
        // Handle regular search (one-way or round-trip)
        // Fetch from both Amadeus and Duffel in parallel
        Promise.all([
        fetch('/api/amadeus/flights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedData),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
                console.error('Amadeus API error:', data.error)
                return { flights: [], source: 'amadeus' }
            }
            const transformedFlights = transformAmadeusFlights(data.data || [], data.dictionaries)
              return { flights: transformedFlights, source: 'amadeus' }
            })
            .catch((err) => {
              console.error('Amadeus API error:', err)
              return { flights: [], source: 'amadeus' }
            }),
          fetch('/api/duffel/flights', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(parsedData),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.error) {
                console.error('Duffel API error:', data.error)
                return { flights: [], source: 'duffel' }
              }
              const transformedFlights = transformDuffelFlights(data.data || [])
              return { flights: transformedFlights, source: 'duffel' }
            })
            .catch((err) => {
              console.error('Duffel API error:', err)
              return { flights: [], source: 'duffel' }
            }),
        ])
          .then((results) => {
            // Merge results from both sources
            const amadeusFlights = results.find((r) => r.source === 'amadeus')?.flights || []
            const duffelFlights = results.find((r) => r.source === 'duffel')?.flights || []
            
            // Combine and sort by price (if available)
            const allFlights = [...amadeusFlights, ...duffelFlights]
            
            // Sort by price (extract numeric value from price string)
            allFlights.sort((a, b) => {
              const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0
              const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0
              return priceA - priceB
            })
            
            setFlights(allFlights)
            setFilteredFlights(allFlights)
            setLoading(false)
            
            // Reset to page 1 if we have flights and we're not on page 1
            if (allFlights.length > 0 && currentPage > 1) {
              const newParams = new URLSearchParams(searchParams.toString())
              newParams.set('page', '1')
              router.replace(`?${newParams.toString()}`, { scroll: false })
            }
          })
          .catch((err) => {
            console.error('Flight search error:', err)
            setError('Failed to search flights')
            setLoading(false)
          })
      }
    } catch (err) {
      console.error('Parse error:', err)
      setError('Invalid search parameters')
      setLoading(false)
    }
  }, [searchParams, lastSearchData, lastSearchType, currentPage, router])

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
  const from = searchParamsData?.originLocationCode || searchParamsData?.segments?.[0]?.origin || ''
  const to = searchParamsData?.destinationLocationCode || searchParamsData?.segments?.[0]?.destination || ''
  const searchData = searchParams.get('data')
  const searchType = searchParams.get('type')

  return (
    <div className="pb-28">
      {/* Hero section */}
      <div className="container">
        <HeroSectionWithSearchForm1
          heading="Flight Search Results"
          image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1260&h=750&fit=crop&auto=format"
          imageAlt="Flight Search"
          searchForm={<FlightSearchForm key={`${searchData}-${searchType}`} formStyle="default" />}
          formClassName="!mt-96"
          description={
            <div className="flex items-center sm:text-lg">
              <HugeiconsIcon icon={MapPinpoint02Icon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">
                {from && to ? `${from} → ${to}` : 'Search flights'}
              </span>
              <span className="mx-5"></span>
              <HugeiconsIcon icon={AirplaneTakeOff01Icon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">{flights.length} flight{flights.length !== 1 ? 's' : ''} found</span>
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
                <FlightFiltersSkeleton />
              </div>
            </aside>

            {/* Right Side - Flight Cards Skeleton */}
            <div className="flex-1">
              <div className="space-y-6">
                {[...Array(10)].map((_, index) => (
                  <FlightCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-red-600 dark:text-red-400">{error}</div>
          </div>
        )}

        {!loading && !error && flights.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-neutral-600 dark:text-neutral-400">No flights found. Try adjusting your search criteria.</div>
          </div>
        )}

        {!loading && !error && flights.length > 0 && (
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left Sidebar - Filters (Desktop) */}
            <aside className="hidden w-full shrink-0 lg:block lg:w-80">
              <div className="sticky top-24">
                <FlightFilters flights={flights} onFilterChange={setFilteredFlights} />
              </div>
            </aside>

            {/* Right Side - Flight Cards */}
            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Showing {Math.min((currentPage - 1) * FLIGHTS_PER_PAGE + 1, filteredFlights.length)} - {Math.min(currentPage * FLIGHTS_PER_PAGE, filteredFlights.length)} of {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''}
                  {filteredFlights.length !== flights.length && (
                    <span className="ml-2">(filtered from {flights.length} total)</span>
                  )}
                </div>
                {/* Apply Filters Button (Mobile) */}
                <div className="lg:hidden">
                  <Button
                    onClick={() => setIsFiltersModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <HugeiconsIcon icon={FilterVerticalIcon} size={18} />
                    <span>Apply Filters</span>
                  </Button>
                </div>
              </div>

              {filteredFlights.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-lg text-neutral-600 dark:text-neutral-400">
                    No flights match your filters. Try adjusting your search criteria.
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {filteredFlights
                      .slice((currentPage - 1) * FLIGHTS_PER_PAGE, currentPage * FLIGHTS_PER_PAGE)
                      .map((flight) => (
                        <FlightCard key={flight.id} data={flight} />
                      ))}
                  </div>
                  
                  {/* Pagination */}
                  {filteredFlights.length > FLIGHTS_PER_PAGE && (
                    <div className="mt-16 flex justify-center">
                      <Pagination>
                        <PaginationPrevious 
                          href={currentPage > 1 ? `?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(currentPage - 1) }).toString()}` : null}
                        />
                        <PaginationList>
                          {(() => {
                            const totalPages = Math.ceil(filteredFlights.length / FLIGHTS_PER_PAGE)
                            const pages: (number | 'gap')[] = []
                            
                            if (totalPages <= 7) {
                              // Show all pages if 7 or fewer
                              for (let i = 1; i <= totalPages; i++) {
                                pages.push(i)
                              }
                            } else {
                              // Always show first page
                              pages.push(1)
                              
                              if (currentPage > 3) {
                                pages.push('gap')
                              }
                              
                              // Show pages around current page
                              const start = Math.max(2, currentPage - 1)
                              const end = Math.min(totalPages - 1, currentPage + 1)
                              
                              for (let i = start; i <= end; i++) {
                                pages.push(i)
                              }
                              
                              if (currentPage < totalPages - 2) {
                                pages.push('gap')
                              }
                              
                              // Always show last page
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
                          href={currentPage < Math.ceil(filteredFlights.length / FLIGHTS_PER_PAGE) ? `?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(currentPage + 1) }).toString()}` : null}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Filters Modal (Mobile) */}
        <Dialog
          open={isFiltersModalOpen}
          onClose={() => setIsFiltersModalOpen(false)}
          className="relative z-50"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-black/50 duration-200 ease-out data-closed:opacity-0"
          />
          <div className="fixed inset-0 flex max-h-screen w-screen items-center justify-center pt-3">
            <DialogPanel
              className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white text-left align-middle shadow-xl duration-200 ease-out data-closed:translate-y-16 data-closed:opacity-0 dark:border dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              transition
            >
              <div className="relative shrink-0 border-b border-neutral-200 p-4 text-center sm:px-8 dark:border-neutral-800">
                <DialogTitle as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-neutral-100">
                  {T['common']['Filters']}
                </DialogTitle>
                <div className="absolute end-2 top-2">
                  <ButtonClose plain onClick={() => setIsFiltersModalOpen(false)} />
                </div>
              </div>

              <div className="hidden-scrollbar grow overflow-y-auto text-start">
                <div className="px-4 sm:px-8">
                  <FlightFilters 
                    flights={flights} 
                    onFilterChange={setFilteredFlights}
                    onCloseModal={() => setIsFiltersModalOpen(false)}
                  />
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between bg-neutral-50 p-4 sm:px-8 dark:border-t dark:border-neutral-800 dark:bg-neutral-900">
                <ButtonThird 
                  className="-mx-3" 
                  onClick={() => {
                    // Clear all filters by resetting to original flights
                    setFilteredFlights(flights)
                    setIsFiltersModalOpen(false)
                  }} 
                  type="button"
                >
                  {T['common']['Clear All']}
                </ButtonThird>
                <ButtonPrimary type="button" onClick={() => setIsFiltersModalOpen(false)}>
                  {T['common']['Apply filters']}
                </ButtonPrimary>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </div>
    </div>
  )
}

export default FlightsPageContent

