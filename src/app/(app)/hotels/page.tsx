'use client'

import HotelCard from '@/components/HotelCard'
import HotelCardSkeleton from '@/components/HotelCardSkeleton'
import HotelFilters from '@/components/HotelFilters'
import HotelFiltersSkeleton from '@/components/HotelFiltersSkeleton'
import HeroSectionWithSearchForm1 from '@/components/hero-sections/HeroSectionWithSearchForm1'
import { StaySearchForm } from '@/components/HeroSearchForm/StaySearchForm'
import { House04Icon, MapPinpoint02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Pagination, PaginationList, PaginationNext, PaginationPage, PaginationPrevious, PaginationGap } from '@/shared/Pagination'

const HOTELS_PER_PAGE = 10

interface Hotel {
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
  images?: string[] // Array of hotel images (up to 15)
  amenities?: string[]
  description?: string
  rooms?: any[]
  latitude?: number
  longitude?: number
  fullData?: any
}

const HotelsPageContent = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  // Track the last search data to avoid re-fetching on pagination
  const [lastSearchData, setLastSearchData] = useState<string | null>(null)

  // Function to format Hotelbeds image URL (XL - extra large images)
  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return ''
    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) return imagePath
    
    // Clean the image path - remove leading/trailing slashes
    const cleanPath = imagePath.replace(/^\/+|\/+$/g, '')
    
    // Construct Hotelbeds image URL for XL images
    // Format: https://photos.hotelbeds.com/giata/xl/{path}
    return `https://photos.hotelbeds.com/giata/xl/${cleanPath}`
  }

  // Function to fetch hotel images from hotel details API with rate limiting
  const fetchHotelImages = async (hotelsList: Hotel[]) => {
    // Filter out hotels that already have images to avoid unnecessary API calls
    const hotelsNeedingImages = hotelsList.filter(hotel => !hotel.images || hotel.images.length === 0)
    
    if (hotelsNeedingImages.length === 0) {
      return
    }
    
    // Helper function to fetch images for a single hotel
    const fetchSingleHotelImages = async (hotel: Hotel): Promise<{ hotelId: string; images: string[] }> => {
      try {
        const response = await fetch(`/api/hotelbeds/hotel-details?code=${encodeURIComponent(hotel.id)}`)
        const data = await response.json()
        
        if (data.error || !data.data) {
          return { hotelId: hotel.id, images: [] }
        }

        const hotelDetails = data.data
        const images: string[] = []

        // Collect images from hotel details (up to 15 images)
        // Primary: images array (standard Hotelbeds API structure)
        if (hotelDetails.images && Array.isArray(hotelDetails.images)) {
          hotelDetails.images.slice(0, 15).forEach((img: any) => {
            const imagePath = img.path || img.url || img.uri || (typeof img === 'string' ? img : null)
            if (imagePath) {
              const imageUrl = getImageUrl(imagePath)
              if (imageUrl && !images.includes(imageUrl)) {
                images.push(imageUrl)
              }
            }
          })
        }
        
        // Fallback: visualizations array
        if (images.length < 15 && hotelDetails.visualizations && Array.isArray(hotelDetails.visualizations)) {
          hotelDetails.visualizations.forEach((viz: any) => {
            if (images.length >= 15) return
            const imagePath = viz.path || viz.url || viz.uri || (typeof viz === 'string' ? viz : null)
            if (imagePath) {
              const imageUrl = getImageUrl(imagePath)
              if (imageUrl && !images.includes(imageUrl)) {
                images.push(imageUrl)
              }
            }
          })
        }
        
        // Fallback: mediaFiles array
        if (images.length < 15 && hotelDetails.mediaFiles && Array.isArray(hotelDetails.mediaFiles)) {
          hotelDetails.mediaFiles.forEach((media: any) => {
            if (images.length >= 15) return
            if (media.type === 'IMAGE' || media.type === 'PHOTO' || !media.type) {
              const imagePath = media.path || media.url || media.uri || media.fileName
              if (imagePath) {
                const imageUrl = getImageUrl(imagePath)
                if (imageUrl && !images.includes(imageUrl)) {
                  images.push(imageUrl)
                }
              }
            }
          })
        }

        // Limit to 15 images
        const limitedImages = images.slice(0, 15)
        
        return { hotelId: hotel.id, images: limitedImages }
      } catch (error) {
        console.error(`Error fetching images for hotel ${hotel.id}:`, error)
        return { hotelId: hotel.id, images: [] }
      }
    }

    // Rate limiting: Process hotels in batches with delays
    const BATCH_SIZE = 3 // Process 3 hotels at a time
    const DELAY_BETWEEN_BATCHES = 1000 // 1 second delay between batches
    const imageResults: { hotelId: string; images: string[] }[] = []

    // Process hotels in batches
    for (let i = 0; i < hotelsNeedingImages.length; i += BATCH_SIZE) {
      const batch = hotelsNeedingImages.slice(i, i + BATCH_SIZE)
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(hotel => fetchSingleHotelImages(hotel))
      )
      
      imageResults.push(...batchResults)
      
      // Update hotels state incrementally for better UX
      setHotels((prevHotels) => {
        return prevHotels.map((hotel) => {
          const imageResult = batchResults.find((result) => result.hotelId === hotel.id)
          if (imageResult && imageResult.images.length > 0) {
            return {
              ...hotel,
              images: imageResult.images,
              image: imageResult.images[0] || hotel.image,
            }
          }
          return hotel
        })
      })
      
      setFilteredHotels((prevHotels) => {
        return prevHotels.map((hotel) => {
          const imageResult = batchResults.find((result) => result.hotelId === hotel.id)
          if (imageResult && imageResult.images.length > 0) {
            return {
              ...hotel,
              images: imageResult.images,
              image: imageResult.images[0] || hotel.image,
            }
          }
          return hotel
        })
      })
      
      // Add delay between batches (except for the last batch)
      if (i + BATCH_SIZE < hotelsNeedingImages.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
    }
    
  }

  useEffect(() => {
    const searchData = searchParams.get('data')

    if (!searchData) {
      setLoading(false)
      setError('No search parameters provided')
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
      const { destinationCode, checkIn, checkOut, adults, children, infants, rooms } = parsedData

      // Store search data in sessionStorage for hotel details page
      try {
        sessionStorage.setItem('lastHotelSearch', JSON.stringify({
          checkIn,
          checkOut,
          adults: adults || 2,
          children: children || 0,
          infants: infants || 0,
          destinationCode,
          destination: parsedData.destination || parsedData.destinationName,
        }))
      } catch (e) {
        console.error('Failed to store search data in sessionStorage:', e)
      }

      // Validate that destination code is provided
      if (!destinationCode) {
        setError('Destination code is required. Please select a destination from the suggestions.')
        setLoading(false)
        return
      }

      if (!checkIn || !checkOut) {
        setError('Missing required parameters: checkIn, checkOut')
        setLoading(false)
        return
      }

      // Search for hotels using Hotelbeds API
      fetch('/api/hotelbeds/hotels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationCode,
          checkIn,
          checkOut,
          adults: adults || 1,
          children: children || 0,
          rooms: rooms || 1,
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
          
          // Transform Hotelbeds hotel data to our format
          const transformedHotels: Hotel[] = (data.data || []).map((hotel: any, index: number) => {
            // Extract rating from categoryCode (e.g., "4EST" -> 4, "H4_5" -> 4.5)
            let rating: number | undefined
            if (hotel.categoryCode) {
              const categoryMatch = hotel.categoryCode.match(/(\d+)(?:[._](\d+))?/)
              if (categoryMatch) {
                const whole = parseInt(categoryMatch[1])
                const decimal = categoryMatch[2] ? parseInt(categoryMatch[2]) : 0
                rating = whole + (decimal / 10)
              }
            }

            // Extract price from minRate (convert string to number)
            const price = hotel.minRate ? parseFloat(hotel.minRate) : undefined

            // Extract images - check multiple possible structures
            // According to Hotelbeds docs: images are in /hotels and /hoteldetails operations
            // Images are returned as path segments, not full URLs
            let imagePath: string | undefined
            
            // Structure 1: visualizations array (common in Hotelbeds API)
            if (hotel.visualizations && Array.isArray(hotel.visualizations) && hotel.visualizations.length > 0) {
              const viz = hotel.visualizations[0]
              // Visualizations can have path, url, uri, or be a string
              imagePath = viz.path || viz.url || viz.uri || (typeof viz === 'string' ? viz : null)
            }
            // Structure 2: images array
            else if (hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0) {
              const img = hotel.images[0]
              imagePath = img.path || img.url || img.uri || (typeof img === 'string' ? img : null)
            }
            // Structure 3: mediaFiles array
            else if (hotel.mediaFiles && Array.isArray(hotel.mediaFiles) && hotel.mediaFiles.length > 0) {
              const mediaFile = hotel.mediaFiles.find((m: any) => m.type === 'IMAGE' || m.type === 'PHOTO' || !m.type)
              if (mediaFile) {
                imagePath = mediaFile.path || mediaFile.url || mediaFile.uri || mediaFile.fileName
              }
            }
            // Structure 4: single image property
            else if (hotel.image) {
              if (typeof hotel.image === 'object') {
                imagePath = hotel.image.path || hotel.image.url || hotel.image.uri
              } else {
                imagePath = hotel.image
              }
            }

            // Debug: Log first hotel's structure to understand API response
            return {
              id: String(hotel.code || hotel.id || `hotel-${index}`),
              name: hotel.name || 'Hotel',
              address: hotel.address || '',
              city: hotel.destinationName || hotel.city || '',
              country: hotel.destinationName?.split(' - ')[1] || hotel.country || '',
              rating: rating,
              reviewCount: hotel.reviewCount || 0,
              price: price,
              currency: hotel.currency || 'EUR',
              image: imagePath,
              images: [], // Will be populated by fetchHotelImages function
              amenities: hotel.facilities?.map((f: any) => f.description?.content || f.description || f) || [],
              description: hotel.description?.content || hotel.description || hotel.categoryName || '',
              rooms: hotel.rooms || [],
              latitude: hotel.latitude ? parseFloat(hotel.latitude) : undefined,
              longitude: hotel.longitude ? parseFloat(hotel.longitude) : undefined,
              fullData: hotel, // Store full data for detail page
            }
          })

          setHotels(transformedHotels)
          setFilteredHotels(transformedHotels)
          
          // Store hotels in sessionStorage for detail page access
          try {
            sessionStorage.setItem('hotels', JSON.stringify(transformedHotels))
          } catch (e) {
            console.error('Failed to store hotels in sessionStorage:', e)
          }
          
          setLoading(false)
          
          // Fetch hotel images from hotel details API for each hotel
          fetchHotelImages(transformedHotels)
          
          // Reset to page 1 if we have hotels and we're not on page 1
          if (transformedHotels.length > 0 && currentPage > 1) {
            const newParams = new URLSearchParams(searchParams.toString())
            newParams.set('page', '1')
            router.replace(`?${newParams.toString()}`, { scroll: false })
          }
        })
        .catch((err) => {
          console.error('Hotel search error:', err)
          setError(err.message || 'Failed to search hotels')
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
  const checkIn = searchParamsData?.checkIn || ''
  const checkOut = searchParamsData?.checkOut || ''

  return (
    <div className="pb-28">
      {/* Hero section */}
      <div className="container">
        <HeroSectionWithSearchForm1
          heading="Hotel Search Results"
          image="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1260&h=750&fit=crop&auto=format"
          imageAlt="Hotel Search"
          searchForm={
            <StaySearchForm 
              key={`${checkIn}-${checkOut}`}
              formStyle="default" 
              initialValues={{
                from: destination,
                fromCode: destinationCode,
                departureDate: checkIn,
                returnDate: checkOut,
                adults: searchParamsData?.adults || 1,
                children: searchParamsData?.children || 0,
              }}
            />
          }
          formClassName="!mt-[28rem]"
          description={
            <div className="flex items-center sm:text-lg">
              <HugeiconsIcon icon={MapPinpoint02Icon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">
                {destination || 'Search hotels'}
              </span>
              <span className="mx-5"></span>
              <HugeiconsIcon icon={House04Icon} size={20} color="currentColor" strokeWidth={1.5} />
              <span className="ms-2.5">{hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found</span>
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
                <HotelFiltersSkeleton />
              </div>
            </aside>

            {/* Right Side - Hotel Cards Skeleton */}
            <div className="flex-1">
              <div className="space-y-6">
                {[...Array(10)].map((_, index) => (
                  <HotelCardSkeleton key={index} />
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

        {!loading && !error && hotels.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-neutral-600 dark:text-neutral-400">No hotels found. Try adjusting your search criteria.</div>
          </div>
        )}

        {!loading && !error && hotels.length > 0 && (
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left Sidebar - Filters */}
            <aside className="w-full shrink-0 lg:w-80">
              <div className="sticky top-24">
                <HotelFilters hotels={hotels} onFilterChange={setFilteredHotels} />
              </div>
            </aside>

            {/* Right Side - Hotel Cards */}
            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Showing {Math.min((currentPage - 1) * HOTELS_PER_PAGE + 1, filteredHotels.length)} - {Math.min(currentPage * HOTELS_PER_PAGE, filteredHotels.length)} of {filteredHotels.length} hotel{filteredHotels.length !== 1 ? 's' : ''}
                  {filteredHotels.length !== hotels.length && (
                    <span className="ml-2">(filtered from {hotels.length} total)</span>
                  )}
                </div>
              </div>

              {filteredHotels.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-lg text-neutral-600 dark:text-neutral-400">
                    No hotels match your filters. Try adjusting your search criteria.
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {filteredHotels
                      .slice((currentPage - 1) * HOTELS_PER_PAGE, currentPage * HOTELS_PER_PAGE)
                      .map((hotel) => (
                        <HotelCard key={hotel.id} data={hotel} />
                      ))}
                  </div>
                  
                  {/* Pagination */}
                  {filteredHotels.length > HOTELS_PER_PAGE && (
                    <div className="mt-16 flex justify-center">
                      <Pagination>
                        <PaginationPrevious 
                          href={currentPage > 1 ? `?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(currentPage - 1) }).toString()}` : null}
                        />
                        <PaginationList>
                          {(() => {
                            const totalPages = Math.ceil(filteredHotels.length / HOTELS_PER_PAGE)
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
                          href={currentPage < Math.ceil(filteredHotels.length / HOTELS_PER_PAGE) ? `?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: String(currentPage + 1) }).toString()}` : null}
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

export default HotelsPageContent

