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

const StaySearchFormMobile = () => {
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const twoDaysAhead = new Date(today)
  twoDaysAhead.setDate(twoDaysAhead.getDate() + 2)
  const [startDate, setStartDate] = useState<Date | null>(today)
  const [endDate, setEndDate] = useState<Date | null>(twoDaysAhead)
  const router = useRouter()

  const onChangeDate = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }
  
  const handleFormSubmit = async (formData: FormData) => {
    const formDataEntries = Object.fromEntries(formData.entries())

    try {
      const location = formDataEntries['location'] as string || locationInputTo
      const code = formDataEntries['location_code'] as string || locationCode
      const checkin = formDataEntries['checkin'] as string
      const checkout = formDataEntries['checkout'] as string
      const guestAdults = parseInt(formDataEntries['guestAdults'] as string) || guestInput.guestAdults || 1
      const guestChildren = parseInt(formDataEntries['guestChildren'] as string) || guestInput.guestChildren || 0

      if (!location || !checkin || !checkout) {
        console.error('Missing required fields: location, checkin, checkout')
        return
      }

      // Destination code is required for Hotelbeds API
      if (!code) {
        console.error('Missing destination code. Please select a destination from the suggestions.')
        alert('Please select a destination from the suggestions to search for hotels.')
        return
      }

      const searchData = {
        destination: location,
        destinationName: location,
        destinationCode: code,
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
      const location = formDataEntries['location'] as string || locationInputTo
      let url = '/stay-categories/all'
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
          onChange={(value, code) => {
            setLocationInputTo(value)
            if (code) {
              setLocationCode(code)
            }
            setFieldNameShow('dates')
          }}
          useHotelbeds={true}
          imputName="location"
        />
      </FieldPanelContainer>

      {/* DATE RANGE  */}
      <FieldPanelContainer
        isActive={fieldNameShow === 'dates'}
        headingOnClick={() => setFieldNameShow('dates')}
        headingTitle={T['HeroSearchForm']['When']}
        headingValue={startDate ? converSelectedDateToString([startDate, endDate]) : T['HeroSearchForm']['Add dates']}
      >
        <DatesRangeInput 
        defaultStartDate={startDate} 
        defaultEndDate={endDate} 
        onChange={onChangeDate}
      />
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

export default StaySearchFormMobile
