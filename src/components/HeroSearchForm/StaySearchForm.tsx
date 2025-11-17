'use client'

import clsx from 'clsx'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { parseLocalDate } from '@/utils/parseLocalDate'
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
  }
}

export const StaySearchForm = ({ className, formStyle = 'default', initialValues }: Props) => {
  const router = useRouter()

  // Prefetch the hotels page to improve performance
  useEffect(() => {
    router.prefetch('/hotels')
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

      if (!location || !checkin || !checkout) {
        console.error('Missing required fields: location, checkin, checkout')
        return
      }

      // Destination code is required for Hotelbeds API
      if (!locationCode) {
        console.error('Missing destination code. Please select a destination from the suggestions.')
        alert('Please select a destination from the suggestions to search for hotels.')
        return
      }

      const searchData = {
        destination: location,
        destinationName: location,
        destinationCode: locationCode, // Use destination code for Hotelbeds API
        checkIn: checkin,
        checkOut: checkout,
        adults: guestAdults,
        children: guestChildren,
        rooms: 1,
      }

      // Navigate to hotels results page with search parameters
      const encodedData = encodeURIComponent(JSON.stringify(searchData))
      router.push(`/hotels?data=${encodedData}`)
    } catch (error) {
      console.error('Hotel search error:', error)
      // Fallback to original behavior
      const location = formDataEntries['location'] as string
      let url = '/stay-categories/all'
      if (location) {
        url = url + `?location=${encodeURIComponent(location)}`
      }
      router.push(url)
    }
  }

  return (
    <Form
      className={clsx(
        'relative z-10 flex w-full rounded-full bg-white [--form-bg:var(--color-white)] dark:bg-neutral-800 dark:[--form-bg:var(--color-neutral-800)]',
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
        defaultValue={initialValues?.from}
        defaultCode={initialValues?.fromCode}
      />
      <VerticalDividerLine />
      <DateRangeField
        className="hero-search-form__field-before hero-search-form__field-after flex-4/12"
        fieldStyle={formStyle}
        defaultValue={initialValues?.departureDate ? parseLocalDate(initialValues.departureDate) : undefined}
        defaultEndValue={initialValues?.returnDate ? parseLocalDate(initialValues.returnDate) : undefined}
      />
      <VerticalDividerLine />
      <GuestNumberField
        className="hero-search-form__field-before flex-4/12"
        clearDataButtonClassName={clsx(formStyle === 'small' && 'sm:end-18', formStyle === 'default' && 'sm:end-22')}
        fieldStyle={formStyle}
        defaultValue={{
          guestAdults: initialValues?.adults || 1,
          guestChildren: initialValues?.children || 0,
          guestInfants: 0,
        }}
      />

      <ButtonSubmit fieldStyle={formStyle} className="z-10" />
    </Form>
  )
}
