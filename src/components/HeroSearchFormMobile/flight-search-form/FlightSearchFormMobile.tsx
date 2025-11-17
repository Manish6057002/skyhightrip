'use client'

import { GuestsObject } from '@/type'
import converSelectedDateToString from '@/utils/converSelectedDateToString'
import T from '@/utils/getT'
import * as Headless from '@headlessui/react'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import DatesRangeInput from '../DatesRangeInput'
import FieldPanelContainer from '../FieldPanelContainer'
import GuestsInput from '../GuestsInput'
import LocationInput from '../LocationInput'

const dropOffLocationTypes = ['Round-trip', 'One-way'] as const
const flightClasses = ['Economy', 'Business', 'Multiple'] as const

interface FlightSearchFormMobileProps {
  initialValues?: {
    from?: string
    to?: string
    departureDate?: string
    returnDate?: string
    adults?: number
    children?: number
    infants?: number
    tripType?: 'roundTrip' | 'oneWay'
    travelClass?: string
  }
}

const FlightSearchFormMobile = ({ initialValues }: FlightSearchFormMobileProps) => {
  //
  const [fieldNameShow, setFieldNameShow] = useState<
    'locationPickup' | 'locationDropoff' | 'dates' | 'guests' | 'general'
  >('locationPickup')
  //
  const [locationInputPickUp, setLocationInputPickUp] = useState(initialValues?.from || '')
  const [locationInputPickUpCode, setLocationInputPickUpCode] = useState('')
  const [locationInputDropOff, setLocationInputDropOff] = useState(initialValues?.to || '')
  const [locationInputDropOffCode, setLocationInputDropOffCode] = useState('')
  
  // Set default dates or use initial values
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const twoDaysAhead = new Date(today)
  twoDaysAhead.setDate(twoDaysAhead.getDate() + 2)
  
  const defaultStartDate = initialValues?.departureDate ? new Date(initialValues.departureDate) : today
  const defaultEndDate = initialValues?.returnDate ? new Date(initialValues.returnDate) : twoDaysAhead
  
  const [startDate, setStartDate] = useState<Date | null>(defaultStartDate)
  const [endDate, setEndDate] = useState<Date | null>(defaultEndDate)

  const [dropOffLocationType, setDropOffLocationType] = useState(
    initialValues?.tripType === 'oneWay' ? dropOffLocationTypes[1] : dropOffLocationTypes[0]
  )
  const [flightClassState, setFlightClassState] = useState(
    initialValues?.travelClass 
      ? (flightClasses.find(c => c.toLowerCase() === initialValues.travelClass?.toLowerCase()) || flightClasses[0])
      : flightClasses[0]
  )

  const [guestInput, setGuestInput] = useState<GuestsObject>({
    guestAdults: initialValues?.adults || 1,
    guestChildren: initialValues?.children || 0,
    guestInfants: initialValues?.infants || 0,
  })
  const router = useRouter()

  // Update form values when initialValues change
  useEffect(() => {
    if (initialValues) {
      if (initialValues.from) {
        setLocationInputPickUp(initialValues.from)
      }
      if (initialValues.to) {
        setLocationInputDropOff(initialValues.to)
      }
      if (initialValues.departureDate) {
        setStartDate(new Date(initialValues.departureDate))
      }
      if (initialValues.returnDate) {
        setEndDate(new Date(initialValues.returnDate))
      }
      if (initialValues.tripType) {
        setDropOffLocationType(initialValues.tripType === 'oneWay' ? dropOffLocationTypes[1] : dropOffLocationTypes[0])
      }
      if (initialValues.travelClass) {
        const travelClass = initialValues.travelClass
        const classMap: Record<string, typeof flightClasses[number]> = {
          'ECONOMY': 'Economy',
          'BUSINESS': 'Business',
          'PREMIUM_ECONOMY': 'Economy',
          'FIRST': 'Economy',
        }
        setFlightClassState(classMap[travelClass] || 'Economy')
      }
      if (initialValues.adults !== undefined || initialValues.children !== undefined || initialValues.infants !== undefined) {
        setGuestInput({
          guestAdults: initialValues.adults || 1,
          guestChildren: initialValues.children || 0,
          guestInfants: initialValues.infants || 0,
        })
      }
    }
  }, [initialValues])

  const handleFormSubmit = async (formData: FormData) => {
    const formDataEntries = Object.fromEntries(formData.entries())

    try {
      const from = formDataEntries['locationPickup'] as string || locationInputPickUp
      const fromCode = formDataEntries['locationPickup_code'] as string || locationInputPickUpCode
      const to = formDataEntries['locationDropOff'] as string || locationInputDropOff
      const toCode = formDataEntries['locationDropOff_code'] as string || locationInputDropOffCode
      const checkin = formDataEntries['checkin'] as string
      const checkout = dropOffLocationType === 'Round-trip' ? (formDataEntries['checkout'] as string) : undefined
      const guestAdults = parseInt(formDataEntries['guestAdults'] as string) || guestInput.guestAdults || 1
      const guestChildren = parseInt(formDataEntries['guestChildren'] as string) || guestInput.guestChildren || 0
      const guestInfants = parseInt(formDataEntries['guestInfants'] as string) || guestInput.guestInfants || 0

      if (!from || !to || !checkin) {
        console.error('Missing required fields: from, to, checkin')
        return
      }

      // Extract IATA code from airport name if code is not available
      const fromIataCode = fromCode || from.match(/\(([A-Z]{3})\)$/)?.[1] || from
      const toIataCode = toCode || to.match(/\(([A-Z]{3})\)$/)?.[1] || to

      const searchData = {
        originLocationCode: fromIataCode,
        destinationLocationCode: toIataCode,
        departureDate: checkin,
        returnDate: dropOffLocationType === 'Round-trip' ? checkout : undefined,
        adults: guestAdults,
        children: guestChildren,
        infants: guestInfants,
        travelClass: (() => {
          const classMap: Record<string, string> = {
            'Economy': 'ECONOMY',
            'Business': 'BUSINESS',
            'Multiple': 'ECONOMY',
          }
          return classMap[flightClassState] || 'ECONOMY'
        })(),
        max: 250,
      }

      // Navigate to flights results page with search parameters
      const tripType = dropOffLocationType === 'Round-trip' ? 'roundTrip' : 'oneWay'
      const encodedData = encodeURIComponent(JSON.stringify(searchData))
      router.push(`/flights?type=${tripType}&data=${encodedData}`)
    } catch (error) {
      console.error('Flight search error:', error)
      // Fallback to original behavior
      const location = formDataEntries['locationPickup'] as string || locationInputPickUp
      let url = '/flight-categories/all'
      if (location) {
        url = url + `?location=${encodeURIComponent(location)}`
      }
      router.push(url)
    }
  }

  const onChangeDate = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }

  const renderInputLocationPickup = () => {
    return (
      <FieldPanelContainer
        isActive={fieldNameShow === 'locationPickup'}
        headingOnClick={() => setFieldNameShow('locationPickup')}
        headingTitle="Flying from"
        headingValue={locationInputPickUp || T['HeroSearchForm']['Location']}
      >
        <LocationInput
          headingText="Flying from?"
          imputName="locationPickup"
          defaultValue={locationInputPickUp}
          onChange={(value, code) => {
            setLocationInputPickUp(value)
            if (code) {
              setLocationInputPickUpCode(code)
            }
            setFieldNameShow('dates')
          }}
          useAmadeus={true}
        />
      </FieldPanelContainer>
    )
  }

  const renderInputLocationDropOff = () => {
    return (
      <FieldPanelContainer
        isActive={fieldNameShow === 'locationDropoff'}
        headingOnClick={() => setFieldNameShow('locationDropoff')}
        headingTitle="Flying to"
        headingValue={locationInputDropOff || T['HeroSearchForm']['Location']}
      >
        <LocationInput
          headingText="Flying to?"
          imputName="locationDropOff"
          defaultValue={locationInputDropOff}
          onChange={(value, code) => {
            setLocationInputDropOff(value)
            if (code) {
              setLocationInputDropOffCode(code)
            }
            setFieldNameShow('dates')
          }}
          useAmadeus={true}
        />
      </FieldPanelContainer>
    )
  }

  const renderInputDates = () => {
    return (
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
    )
  }

  const renderGenerals = () => {
    return (
      <FieldPanelContainer
        isActive={fieldNameShow === 'general'}
        headingOnClick={() => setFieldNameShow('general')}
        headingTitle={T['HeroSearchForm']['Flight type?']}
        headingValue={`${dropOffLocationType}, ${flightClassState}`}
      >
        <p className="block text-xl font-semibold sm:text-2xl">{T['HeroSearchForm']['Flight type?']}</p>
        <div className="relative mt-5">
          <Headless.RadioGroup
            value={dropOffLocationType}
            onChange={setDropOffLocationType}
            aria-label="Real Estate Tab Type"
            name="dropOffLocationType"
            className="flex flex-wrap items-center gap-2.5"
          >
            {dropOffLocationTypes.map((tab) => (
              <Headless.Field key={tab}>
                <Headless.Radio
                  value={tab}
                  className={`flex cursor-pointer items-center rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium data-checked:bg-black data-checked:text-white data-checked:shadow-lg data-checked:shadow-black/10 dark:border-neutral-700 dark:data-checked:bg-neutral-200 dark:data-checked:text-neutral-900`}
                >
                  {tab}
                </Headless.Radio>
              </Headless.Field>
            ))}
          </Headless.RadioGroup>

          <div className="mt-6">
            <p className="text-base font-semibold">{T['HeroSearchForm']['Ticket Class']}</p>
            <Headless.RadioGroup
              value={flightClassState}
              onChange={setFlightClassState}
              aria-label="Real Estate Tab Type"
              name="flightClasses"
              className="mt-4 flex flex-wrap items-center gap-2.5"
            >
              {flightClasses.map((tab) => (
                <Headless.Field key={tab}>
                  <Headless.Radio
                    value={tab}
                    className={`flex cursor-pointer items-center rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium data-checked:bg-black data-checked:text-white data-checked:shadow-lg data-checked:shadow-black/10 dark:border-neutral-700 dark:data-checked:bg-neutral-200 dark:data-checked:text-neutral-900`}
                  >
                    {tab}
                  </Headless.Radio>
                </Headless.Field>
              ))}
            </Headless.RadioGroup>
          </div>
        </div>
      </FieldPanelContainer>
    )
  }

  const renderInputGuests = () => {
    const isActive = fieldNameShow === 'guests'
    const totalGuests = (guestInput.guestAdults || 0) + (guestInput.guestChildren || 0) + (guestInput.guestInfants || 0)
    const guestStringConverted = totalGuests
      ? `${totalGuests} ${T['HeroSearchForm']['Guests']}`
      : T['HeroSearchForm']['Add guests']

    return (
      <FieldPanelContainer
        isActive={isActive}
        headingOnClick={() => setFieldNameShow('guests')}
        headingTitle={T['HeroSearchForm']['Who']}
        headingValue={guestStringConverted}
      >
        <GuestsInput defaultValue={guestInput} onChange={setGuestInput} />
      </FieldPanelContainer>
    )
  }

  return (
    <Form id="form-hero-search-form-mobile" action={handleFormSubmit} className="flex w-full flex-col gap-y-3">
      {renderInputLocationPickup()}
      {/*  */}
      {renderInputLocationDropOff()}
      {/*  */}
      {renderGenerals()}
      {/*  */}
      {renderInputDates()}
      {/*  */}
      {renderInputGuests()}
    </Form>
  )
}

export default FlightSearchFormMobile
