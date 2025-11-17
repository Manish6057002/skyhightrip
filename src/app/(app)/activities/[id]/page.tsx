'use client'

import StartRating from '@/components/StartRating'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import { Badge } from '@/shared/Badge'
import { Location06Icon, ClockIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import HeaderGallery from '../../(listings)/components/HeaderGallery'
import SectionHeader from '../../(listings)/components/SectionHeader'
import { SectionHeading, SectionSubheading } from '../../(listings)/components/SectionHeading'
import SectionListingReviews from '../../(listings)/components/SectionListingReviews'
import Image from 'next/image'
import QuantitySelector from '@/components/QuantitySelector'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import { Field, Label } from '@/shared/fieldset'

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

interface CancellationPolicy {
  dateFrom: string // ISO date string
  amount: number
}

interface CancellationInfo {
  rateClass: string // 'NRF' or 'NOR'
  freeCancellation: boolean
  policies: CancellationPolicy[]
  activityDate: string // The date this applies to
}

export default function ActivityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const activityId = params?.id as string
  
  // Get search params safely - use window.location if useSearchParams causes issues
  const [searchParamsState, setSearchParamsState] = useState<URLSearchParams>(new URLSearchParams())
  
  useEffect(() => {
    // Try to get search params from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setSearchParamsState(params)
    }
  }, [])

  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Date and quantity selection state
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [loadingDates, setLoadingDates] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [priceInfo, setPriceInfo] = useState<{ adult?: number; child?: number; currency: string } | null>(null)

  useEffect(() => {
    if (!activityId) {
      setError('Activity ID is required')
      setLoading(false)
      return
    }

    try {
      // Try to get activity from sessionStorage
      const storedActivities = sessionStorage.getItem('activities')
      if (storedActivities) {
        const activities: Activity[] = JSON.parse(storedActivities)
        const foundActivity = activities.find((a) => a.id === activityId)
        if (foundActivity) {
          setActivity(foundActivity)
          
          // Get initial search params for date range
          const urlParams = new URLSearchParams(window.location.search)
          const dateFrom = urlParams.get('dateFrom') || ''
          const dateTo = urlParams.get('dateTo') || ''
          const destinationCode = urlParams.get('destinationCode') || ''
          
          // Set initial quantities from URL params
          const urlAdults = parseInt(urlParams.get('adults') || '1')
          const urlChildren = parseInt(urlParams.get('children') || '0')
          const urlInfants = parseInt(urlParams.get('infants') || '0')
          setAdults(urlAdults)
          setChildren(urlChildren)
          setInfants(urlInfants)
          
          // Set initial selected date
          if (dateFrom) {
            setSelectedDate(dateFrom)
          }
          
          // Fetch available dates if we have destination code
          if (destinationCode && foundActivity.fullData?.code) {
            fetchAvailableDates(
              foundActivity.fullData.code || foundActivity.fullData.activityCode,
              destinationCode,
              dateFrom || new Date().toISOString().split('T')[0],
              dateTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              urlAdults,
              urlChildren,
              urlInfants
            )
          }
          
          setLoading(false)
          return
        }
      }

      // If not found in sessionStorage, show error
      setError('Activity not found')
      setLoading(false)
    } catch (err) {
      console.error('Error loading activity:', err)
      setError('Failed to load activity details')
      setLoading(false)
    }
  }, [activityId])

  // Fetch available dates for the activity
  const fetchAvailableDates = async (
    activityCode: string,
    destinationCode: string,
    dateFrom: string,
    dateTo: string,
    adultsCount: number,
    childrenCount: number,
    infantsCount: number
  ) => {
    if (!activityCode || !destinationCode) return

    setLoadingDates(true)
    setAvailabilityError(null)

    try {
      const response = await fetch('/api/hotelbeds/activities/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityCode,
          destinationCode,
          dateFrom,
          dateTo,
          adults: adultsCount,
          children: childrenCount,
          infants: infantsCount,
        }),
      })

      const data = await response.json()

      if (data.error || !data.available) {
        setAvailabilityError(data.message || data.error || 'Activity not available for the selected dates')
        setAvailableDates([])
      } else {
        setAvailableDates(data.availableDates || [])
        if (data.priceInfo) {
          setPriceInfo({
            adult: data.priceInfo.adult ? parseFloat(data.priceInfo.adult) : undefined,
            child: data.priceInfo.child ? parseFloat(data.priceInfo.child) : undefined,
            currency: data.priceInfo.currency || 'EUR',
          })
        }
        // Auto-select first available date if none selected
        if (!selectedDate && data.availableDates && data.availableDates.length > 0) {
          setSelectedDate(data.availableDates[0])
        }
      }
    } catch (err: any) {
      console.error('Error fetching available dates:', err)
      setAvailabilityError('Failed to fetch available dates')
      setAvailableDates([])
    } finally {
      setLoadingDates(false)
    }
  }

  // Refetch available dates when quantities change
  useEffect(() => {
    if (!activity?.fullData?.code || loadingDates) return
    
    const destinationCode = searchParamsState.get('destinationCode') || ''
    if (!destinationCode) return

    const today = new Date()
    const dateFrom = searchParamsState.get('dateFrom') || today.toISOString().split('T')[0]
    const dateTo = searchParamsState.get('dateTo') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    fetchAvailableDates(
      activity.fullData.code || activity.fullData.activityCode,
      destinationCode,
      dateFrom,
      dateTo,
      adults,
      children,
      infants
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adults, children, infants])

  // Get all images from the activity
  const getGalleryImages = (): string[] => {
    if (!activity) return []

    const images: string[] = []

    // Add main image
    if (activity.image) {
      images.push(activity.image)
    }

    // Add images array
    if (activity.images && Array.isArray(activity.images)) {
      activity.images.forEach((img) => {
        if (img && !images.includes(img)) {
          images.push(img)
        }
      })
    }

    // Extract images from fullData (Hotelbeds API structure)
    if (activity.fullData?.content?.media?.images && Array.isArray(activity.fullData.content.media.images)) {
      activity.fullData.content.media.images.forEach((img: any) => {
        if (img.urls && Array.isArray(img.urls)) {
          // Prefer XLARGE, then LARGE, then LARGE2
          const xlarge = img.urls.find((u: any) => u.sizeType === 'XLARGE')
          const large = img.urls.find((u: any) => u.sizeType === 'LARGE')
          const large2 = img.urls.find((u: any) => u.sizeType === 'LARGE2')
          const url = xlarge?.resource || large?.resource || large2?.resource || img.urls[0]?.resource
          if (url && !images.includes(url)) {
            images.push(url)
          }
        }
      })
    }

    // If no images found, use placeholder
    if (images.length === 0) {
      images.push(`https://images.unsplash.com/photo-1551882547-27421c4d62f4?w=1280&h=720&fit=crop&auto=format`)
    }

    return images
  }

  // Get first available rateKey for booking
  const getRateKey = () => {
    if (!activity?.fullData) return null
    
    // Check modalities for rates
    if (activity.fullData.modalities && Array.isArray(activity.fullData.modalities)) {
      for (const modality of activity.fullData.modalities) {
        if (modality.rates && Array.isArray(modality.rates)) {
          for (const rate of modality.rates) {
            if (rate.rateDetails && Array.isArray(rate.rateDetails)) {
              for (const rateDetail of rate.rateDetails) {
                if (rateDetail.rateKey) {
                  return rateDetail.rateKey
                }
              }
            }
          }
        }
      }
    }
    
    return null
  }

  // Get price information from fullData or from availability API
  const getPriceInfo = () => {
    // Use price info from availability API if available (more accurate)
    if (priceInfo) {
      return priceInfo
    }

    if (!activity) return null

    const amountsFrom = activity.fullData?.amountsFrom || activity.fullData?.modalities?.[0]?.amountsFrom
    if (!amountsFrom || !Array.isArray(amountsFrom)) {
      return activity.price ? {
        adult: activity.price,
        currency: activity.currency || 'EUR',
      } : null
    }

    const adultPrice = amountsFrom.find((amt: any) => amt.paxType === 'ADULT')
    const childPrice = amountsFrom.find((amt: any) => amt.paxType === 'CHILD')
    const currency = activity.currency || activity.fullData?.currency || 'EUR'

    return {
      adult: adultPrice ? parseFloat(adultPrice.amount) : activity.price,
      child: childPrice ? parseFloat(childPrice.amount) : undefined,
      currency,
      amountsFrom,
    }
  }

  // Get cancellation policies for selected date
  const getCancellationInfo = (): CancellationInfo | null => {
    if (!activity || !selectedDate) return null

    // Extract cancellation policies from activity fullData
    // According to Hotelbeds API: cancellationPolicies are in modalities[].rates[].rateDetails[].operationDates[].cancellationPolicies[]
    if (activity.fullData?.modalities && Array.isArray(activity.fullData.modalities)) {
      for (const modality of activity.fullData.modalities) {
        if (modality.rates && Array.isArray(modality.rates)) {
          for (const rate of modality.rates) {
            const rateClass = rate.rateClass || 'NOR'
            const freeCancellation = rate.freeCancellation || false
            
            if (rate.rateDetails && Array.isArray(rate.rateDetails)) {
              for (const rateDetail of rate.rateDetails) {
                if (rateDetail.operationDates && Array.isArray(rateDetail.operationDates)) {
                  // Find the operation date that matches the selected date
                  const matchingOperationDate = rateDetail.operationDates.find((opDate: any) => {
                    return opDate.from === selectedDate || opDate.to === selectedDate
                  })
                  
                  if (matchingOperationDate && matchingOperationDate.cancellationPolicies) {
                    const policies = Array.isArray(matchingOperationDate.cancellationPolicies)
                      ? matchingOperationDate.cancellationPolicies
                      : []
                    
                    return {
                      rateClass,
                      freeCancellation,
                      policies: policies.map((policy: any) => ({
                        dateFrom: policy.dateFrom,
                        amount: policy.amount || 0,
                      })),
                      activityDate: matchingOperationDate.from || selectedDate,
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return null
  }

  // Get provider information
  const getProviderInfo = () => {
    if (!activity) return null

    // Try to get provider name from various possible locations
    const contract = activity.fullData?.modalities?.[0]?.contract
    const providerName = 
      activity.fullData?.providerInformation?.name ||
      activity.fullData?.supplier?.name ||
      contract?.name ||
      'Activity Provider'

    // Get provider address from meeting point (activity location)
    const location = activity.fullData?.content?.location
    const firstMeetingPoint = location?.startingPoints?.[0]?.meetingPoint
    let providerAddress = ''
    
    if (firstMeetingPoint) {
      providerAddress = [
        firstMeetingPoint.address,
        firstMeetingPoint.city,
        firstMeetingPoint.zip,
        firstMeetingPoint.country?.name
      ].filter(Boolean).join(', ')
    } else {
      // Fallback to activity address fields
      const addressParts = [
        activity.address,
        activity.city,
        activity.country
      ].filter(Boolean)
      providerAddress = addressParts.join(', ')
    }

    return {
      name: providerName,
      address: providerAddress,
      contractCode: contract?.code,
      contractName: contract?.name,
    }
  }

  // Get location details
  const getLocationInfo = () => {
    if (!activity) return null

    const location = activity.fullData?.content?.location
    const startingPoints = location?.startingPoints || []
    
    // Extract all starting points with full details
    const meetingPoints = startingPoints
      .filter((point: any) => point.meetingPoint)
      .map((point: any) => {
        const mp = point.meetingPoint
        return {
          type: point.type || 'Meeting Point',
          address: mp.address || '',
          city: mp.city || '',
          zip: mp.zip || '',
          country: mp.country?.name || '',
          description: mp.description || '',
          geolocation: mp.geolocation,
          pickupInstructions: point.pickupInstructions || [],
        }
      })

    // For backward compatibility, use first meeting point
    const firstPoint = meetingPoints[0] || {}
    const address = firstPoint.address || activity.address
    const city = firstPoint.city || activity.city
    const country = firstPoint.country || activity.country
    const zip = firstPoint.zip || ''

    // Build full address with zip code
    const addressParts = [address]
    if (city) addressParts.push(city)
    if (zip) addressParts.push(zip)
    if (country) addressParts.push(country)
    const fullAddress = addressParts.filter(Boolean).join(', ')

    return {
      address,
      city,
      zip,
      country,
      fullAddress,
      meetingPoints, // All meeting points
      latitude: firstPoint.geolocation?.latitude,
      longitude: firstPoint.geolocation?.longitude,
    }
  }

  // Get duration details
  const getDurationInfo = () => {
    if (!activity) return null

    const scheduling = activity.fullData?.content?.scheduling
    const duration = scheduling?.duration || activity.fullData?.modalities?.[0]?.duration

    if (duration) {
      const value = duration.value || ''
      const metric = duration.metric || ''
      const type = duration.type || ''
      const description = duration.description || ''

      return {
        value,
        metric: metric.toLowerCase(),
        type,
        description,
        display: description 
          ? `${description}${value} ${metric.toLowerCase()}`
          : `${value} ${metric.toLowerCase()}`,
      }
    }

    return activity.duration ? { display: activity.duration } : null
  }

  // Get important information
  const getImportantInfo = () => {
    if (!activity?.fullData?.content?.importantInfo) return []
    return Array.isArray(activity.fullData.content.importantInfo)
      ? activity.fullData.content.importantInfo
      : [activity.fullData.content.importantInfo]
  }

  // Get highlights
  const getHighlights = () => {
    if (!activity?.fullData?.content?.highligths) return []
    return Array.isArray(activity.fullData.content.highligths)
      ? activity.fullData.content.highligths
      : [activity.fullData.content.highligths]
  }

  // Get included/excluded features
  const getFeatures = () => {
    if (!activity?.fullData?.content?.featureGroups) return { included: [], excluded: [] }

    const included: string[] = []
    const excluded: string[] = []

    activity.fullData.content.featureGroups.forEach((group: any) => {
      if (group.included && Array.isArray(group.included)) {
        group.included.forEach((item: any) => {
          if (item.description) included.push(item.description)
        })
      }
      if (group.excluded && Array.isArray(group.excluded)) {
        group.excluded.forEach((item: any) => {
          if (item.description) excluded.push(item.description)
        })
      }
    })

    return { included, excluded }
  }

  if (loading) {
    return (
      <div className="container py-20">
        <div className="flex items-center justify-center">
          <div className="text-lg text-neutral-600 dark:text-neutral-400">Loading activity details...</div>
        </div>
      </div>
    )
  }

  if (error || !activity) {
    return (
      <div className="container py-20">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">{error || 'Activity not found'}</div>
          <ButtonPrimary onClick={() => router.push('/activities')}>Back to Activities</ButtonPrimary>
        </div>
      </div>
    )
  }

  const galleryImages = getGalleryImages()
  const priceInfoData = getPriceInfo()
  const locationInfo = getLocationInfo()
  const providerInfo = getProviderInfo()
  const cancellationInfo = getCancellationInfo()
  const durationInfo = getDurationInfo()
  const importantInfo = getImportantInfo()
  const highlights = getHighlights()
  const features = getFeatures()
  
  // Get destination code for booking
  const destinationCode = searchParamsState.get('destinationCode') || ''

  const renderSectionHeader = () => {
    return (
      <SectionHeader
        title={activity.name}
        listingCategory={activity.category || activity.categories?.[0] || 'Activity'}
        reviewStart={activity.rating || 0}
        reviewCount={activity.reviewCount || 0}
        address={locationInfo?.fullAddress || activity.address || 'Location not available'}
        host={{
          displayName: providerInfo?.name || 'Activity Provider',
          avatarUrl: '',
        }}
      >
        {durationInfo && (
          <div className="flex items-center gap-x-3">
            <HugeiconsIcon icon={ClockIcon} size={24} strokeWidth={1.5} />
            <span>{durationInfo.display}</span>
          </div>
        )}
      </SectionHeader>
    )
  }

  const renderSectionInfo = () => {
    const description = activity.fullData?.content?.description || activity.fullData?.content?.summary || activity.description

    return (
      <div className="listingSection__wrap">
        <SectionHeading>About this activity</SectionHeading>
        {description && (
          <div
            className="prose prose-neutral max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
        {highlights.length > 0 && (
          <div className="mt-6">
            <SectionSubheading>Highlights</SectionSubheading>
            <ul className="mt-4 space-y-2">
              {highlights.map((highlight: string, index: number) => (
                <li key={index} className="flex items-start gap-x-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-600" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const renderSectionDetails = () => {
    return (
      <div className="listingSection__wrap">
        <SectionHeading>Details</SectionHeading>
        <DescriptionList>
          {durationInfo && (
            <>
              <DescriptionTerm>Duration</DescriptionTerm>
              <DescriptionDetails>{durationInfo.display}</DescriptionDetails>
            </>
          )}
          {activity.category && (
            <>
              <DescriptionTerm>Category</DescriptionTerm>
              <DescriptionDetails>{activity.category}</DescriptionDetails>
            </>
          )}
          {activity.categories && activity.categories.length > 0 && (
            <>
              <DescriptionTerm>Categories</DescriptionTerm>
              <DescriptionDetails>
                <div className="flex flex-wrap gap-2">
                  {activity.categories.map((cat, index) => (
                    <Badge key={index} color="zinc" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </DescriptionDetails>
            </>
          )}
          {locationInfo && locationInfo.meetingPoints && locationInfo.meetingPoints.length > 0 && (
            <>
              <DescriptionTerm>Meeting Point{locationInfo.meetingPoints.length > 1 ? 's' : ''}</DescriptionTerm>
              <DescriptionDetails>
                <div className="space-y-4">
                  {locationInfo.meetingPoints.map((point: any, index: number) => (
                    <div key={index} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
                      <div className="flex items-start gap-x-3">
                        <HugeiconsIcon icon={Location06Icon} size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-primary-600 dark:text-primary-400" />
                        <div className="flex-1 space-y-2">
                          {point.type && (
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {point.type} {locationInfo.meetingPoints.length > 1 ? `#${index + 1}` : ''}
                            </div>
                          )}
                          {point.description && (
                            <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {point.description}
                            </div>
                          )}
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {[point.address, point.city, point.zip, point.country].filter(Boolean).join(', ')}
                          </div>
                          {point.pickupInstructions && point.pickupInstructions.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {point.pickupInstructions.map((instruction: any, instIndex: number) => (
                                <div key={instIndex} className="text-sm text-neutral-600 dark:text-neutral-400 italic">
                                  {instruction.description}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </DescriptionDetails>
            </>
          )}
          {locationInfo?.fullAddress && (!locationInfo.meetingPoints || locationInfo.meetingPoints.length === 0) && (
            <>
              <DescriptionTerm>Location</DescriptionTerm>
              <DescriptionDetails>{locationInfo.fullAddress}</DescriptionDetails>
            </>
          )}
          {providerInfo && (
            <>
              <DescriptionTerm>Provider</DescriptionTerm>
              <DescriptionDetails>
                <div className="space-y-2">
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">
                    {providerInfo.name}
                  </div>
                  {providerInfo.address && (
                    <div className="flex items-start gap-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <HugeiconsIcon icon={Location06Icon} size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                      <span>{providerInfo.address}</span>
                    </div>
                  )}
                </div>
              </DescriptionDetails>
            </>
          )}
        </DescriptionList>
      </div>
    )
  }

  const renderSectionCancellationPolicy = () => {
    if (!cancellationInfo || !selectedDate) return null

    return (
      <div className="listingSection__wrap">
        <SectionHeading>Cancellation Policy</SectionHeading>
        <div className="mt-4 space-y-4">
          {/* Rate Class Information */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
            <div className="flex items-start gap-x-3">
              <div className="flex-1">
                <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {cancellationInfo.rateClass === 'NRF' ? 'Non-Refundable' : 'Standard Cancellation'}
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {cancellationInfo.rateClass === 'NRF' 
                    ? 'This booking is non-refundable. Cancellation charges will apply immediately upon confirmation.'
                    : cancellationInfo.policies.length === 0
                    ? 'Free cancellation available until the activity date.'
                    : 'Cancellation charges apply based on when you cancel. See details below.'}
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Policies List */}
          {cancellationInfo.policies.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Cancellation Charges for {new Date(selectedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}:
              </div>
              <div className="space-y-2">
                {cancellationInfo.policies
                  .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
                  .map((policy, index) => {
                    const policyDate = new Date(policy.dateFrom)
                    const activityDate = new Date(cancellationInfo.activityDate)
                    const daysBefore = Math.ceil((activityDate.getTime() - policyDate.getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <div 
                        key={index} 
                        className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {daysBefore > 0 
                              ? `Cancel ${daysBefore} day${daysBefore !== 1 ? 's' : ''} or less before activity`
                              : 'Cancel on or after activity date'}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                            After {policyDate.toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZoneName: 'short'
                            })}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {activity.currency || priceInfoData?.currency || 'EUR'} {policy.amount.toLocaleString(undefined, { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">
                            will be charged
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
              
              {/* Free cancellation before first policy */}
              {cancellationInfo.policies.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                  <div className="text-sm text-green-800 dark:text-green-300">
                    <span className="font-medium">Free cancellation</span> available if you cancel before{' '}
                    {new Date(
                      cancellationInfo.policies
                        .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())[0]
                        .dateFrom
                    ).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZoneName: 'short'
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No cancellation charges message */}
          {cancellationInfo.policies.length === 0 && cancellationInfo.rateClass === 'NOR' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="text-sm font-medium text-green-800 dark:text-green-300">
                Free cancellation available until the activity date
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSectionFeatures = () => {
    if (features.included.length === 0 && features.excluded.length === 0) return null

    return (
      <div className="listingSection__wrap">
        <SectionHeading>What&apos;s included</SectionHeading>
        <div className="grid gap-6 sm:grid-cols-2">
          {features.included.length > 0 && (
            <div>
              <SectionSubheading>Included</SectionSubheading>
              <ul className="mt-4 space-y-2">
                {features.included.map((item, index) => (
                  <li key={index} className="flex items-start gap-x-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {features.excluded.length > 0 && (
            <div>
              <SectionSubheading>Not included</SectionSubheading>
              <ul className="mt-4 space-y-2">
                {features.excluded.map((item, index) => (
                  <li key={index} className="flex items-start gap-x-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSectionImportantInfo = () => {
    if (importantInfo.length === 0) return null

    return (
      <div className="listingSection__wrap">
        <SectionHeading>Important information</SectionHeading>
        <div className="space-y-4">
          {importantInfo.map((info: string, index: number) => (
            <div
              key={index}
              className="prose prose-neutral max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: info }}
            />
          ))}
        </div>
      </div>
    )
  }

  const renderSidebarPriceAndForm = () => {
    const currency = priceInfoData?.currency || 'EUR'
    const adultPrice = priceInfoData?.adult || 0
    const childPrice = priceInfoData?.child

    // Calculate total price
    const totalPrice = (adultPrice * adults) + (childPrice ? childPrice * children : 0)

    return (
      <div className="sticky top-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <div className="space-y-6">
          {/* Date Selection */}
          {loadingDates ? (
            <div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Select Date *</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Loading available dates...</div>
            </div>
          ) : availabilityError ? (
            <div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Select Date *</div>
              <div className="text-sm text-red-600 dark:text-red-400">{availabilityError}</div>
            </div>
          ) : availableDates.length > 0 ? (
            <Field>
              <Label>Select Date *</Label>
              <Select
                value={selectedDate}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDate(e.target.value)}
                className="mt-2"
                required
              >
                <option value="">Choose a date</option>
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Select Date *</div>
              <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {destinationCode ? 'No dates available. Please try a different date range.' : 'Please search for activities first to see available dates.'}
              </div>
            </div>
          )}

          {/* Quantity Selectors */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Quantity</div>
            
            <QuantitySelector
              label="Adult"
              ageRange="13-99 years old"
              price={adultPrice}
              currency={currency}
              value={adults}
              min={1}
              max={20}
              onChange={setAdults}
              disabled={loadingDates}
            />
            
            {childPrice !== undefined && (
              <QuantitySelector
                label="Child"
                ageRange="1-12 years old"
                price={childPrice}
                currency={currency}
                value={children}
                min={0}
                max={20}
                onChange={setChildren}
                disabled={loadingDates}
              />
            )}
          </div>

          {/* Price Summary */}
          {priceInfoData && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Adults ({adults})</span>
                  <span className="font-medium">
                    {currency} {(adultPrice * adults).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {children > 0 && childPrice !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Children ({children})</span>
                    <span className="font-medium">
                      {currency} {(childPrice * children).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <Divider />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">
                    {currency} {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Book button */}
          <Link 
            href={`/activities/${activity.id}/book?dateFrom=${selectedDate || searchParamsState.get('dateFrom') || ''}&dateTo=${selectedDate || searchParamsState.get('dateTo') || ''}&destinationCode=${destinationCode}&adults=${adults}&children=${children}&infants=${infants}`}
          >
            <ButtonPrimary 
              className="w-full py-3"
              disabled={!selectedDate || loadingDates || availableDates.length === 0}
            >
              {!selectedDate ? 'Select a Date' : 'Book Now'}
            </ButtonPrimary>
          </Link>

          {/* Additional info */}
          {durationInfo && (
            <div className="flex items-center gap-x-2 text-sm text-neutral-600 dark:text-neutral-400">
              <HugeiconsIcon icon={ClockIcon} size={18} strokeWidth={1.5} />
              <span>{durationInfo.display}</span>
            </div>
          )}
          {locationInfo?.fullAddress && (
            <div className="flex items-start gap-x-2 text-sm text-neutral-600 dark:text-neutral-400">
              <HugeiconsIcon icon={Location06Icon} size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              <span>{locationInfo.fullAddress}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* HEADER - Gallery */}
      {galleryImages.length > 0 && (
        <div className="container">
          <HeaderGallery images={galleryImages} gridType="grid1" />
        </div>
      )}

      {/* MAIN */}
      <div className="container">
        <main className="relative z-[1] mt-10 flex flex-col gap-8 lg:flex-row xl:gap-10">
          {/* CONTENT */}
          <div className="flex w-full flex-col gap-y-8 lg:w-3/5 xl:w-[64%] xl:gap-y-10">
            {renderSectionHeader()}
            {renderSectionInfo()}
            {renderSectionDetails()}
            {renderSectionCancellationPolicy()}
            {renderSectionFeatures()}
            {renderSectionImportantInfo()}
          </div>

          {/* SIDEBAR */}
          <div className="grow">
            {renderSidebarPriceAndForm()}
          </div>
        </main>

        <Divider className="my-16" />

        {/* Reviews */}
        <div className="flex flex-col gap-y-10">
          <div className="w-full">
            <SectionListingReviews
              reviewCount={activity.reviewCount || 0}
              reviewStart={activity.rating || 0}
              reviews={[]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

