'use client'

import T from '@/utils/getT'
import clsx from 'clsx'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ButtonSubmit, DateRangeField, GuestNumberField, LocationInputField, VerticalDividerLine } from './ui'

interface Props {
  className?: string
  formStyle: 'default' | 'small'
  initialValues?: {
    from?: string
    fromCode?: string
    departureDate?: string
    returnDate?: string
    adults?: number
    children?: number
    infants?: number
  }
}

export const ExperiencesSearchForm = ({ className, formStyle = 'default', initialValues }: Props) => {
  const router = useRouter()

  // Prefetch the experience categories page to improve performance
  useEffect(() => {
    router.prefetch('/experience-categories/all')
  }, [router])

  const handleFormSubmit = async (formData: FormData) => {
    const formDataEntries = Object.fromEntries(formData.entries())

    try {
      const location = formDataEntries['location'] as string
      const locationCode = formDataEntries['location_code'] as string
      const checkin = formDataEntries['checkin'] as string
      const checkout = formDataEntries['checkout'] as string
      const guestAdults = parseInt(formDataEntries['guestAdults'] as string) || 1
      const guestChildren = parseInt(formDataEntries['guestChildren'] as string) || 0
      const guestInfants = parseInt(formDataEntries['guestInfants'] as string) || 0

      if (!location || !checkin || !checkout) {
        console.error('Missing required fields: location, checkin, checkout')
        return
      }

      // Destination code is required for Hotelbeds Activities API
      if (!locationCode) {
        console.error('Missing destination code. Please select a destination from the suggestions.')
        alert('Please select a destination from the suggestions to search for activities.')
        return
      }

      // Format dates for Hotelbeds API (YYYY-MM-DD)
      const dateFrom = checkin
      const dateTo = checkout

      // Prepare paxes array for Hotelbeds Activities API
      // Activities API requires paxes array with type and age
      const paxes: Array<{ type: string; age?: number }> = []
      
      // Add adults (type: 'AD')
      for (let i = 0; i < guestAdults; i++) {
        paxes.push({ type: 'AD' })
      }
      
      // Add children (type: 'CH', age required)
      // Note: Hotelbeds requires age for children, defaulting to 8 years old
      for (let i = 0; i < guestChildren; i++) {
        paxes.push({ type: 'CH', age: 8 })
      }
      
      // Add infants (type: 'INF', age required)
      // Note: Hotelbeds requires age for infants, defaulting to 1 year old
      for (let i = 0; i < guestInfants; i++) {
        paxes.push({ type: 'INF', age: 1 })
      }

      // Ensure at least one adult
      if (paxes.length === 0 || guestAdults === 0) {
        paxes.push({ type: 'AD' })
      }

      const searchData = {
        destination: location,
        destinationName: location,
        destinationCode: locationCode,
        dateFrom,
        dateTo,
        paxes,
        adults: guestAdults,
        children: guestChildren,
        infants: guestInfants,
      }

      // Search for activities using Hotelbeds API
      const response = await fetch('/api/hotelbeds/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationCode: locationCode,
          dateFrom,
          dateTo,
          paxes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      // Navigate to activities results page with search parameters
      const encodedData = encodeURIComponent(JSON.stringify(searchData))
      router.push(`/activities?data=${encodedData}`)
    } catch (error) {
      console.error('Activities search error:', error)
      // Fallback to original behavior
      const location = formDataEntries['location'] as string
      let url = '/experience-categories/all'
      if (location) {
        url = url + `?location=${encodeURIComponent(location)}`
      }
      router.push(url)
    }
  }

  return (
    <Form
      className={clsx(
        'relative z-10 flex w-full rounded-full bg-white shadow-xl [--form-bg:var(--color-white)] dark:bg-neutral-800 dark:shadow-2xl dark:[--form-bg:var(--color-neutral-800)]',
        className,
        formStyle === 'small' && 'custom-shadow-1',
        formStyle === 'default' && 'shadow-xl dark:shadow-2xl'
      )}
      action={handleFormSubmit}
    >
      <LocationInputField 
        className="hero-search-form__field-after flex-5/12" 
        fieldStyle={formStyle}
        useHotelbeds={true}
        inputName="location"
        defaultValue={initialValues?.from}
        defaultCode={initialValues?.fromCode}
      />
      <VerticalDividerLine />
      <DateRangeField
        className="hero-search-form__field-before hero-search-form__field-after flex-4/12"
        fieldStyle={formStyle}
        description={T['HeroSearchForm']['Date range']}
        inputName="checkin"
        defaultValue={initialValues?.departureDate ? new Date(initialValues.departureDate) : null}
        defaultEndValue={initialValues?.returnDate ? new Date(initialValues.returnDate) : null}
      />
      <VerticalDividerLine />
      <GuestNumberField
        className="hero-search-form__field-before flex-4/12"
        clearDataButtonClassName={clsx(formStyle === 'small' && 'sm:end-18', formStyle === 'default' && 'sm:end-22')}
        fieldStyle={formStyle}
        defaultValue={{
          guestAdults: initialValues?.adults || 1,
          guestChildren: initialValues?.children || 0,
          guestInfants: initialValues?.infants || 0,
        }}
      />

      <ButtonSubmit fieldStyle={formStyle} className="z-10" />
    </Form>
  )
}
