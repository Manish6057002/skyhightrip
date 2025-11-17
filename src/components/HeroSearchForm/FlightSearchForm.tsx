'use client'

import NcInputNumber from '@/components/NcInputNumber'
import { GuestsObject } from '@/type'
import T from '@/utils/getT'
import * as Headless from '@headlessui/react'
import { ChevronDownIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/solid'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import Form from 'next/form'
import { useRouter, useSearchParams } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import { ButtonSubmit, DateRangeField, LocationInputField, VerticalDividerLine } from './ui'

interface Props {
  className?: string
  formStyle: 'default' | 'small'
  initialValues?: {
    tripType?: 'roundTrip' | 'oneWay' | 'multiCity'
    from?: string
    to?: string
    departureDate?: string
    returnDate?: string
    adults?: number
    children?: number
    infants?: number
    travelClass?: string
    segments?: Array<{ origin: string; destination: string; date: string }>
  }
}

interface MultiCitySegment {
  id: string
  from: string
  to: string
  date: Date | null
}

const flightClass = [
  {
    name: 'Economy',
    value: 'ECONOMY',
    href: '#',
  },
  {
    name: 'Premium Economy',
    value: 'PREMIUM_ECONOMY',
    href: '#',
  },
  {
    name: 'Business',
    value: 'BUSINESS',
    href: '#',
  },
  {
    name: 'First',
    value: 'FIRST',
    href: '#',
  },
]

const MAX_SEGMENTS = 5
const MIN_SEGMENTS = 2

export const FlightSearchForm: FC<Props> = ({ className, formStyle = 'default', initialValues }) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get initial values from props or URL params
  const getInitialValues = () => {
    if (initialValues) return initialValues
    
    const searchData = searchParams.get('data')
    if (!searchData) return null
    
    try {
      const parsed = JSON.parse(decodeURIComponent(searchData))
      const searchType = searchParams.get('type')
      
      return {
        tripType: searchType === 'multi-city' ? 'multiCity' : (searchType === 'oneWay' ? 'oneWay' : 'roundTrip'),
        from: parsed.originLocationCode?.trim().toUpperCase() || parsed.segments?.[0]?.origin?.trim().toUpperCase(),
        to: parsed.destinationLocationCode?.trim().toUpperCase() || parsed.segments?.[0]?.destination?.trim().toUpperCase(),
        departureDate: parsed.departureDate || parsed.segments?.[0]?.date,
        returnDate: parsed.returnDate,
        adults: parsed.adults || 1,
        children: parsed.children || 0,
        infants: parsed.infants || 0,
        travelClass: (() => {
          if (parsed.travelClass === 'BUSINESS') return 'Business'
          if (parsed.travelClass === 'PREMIUM_ECONOMY') return 'Premium Economy'
          if (parsed.travelClass === 'FIRST') return 'First'
          return 'Economy'
        })(),
        segments: parsed.segments,
      }
    } catch {
      return null
    }
  }
  
  const initValues = getInitialValues()
  
  const [tripType, setTripType] = useState<'roundTrip' | 'oneWay' | 'multiCity'>(() => {
    const type = initValues?.tripType
    if (type === 'roundTrip' || type === 'oneWay' || type === 'multiCity') {
      return type
    }
    return 'roundTrip'
  })
  const [flightClassState, setFlightClassState] = useState(initValues?.travelClass || 'Economy')
  const [multiCitySegments, setMultiCitySegments] = useState<MultiCitySegment[]>(() => {
    if (initValues?.segments && initValues.segments.length > 0) {
      return initValues.segments.map((seg: { origin: string; destination: string; date: string }, index: number) => ({
        id: String(index + 1),
        from: seg.origin,
        to: seg.destination,
        date: seg.date ? new Date(seg.date) : null,
      }))
    }
    return [
      { id: '1', from: '', to: '', date: null },
      { id: '2', from: '', to: '', date: null },
    ]
  })

  const [guestAdultsInputValue, setGuestAdultsInputValue] = useState(initValues?.adults || 1)
  const [guestChildrenInputValue, setGuestChildrenInputValue] = useState(initValues?.children || 0)
  const [guestInfantsInputValue, setGuestInfantsInputValue] = useState(initValues?.infants || 0)

  // Prefetch the stay categories page to improve performance
  useEffect(() => {
    router.prefetch('/flight-categories/all')
  }, [router])

  // Reset multi-city segments when switching to multi-city mode
  useEffect(() => {
    if (tripType === 'multiCity' && multiCitySegments.length < MIN_SEGMENTS) {
      setMultiCitySegments([
        { id: '1', from: '', to: '', date: null },
        { id: '2', from: '', to: '', date: null },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripType])

  const MAX_TOTAL_GUESTS = 9

  const handleChangeData = (value: number, type: keyof GuestsObject) => {
    const currentTotal = guestAdultsInputValue + guestChildrenInputValue + guestInfantsInputValue
    const otherGuests = currentTotal - (type === 'guestAdults' ? guestAdultsInputValue : type === 'guestChildren' ? guestChildrenInputValue : guestInfantsInputValue)
    const newTotal = otherGuests + value

    // Prevent exceeding maximum total guests
    if (newTotal > MAX_TOTAL_GUESTS) {
      return
    }

    if (type === 'guestAdults') {
      setGuestAdultsInputValue(value)
    }
    if (type === 'guestChildren') {
      setGuestChildrenInputValue(value)
    }
    if (type === 'guestInfants') {
      setGuestInfantsInputValue(value)
    }
  }

  const handleFormSubmit = async (formData: FormData) => {
    const formDataEntries = Object.fromEntries(formData.entries())

    try {
      if (tripType === 'multiCity') {
        // Handle multi-city flight search
        const segments: Array<{ origin: string; destination: string; date: string }> = []
        
        multiCitySegments.forEach((segment) => {
          const from = formDataEntries[`multi-city-from-${segment.id}`] as string
          const to = formDataEntries[`multi-city-to-${segment.id}`] as string
          const date = formDataEntries[`checkin-${segment.id}`] as string || formDataEntries[`checkin`] as string
          
          if (from && to && date) {
            // Extract IATA code from airport name (format: "Airport Name (IATA)")
            const fromCode = from.match(/\(([A-Z]{3})\)$/)?.[1] || from
            const toCode = to.match(/\(([A-Z]{3})\)$/)?.[1] || to
            
            segments.push({
              origin: fromCode,
              destination: toCode,
              date: date,
            })
          }
        })

        if (segments.length > 0) {
          const searchData = {
            segments,
            adults: guestAdultsInputValue,
            children: guestChildrenInputValue,
            infants: guestInfantsInputValue,
            travelClass: (() => {
              const classMap: Record<string, string> = {
                'Economy': 'ECONOMY',
                'Premium Economy': 'PREMIUM_ECONOMY',
                'Business': 'BUSINESS',
                'First': 'FIRST',
              }
              return classMap[flightClassState] || 'ECONOMY'
            })(),
            max: 250, // Show all available flights
          }

          // Navigate to results page with search parameters
          const encodedData = encodeURIComponent(JSON.stringify(searchData))
          router.push(`/flights?type=multi-city&data=${encodedData}`)
        }
      } else {
        // Handle round-trip or one-way flight search
        const from = formDataEntries['flying-from-location'] as string
        const to = formDataEntries['flying-to-location'] as string
        const checkin = formDataEntries['checkin'] as string
        const checkout = tripType === 'roundTrip' ? (formDataEntries['checkout'] as string) : undefined

        if (from && to && checkin) {
          // Extract IATA code from airport name (format: "Airport Name (IATA)")
          const fromCode = from.match(/\(([A-Z]{3})\)$/)?.[1] || from
          const toCode = to.match(/\(([A-Z]{3})\)$/)?.[1] || to

          const searchData = {
            originLocationCode: fromCode,
            destinationLocationCode: toCode,
            departureDate: checkin,
            returnDate: tripType === 'roundTrip' ? checkout : undefined,
            adults: guestAdultsInputValue,
            children: guestChildrenInputValue,
            infants: guestInfantsInputValue,
            travelClass: (() => {
              const classMap: Record<string, string> = {
                'Economy': 'ECONOMY',
                'Premium Economy': 'PREMIUM_ECONOMY',
                'Business': 'BUSINESS',
                'First': 'FIRST',
              }
              return classMap[flightClassState] || 'ECONOMY'
            })(),
            max: 250, // Show all available flights
          }

          // Navigate to results page with search parameters
          const encodedData = encodeURIComponent(JSON.stringify(searchData))
          router.push(`/flights?type=${tripType}&data=${encodedData}`)
        }
      }
    } catch (error) {
      console.error('Flight search error:', error)
      // Fallback to original behavior
      const location = formDataEntries['flying-from-location'] as string
      let url = '/flight-categories/all'
      if (location) {
        url = url + `?location=${encodeURIComponent(location)}`
      }
      router.push(url)
    }
  }

  const totalGuests = guestChildrenInputValue + guestAdultsInputValue + guestInfantsInputValue

  const renderGuest = () => {
    return (
      <Headless.Popover className="group relative">
        <Headless.PopoverButton className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium dark:border-neutral-700">
          <span>
            {totalGuests || ''} {T['HeroSearchForm']['Guests']}
          </span>
          <ChevronDownIcon className="-me-1 size-3.5 group-data-open:rotate-180" />
        </Headless.PopoverButton>

        <Headless.PopoverPanel
          unmount={false}
          transition
          className="absolute top-full left-1/2 z-20 mt-3 w-84 -translate-x-1/2 rounded-3xl bg-white px-4 py-5 shadow-xl ring-1 ring-black/5 transition duration-150 data-closed:translate-y-1 data-closed:opacity-0 sm:px-8 sm:py-6 dark:bg-neutral-800 dark:ring-white/10"
        >
          <NcInputNumber
            key={`adults-${guestChildrenInputValue}-${guestInfantsInputValue}`}
            className="w-full"
            defaultValue={guestAdultsInputValue}
            onChange={(value) => handleChangeData(value, 'guestAdults')}
            max={Math.max(1, MAX_TOTAL_GUESTS - guestChildrenInputValue - guestInfantsInputValue)}
            min={1}
            label={T['HeroSearchForm']['Adults']}
            description={T['HeroSearchForm']['Ages 13 or above']}
            inputName="guestAdults"
          />
          <NcInputNumber
            key={`children-${guestAdultsInputValue}-${guestInfantsInputValue}`}
            className="mt-6 w-full"
            defaultValue={guestChildrenInputValue}
            onChange={(value) => handleChangeData(value, 'guestChildren')}
            max={Math.max(0, MAX_TOTAL_GUESTS - guestAdultsInputValue - guestInfantsInputValue)}
            min={0}
            label={T['HeroSearchForm']['Children']}
            description={T['HeroSearchForm']['Ages 2–12']}
            inputName="guestChildren"
          />

          <NcInputNumber
            key={`infants-${guestAdultsInputValue}-${guestChildrenInputValue}`}
            className="mt-6 w-full"
            defaultValue={guestInfantsInputValue}
            onChange={(value) => handleChangeData(value, 'guestInfants')}
            max={Math.max(0, MAX_TOTAL_GUESTS - guestAdultsInputValue - guestChildrenInputValue)}
            min={0}
            label={T['HeroSearchForm']['Infants']}
            description={T['HeroSearchForm']['Ages 0–2']}
            inputName="guestInfants"
          />
        </Headless.PopoverPanel>
      </Headless.Popover>
    )
  }

  const renderSelectClassType = () => {
    return (
      <>
        <Headless.Popover className="group relative">
          <Headless.PopoverButton className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium dark:border-neutral-700">
            <span>{flightClassState}</span>
            <ChevronDownIcon className="-me-1 size-3.5 group-data-open:rotate-180" />
          </Headless.PopoverButton>

          <Headless.PopoverPanel
            transition
            className="absolute top-full left-1/2 z-20 mt-3 w-56 -translate-x-1/2 transition duration-150 data-closed:translate-y-1 data-closed:opacity-0"
          >
            <div className="relative grid gap-7 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
              {flightClass.map((item) => (
                <Headless.CloseButton
                  key={item.name}
                  onClick={() => {
                    setFlightClassState(item.name)
                  }}
                  className="-m-3 flex cursor-pointer items-center rounded-lg p-2 text-sm font-medium hover:bg-gray-50 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-gray-700"
                >
                  {item.name}
                </Headless.CloseButton>
              ))}
            </div>
          </Headless.PopoverPanel>
        </Headless.Popover>

        {/* hidden inputs */}
        <input type="hidden" name="flight-class-type" value={flightClassState} />
      </>
    )
  }

  const addMultiCitySegment = () => {
    if (multiCitySegments.length < MAX_SEGMENTS) {
      setMultiCitySegments([
        ...multiCitySegments,
        { id: Date.now().toString(), from: '', to: '', date: null },
      ])
    }
  }

  const removeMultiCitySegment = (id: string) => {
    if (multiCitySegments.length > MIN_SEGMENTS) {
      setMultiCitySegments(multiCitySegments.filter((segment) => segment.id !== id))
    }
  }

  const renderTripType = () => {
    return (
      <Headless.RadioGroup
        value={tripType}
        onChange={setTripType}
        aria-label="Trip Type"
        name="trip-type"
        className="flex flex-wrap items-center gap-2.5"
      >
        <Headless.Radio
          value="roundTrip"
          className={`flex cursor-pointer items-center rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium data-checked:bg-black data-checked:text-white data-checked:shadow-lg data-checked:shadow-black/10 dark:border-neutral-700 dark:data-checked:bg-neutral-200 dark:data-checked:text-neutral-900`}
        >
          {T['HeroSearchForm']['Round-trip']}
        </Headless.Radio>
        <Headless.Radio
          value="oneWay"
          className={`flex cursor-pointer items-center rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium data-checked:bg-black data-checked:text-white data-checked:shadow-lg data-checked:shadow-black/10 dark:border-neutral-700 dark:data-checked:bg-neutral-200 dark:data-checked:text-neutral-900`}
        >
          {T['HeroSearchForm']['One-way']}
        </Headless.Radio>
        <Headless.Radio
          value="multiCity"
          className={`flex cursor-pointer items-center rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium data-checked:bg-black data-checked:text-white data-checked:shadow-lg data-checked:shadow-black/10 dark:border-neutral-700 dark:data-checked:bg-neutral-200 dark:data-checked:text-neutral-900`}
        >
          Multi-city
        </Headless.Radio>
      </Headless.RadioGroup>
    )
  }

  const renderMultiCityForm = () => {
    const canRemove = multiCitySegments.length > MIN_SEGMENTS
    const canAdd = multiCitySegments.length < MAX_SEGMENTS

    return (
      <div className="space-y-4">
        {multiCitySegments.map((segment, index) => {
          const baseZIndex = 100 + (index * 30)
          const fromZIndex = baseZIndex + 1
          const toZIndex = baseZIndex + 2
          const dateZIndex = baseZIndex + 3
          return (
            <div key={segment.id} className="relative" style={{ zIndex: baseZIndex }}>
              <div className="relative flex flex-1 items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                <div className="relative" style={{ zIndex: fromZIndex }}>
                  <LocationInputField
                    inputName={`multi-city-from-${segment.id}`}
                    placeholder={T['HeroSearchForm']['Flying from']}
                    description={index === 0 ? T['HeroSearchForm']['Where are you flying from?'] : 'From'}
                    className="hero-search-form__field-after flex-1"
                    fieldStyle={formStyle}
                    useAmadeus={true}
                    defaultValue={segment.from}
                    panelZIndex={fromZIndex}
                  />
                </div>
                <VerticalDividerLine />
                <div className="relative" style={{ zIndex: toZIndex }}>
                  <LocationInputField
                    inputName={`multi-city-to-${segment.id}`}
                    placeholder={T['HeroSearchForm']['Flying to']}
                    description={index === 0 ? T['HeroSearchForm']['Where are you flying to?'] : 'To'}
                    className="hero-search-form__field-before hero-search-form__field-after flex-1"
                    fieldStyle={formStyle}
                    useAmadeus={true}
                    defaultValue={segment.to}
                    panelZIndex={toZIndex}
                  />
                </div>
                <VerticalDividerLine />
                <div className="relative flex-1" style={{ zIndex: dateZIndex }}>
                  <DateRangeField
                    fieldStyle={formStyle}
                    className="hero-search-form__field-before flex-1"
                    panelClassName="sm:start-auto sm:translate-x-0 sm:end-0"
                    panelZIndex={dateZIndex}
                    description={T['HeroSearchForm']['Flying date']}
                    isOnlySingleDate={true}
                    inputName={`checkin-${segment.id}`}
                    clearDataButtonClassName={clsx(formStyle === 'small' && 'sm:end-18', formStyle === 'default' && 'sm:end-22')}
                    defaultValue={segment.date}
                  />
                </div>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => removeMultiCitySegment(segment.id)}
                  className="mx-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Remove segment"
                  disabled={!canRemove}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
              </div>
            </div>
          )
        })}
        <div className="flex items-center gap-3 border-t border-neutral-100 px-7 py-4 dark:border-neutral-700 xl:px-8 xl:py-6">
          <button
            type="button"
            onClick={addMultiCitySegment}
            disabled={!canAdd}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-neutral-300 disabled:hover:bg-transparent dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:disabled:hover:border-neutral-700 dark:disabled:hover:bg-transparent"
          >
            <PlusIcon className="h-5 w-5" />
            {canAdd ? 'Add another flight' : `Maximum ${MAX_SEGMENTS} flights allowed`}
          </button>
          <button
            type="submit"
            className={clsx(
              'flex shrink-0 items-center justify-center rounded-full bg-primary-600 text-neutral-50 hover:bg-primary-700 focus:outline-hidden cursor-pointer',
              formStyle === 'default' ? 'size-16' : 'size-14'
            )}
          >
            <HugeiconsIcon icon={Search01Icon} size={24} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <Form
      className={clsx(
        'relative z-10 w-full bg-white [--form-bg:var(--color-white)] dark:bg-neutral-800 dark:[--form-bg:var(--color-neutral-800)]',
        className,
        formStyle === 'small' && 'rounded-t-2xl rounded-b-4xl custom-shadow-1',
        formStyle === 'default' &&
          'rounded-t-2xl rounded-b-[40px] shadow-xl xl:rounded-t-3xl xl:rounded-b-[48px] dark:shadow-2xl'
      )}
      action={handleFormSubmit}
    >
      <div
        className={clsx(
          'flex flex-wrap items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-700',
          formStyle === 'small' && 'px-7 py-4 xl:px-8',
          formStyle === 'default' && 'px-7 py-4 xl:px-8 xl:py-6'
        )}
      >
        {renderTripType()}
        <div className="mx-2 h-7 self-center border-r" />
        {renderSelectClassType()}
        {renderGuest()}
      </div>

      {tripType === 'multiCity' ? (
        renderMultiCityForm()
      ) : (
        <div className="relative z-10 flex flex-1 rounded-full">
          <LocationInputField
            inputName="flying-from-location"
            placeholder={T['HeroSearchForm']['Flying from']}
            description={T['HeroSearchForm']['Where are you flying from?']}
            className="hero-search-form__field-after flex-1"
            fieldStyle={formStyle}
            useAmadeus={true}
            defaultValue={initValues?.from}
          />
          <VerticalDividerLine />
          <LocationInputField
            inputName="flying-to-location"
            placeholder={T['HeroSearchForm']['Flying to']}
            description={T['HeroSearchForm']['Where are you flying to?']}
            className="hero-search-form__field-before hero-search-form__field-after flex-1"
            fieldStyle={formStyle}
            useAmadeus={true}
            defaultValue={initValues?.to}
          />
          <VerticalDividerLine />
          <DateRangeField
            fieldStyle={formStyle}
            className="hero-search-form__field-before flex-1"
            panelClassName="sm:start-auto sm:translate-x-0 sm:end-0"
            description={tripType === 'oneWay' ? T['HeroSearchForm']['Flying date'] : T['HeroSearchForm']['Flying dates']}
            isOnlySingleDate={tripType === 'oneWay'}
            clearDataButtonClassName={clsx(formStyle === 'small' && 'sm:end-18', formStyle === 'default' && 'sm:end-22')}
            defaultValue={initValues?.departureDate ? new Date(initValues.departureDate) : null}
            defaultEndValue={initValues?.returnDate ? new Date(initValues.returnDate) : null}
          />

          <ButtonSubmit fieldStyle={formStyle} />
        </div>
      )}
    </Form>
  )
}
