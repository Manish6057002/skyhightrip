'use client'

import { Search01Icon } from '@/components/Icons'
import T from '@/utils/getT'
import { searchAirports, findAirportByIataCode } from '@/utils/searchAirports'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { Location01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import _ from 'lodash'
import { FC, useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  onClick?: () => void
  onChange?: (value: string, code?: string) => void
  className?: string
  defaultValue?: string
  headingText?: string
  imputName?: string
  useHotelbeds?: boolean
  useAmadeus?: boolean
}

interface Destination {
  id: string
  name: string
  code?: string
  iataCode?: string
  city?: string
  country?: string
}

const LocationInput: FC<Props> = ({
  onChange,
  className,
  defaultValue = '',
  headingText = T['HeroSearchForm']['Where to?'],
  imputName = 'location',
  useHotelbeds = false,
  useAmadeus = false,
}) => {
  const [value, setValue] = useState('')
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  const fetchDestinations = useCallback(
    _.debounce(async (keyword: string) => {
      if (!useHotelbeds || keyword.length < 2) {
        setDestinations([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/hotelbeds/destinations?keyword=${encodeURIComponent(keyword)}`)
        const data = await response.json()
        
        if (data.data) {
          setDestinations(
            data.data.map((destination: any) => ({
              id: destination.code || destination.id,
              name: destination.name || '',
              code: destination.code || '',
              city: destination.city || destination.name,
              country: destination.country || '',
            }))
          )
        }
      } catch (error) {
        console.error('Failed to fetch destinations:', error)
        setDestinations([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [useHotelbeds]
  )

  const fetchAirports = useCallback(
    _.debounce((keyword: string) => {
      if (!useAmadeus || keyword.length < 2) {
        setDestinations([])
        return
      }

      setIsLoading(true)
      try {
        const results = searchAirports(keyword, 20)
        
        setDestinations(
          results.map((airport) => ({
            id: airport.iataCode,
            name: `${airport.name} (${airport.iataCode})`,
            iataCode: airport.iataCode,
            city: airport.city,
            country: airport.country,
          }))
        )
      } catch (error) {
        console.error('Failed to search airports:', error)
        setDestinations([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [useAmadeus]
  )

  useEffect(() => {
    return () => {
      fetchDestinations.cancel()
      fetchAirports.cancel()
    }
  }, [fetchDestinations, fetchAirports])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    setSelectedDestination(null)
    
    if (useHotelbeds && newValue.length >= 2) {
      fetchDestinations(newValue)
    } else if (useAmadeus && newValue.length >= 2) {
      fetchAirports(newValue)
    } else {
      setDestinations([])
    }
  }

  const handleSelectLocation = (destination: Destination | string) => {
    if (typeof destination === 'string') {
      // Fallback for non-API mode
      setTimeout(() => {
        setValue(destination)
        onChange && onChange(destination)
      }, 0)
    } else {
      // API mode - store both name and code
      const code = destination.code || destination.iataCode
      setTimeout(() => {
        setValue(destination.name)
        setSelectedDestination(destination)
        onChange && onChange(destination.name, code)
      }, 0)
    }
  }

  const renderSearchValues = ({ heading, items }: { heading: string; items: string[] }) => {
    return (
      <>
        <p className="block text-base font-semibold">{heading || T['HeroSearchForm']['Destinations']}</p>
        <div className="mt-3">
          {items.map((item) => {
            return (
              <div
                className="mb-1 flex items-center gap-x-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg px-2"
                onClick={() => handleSelectLocation(item)}
                key={item}
              >
                <MapPinIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                <span>{item}</span>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  // Popular flight destinations (airports/cities)
  const popularFlightDestinations = [
    { name: 'New York (JFK)', code: 'JFK', city: 'New York', country: 'United States' },
    { name: 'London (LHR)', code: 'LHR', city: 'London', country: 'United Kingdom' },
    { name: 'Paris (CDG)', code: 'CDG', city: 'Paris', country: 'France' },
    { name: 'Tokyo (NRT)', code: 'NRT', city: 'Tokyo', country: 'Japan' },
    { name: 'Dubai (DXB)', code: 'DXB', city: 'Dubai', country: 'United Arab Emirates' },
    { name: 'Singapore (SIN)', code: 'SIN', city: 'Singapore', country: 'Singapore' },
    { name: 'Los Angeles (LAX)', code: 'LAX', city: 'Los Angeles', country: 'United States' },
    { name: 'Sydney (SYD)', code: 'SYD', city: 'Sydney', country: 'Australia' },
  ]

  const renderDestinations = () => {
    if (isLoading) {
      return (
        <div className="mt-7">
          <p className="block text-base font-semibold">{T['HeroSearchForm']['Destinations']}</p>
          <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Searching destinations...</div>
        </div>
      )
    }

    if (destinations.length > 0) {
      return (
        <div className="mt-7">
          <p className="block text-base font-semibold">{T['HeroSearchForm']['Destinations']}</p>
          <div className="mt-3">
            {destinations.map((destination) => (
              <div
                key={destination.id}
                className="mb-1 flex items-center gap-x-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg px-2"
                onClick={() => handleSelectLocation(destination)}
              >
                <HugeiconsIcon icon={Location01Icon} size={20} className="text-neutral-500 dark:text-neutral-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{destination.name}</span>
                    {(destination.code || destination.iataCode) && (
                      <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {destination.code || destination.iataCode}
                      </span>
                    )}
                  </div>
                  {(destination.city || destination.country) && (
                    <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                      {destination.city || ''}
                      {destination.city && destination.country ? ', ' : ''}
                      {destination.country || ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (value && value.length >= 2 && (useHotelbeds || useAmadeus)) {
      return (
        <div className="mt-7">
          <p className="block text-base font-semibold">{T['HeroSearchForm']['Destinations']}</p>
          <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">No destinations found</div>
        </div>
      )
    }

    // Show popular destinations when input is empty
    if (useAmadeus && !value) {
      return (
        <div className="mt-7">
          <p className="block text-base font-semibold">{T['HeroSearchForm']['Popular destinations']}</p>
          <div className="mt-3">
            {popularFlightDestinations.map((destination) => (
              <div
                key={destination.code}
                className="mb-1 flex items-center gap-x-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg px-2"
                onClick={() => handleSelectLocation({
                  id: destination.code,
                  name: destination.name,
                  iataCode: destination.code,
                  city: destination.city,
                  country: destination.country,
                })}
              >
                <HugeiconsIcon icon={Location01Icon} size={20} className="text-neutral-500 dark:text-neutral-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{destination.name}</span>
                    <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {destination.code}
                    </span>
                  </div>
                  <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                    {destination.city}, {destination.country}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Show popular destinations when input is empty and not using Hotelbeds or Amadeus
    if (!useHotelbeds && !useAmadeus) {
      return (
        <div className="mt-7">
          {value
            ? renderSearchValues({
                heading: T['HeroSearchForm']['Locations'],
                items: ['Afghanistan', 'Albania', 'Algeria', 'American Samao', 'Andorra'],
              })
            : renderSearchValues({
                heading: T['HeroSearchForm']['Popular destinations'],
                items: ['Australia', 'Canada', 'Germany', 'United Kingdom', 'United Arab Emirates'],
              })}
        </div>
      )
    }

    return null
  }

  return (
    <div className={clsx(className)} ref={containerRef}>
      <h3 className="text-xl font-semibold sm:text-2xl">{headingText}</h3>
      <div className="relative mt-5">
        <input
          className="block w-full truncate rounded-xl border border-neutral-300 bg-transparent px-4 py-3 pe-12 leading-none font-normal placeholder-neutral-500 placeholder:truncate focus:border-primary-300 focus:ring-3 focus:ring-primary-200/50 sm:text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder-neutral-300 dark:focus:ring-primary-600/25"
          placeholder={T['HeroSearchForm']['Search destinations']}
          value={value}
          onChange={handleInputChange}
          ref={inputRef}
          name={imputName}
          autoComplete="off"
          autoFocus
          data-autofocus
        />
        <span className="absolute end-2.5 top-1/2 -translate-y-1/2">
          <Search01Icon className="h-5 w-5 text-neutral-700 dark:text-neutral-400" />
        </span>
      </div>
      {useHotelbeds && selectedDestination && selectedDestination.code && (
        <input type="hidden" name={`${imputName}_code`} value={selectedDestination.code} />
      )}
      {useAmadeus && selectedDestination && selectedDestination.iataCode && (
        <input type="hidden" name={`${imputName}_code`} value={selectedDestination.iataCode} />
      )}
      {renderDestinations()}
    </div>
  )
}

export default LocationInput
