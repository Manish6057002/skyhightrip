'use client'

import { Button } from '@/shared/Button'
import { Checkbox, CheckboxField, CheckboxGroup } from '@/shared/Checkbox'
import { Description, Fieldset, Field, Label } from '@/shared/fieldset'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PriceRangeSlider } from './PriceRangeSlider'
import Select from '@/shared/Select'
import { StarIcon } from '@heroicons/react/24/solid'

export type SortOption = 'price-low' | 'price-high' | 'rating-high' | 'rating-low' | 'name-asc' | 'name-desc' | ''

interface Hotel {
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
  amenities?: string[]
  description?: string
  fullData?: any // Store full API response for accessing facilities and board types
}

type FilterState = {
  priceRange: [number, number]
  rating: number[]
  amenities: string[]
  boardTypes: string[]
}

interface HotelFiltersProps {
  hotels: Hotel[]
  onFilterChange: (filteredHotels: Hotel[]) => void
  onSortChange?: (sortBy: SortOption) => void
}

export default function HotelFilters({ hotels, onFilterChange, onSortChange }: HotelFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get unique amenities from hotels (from fullData.facilities or amenities)
  const allAmenities = new Set<string>()
  hotels.forEach((hotel) => {
    // Get facilities from fullData (API response) first
    const facilities = hotel.fullData?.facilities || []
    facilities.forEach((facility: any) => {
      if (typeof facility === 'string') {
        allAmenities.add(facility)
      } else if (facility?.description?.content) {
        allAmenities.add(facility.description.content)
      } else if (facility?.description) {
        allAmenities.add(facility.description)
      } else if (facility?.name) {
        allAmenities.add(facility.name)
      }
    })
    // Fallback to amenities array
    hotel.amenities?.forEach((amenity) => allAmenities.add(amenity))
  })
  const uniqueAmenities = Array.from(allAmenities).sort()
  
  // Get common amenities (most frequently occurring)
  const amenityCounts = new Map<string, number>()
  hotels.forEach((hotel) => {
    const facilities = hotel.fullData?.facilities || []
    facilities.forEach((facility: any) => {
      let amenityName = ''
      if (typeof facility === 'string') {
        amenityName = facility
      } else if (facility?.description?.content) {
        amenityName = facility.description.content
      } else if (facility?.description) {
        amenityName = facility.description
      } else if (facility?.name) {
        amenityName = facility.name
      }
      if (amenityName) {
        amenityCounts.set(amenityName, (amenityCounts.get(amenityName) || 0) + 1)
      }
    })
    hotel.amenities?.forEach((amenity) => {
      amenityCounts.set(amenity, (amenityCounts.get(amenity) || 0) + 1)
    })
  })
  
  // Get top 15 most common amenities
  const commonAmenities = Array.from(amenityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name]) => name)
  
  // Get unique board types from hotels (from rooms or fullData)
  const allBoardTypes = new Set<string>()
  hotels.forEach((hotel) => {
    // Check rooms for board types
    if (hotel.fullData?.rooms && Array.isArray(hotel.fullData.rooms)) {
      hotel.fullData.rooms.forEach((room: any) => {
        if (room.boardType) {
          const boardType = typeof room.boardType === 'string' 
            ? room.boardType 
            : room.boardType.name || room.boardType.code || String(room.boardType)
          allBoardTypes.add(boardType)
        }
        if (room.rates && Array.isArray(room.rates)) {
          room.rates.forEach((rate: any) => {
            if (rate.boardType) {
              const boardType = typeof rate.boardType === 'string' 
                ? rate.boardType 
                : rate.boardType.name || rate.boardType.code || String(rate.boardType)
              allBoardTypes.add(boardType)
            }
          })
        }
      })
    }
  })
  const uniqueBoardTypes = Array.from(allBoardTypes).sort()

  // Get price range from hotels
  const prices = useMemo(() => hotels
    .map((hotel) => hotel.price || 0)
    .filter((price) => price > 0), [hotels])
  const minPrice = prices.length > 0 ? Math.min(...prices, 0) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices, 1000) : 1000

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [minPrice, maxPrice],
    rating: [],
    amenities: [],
    boardTypes: [],
  })

  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice])
  const [sortBy, setSortBy] = useState<SortOption>('')

  // Update price range when hotels change
  useEffect(() => {
    if (prices.length > 0) {
      const newMinPrice = Math.min(...prices, 0)
      const newMaxPrice = Math.max(...prices, 1000)
      if (newMinPrice !== minPrice || newMaxPrice !== maxPrice) {
        setPriceRange([newMinPrice, newMaxPrice])
        setFilters((prev) => ({
          ...prev,
          priceRange: [newMinPrice, newMaxPrice],
        }))
      }
    }
  }, [hotels.length, prices.length, minPrice, maxPrice, prices])

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

    let filtered = [...hotels]

    // Filter by price
    filtered = filtered.filter((hotel) => {
      const price = hotel.price || 0
      return price >= updatedFilters.priceRange[0] && price <= updatedFilters.priceRange[1]
    })

    // Filter by rating
    if (updatedFilters.rating.length > 0) {
      filtered = filtered.filter((hotel) => {
        if (!hotel.rating) return false
        return updatedFilters.rating.some((r) => {
          const ratingNum = typeof r === 'string' ? parseFloat(r) : r
          return hotel.rating! >= ratingNum
        })
      })
    }

    // Filter by amenities
    if (updatedFilters.amenities.length > 0) {
      filtered = filtered.filter((hotel) => {
        // Get facilities from fullData (API response) first
        const facilities = hotel.fullData?.facilities || []
        const facilityNames = facilities.map((facility: any) => {
          if (typeof facility === 'string') return facility
          if (facility?.description?.content) return facility.description.content
          if (facility?.description) return facility.description
          if (facility?.name) return facility.name
          return String(facility)
        })
        const allAmenities = [...facilityNames, ...(hotel.amenities || [])]
        
        if (allAmenities.length === 0) return false
        return updatedFilters.amenities.every((amenity) =>
          allAmenities.some((h) => h.toLowerCase().includes(amenity.toLowerCase()))
        )
      })
    }

    // Filter by board types
    if (updatedFilters.boardTypes.length > 0) {
      filtered = filtered.filter((hotel) => {
        if (!hotel.fullData?.rooms || !Array.isArray(hotel.fullData.rooms)) return false
        
        const hotelBoardTypes = new Set<string>()
        hotel.fullData.rooms.forEach((room: any) => {
          if (room.boardType) {
            const boardType = typeof room.boardType === 'string' 
              ? room.boardType 
              : room.boardType.name || room.boardType.code || String(room.boardType)
            hotelBoardTypes.add(boardType)
          }
          if (room.rates && Array.isArray(room.rates)) {
            room.rates.forEach((rate: any) => {
              if (rate.boardType) {
                const boardType = typeof rate.boardType === 'string' 
                  ? rate.boardType 
                  : rate.boardType.name || rate.boardType.code || String(rate.boardType)
                hotelBoardTypes.add(boardType)
              }
            })
          }
        })
        
        return updatedFilters.boardTypes.some((boardType) =>
          Array.from(hotelBoardTypes).some((h) => h.toLowerCase().includes(boardType.toLowerCase()))
        )
      })
    }

    // Apply sorting
    if (updatedSortBy) {
      filtered.sort((a, b) => {
        switch (updatedSortBy) {
          case 'price-low':
            return (a.price || 0) - (b.price || 0)
          case 'price-high':
            return (b.price || 0) - (a.price || 0)
          case 'rating-high':
            return (b.rating || 0) - (a.rating || 0)
          case 'rating-low':
            return (a.rating || 0) - (b.rating || 0)
          case 'name-asc':
            return a.name.localeCompare(b.name)
          case 'name-desc':
            return b.name.localeCompare(a.name)
          default:
            return 0
        }
      })
    }

    onFilterChange(filtered)
  }

  const handlePriceChange = (values: number[]) => {
    const newRange = [values[0], values[1]] as [number, number]
    setPriceRange(newRange)
    applyFilters({ priceRange: newRange })
  }

  const handleRatingChange = (rating: number, checked: boolean) => {
    const newRatings = checked
      ? [...filters.rating, rating]
      : filters.rating.filter((r) => r !== rating)
    applyFilters({ rating: newRatings })
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const newAmenities = checked
      ? [...filters.amenities, amenity]
      : filters.amenities.filter((a) => a !== amenity)
    applyFilters({ amenities: newAmenities })
  }

  const handleBoardTypeChange = (boardType: string, checked: boolean) => {
    const newBoardTypes = checked
      ? [...filters.boardTypes, boardType]
      : filters.boardTypes.filter((b) => b !== boardType)
    applyFilters({ boardTypes: newBoardTypes })
  }

  const clearFilters = () => {
    const newFilters: FilterState = {
      priceRange: [minPrice, maxPrice],
      rating: [],
      amenities: [],
      boardTypes: [],
    }
    setFilters(newFilters)
    setPriceRange([minPrice, maxPrice])
    setSortBy('')
    applyFilters(newFilters, '')
  }

  const hasActiveFilters =
    filters.priceRange[0] !== minPrice ||
    filters.priceRange[1] !== maxPrice ||
    filters.rating.length > 0 ||
    filters.amenities.length > 0 ||
    filters.boardTypes.length > 0 ||
    sortBy !== ''

  return (
    <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            color="light"
            onClick={clearFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Price Range */}
      <Field>
        <Label className="mb-4">Price Range</Label>
        <PriceRangeSlider
          min={minPrice}
          max={maxPrice}
          defaultValue={[minPrice, maxPrice]}
          onChange={handlePriceChange}
          showTitle={false}
        />
      </Field>

      {/* Rating */}
      <Field>
        <Label className="mb-4">Rating</Label>
        <CheckboxGroup>
          {[5, 4, 3, 2, 1].map((rating) => (
            <CheckboxField key={rating}>
              <Checkbox
                name={`rating-${rating}`}
                checked={filters.rating.includes(rating)}
                onChange={(checked) => handleRatingChange(rating, checked)}
              />
              <Label className="ml-2 flex items-center gap-x-1">
                <div className="flex items-center">
                  {Array.from({ length: rating }).map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 text-orange-400" />
                  ))}
                </div>
              </Label>
            </CheckboxField>
          ))}
        </CheckboxGroup>
      </Field>

      {/* Amenities */}
      {commonAmenities.length > 0 && (
        <Field>
          <Label className="mb-4">Amenities</Label>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            <CheckboxGroup>
              {commonAmenities.map((amenity) => (
                <CheckboxField key={amenity}>
                  <Checkbox
                    name={`amenity-${amenity}`}
                    checked={filters.amenities.includes(amenity)}
                    onChange={(checked) => handleAmenityChange(amenity, checked)}
                  />
                  <Label className="ml-2 text-sm">{amenity}</Label>
                </CheckboxField>
              ))}
            </CheckboxGroup>
          </div>
        </Field>
      )}

      {/* Board Types (Property Type) */}
      {uniqueBoardTypes.length > 0 && (
        <Field>
          <Label className="mb-4">Board Type</Label>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            <CheckboxGroup>
              {uniqueBoardTypes.map((boardType) => (
                <CheckboxField key={boardType}>
                  <Checkbox
                    name={`boardType-${boardType}`}
                    checked={filters.boardTypes.includes(boardType)}
                    onChange={(checked) => handleBoardTypeChange(boardType, checked)}
                  />
                  <Label className="ml-2 text-sm">{boardType}</Label>
                </CheckboxField>
              ))}
            </CheckboxGroup>
          </div>
        </Field>
      )}

      {/* Sort By */}
      <Field>
        <Label className="mb-4">Sort By</Label>
        <Select
          value={sortBy}
          onChange={(e) => {
            const value = e.target.value as SortOption
            applyFilters({}, value)
          }}
        >
          <option value="">Default</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating-high">Rating: High to Low</option>
          <option value="rating-low">Rating: Low to High</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </Select>
      </Field>
    </div>
  )
}

