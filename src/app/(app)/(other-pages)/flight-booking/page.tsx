'use client'

import ButtonPrimary from '@/shared/ButtonPrimary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import { Description, Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { TFlightListing } from '@/data/listings'

interface FieldErrors {
  title?: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  gender?: string
  passportNumber?: string
  passportExpiry?: string
  nationality?: string
  email?: string
  phone?: string
  countryCode?: string
}

const Page = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [flightData, setFlightData] = useState<TFlightListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'instant',
    })

    // Get flight data from URL parameters
    const flightDataParam = searchParams.get('data')
    if (flightDataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(flightDataParam))
        // Convert date strings back to Date objects
        if (decoded.departureTime) {
          decoded.departureTime = new Date(decoded.departureTime)
        }
        if (decoded.arrivalTime) {
          decoded.arrivalTime = new Date(decoded.arrivalTime)
        }
        // Convert segment dates if they exist
        if (decoded.segments && Array.isArray(decoded.segments)) {
          decoded.segments = decoded.segments.map((segment: any) => ({
            ...segment,
            departureTime: segment.departureTime ? new Date(segment.departureTime) : new Date(),
            arrivalTime: segment.arrivalTime ? new Date(segment.arrivalTime) : new Date(),
          }))
        }
        setFlightData(decoded)
      } catch (error) {
        console.error('Error parsing flight data:', error)
      }
    }
    setLoading(false)
  }, [searchParams])

  const handleFieldChange = (fieldName: keyof FieldErrors) => {
    // Clear error for this specific field when user starts typing/selecting
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const validateForm = (formObject: Record<string, string>): FieldErrors => {
    const errors: FieldErrors = {}

    // Title validation
    if (!formObject.title || formObject.title.trim() === '') {
      errors.title = 'Title is required'
    }

    // First name validation
    if (!formObject.firstName || formObject.firstName.trim() === '') {
      errors.firstName = 'First name is required'
    } else if (formObject.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters'
    } else if (!/^[a-zA-Z\s'-]+$/.test(formObject.firstName.trim())) {
      errors.firstName = 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }

    // Last name validation
    if (!formObject.lastName || formObject.lastName.trim() === '') {
      errors.lastName = 'Last name is required'
    } else if (formObject.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters'
    } else if (!/^[a-zA-Z\s'-]+$/.test(formObject.lastName.trim())) {
      errors.lastName = 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }

    // Date of birth validation
    if (!formObject.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required'
    } else {
      const dob = new Date(formObject.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      
      if (dob > today) {
        errors.dateOfBirth = 'Date of birth cannot be in the future'
      } else if (age < 0 || (age === 0 && monthDiff < 0)) {
        errors.dateOfBirth = 'Invalid date of birth'
      } else if (age > 120) {
        errors.dateOfBirth = 'Please enter a valid date of birth'
      }
    }

    // Gender validation
    if (!formObject.gender || formObject.gender.trim() === '') {
      errors.gender = 'Gender is required'
    }

    // Passport number validation
    if (!formObject.passportNumber || formObject.passportNumber.trim() === '') {
      errors.passportNumber = 'Passport number is required'
    } else if (formObject.passportNumber.trim().length < 6) {
      errors.passportNumber = 'Passport number must be at least 6 characters'
    } else if (!/^[A-Z0-9]+$/.test(formObject.passportNumber.trim().toUpperCase())) {
      errors.passportNumber = 'Passport number can only contain letters and numbers'
    }

    // Passport expiry validation
    if (!formObject.passportExpiry) {
      errors.passportExpiry = 'Passport expiry date is required'
    } else {
      const expiry = new Date(formObject.passportExpiry)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (expiry <= today) {
        errors.passportExpiry = 'Passport must be valid (expiry date must be in the future)'
      }
      
      // Check if passport expires within 6 months (common travel requirement)
      const sixMonthsFromNow = new Date()
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
      if (expiry <= sixMonthsFromNow) {
        errors.passportExpiry = 'Passport should be valid for at least 6 months from today'
      }
    }

    // Nationality validation
    if (!formObject.nationality || formObject.nationality.trim() === '') {
      errors.nationality = 'Nationality is required'
    }

    // Email validation
    if (!formObject.email || formObject.email.trim() === '') {
      errors.email = 'Email address is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formObject.email.trim())) {
        errors.email = 'Please enter a valid email address'
      }
    }

    // Country code validation
    if (!formObject.countryCode || formObject.countryCode.trim() === '') {
      errors.countryCode = 'Country code is required'
    } else {
      const countryCodeRegex = /^\d{1,3}$/
      if (!countryCodeRegex.test(formObject.countryCode.trim())) {
        errors.countryCode = 'Country code must be 1-3 digits (e.g., 61 for Australia)'
      }
    }

    // Phone validation
    if (!formObject.phone || formObject.phone.trim() === '') {
      errors.phone = 'Phone number is required'
    } else {
      const phoneRegex = /^[0-9\s\-\(\)]+$/
      const cleanedPhone = formObject.phone.replace(/[\s\-\(\)]/g, '')
      if (cleanedPhone.length < 6 || cleanedPhone.length > 15) {
        errors.phone = 'Phone number must be between 6 and 15 digits'
      } else if (!phoneRegex.test(formObject.phone.trim())) {
        errors.phone = 'Phone number can only contain digits, spaces, hyphens, and parentheses'
      }
    }

    return errors
  }

  const handleSubmitForm = async (formData: FormData) => {
    if (!flightData) return

    setBookingLoading(true)
    setBookingError(null)
    setFieldErrors({})

    try {
      const formObject = Object.fromEntries(formData.entries()) as Record<string, string>
      
      // Validate form
      const errors = validateForm(formObject)
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setBookingLoading(false)
        // Scroll to first error
        const firstErrorField = Object.keys(errors)[0]
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`)
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          ;(errorElement as HTMLElement).focus()
        }
        return
      }
      
      // Prepare booking data
      const bookingData = {
        flightData: flightData,
        passenger: {
          title: formObject.title,
          firstName: formObject.firstName.trim(),
          lastName: formObject.lastName.trim(),
          dateOfBirth: formObject.dateOfBirth,
          gender: formObject.gender,
          passportNumber: formObject.passportNumber.trim().toUpperCase(),
          passportExpiry: formObject.passportExpiry,
          nationality: formObject.nationality,
        },
        contact: {
          email: formObject.email.trim(),
          phone: formObject.phone.trim(),
          countryCode: formObject.countryCode.trim(),
        },
      }

      // Detect provider based on originalOffer structure
      // Amadeus offers have 'itineraries' property
      // Duffel offers have 'slices' property
      const originalOffer = flightData.originalOffer
      let bookingApiUrl = '/api/amadeus/book-flight' // Default to Amadeus
      
      if (originalOffer) {
        if (originalOffer.slices && Array.isArray(originalOffer.slices)) {
          // This is a Duffel offer
          bookingApiUrl = '/api/duffel/book-flight'
        } else if (originalOffer.itineraries && Array.isArray(originalOffer.itineraries)) {
          // This is an Amadeus offer
          bookingApiUrl = '/api/amadeus/book-flight'
        }
      }

      // Call booking API based on provider
      const response = await fetch(bookingApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to book flight')
      }

      // Redirect to success page with booking confirmation and data
      const bookingDataParam = encodeURIComponent(JSON.stringify({
        bookingId: result.bookingId || 'confirmed',
        bookingData: result.data,
        flightData: flightData,
        passenger: bookingData.passenger,
        contact: bookingData.contact,
      }))
      router.push(`/pay-done?type=flight&data=${bookingDataParam}`)
    } catch (error: any) {
      console.error('Booking error:', error)
      setBookingError(error.message || 'Failed to book flight. Please try again.')
      setBookingLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderSidebar = () => {
    if (!flightData) return null

    const priceValue = flightData.price.replace(/[^0-9]/g, '')
    const basePrice = parseInt(priceValue) || 0
    const serviceCharge = 0
    const fee = 0
    const tax = Math.round(basePrice * 0.1) // 10% tax
    const total = basePrice + serviceCharge + fee + tax

    return (
      <div className="flex w-full flex-col gap-y-6 border-neutral-200 px-0 sm:gap-y-8 sm:rounded-4xl sm:p-6 lg:border xl:p-8 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <div className="w-full shrink-0 sm:w-24">
            <div className="aspect-w-1 overflow-hidden rounded-2xl aspect-h-1">
              <Image
                alt={flightData.airlines.name}
                fill
                sizes="96px"
                src={flightData.airlines.logo}
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://www.gstatic.com/flights/airline_logos/70px/XX.png`
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-y-3 py-5 text-start sm:ps-5">
            <div>
              <span className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                {flightData.departure} → {flightData.arrival}
              </span>
              <span className="mt-1 block text-base font-medium">{flightData.airlines.fullName || flightData.airlines.name}</span>
            </div>
            <p className="block text-sm text-neutral-500 dark:text-neutral-400">
              {formatDate(flightData.departureTime)} · {formatTime(flightData.departureTime)} - {formatTime(flightData.arrivalTime)}
            </p>
            <p className="block text-sm text-neutral-500 dark:text-neutral-400">
              {flightData.duration} · {flightData.stopNumber === 0 ? 'Non-stop' : `${flightData.stopNumber} stop${flightData.stopNumber > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <Divider className="block lg:hidden" />

        <DescriptionList>
          <DescriptionTerm>Flight price</DescriptionTerm>
          <DescriptionDetails className="sm:text-right">{flightData.price}</DescriptionDetails>
          <DescriptionTerm>Service charge</DescriptionTerm>
          <DescriptionDetails className="sm:text-right">A$0.00</DescriptionDetails>
          <DescriptionTerm>Fee</DescriptionTerm>
          <DescriptionDetails className="sm:text-right">A$0.00</DescriptionDetails>
          <DescriptionTerm>Tax</DescriptionTerm>
          <DescriptionDetails className="sm:text-right">A${tax.toLocaleString()}</DescriptionDetails>
          <DescriptionTerm className="font-semibold text-neutral-900">Total</DescriptionTerm>
          <DescriptionDetails className="font-semibold sm:text-right">A${total.toLocaleString()}</DescriptionDetails>
        </DescriptionList>
      </div>
    )
  }

  const renderMain = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-neutral-600 dark:text-neutral-400">Loading...</div>
        </div>
      )
    }

    if (!flightData) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-neutral-600 dark:text-neutral-400">Flight data not found</div>
        </div>
      )
    }

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          handleSubmitForm(formData)
        }}
        className="flex w-full flex-col gap-y-8 border-neutral-200 px-0 sm:rounded-4xl sm:border sm:p-6 xl:p-8 dark:border-neutral-700"
      >
        <h1 className="text-3xl font-semibold lg:text-4xl">Confirm booking</h1>
        <Divider />
        
        {/* Flight Details */}
        <div>
          <h3 className="text-2xl font-semibold">Your flight</h3>
          <div className="mt-6 space-y-4 rounded-3xl border border-neutral-200 p-6 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Route</div>
                <div className="mt-1 text-lg font-semibold">{flightData.departure} → {flightData.arrival}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Airline</div>
                <div className="mt-1 text-lg font-semibold">{flightData.airlines.fullName || flightData.airlines.name}</div>
              </div>
            </div>
            <Divider />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Departure</div>
                <div className="mt-1 font-semibold">{formatTime(flightData.departureTime)}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(flightData.departureTime)}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Arrival</div>
                <div className="mt-1 font-semibold">{formatTime(flightData.arrivalTime)}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(flightData.arrivalTime)}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Duration</div>
                <div className="mt-1 font-semibold">{flightData.duration}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">Stops</div>
                <div className="mt-1 font-semibold">{flightData.stopNumber === 0 ? 'Non-stop' : `${flightData.stopNumber} stop${flightData.stopNumber > 1 ? 's' : ''}`}</div>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        {/* Passenger Information */}
        <div>
          <h3 className="text-2xl font-semibold">Passenger Information</h3>
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Field>
                <Label>Title</Label>
                <Select 
                  name="title" 
                  className={`mt-1.5 ${fieldErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  onChange={() => handleFieldChange('title')}
                >
                  <option value="">Select title</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr">Dr</option>
                </Select>
                {fieldErrors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.title}</p>
                )}
              </Field>
              <Field>
                <Label>First Name</Label>
                <Input 
                  name="firstName" 
                  className={`mt-1.5 ${fieldErrors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="First name"
                  onChange={() => handleFieldChange('firstName')}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.firstName}</p>
                )}
              </Field>
              <Field>
                <Label>Last Name</Label>
                <Input 
                  name="lastName" 
                  className={`mt-1.5 ${fieldErrors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Last name"
                  onChange={() => handleFieldChange('lastName')}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.lastName}</p>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Date of Birth</Label>
                <Input 
                  name="dateOfBirth" 
                  type="date" 
                  className={`mt-1.5 ${fieldErrors.dateOfBirth ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  onChange={() => handleFieldChange('dateOfBirth')}
                />
                {fieldErrors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.dateOfBirth}</p>
                )}
              </Field>
              <Field>
                <Label>Gender</Label>
                <Select 
                  name="gender" 
                  className={`mt-1.5 ${fieldErrors.gender ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  onChange={() => handleFieldChange('gender')}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>
                {fieldErrors.gender && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.gender}</p>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label>Passport Number</Label>
                <Input 
                  name="passportNumber" 
                  className={`mt-1.5 ${fieldErrors.passportNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Passport number"
                  onChange={() => handleFieldChange('passportNumber')}
                />
                <Description>Enter your passport number exactly as it appears on your passport</Description>
                {fieldErrors.passportNumber && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.passportNumber}</p>
                )}
              </Field>
              <Field>
                <Label>Passport Expiry Date</Label>
                <Input 
                  name="passportExpiry" 
                  type="date" 
                  className={`mt-1.5 ${fieldErrors.passportExpiry ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  onChange={() => handleFieldChange('passportExpiry')}
                />
                {fieldErrors.passportExpiry && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.passportExpiry}</p>
                )}
              </Field>
            </div>

            <Field>
              <Label>Nationality</Label>
              <Select 
                name="nationality" 
                className={`mt-1.5 ${fieldErrors.nationality ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                onChange={() => handleFieldChange('nationality')}
              >
                <option value="">Select nationality</option>
                <option value="AU">Australia</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="NZ">New Zealand</option>
                <option value="IN">India</option>
                <option value="CN">China</option>
                <option value="JP">Japan</option>
                <option value="KR">South Korea</option>
                <option value="SG">Singapore</option>
                <option value="MY">Malaysia</option>
                <option value="TH">Thailand</option>
                <option value="ID">Indonesia</option>
                <option value="PH">Philippines</option>
                <option value="VN">Vietnam</option>
                <option value="FR">France</option>
                <option value="DE">Germany</option>
                <option value="IT">Italy</option>
                <option value="ES">Spain</option>
                <option value="NL">Netherlands</option>
                <option value="BE">Belgium</option>
                <option value="CH">Switzerland</option>
                <option value="AT">Austria</option>
                <option value="SE">Sweden</option>
                <option value="NO">Norway</option>
                <option value="DK">Denmark</option>
                <option value="FI">Finland</option>
                <option value="PL">Poland</option>
                <option value="PT">Portugal</option>
                <option value="GR">Greece</option>
                <option value="IE">Ireland</option>
                <option value="BR">Brazil</option>
                <option value="MX">Mexico</option>
                <option value="AR">Argentina</option>
                <option value="ZA">South Africa</option>
                <option value="EG">Egypt</option>
                <option value="AE">United Arab Emirates</option>
                <option value="SA">Saudi Arabia</option>
                <option value="IL">Israel</option>
                <option value="TR">Turkey</option>
                <option value="RU">Russia</option>
                <option value="Other">Other</option>
              </Select>
              {fieldErrors.nationality && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.nationality}</p>
              )}
            </Field>
          </div>
        </div>

        <Divider />

        {/* Contact Information */}
        <div>
          <h3 className="text-2xl font-semibold">Contact Information</h3>
          <div className="mt-6 space-y-6">
            <Field>
              <Label>Email Address</Label>
              <Input 
                name="email" 
                type="email" 
                className={`mt-1.5 ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="example@email.com"
                onChange={() => handleFieldChange('email')}
              />
              <Description>We&apos;ll send your booking confirmation to this email</Description>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.email}</p>
              )}
            </Field>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Field>
                <Label>Country Code</Label>
                <Select 
                  name="countryCode" 
                  className={`mt-1.5 ${fieldErrors.countryCode ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  onChange={() => handleFieldChange('countryCode')}
                >
                  <option value="">Select country code</option>
                  <option value="1">+1 (USA/Canada)</option>
                  <option value="7">+7 (Russia/Kazakhstan)</option>
                  <option value="20">+20 (Egypt)</option>
                  <option value="27">+27 (South Africa)</option>
                  <option value="30">+30 (Greece)</option>
                  <option value="31">+31 (Netherlands)</option>
                  <option value="32">+32 (Belgium)</option>
                  <option value="33">+33 (France)</option>
                  <option value="34">+34 (Spain)</option>
                  <option value="36">+36 (Hungary)</option>
                  <option value="39">+39 (Italy)</option>
                  <option value="40">+40 (Romania)</option>
                  <option value="41">+41 (Switzerland)</option>
                  <option value="43">+43 (Austria)</option>
                  <option value="44">+44 (United Kingdom)</option>
                  <option value="45">+45 (Denmark)</option>
                  <option value="46">+46 (Sweden)</option>
                  <option value="47">+47 (Norway)</option>
                  <option value="48">+48 (Poland)</option>
                  <option value="49">+49 (Germany)</option>
                  <option value="51">+51 (Peru)</option>
                  <option value="52">+52 (Mexico)</option>
                  <option value="53">+53 (Cuba)</option>
                  <option value="54">+54 (Argentina)</option>
                  <option value="55">+55 (Brazil)</option>
                  <option value="56">+56 (Chile)</option>
                  <option value="57">+57 (Colombia)</option>
                  <option value="58">+58 (Venezuela)</option>
                  <option value="60">+60 (Malaysia)</option>
                  <option value="61">+61 (Australia)</option>
                  <option value="62">+62 (Indonesia)</option>
                  <option value="63">+63 (Philippines)</option>
                  <option value="64">+64 (New Zealand)</option>
                  <option value="65">+65 (Singapore)</option>
                  <option value="66">+66 (Thailand)</option>
                  <option value="81">+81 (Japan)</option>
                  <option value="82">+82 (South Korea)</option>
                  <option value="84">+84 (Vietnam)</option>
                  <option value="86">+86 (China)</option>
                  <option value="90">+90 (Turkey)</option>
                  <option value="91">+91 (India)</option>
                  <option value="92">+92 (Pakistan)</option>
                  <option value="93">+93 (Afghanistan)</option>
                  <option value="94">+94 (Sri Lanka)</option>
                  <option value="95">+95 (Myanmar)</option>
                  <option value="98">+98 (Iran)</option>
                  <option value="212">+212 (Morocco)</option>
                  <option value="213">+213 (Algeria)</option>
                  <option value="216">+216 (Tunisia)</option>
                  <option value="218">+218 (Libya)</option>
                  <option value="220">+220 (Gambia)</option>
                  <option value="221">+221 (Senegal)</option>
                  <option value="222">+222 (Mauritania)</option>
                  <option value="223">+223 (Mali)</option>
                  <option value="224">+224 (Guinea)</option>
                  <option value="225">+225 (Ivory Coast)</option>
                  <option value="226">+226 (Burkina Faso)</option>
                  <option value="227">+227 (Niger)</option>
                  <option value="228">+228 (Togo)</option>
                  <option value="229">+229 (Benin)</option>
                  <option value="230">+230 (Mauritius)</option>
                  <option value="231">+231 (Liberia)</option>
                  <option value="232">+232 (Sierra Leone)</option>
                  <option value="233">+233 (Ghana)</option>
                  <option value="234">+234 (Nigeria)</option>
                  <option value="235">+235 (Chad)</option>
                  <option value="236">+236 (Central African Republic)</option>
                  <option value="237">+237 (Cameroon)</option>
                  <option value="238">+238 (Cape Verde)</option>
                  <option value="239">+239 (São Tomé and Príncipe)</option>
                  <option value="240">+240 (Equatorial Guinea)</option>
                  <option value="241">+241 (Gabon)</option>
                  <option value="242">+242 (Republic of the Congo)</option>
                  <option value="243">+243 (DR Congo)</option>
                  <option value="244">+244 (Angola)</option>
                  <option value="245">+245 (Guinea-Bissau)</option>
                  <option value="246">+246 (British Indian Ocean Territory)</option>
                  <option value="248">+248 (Seychelles)</option>
                  <option value="249">+249 (Sudan)</option>
                  <option value="250">+250 (Rwanda)</option>
                  <option value="251">+251 (Ethiopia)</option>
                  <option value="252">+252 (Somalia)</option>
                  <option value="253">+253 (Djibouti)</option>
                  <option value="254">+254 (Kenya)</option>
                  <option value="255">+255 (Tanzania)</option>
                  <option value="256">+256 (Uganda)</option>
                  <option value="257">+257 (Burundi)</option>
                  <option value="258">+258 (Mozambique)</option>
                  <option value="260">+260 (Zambia)</option>
                  <option value="261">+261 (Madagascar)</option>
                  <option value="262">+262 (Réunion/Mayotte)</option>
                  <option value="263">+263 (Zimbabwe)</option>
                  <option value="264">+264 (Namibia)</option>
                  <option value="265">+265 (Malawi)</option>
                  <option value="266">+266 (Lesotho)</option>
                  <option value="267">+267 (Botswana)</option>
                  <option value="268">+268 (Eswatini)</option>
                  <option value="269">+269 (Comoros)</option>
                  <option value="290">+290 (Saint Helena)</option>
                  <option value="291">+291 (Eritrea)</option>
                  <option value="297">+297 (Aruba)</option>
                  <option value="298">+298 (Faroe Islands)</option>
                  <option value="299">+299 (Greenland)</option>
                  <option value="350">+350 (Gibraltar)</option>
                  <option value="351">+351 (Portugal)</option>
                  <option value="352">+352 (Luxembourg)</option>
                  <option value="353">+353 (Ireland)</option>
                  <option value="354">+354 (Iceland)</option>
                  <option value="355">+355 (Albania)</option>
                  <option value="356">+356 (Malta)</option>
                  <option value="357">+357 (Cyprus)</option>
                  <option value="358">+358 (Finland)</option>
                  <option value="359">+359 (Bulgaria)</option>
                  <option value="370">+370 (Lithuania)</option>
                  <option value="371">+371 (Latvia)</option>
                  <option value="372">+372 (Estonia)</option>
                  <option value="373">+373 (Moldova)</option>
                  <option value="374">+374 (Armenia)</option>
                  <option value="375">+375 (Belarus)</option>
                  <option value="376">+376 (Andorra)</option>
                  <option value="377">+377 (Monaco)</option>
                  <option value="378">+378 (San Marino)</option>
                  <option value="380">+380 (Ukraine)</option>
                  <option value="381">+381 (Serbia)</option>
                  <option value="382">+382 (Montenegro)</option>
                  <option value="383">+383 (Kosovo)</option>
                  <option value="385">+385 (Croatia)</option>
                  <option value="386">+386 (Slovenia)</option>
                  <option value="387">+387 (Bosnia and Herzegovina)</option>
                  <option value="389">+389 (North Macedonia)</option>
                  <option value="420">+420 (Czech Republic)</option>
                  <option value="421">+421 (Slovakia)</option>
                  <option value="423">+423 (Liechtenstein)</option>
                  <option value="500">+500 (Falkland Islands)</option>
                  <option value="501">+501 (Belize)</option>
                  <option value="502">+502 (Guatemala)</option>
                  <option value="503">+503 (El Salvador)</option>
                  <option value="504">+504 (Honduras)</option>
                  <option value="505">+505 (Nicaragua)</option>
                  <option value="506">+506 (Costa Rica)</option>
                  <option value="507">+507 (Panama)</option>
                  <option value="508">+508 (Saint Pierre and Miquelon)</option>
                  <option value="509">+509 (Haiti)</option>
                  <option value="590">+590 (Guadeloupe)</option>
                  <option value="591">+591 (Bolivia)</option>
                  <option value="592">+592 (Guyana)</option>
                  <option value="593">+593 (Ecuador)</option>
                  <option value="594">+594 (French Guiana)</option>
                  <option value="595">+595 (Paraguay)</option>
                  <option value="596">+596 (Martinique)</option>
                  <option value="597">+597 (Suriname)</option>
                  <option value="598">+598 (Uruguay)</option>
                  <option value="599">+599 (Curaçao)</option>
                  <option value="670">+670 (East Timor)</option>
                  <option value="672">+672 (Antarctica)</option>
                  <option value="673">+673 (Brunei)</option>
                  <option value="674">+674 (Nauru)</option>
                  <option value="675">+675 (Papua New Guinea)</option>
                  <option value="676">+676 (Tonga)</option>
                  <option value="677">+677 (Solomon Islands)</option>
                  <option value="678">+678 (Vanuatu)</option>
                  <option value="679">+679 (Fiji)</option>
                  <option value="680">+680 (Palau)</option>
                  <option value="681">+681 (Wallis and Futuna)</option>
                  <option value="682">+682 (Cook Islands)</option>
                  <option value="683">+683 (Niue)</option>
                  <option value="685">+685 (Samoa)</option>
                  <option value="686">+686 (Kiribati)</option>
                  <option value="687">+687 (New Caledonia)</option>
                  <option value="688">+688 (Tuvalu)</option>
                  <option value="689">+689 (French Polynesia)</option>
                  <option value="690">+690 (Tokelau)</option>
                  <option value="691">+691 (Micronesia)</option>
                  <option value="692">+692 (Marshall Islands)</option>
                  <option value="850">+850 (North Korea)</option>
                  <option value="852">+852 (Hong Kong)</option>
                  <option value="853">+853 (Macau)</option>
                  <option value="855">+855 (Cambodia)</option>
                  <option value="856">+856 (Laos)</option>
                  <option value="880">+880 (Bangladesh)</option>
                  <option value="886">+886 (Taiwan)</option>
                  <option value="960">+960 (Maldives)</option>
                  <option value="961">+961 (Lebanon)</option>
                  <option value="962">+962 (Jordan)</option>
                  <option value="963">+963 (Syria)</option>
                  <option value="964">+964 (Iraq)</option>
                  <option value="965">+965 (Kuwait)</option>
                  <option value="966">+966 (Saudi Arabia)</option>
                  <option value="967">+967 (Yemen)</option>
                  <option value="968">+968 (Oman)</option>
                  <option value="970">+970 (Palestine)</option>
                  <option value="971">+971 (United Arab Emirates)</option>
                  <option value="972">+972 (Israel)</option>
                  <option value="973">+973 (Bahrain)</option>
                  <option value="974">+974 (Qatar)</option>
                  <option value="975">+975 (Bhutan)</option>
                  <option value="976">+976 (Mongolia)</option>
                  <option value="977">+977 (Nepal)</option>
                  <option value="992">+992 (Tajikistan)</option>
                  <option value="993">+993 (Turkmenistan)</option>
                  <option value="994">+994 (Azerbaijan)</option>
                  <option value="995">+995 (Georgia)</option>
                  <option value="996">+996 (Kyrgyzstan)</option>
                  <option value="998">+998 (Uzbekistan)</option>
                </Select>
                <Description>Select your country calling code</Description>
                {fieldErrors.countryCode && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.countryCode}</p>
                )}
              </Field>
              <Field className="sm:col-span-2">
                <Label>Phone Number</Label>
                <Input 
                  name="phone" 
                  type="tel" 
                  className={`mt-1.5 ${fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="400 000 000"
                  onChange={() => handleFieldChange('phone')}
                />
                <Description>Phone number without country code</Description>
                {fieldErrors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.phone}</p>
                )}
              </Field>
            </div>
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
            className="mt-10 text-base/6!" 
            disabled={bookingLoading}
          >
            {bookingLoading ? 'Booking...' : 'Confirm booking'}
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

export default Page

