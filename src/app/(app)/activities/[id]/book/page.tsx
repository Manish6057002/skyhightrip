'use client'

import ButtonPrimary from '@/shared/ButtonPrimary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import { Description, Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ClockIcon, Location06Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { SectionHeading } from '@/app/(app)/(listings)/components/SectionHeading'

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

interface ActivityQuestion {
  code: string
  text: string
  required: boolean
}

interface FieldErrors {
  holderName?: string
  holderSurname?: string
  holderEmail?: string
  holderPhone?: string
  passengerName?: string
  passengerSurname?: string
  passengerAge?: string
  [key: string]: string | undefined // For activity question errors
}

export default function ActivityBookingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activityId = params?.id as string

  const [activity, setActivity] = useState<Activity | null>(null)
  const [rateDetail, setRateDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)
  const [activityQuestions, setActivityQuestions] = useState<ActivityQuestion[]>([])

  // Passenger form state - get from search params or defaults
  const adultsParam = searchParams.get('adults')
  const childrenParam = searchParams.get('children')
  const infantsParam = searchParams.get('infants')
  
  const [adults, setAdults] = useState(adultsParam ? parseInt(adultsParam) : 1)
  const [children, setChildren] = useState(childrenParam ? parseInt(childrenParam) : 0)
  const [infants, setInfants] = useState(infantsParam ? parseInt(infantsParam) : 0)
  const [passengers, setPassengers] = useState<Array<{ name: string; surname: string; age: number; type: 'AD' | 'CH' | 'INF' }>>([])

  useEffect(() => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'instant',
    })

    if (!activityId) {
      setLoading(false)
      return
    }

    // Load activity from sessionStorage
    try {
      const storedActivities = sessionStorage.getItem('activities')
      if (storedActivities) {
        const activities: Activity[] = JSON.parse(storedActivities)
        const foundActivity = activities.find((a) => a.id === activityId)
        if (foundActivity) {
          setActivity(foundActivity)
          
          // Get rateKey (rate detail fetch is optional)
          const rateKey = getRateKey(foundActivity)
          if (rateKey) {
            // Try to fetch rate details, but don't block if it fails
            fetchRateDetail(rateKey).catch(() => {
              // If fetch fails, just continue without rate detail
              setLoading(false)
            })
          } else {
            setLoading(false)
          }
          return
        }
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error loading activity:', err)
      setLoading(false)
    }
  }, [activityId])

  // Get first available rateKey
  const getRateKey = (activity: Activity): string | null => {
    if (!activity?.fullData) return null
    
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

  // Fetch rate detail for booking (optional - not required for booking)
  const fetchRateDetail = async (rateKey: string) => {
    try {
      const response = await fetch('/api/hotelbeds/activities/detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rateKey }),
      })

      if (!response.ok) {
        // Rate detail is optional, so we'll just continue
        setLoading(false)
        return
      }

      const data = await response.json()
      if (data.error) {
        // Rate detail is optional, so we'll just continue
        setLoading(false)
        return
      }

      setRateDetail(data.data)
      setLoading(false)
    } catch (error) {
      // Rate detail is optional, so we'll just continue
      setLoading(false)
    }
  }

  // Initialize passengers based on adults/children/infants
  useEffect(() => {
    const newPassengers: Array<{ name: string; surname: string; age: number; type: 'AD' | 'CH' | 'INF' }> = []
    
    // Add adults
    for (let i = 0; i < adults; i++) {
      newPassengers.push({ name: '', surname: '', age: 25, type: 'AD' })
    }
    
    // Add children
    for (let i = 0; i < children; i++) {
      newPassengers.push({ name: '', surname: '', age: 8, type: 'CH' })
    }
    
    // Add infants
    for (let i = 0; i < infants; i++) {
      newPassengers.push({ name: '', surname: '', age: 1, type: 'INF' })
    }
    
    setPassengers(newPassengers)
  }, [adults, children, infants])

  const handleFieldChange = (fieldName: keyof FieldErrors) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const validateForm = (formData: FormData): FieldErrors => {
    const errors: FieldErrors = {}

    // Holder validation
    if (!formData.get('holderName') || (formData.get('holderName') as string).trim() === '') {
      errors.holderName = 'Name is required'
    }
    if (!formData.get('holderSurname') || (formData.get('holderSurname') as string).trim() === '') {
      errors.holderSurname = 'Surname is required'
    }
    if (!formData.get('holderEmail') || (formData.get('holderEmail') as string).trim() === '') {
      errors.holderEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((formData.get('holderEmail') as string).trim())) {
      errors.holderEmail = 'Invalid email format'
    }

    // Passenger validation
    passengers.forEach((passenger, index) => {
      if (!formData.get(`passengerName_${index}`) || (formData.get(`passengerName_${index}`) as string).trim() === '') {
        errors.passengerName = `Passenger ${index + 1} name is required`
      }
      if (!formData.get(`passengerSurname_${index}`) || (formData.get(`passengerSurname_${index}`) as string).trim() === '') {
        errors.passengerSurname = `Passenger ${index + 1} surname is required`
      }
      if (passenger.type === 'CH' || passenger.type === 'INF') {
        const ageStr = formData.get(`passengerAge_${index}`) as string
        if (!ageStr || ageStr.trim() === '') {
          errors.passengerAge = `Passenger ${index + 1} age is required`
        } else {
          const age = parseInt(ageStr)
          if (isNaN(age) || age < 0 || age > 17) {
            errors.passengerAge = `Passenger ${index + 1} age must be between 0 and 17`
          }
        }
      }
    })

    // Activity questions validation
    activityQuestions.forEach((question) => {
      if (question.required) {
        const answer = formData.get(`question_${question.code}`) as string
        if (!answer || answer.trim() === '') {
          errors[`question_${question.code}`] = `${question.text} is required`
        }
      }
    })

    return errors
  }

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBookingError(null)
    setBookingLoading(true)

    const formData = new FormData(e.currentTarget)
    const errors = validateForm(formData)

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setBookingLoading(false)
      return
    }

    try {
      if (!activity) {
        throw new Error('Activity not found')
      }

      // Get dates and destination code from URL params (required for v3.0 API)
      const dateFromParam = searchParams.get('dateFrom')
      const dateToParam = searchParams.get('dateTo')
      const destinationCodeParam = searchParams.get('destinationCode')
      
      if (!dateFromParam || !dateToParam) {
        throw new Error('Missing required dates. Please go back and select dates for your activity.')
      }

      // Get destination code - must be 3 characters max
      // Try from URL params first, then from activity data, then from stored search data
      let destinationCode = destinationCodeParam
      
      if (!destinationCode || destinationCode.length > 3) {
        // Try to get from activity's fullData
        destinationCode = activity.fullData?.destination?.code || 
                         activity.fullData?.destinationCode ||
                         activity.fullData?.country?.destinations?.[0]?.code
      }
      
      // If still not found or too long, try to get from sessionStorage search data
      if (!destinationCode || destinationCode.length > 3) {
        try {
          const storedSearchData = sessionStorage.getItem('lastActivitySearch')
          if (storedSearchData) {
            const searchData = JSON.parse(storedSearchData)
            destinationCode = searchData.destinationCode
          }
        } catch (e) {
          // Ignore storage errors
        }
      }
      
      // Validate destination code (must be max 3 characters)
      if (!destinationCode || destinationCode.length > 3) {
        throw new Error('Invalid destination code. Please go back and search again.')
      }

      // Re-fetch activity availability with exact booking dates and passenger config to get a fresh rateKey
      // RateKeys are date-specific and passenger-specific, so we need exact match
      // Convert passengers to the format expected by the API (same as original search)
      const paxesForSearch = passengers.map((p) => {
        // API expects: AD -> age 25, CH -> provided age, INF -> provided age
        if (p.type === 'AD') {
          return { type: 'AD', age: 25 }
        } else if (p.type === 'CH') {
          return { type: 'CH', age: p.age || 8 }
        } else if (p.type === 'INF') {
          return { type: 'INF', age: p.age || 1 }
        }
        return { type: 'AD', age: 25 }
      })
      
      const availabilityResponse = await fetch('/api/hotelbeds/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationCode: destinationCode, // Must be 3 characters max (e.g., "BCN")
          dateFrom: dateFromParam,
          dateTo: dateToParam,
          paxes: paxesForSearch, // Use exact passenger configuration
        }),
      })

      if (!availabilityResponse.ok) {
        const errorData = await availabilityResponse.json()
        throw new Error(errorData.error || 'Failed to fetch fresh rate key. Please try again.')
      }

      const availabilityData = await availabilityResponse.json()
      // API route returns { data: activities[], ... } but Hotelbeds API returns { activities: [], ... }
      const freshActivities = availabilityData.data || availabilityData.activities || []
      
      // Find the same activity in the fresh results
      // Try multiple matching strategies
      // The activity ID is created from activityCode or code, so we need to match by that
      const originalActivityCode = activity.fullData?.code || activity.fullData?.activityCode
      const activityCodeFromId = activity.id.startsWith('activity-') ? null : activity.id // If ID is generated, don't use it
      
      const freshActivity = freshActivities.find((a: any) => {
        const freshCode = a.code || a.activityCode
        const freshName = a.name || a.content?.name
        
        // Match by activity code (most reliable) - check both code and activityCode fields
        if (originalActivityCode && freshCode && (
          freshCode === originalActivityCode || 
          String(freshCode) === String(originalActivityCode)
        )) {
          return true
        }
        
        // Match by ID if it's not a generated ID
        if (activityCodeFromId && (a.id === activityCodeFromId || freshCode === activityCodeFromId)) {
          return true
        }
        
        // Match by name (less reliable but fallback) - use exact match
        if (activity.name && freshName && (
          freshName === activity.name || 
          freshName.toLowerCase() === activity.name.toLowerCase()
        )) {
          return true
        }
        
        return false
      })

      if (!freshActivity) {
        console.error('Could not find matching activity in fresh results')
        console.error('Original activity:', {
          id: activity.id,
          code: originalActivityCode,
          name: activity.name
        })
        console.error('Available activities:', freshActivities.map((a: any) => ({
          code: a.code || a.activityCode,
          name: a.name || a.content?.name
        })).slice(0, 5))
        throw new Error('Activity not available for the selected dates. Please choose different dates.')
      }

      // Extract activity questions from modalities
      // Questions are in modalities[].questions array
      const allQuestions: ActivityQuestion[] = []
      if (freshActivity.modalities && Array.isArray(freshActivity.modalities)) {
        freshActivity.modalities.forEach((modality: any) => {
          if (modality.questions && Array.isArray(modality.questions)) {
            modality.questions.forEach((question: any) => {
              // Avoid duplicates
              if (!allQuestions.find(q => q.code === question.code)) {
                allQuestions.push({
                  code: question.code,
                  text: question.text,
                  required: question.required || false
                })
              }
            })
          }
        })
      }
      
      // Filter out email and phone number questions (they're already in the form)
      // Common question codes for email/phone: EMAIL, EMAILENTRANCE, PHONENUMBER, NC-CTEL, etc.
      const emailPhoneCodes = ['EMAIL', 'EMAILENTRANCE', 'PHONENUMBER', 'NC-CTEL', 'TEL', 'TELEPHONE']
      const filteredQuestions = allQuestions.filter(q => {
        const codeUpper = q.code.toUpperCase()
        return !emailPhoneCodes.some(excludedCode => 
          codeUpper === excludedCode || 
          codeUpper.includes('EMAIL') || 
          codeUpper.includes('PHONE') || 
          codeUpper.includes('TEL')
        )
      })
      
      setActivityQuestions(filteredQuestions)

      // Get rateKey from the fresh activity data
      // Try multiple paths to find rateKey
      let rateKey: string | null = null
      
      // Method 1: Check modalities -> rates -> rateDetails
      if (freshActivity.modalities && Array.isArray(freshActivity.modalities)) {
        for (const modality of freshActivity.modalities) {
          if (modality.rates && Array.isArray(modality.rates)) {
            for (const rate of modality.rates) {
              if (rate.rateDetails && Array.isArray(rate.rateDetails)) {
                for (const rateDetail of rate.rateDetails) {
                  if (rateDetail.rateKey) {
                    rateKey = rateDetail.rateKey
                    break
                  }
                }
                if (rateKey) break
              }
              // Also check if rateKey is directly on rate object
              if (rate.rateKey && !rateKey) {
                rateKey = rate.rateKey
                break
              }
            }
            if (rateKey) break
          }
        }
      }
      
      // Method 2: Check if rateKey is at root level of activity
      if (!rateKey && freshActivity.rateKey) {
        rateKey = freshActivity.rateKey
      }
      
      // Method 3: Check rates array at root level
      if (!rateKey && freshActivity.rates && Array.isArray(freshActivity.rates)) {
        for (const rate of freshActivity.rates) {
            if (rate.rateKey) {
              rateKey = rate.rateKey
              break
            }
          if (rate.rateDetails && Array.isArray(rate.rateDetails)) {
            for (const rateDetail of rate.rateDetails) {
              if (rateDetail.rateKey) {
                rateKey = rateDetail.rateKey
                break
              }
            }
            if (rateKey) break
          }
        }
      }

      if (!rateKey) {
        // Fallback to old rateKey if fresh one not found
        rateKey = getRateKey(activity)
        if (!rateKey) {
          console.error('Fresh activity structure:', JSON.stringify(freshActivity, null, 2).substring(0, 2000))
          throw new Error('Rate key not found in fresh activity data. Please try again or select a different activity.')
        }
      }

      // Build passengers array for booking
      // IMPORTANT: Use the exact same ages that were used to generate the rateKey
      // The rateKey is tied to specific passenger ages, so we must match them exactly
      const bookingPassengers = passengers.map((passenger, index) => {
        const name = (formData.get(`passengerName_${index}`) as string).trim()
        const surname = (formData.get(`passengerSurname_${index}`) as string).trim()
        
        // For booking, use the age from the form if provided, otherwise use the original age
        // But ensure adults always use age 25 (as per API requirements)
        let age: number
        if (passenger.type === 'AD') {
          age = 25 // Adults always use age 25
        } else if (passenger.type === 'CH' || passenger.type === 'INF') {
          // For children/infants, use form age if provided, otherwise use original age
          const formAge = formData.get(`passengerAge_${index}`) as string
          age = formAge ? parseInt(formAge) : (passenger.age || (passenger.type === 'CH' ? 8 : 1))
        } else {
          age = 25 // Default to adult age
        }

        return {
          name,
          surname,
          age,
          type: passenger.type,
        }
      })
      
      // Build holder object
      const holder = {
        name: (formData.get('holderName') as string).trim(),
        surname: (formData.get('holderSurname') as string).trim(),
        email: (formData.get('holderEmail') as string).trim(),
        phone: (formData.get('holderPhone') as string).trim() || '',
      }

      // Build activity questions answers
      const answers = activityQuestions.map((question) => {
        const answer = (formData.get(`question_${question.code}`) as string)?.trim() || ''
        return {
          question: {
            code: question.code,
          },
          answer: answer,
        }
      }).filter(item => item.answer !== '') // Only include non-empty answers

      // Submit booking
      const response = await fetch('/api/hotelbeds/activities/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rateKey,
          paxes: bookingPassengers,
          holder,
          answers, // Include activity question answers
          bookingType: 'confirm', // Use 'preconfirm' if payment is needed
          clientReference: `ACT${Date.now()}`.substring(0, 20), // Max 20 characters
          language: 'ENG', // Will be converted to 'en' in API route
          dateFrom: dateFromParam, // Required for v3.0 API
          dateTo: dateToParam, // Required for v3.0 API
        }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Booking successful
      setBookingData(data.data)
      setBookingSuccess(true)
      
      // Store booking in sessionStorage for confirmation page
      try {
        sessionStorage.setItem('lastActivityBooking', JSON.stringify(data.data))
      } catch (e) {
        console.error('Failed to store booking:', e)
      }

    } catch (error: any) {
      console.error('Booking error:', error)
      setBookingError(error.message || 'Failed to complete booking')
    } finally {
      setBookingLoading(false)
    }
  }

  const renderSidebar = () => {
    if (!activity) return null

    const priceInfo = activity.fullData?.modalities?.[0]?.amountsFrom?.[0]
    const price = priceInfo ? parseFloat(priceInfo.amount) : activity.price
    const currency = activity.currency || activity.fullData?.currency || 'EUR'

    return (
      <div className="sticky top-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <div className="space-y-6">
          {/* Activity Image */}
          {activity.image && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <Image
                src={activity.image}
                alt={activity.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Activity Name */}
          <div>
            <h2 className="text-xl font-semibold">{activity.name}</h2>
            {activity.city && activity.country && (
              <div className="mt-1 flex items-center gap-x-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                <HugeiconsIcon icon={Location06Icon} size={16} strokeWidth={1.5} />
                <span>{activity.city}, {activity.country}</span>
              </div>
            )}
          </div>

          <Divider />

          {/* Price Summary */}
          <DescriptionList>
            <DescriptionTerm>Price per person</DescriptionTerm>
            <DescriptionDetails className="sm:text-right">
              {currency} {price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
            </DescriptionDetails>
            <DescriptionTerm>Adults</DescriptionTerm>
            <DescriptionDetails className="sm:text-right">{adults}</DescriptionDetails>
            {children > 0 && (
              <>
                <DescriptionTerm>Children</DescriptionTerm>
                <DescriptionDetails className="sm:text-right">{children}</DescriptionDetails>
              </>
            )}
            {infants > 0 && (
              <>
                <DescriptionTerm>Infants</DescriptionTerm>
                <DescriptionDetails className="sm:text-right">{infants}</DescriptionDetails>
              </>
            )}
            <DescriptionTerm className="font-semibold text-neutral-900">Total</DescriptionTerm>
            <DescriptionDetails className="font-semibold sm:text-right">
              {currency} {(price ? price * (adults + children) : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </DescriptionDetails>
          </DescriptionList>
        </div>
      </div>
    )
  }

  const renderMain = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-neutral-600 dark:text-neutral-400">Loading booking details...</div>
        </div>
      )
    }

    if (!activity) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-neutral-600 dark:text-neutral-400">Activity not found</div>
        </div>
      )
    }

    if (bookingSuccess && bookingData) {
      // Handle different response structures
      // API returns: { data: { booking: {...} } }
      // Or direct: { booking: {...} }
      const booking = bookingData.data?.booking || bookingData.booking || bookingData.data
      const activities = booking?.activities || []
      const holder = booking?.holder || bookingData.holder

      // Helper function to get destination name
      const getDestination = (activity: any) => {
        // Try contactInfo.country.destinations first (as per user spec)
        if (activity?.contactInfo?.country?.destinations?.length > 0) {
          return activity.contactInfo.country.destinations.map((d: any) => d.name).join(', ')
        }
        // Fallback to content.countries (as seen in test response)
        if (activity?.content?.countries?.length > 0) {
          const destinations: string[] = []
          activity.content.countries.forEach((country: any) => {
            if (country.destinations?.length > 0) {
              destinations.push(...country.destinations.map((d: any) => d.name))
            }
          })
          return destinations.join(', ')
        }
        return 'N/A'
      }

      // Helper function to get contract remarks
      const getContractRemarks = (activity: any) => {
        if (!activity?.comments || !Array.isArray(activity.comments)) return null
        const contractRemarks = activity.comments.find((comment: any) => comment.type === 'CONTRACT_REMARKS')
        return contractRemarks?.text || null
      }

      // Helper function to check if pax is a child (age < 18)
      const isChild = (pax: any) => {
        if (pax.paxType === 'CH' || pax.paxType === 'INF') return true
        if (pax.age !== undefined && pax.age < 18) return true
        return false
      }

      return (
        <div className="flex w-full flex-col gap-y-8 border-neutral-200 px-0 sm:rounded-4xl sm:border sm:p-6 xl:p-8 dark:border-neutral-700">
          <div className="text-center">
            <div className="mb-4 text-6xl">✅</div>
            <h1 className="text-3xl font-semibold lg:text-4xl">Booking Confirmed!</h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              Your activity booking has been confirmed successfully.
            </p>
          </div>

          <Divider />

          {/* Booking Reference */}
          <div>
            <SectionHeading>Booking Reference</SectionHeading>
            <DescriptionList>
              <DescriptionTerm>Reference Number</DescriptionTerm>
              <DescriptionDetails className="font-semibold text-lg">
                {booking?.reference || 'N/A'}
              </DescriptionDetails>
            </DescriptionList>
          </div>

          {/* Activity Details for each activity */}
          {activities.map((activity: any, activityIndex: number) => (
            <div key={activity.id || activity.activityReference || activity.code || `activity-${activityIndex}`}>
              <Divider />
              
              {/* Activity Name */}
              <div>
                <SectionHeading>Activity {activities.length > 1 ? `#${activityIndex + 1}` : ''}</SectionHeading>
                <DescriptionList>
                  <DescriptionTerm>Full Name of Excursion/Ticket</DescriptionTerm>
                  <DescriptionDetails className="font-medium">
                    {activity.name || 'N/A'}
                  </DescriptionDetails>
                  
                  {activity.modality?.name && (
                    <>
                      <DescriptionTerm>Modality Name</DescriptionTerm>
                      <DescriptionDetails>{activity.modality.name}</DescriptionDetails>
                    </>
                  )}
                </DescriptionList>
              </div>

              {/* Booking Date */}
              {booking?.creationDate && (
                <div>
                  <SectionHeading>Booking Information</SectionHeading>
                  <DescriptionList>
                    <DescriptionTerm>Date Booking Was Confirmed</DescriptionTerm>
                    <DescriptionDetails>
                      {new Date(booking.creationDate).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </DescriptionDetails>
                  </DescriptionList>
                </div>
              )}

              {/* Lead Pax Name */}
              {holder && (
                <div>
                  <SectionHeading>Lead Passenger</SectionHeading>
                  <DescriptionList>
                    <DescriptionTerm>Lead Pax Name</DescriptionTerm>
                    <DescriptionDetails>
                      {holder.name && holder.surname 
                        ? `${holder.name} ${holder.surname}`
                        : holder.name || holder.surname || 'N/A'}
                    </DescriptionDetails>
                  </DescriptionList>
                </div>
              )}

              {/* From and To Dates */}
              {(activity.dateFrom || activity.dateTo) && (
                <div>
                  <SectionHeading>Activity Dates</SectionHeading>
                  <DescriptionList>
                    <DescriptionTerm>From</DescriptionTerm>
                    <DescriptionDetails>
                      {activity.dateFrom 
                        ? new Date(activity.dateFrom).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </DescriptionDetails>
                    <DescriptionTerm>To</DescriptionTerm>
                    <DescriptionDetails>
                      {activity.dateTo 
                        ? new Date(activity.dateTo).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </DescriptionDetails>
                  </DescriptionList>
                </div>
              )}

              {/* Pax Distribution */}
              {activity.paxes && Array.isArray(activity.paxes) && activity.paxes.length > 0 && (
                <div>
                  <SectionHeading>Passenger Distribution</SectionHeading>
                  <div className="mt-4 space-y-3">
                    {activity.paxes.map((pax: any, paxIndex: number) => (
                      <div 
                        key={paxIndex} 
                        className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {pax.name && pax.surname 
                                ? `${pax.name} ${pax.surname}`
                                : pax.name || pax.surname || `Passenger ${paxIndex + 1}`}
                            </p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {pax.paxType === 'AD' ? 'Adult' : pax.paxType === 'CH' ? 'Child' : pax.paxType === 'INF' ? 'Infant' : pax.paxType || 'Passenger'}
                            </p>
                          </div>
                          {isChild(pax) && pax.age !== undefined && (
                            <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              Age: {pax.age}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Destination */}
              {getDestination(activity) !== 'N/A' && (
                <div>
                  <SectionHeading>Destination</SectionHeading>
                  <DescriptionList>
                    <DescriptionTerm>Destination (of confirmed activity)</DescriptionTerm>
                    <DescriptionDetails>{getDestination(activity)}</DescriptionDetails>
                  </DescriptionList>
                </div>
              )}

              {/* Remarks */}
              {getContractRemarks(activity) && (
                <div>
                  <SectionHeading>Remarks</SectionHeading>
                  <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                      {getContractRemarks(activity)}
                    </p>
                  </div>
                </div>
              )}

              {/* Provider Information */}
              {activity.providerInformation?.name && (
                <div>
                  <SectionHeading>Provider</SectionHeading>
                  <DescriptionList>
                    <DescriptionTerm>Provider</DescriptionTerm>
                    <DescriptionDetails>{activity.providerInformation.name}</DescriptionDetails>
                  </DescriptionList>
                </div>
              )}

              {/* Supplier Information */}
              {activity.supplier && (
                <div>
                  <SectionHeading>Bookable and Payable</SectionHeading>
                  <DescriptionList>
                    <DescriptionTerm>Supplier</DescriptionTerm>
                    <DescriptionDetails>
                      <div className="space-y-1">
                        <p className="font-medium">{activity.supplier.name || 'N/A'}</p>
                        {activity.supplier.vatNumber && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            VAT: {activity.supplier.vatNumber}
                          </p>
                        )}
                      </div>
                    </DescriptionDetails>
                  </DescriptionList>
                </div>
              )}
            </div>
          ))}

          {/* Voucher Information */}
          {booking?.vouchers && Array.isArray(booking.vouchers) && booking.vouchers.length > 0 && (
            <>
              <Divider />
              <div>
                <SectionHeading>Voucher</SectionHeading>
                <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                  Please use the voucher provided by Hotelbeds. Click the link below to download:
                </p>
                <div className="space-y-2">
                  {booking.vouchers.map((voucher: any, index: number) => (
                    <a
                      key={index}
                      href={voucher.url || voucher}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-primary-200 bg-primary-50 p-4 text-primary-700 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-300"
                    >
                      Download Voucher {voucher.type || `#${index + 1}`}
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          <Divider />

          <div className="flex gap-4">
            <ButtonPrimary onClick={() => router.push('/activities')} className="flex-1">
              Book Another Activity
            </ButtonPrimary>
            <ButtonPrimary onClick={() => router.push('/')} className="flex-1" color="light">
              Go Home
            </ButtonPrimary>
          </div>
        </div>
      )
    }

    return (
      <form
        onSubmit={handleSubmitForm}
        className="flex w-full flex-col gap-y-8 border-neutral-200 px-0 sm:rounded-4xl sm:border sm:p-6 xl:p-8 dark:border-neutral-700"
      >
        <h1 className="text-3xl font-semibold lg:text-4xl">Confirm booking</h1>
        <Divider />

        {/* Activity Details */}
        <div>
          <SectionHeading>Activity Details</SectionHeading>
          <DescriptionList>
            <DescriptionTerm>Activity</DescriptionTerm>
            <DescriptionDetails>{activity.name}</DescriptionDetails>
            {activity.city && activity.country && (
              <>
                <DescriptionTerm>Location</DescriptionTerm>
                <DescriptionDetails>{activity.city}, {activity.country}</DescriptionDetails>
              </>
            )}
            {activity.duration && (
              <>
                <DescriptionTerm>Duration</DescriptionTerm>
                <DescriptionDetails>{activity.duration}</DescriptionDetails>
              </>
            )}
          </DescriptionList>
        </div>

        <Divider />

        {/* Contact Information */}
        <div>
          <SectionHeading>Contact Information</SectionHeading>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <Field>
              <Label>First Name *</Label>
              <Input
                name="holderName"
                className={`mt-1.5 ${fieldErrors.holderName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="John"
                onChange={() => handleFieldChange('holderName')}
                required
              />
              {fieldErrors.holderName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.holderName}</p>
              )}
            </Field>
            <Field>
              <Label>Last Name *</Label>
              <Input
                name="holderSurname"
                className={`mt-1.5 ${fieldErrors.holderSurname ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Doe"
                onChange={() => handleFieldChange('holderSurname')}
                required
              />
              {fieldErrors.holderSurname && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.holderSurname}</p>
              )}
            </Field>
            <Field className="sm:col-span-2">
              <Label>Email *</Label>
              <Input
                name="holderEmail"
                type="email"
                className={`mt-1.5 ${fieldErrors.holderEmail ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="john.doe@example.com"
                onChange={() => handleFieldChange('holderEmail')}
                required
              />
              {fieldErrors.holderEmail && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.holderEmail}</p>
              )}
            </Field>
            <Field className="sm:col-span-2">
              <Label>Phone Number</Label>
              <Input
                name="holderPhone"
                type="tel"
                className="mt-1.5"
                placeholder="+1234567890"
                onChange={() => handleFieldChange('holderPhone')}
              />
            </Field>
          </div>
        </div>

        <Divider />

        {/* Activity Questions */}
        {activityQuestions.length > 0 && (
          <>
            <div>
              <SectionHeading>Additional Information</SectionHeading>
              <Description className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Please provide the following information required for your activity booking.
              </Description>
              <div className="mt-4 space-y-6">
                {activityQuestions.map((question) => (
                  <Field key={question.code}>
                    <Label>
                      {question.text} {question.required && '*'}
                    </Label>
                    <Input
                      name={`question_${question.code}`}
                      className={`mt-1.5 ${
                        fieldErrors[`question_${question.code}`]
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : ''
                      }`}
                      placeholder={`Enter ${question.text.toLowerCase()}`}
                      onChange={() => handleFieldChange(`question_${question.code}` as keyof FieldErrors)}
                      required={question.required}
                    />
                    {fieldErrors[`question_${question.code}`] && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {fieldErrors[`question_${question.code}`]}
                      </p>
                    )}
                  </Field>
                ))}
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* Passenger Information */}
        <div>
          <SectionHeading>Passenger Information</SectionHeading>
          <div className="mt-4 space-y-6">
            {passengers.map((passenger, index) => (
              <div key={index} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
                <h3 className="mb-4 font-medium">
                  {passenger.type === 'AD' ? 'Adult' : passenger.type === 'CH' ? 'Child' : 'Infant'} {index + 1}
                </h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field>
                    <Label>First Name *</Label>
                    <Input
                      name={`passengerName_${index}`}
                      className={`mt-1.5 ${fieldErrors.passengerName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="First name"
                      onChange={() => handleFieldChange('passengerName')}
                      required
                    />
                  </Field>
                  <Field>
                    <Label>Last Name *</Label>
                    <Input
                      name={`passengerSurname_${index}`}
                      className={`mt-1.5 ${fieldErrors.passengerSurname ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Last name"
                      onChange={() => handleFieldChange('passengerSurname')}
                      required
                    />
                  </Field>
                  {(passenger.type === 'CH' || passenger.type === 'INF') && (
                    <Field>
                      <Label>Age *</Label>
                      <Input
                        name={`passengerAge_${index}`}
                        type="number"
                        min="0"
                        max="17"
                        className={`mt-1.5 ${fieldErrors.passengerAge ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Age"
                        defaultValue={passenger.age}
                        onChange={() => handleFieldChange('passengerAge')}
                        required
                      />
                      {fieldErrors.passengerAge && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.passengerAge}</p>
                      )}
                    </Field>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {bookingError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{bookingError}</p>
          </div>
        )}

        <div>
          <ButtonPrimary
            type="submit"
            className="mt-10 w-full text-base/6!"
            disabled={bookingLoading}
          >
            {bookingLoading ? 'Processing...' : 'Confirm Booking'}
          </ButtonPrimary>
        </div>
      </form>
    )
  }

  return (
    <main className="container mt-10 mb-24 flex flex-col gap-14 lg:mb-32 lg:flex-row lg:gap-10">
      <div className="w-full lg:w-3/5 xl:w-2/3">{renderMain()}</div>
      <Divider className="block lg:hidden" />
      <div className="grow">{renderSidebar()}</div>
    </main>
  )
}

