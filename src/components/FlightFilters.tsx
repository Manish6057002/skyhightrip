'use client'

import { Button } from '@/shared/Button'
import { Checkbox, CheckboxField, CheckboxGroup } from '@/shared/Checkbox'
import { Description, Fieldset, Label } from '@/shared/fieldset'
import T from '@/utils/getT'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PriceRangeSlider } from './PriceRangeSlider'
import { TFlightListing } from '@/data/listings'
import Select from '@/shared/Select'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

export type SortOption = 'price-low' | 'price-high' | 'duration-short' | 'duration-long' | 'departure-early' | 'departure-late' | ''

type FilterState = {
  priceRange: [number, number]
  stops: string[]
  airlines: string[]
  travelClass: string[]
  departureTime: [number, number]
  returnTime: [number, number]
}

interface FlightFiltersProps {
  flights: TFlightListing[]
  onFilterChange: (filteredFlights: TFlightListing[]) => void
  onSortChange?: (sortBy: SortOption) => void
  onCloseModal?: () => void
}

export default function FlightFilters({ flights, onFilterChange, onSortChange, onCloseModal }: FlightFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get unique airlines from flights
  const uniqueAirlines = Array.from(
    new Set(flights.map((flight) => flight.airlines.fullName || flight.airlines.name))
  ).sort()

  // Get price range from flights
  const prices = flights.map((flight) => {
    const priceStr = flight.price.replace(/[^0-9]/g, '')
    return parseInt(priceStr) || 0
  })
  const minPrice = Math.min(...prices, 0)
  const maxPrice = Math.max(...prices, 10000)

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [minPrice, maxPrice],
    stops: [],
    airlines: [],
    travelClass: [],
    departureTime: [0, 23],
    returnTime: [0, 23],
  })

  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice])
  const [departureTimeRange, setDepartureTimeRange] = useState<[number, number]>([0, 23])
  const [returnTimeRange, setReturnTimeRange] = useState<[number, number]>([0, 23])
  const [sortBy, setSortBy] = useState<SortOption>('')

  // Format hour to time string (e.g., 6 -> "6:00 AM", 14 -> "2:00 PM")
  const formatHour = (hour: number): string => {
    const h = hour % 12 || 12
    const ampm = hour < 12 ? 'AM' : 'PM'
    return `${h}:00 ${ampm}`
  }

  // Parse duration string (e.g., "2h 30m") to minutes
  const parseDuration = (duration: string): number => {
    const match = duration.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/)
    if (!match) return 0
    const hours = match[1] ? parseInt(match[1]) : 0
    const minutes = match[2] ? parseInt(match[2]) : 0
    return hours * 60 + minutes
  }

  // Apply filters and sorting
  const applyFilters = (newFilters: Partial<FilterState>, newSortBy?: SortOption) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    
    const updatedSortBy = newSortBy !== undefined ? newSortBy : sortBy
    if (newSortBy !== undefined) {
      setSortBy(updatedSortBy)
      if (onSortChange) {
        onSortChange(updatedSortBy)
      }
    }
    
    // Reset to page 1 when filters change
    const newParams = new URLSearchParams(searchParams.toString())
    if (newParams.get('page') !== '1') {
      newParams.set('page', '1')
      router.replace(`?${newParams.toString()}`, { scroll: false })
    }

    let filtered = [...flights]

    // Filter by price
    filtered = filtered.filter((flight) => {
      const priceStr = flight.price.replace(/[^0-9]/g, '')
      const price = parseInt(priceStr) || 0
      return price >= updatedFilters.priceRange[0] && price <= updatedFilters.priceRange[1]
    })

    // Filter by stops
    if (updatedFilters.stops.length > 0) {
      filtered = filtered.filter((flight) => {
        if (updatedFilters.stops.includes('nonstop')) {
          return flight.stopNumber === 0
        }
        if (updatedFilters.stops.includes('1stop')) {
          return flight.stopNumber === 1
        }
        if (updatedFilters.stops.includes('2+stops')) {
          return flight.stopNumber >= 2
        }
        return true
      })
    }

    // Filter by airlines
    if (updatedFilters.airlines.length > 0) {
      filtered = filtered.filter((flight) => {
        const airlineName = flight.airlines.fullName || flight.airlines.name
        return updatedFilters.airlines.includes(airlineName)
      })
    }

    // Filter by departure time (hour range)
    const [departureMin, departureMax] = updatedFilters.departureTime
    if (departureMin !== 0 || departureMax !== 23) {
      filtered = filtered.filter((flight) => {
        const hour = flight.departureTime.getHours()
        return hour >= departureMin && hour <= departureMax
      })
    }

    // Filter by return time (hour range, for round-trip flights, check arrival time)
    const [returnMin, returnMax] = updatedFilters.returnTime
    if (returnMin !== 0 || returnMax !== 23) {
      filtered = filtered.filter((flight) => {
        const hour = flight.arrivalTime.getHours()
        return hour >= returnMin && hour <= returnMax
      })
    }

    // Apply sorting
    if (updatedSortBy) {
      filtered.sort((a, b) => {
        switch (updatedSortBy) {
          case 'price-low':
            const priceA = parseInt(a.price.replace(/[^0-9]/g, '')) || 0
            const priceB = parseInt(b.price.replace(/[^0-9]/g, '')) || 0
            return priceA - priceB
          case 'price-high':
            const priceAHigh = parseInt(a.price.replace(/[^0-9]/g, '')) || 0
            const priceBHigh = parseInt(b.price.replace(/[^0-9]/g, '')) || 0
            return priceBHigh - priceAHigh
          case 'duration-short':
            return parseDuration(a.duration) - parseDuration(b.duration)
          case 'duration-long':
            return parseDuration(b.duration) - parseDuration(a.duration)
          case 'departure-early':
            return a.departureTime.getTime() - b.departureTime.getTime()
          case 'departure-late':
            return b.departureTime.getTime() - a.departureTime.getTime()
          default:
            return 0
        }
      })
    }

    onFilterChange(filtered)
  }

  const handlePriceChange = (range: [number, number]) => {
    setPriceRange(range)
    applyFilters({ priceRange: range })
  }

  const handleStopChange = (stop: string, checked: boolean) => {
    const newStops = checked
      ? [...filters.stops, stop]
      : filters.stops.filter((s) => s !== stop)
    applyFilters({ stops: newStops })
  }

  const handleAirlineChange = (airline: string, checked: boolean) => {
    const newAirlines = checked
      ? [...filters.airlines, airline]
      : filters.airlines.filter((a) => a !== airline)
    applyFilters({ airlines: newAirlines })
  }

  const handleDepartureTimeChange = (range: [number, number]) => {
    setDepartureTimeRange(range)
    applyFilters({ departureTime: range })
  }

  const handleReturnTimeChange = (range: [number, number]) => {
    setReturnTimeRange(range)
    applyFilters({ returnTime: range })
  }

  const handleSortChange = (sort: SortOption) => {
    applyFilters({}, sort)
  }

  const clearAllFilters = () => {
    const resetFilters: FilterState = {
      priceRange: [minPrice, maxPrice],
      stops: [],
      airlines: [],
      travelClass: [],
      departureTime: [0, 23],
      returnTime: [0, 23],
    }
    setFilters(resetFilters)
    setPriceRange([minPrice, maxPrice])
    setDepartureTimeRange([0, 23])
    setReturnTimeRange([0, 23])
    setSortBy('')
    if (onSortChange) {
      onSortChange('')
    }
    onFilterChange(flights)
  }

  return (
    <div className={`space-y-6 ${onCloseModal ? 'py-7' : 'rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900'}`}>
      {!onCloseModal && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h4 className="mb-4 text-sm font-medium">Price Range</h4>
        <PriceRangeSlider
          min={minPrice}
          max={maxPrice}
          defaultValue={[minPrice, maxPrice]}
          onChange={(value) => handlePriceChange([value[0], value[1]])}
          showTitle={false}
        />
      </div>

      {/* Stops */}
      <div>
        <h4 className="mb-4 text-sm font-medium">Stops</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.stops.includes('nonstop')}
              onChange={(e) => handleStopChange('nonstop', e.target.checked)}
              className="mr-2 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm">Non-stop</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.stops.includes('1stop')}
              onChange={(e) => handleStopChange('1stop', e.target.checked)}
              className="mr-2 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm">1 Stop</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.stops.includes('2+stops')}
              onChange={(e) => handleStopChange('2+stops', e.target.checked)}
              className="mr-2 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm">2+ Stops</span>
          </label>
        </div>
      </div>

      {/* Airlines */}
      {uniqueAirlines.length > 0 && (
        <div>
          <h4 className="mb-4 text-sm font-medium">Airlines</h4>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {uniqueAirlines.slice(0, 10).map((airline) => (
              <label key={airline} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.airlines.includes(airline)}
                  onChange={(e) => handleAirlineChange(airline, e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">{airline}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Departure Time */}
      <div>
        <h4 className="mb-4 text-sm font-medium">Departure Time</h4>
        <div className="px-2">
          <Slider
            range
            min={0}
            max={23}
            step={1}
            value={departureTimeRange}
            allowCross={false}
            onChange={(value) => {
              const newRange = value as [number, number]
              handleDepartureTimeChange(newRange)
            }}
          />
        </div>
        <div className="mt-4 flex justify-between gap-x-5">
          <div className="flex-1">
            <div className="ps-4 text-xs/6 text-neutral-700 dark:text-neutral-300">From</div>
            <div className="relative mt-0.5 w-full rounded-full bg-neutral-100 px-4 py-2 text-sm dark:bg-neutral-800">
              {formatHour(departureTimeRange[0])}
            </div>
          </div>
          <div className="flex-1">
            <div className="ps-4 text-xs/6 text-neutral-700 dark:text-neutral-300">To</div>
            <div className="relative mt-0.5 w-full rounded-full bg-neutral-100 px-4 py-2 text-sm dark:bg-neutral-800">
              {formatHour(departureTimeRange[1])}
            </div>
          </div>
        </div>
      </div>

      {/* Return Time */}
      <div>
        <h4 className="mb-4 text-sm font-medium">Return Time</h4>
        <div className="px-2">
          <Slider
            range
            min={0}
            max={23}
            step={1}
            value={returnTimeRange}
            allowCross={false}
            onChange={(value) => {
              const newRange = value as [number, number]
              handleReturnTimeChange(newRange)
            }}
          />
        </div>
        <div className="mt-4 flex justify-between gap-x-5">
          <div className="flex-1">
            <div className="ps-4 text-xs/6 text-neutral-700 dark:text-neutral-300">From</div>
            <div className="relative mt-0.5 w-full rounded-full bg-neutral-100 px-4 py-2 text-sm dark:bg-neutral-800">
              {formatHour(returnTimeRange[0])}
            </div>
          </div>
          <div className="flex-1">
            <div className="ps-4 text-xs/6 text-neutral-700 dark:text-neutral-300">To</div>
            <div className="relative mt-0.5 w-full rounded-full bg-neutral-100 px-4 py-2 text-sm dark:bg-neutral-800">
              {formatHour(returnTimeRange[1])}
            </div>
          </div>
        </div>
      </div>

      {/* Sort By */}
      <div>
        <h4 className="mb-4 text-sm font-medium">Sort By</h4>
        <Select
          value={sortBy}
          onChange={(e) => {
            const value = e.target.value as SortOption
            handleSortChange(value)
          }}
        >
          <option value="">None</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="duration-short">Duration: Shortest</option>
          <option value="duration-long">Duration: Longest</option>
          <option value="departure-early">Departure: Earliest</option>
          <option value="departure-late">Departure: Latest</option>
        </Select>
      </div>

    </div>
  )
}

