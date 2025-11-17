'use client'

import { GuestsObject } from '@/type'
import converSelectedDateToString from '@/utils/converSelectedDateToString'
import T from '@/utils/getT'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import DatesRangeInput from '../DatesRangeInput'
import FieldPanelContainer from '../FieldPanelContainer'
import GuestsInput from '../GuestsInput'
import LocationInput from '../LocationInput'

const ExperienceSearchFormMobile = () => {
  //
  const [fieldNameShow, setFieldNameShow] = useState<'location' | 'dates' | 'guests'>('location')
  //
  const [locationInputTo, setLocationInputTo] = useState('')
  const [locationCode, setLocationCode] = useState('')
  const [guestInput, setGuestInput] = useState<GuestsObject>({
    guestAdults: 1,
    guestChildren: 0,
    guestInfants: 0,
  })
  const [startDate, setStartDate] = useState<Date | null>(new Date('2025/10/05'))
  const [endDate, setEndDate] = useState<Date | null>(new Date('2025/10/09'))
  const router = useRouter()

  const onChangeDate = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }
  
  const handleFormSubmit = async (formData: FormData) => {
    const formDataEntries = Object.fromEntries(formData.entries())

    try {
      const location = formDataEntries['location'] as string
      const locationCodeValue = formDataEntries['location_code'] as string || locationCode
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
      if (!locationCodeValue) {
        console.error('Missing destination code. Please select a destination from the suggestions.')
        alert('Please select a destination from the suggestions to search for activities.')
        return
      }

      // Format dates for Hotelbeds API (YYYY-MM-DD)
      const dateFrom = checkin
      const dateTo = checkout

      // Prepare paxes array for Hotelbeds Activities API
      const paxes: Array<{ type: string; age?: number }> = []
      
      // Add adults (type: 'AD')
      for (let i = 0; i < guestAdults; i++) {
        paxes.push({ type: 'AD' })
      }
      
      // Add children (type: 'CH', age required)
      for (let i = 0; i < guestChildren; i++) {
        paxes.push({ type: 'CH', age: 8 })
      }
      
      // Add infants (type: 'INF', age required)
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
        destinationCode: locationCodeValue,
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
          destinationCode: locationCodeValue,
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

  //
  const totalGuests = (guestInput.guestAdults || 0) + (guestInput.guestChildren || 0) + (guestInput.guestInfants || 0)
  const guestStringConverted = totalGuests
    ? `${totalGuests} ${T['HeroSearchForm']['Guests']}`
    : T['HeroSearchForm']['Add guests']
  return (
    <Form id="form-hero-search-form-mobile" action={handleFormSubmit} className="flex w-full flex-col gap-y-3">
      {/*  LOCATION */}
      <FieldPanelContainer
        isActive={fieldNameShow === 'location'}
        headingOnClick={() => setFieldNameShow('location')}
        headingTitle={T['HeroSearchForm']['Where']}
        headingValue={locationInputTo || T['HeroSearchForm']['Location']}
      >
        <LocationInput
          defaultValue={locationInputTo}
          useHotelbeds={true}
          onChange={(value, code) => {
            setLocationInputTo(value)
            if (code) {
              setLocationCode(code)
            }
            setFieldNameShow('dates')
          }}
        />
      </FieldPanelContainer>

      {/* DATE RANGE  */}
      <FieldPanelContainer
        isActive={fieldNameShow === 'dates'}
        headingOnClick={() => setFieldNameShow('dates')}
        headingTitle={T['HeroSearchForm']['When']}
        headingValue={startDate ? converSelectedDateToString([startDate, endDate]) : T['HeroSearchForm']['Add dates']}
      >
        <DatesRangeInput defaultStartDate={startDate} defaultEndDate={endDate} onChange={onChangeDate} />
      </FieldPanelContainer>

      {/* GUEST NUMBER */}
      <FieldPanelContainer
        isActive={fieldNameShow === 'guests'}
        headingOnClick={() => setFieldNameShow('guests')}
        headingTitle={T['HeroSearchForm']['Who']}
        headingValue={guestStringConverted}
      >
        <GuestsInput defaultValue={guestInput} onChange={setGuestInput} />
      </FieldPanelContainer>
    </Form>
  )
}

export default ExperienceSearchFormMobile
