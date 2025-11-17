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

export type SortOption = 'price-low' | 'price-high' | 'rating-high' | 'rating-low' | 'name-asc' | 'name-desc' | ''

interface Activity {
  id: string
  name: string
  address?: string
  city?: string
  country?: string
  rating?: number
  reviewCount?: number
  price?: number
  currency?: string
  category?: string
  categories?: string[]
  duration?: string
  fullData?: any
}

type FilterState = {
  priceRange: [number, number]
  rating: number[]
  categories: string[]
  duration: string[]
}

interface ActivityFiltersProps {
  activities: Activity[]
  onFilterChange: (filteredActivities: Activity[]) => void
  onSortChange?: (sortBy: SortOption) => void
}

export default function ActivityFilters({ activities, onFilterChange, onSortChange }: ActivityFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get unique categories from activities
  const allCategories = new Set<string>()
  activities.forEach((activity) => {
    if (activity.category) {
      allCategories.add(activity.category)
    }
    if (activity.categories && Array.isArray(activity.categories)) {
      activity.categories.forEach((cat) => allCategories.add(cat))
    }
    // Also check fullData for categories
    if (activity.fullData?.categories && Array.isArray(activity.fullData.categories)) {
      activity.fullData.categories.forEach((cat: any) => {
        const catName = typeof cat === 'string' ? cat : (cat.name || cat.description || String(cat))
        if (catName) allCategories.add(catName)
      })
    }
  })
  const uniqueCategories = Array.from(allCategories).sort()
  
  // Get unique durations
  const allDurations = new Set<string>()
  activities.forEach((activity) => {
    if (activity.duration) {
      allDurations.add(activity.duration)
    }
  })
  const uniqueDurations = Array.from(allDurations).sort()

  // Get price range from activities
  const prices = useMemo(() => activities
    .map((activity) => activity.price || 0)
    .filter((price) => price > 0), [activities])
  const minPrice = prices.length > 0 ? Math.min(...prices, 0) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices, 1000) : 1000

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [minPrice, maxPrice],
    rating: [],
    categories: [],
    duration: [],
  })

  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice])
  const [sortBy, setSortBy] = useState<SortOption>('')

  // Update price range when activities change
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
  }, [activities.length, prices.length, minPrice, maxPrice, prices])

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

    let filtered = [...activities]

    // Filter by price
    filtered = filtered.filter((activity) => {
      const price = activity.price || 0
      return price >= updatedFilters.priceRange[0] && price <= updatedFilters.priceRange[1]
    })

    // Filter by rating
    if (updatedFilters.rating.length > 0) {
      filtered = filtered.filter((activity) => {
        if (!activity.rating) return false
        return updatedFilters.rating.some((r) => {
          const ratingNum = typeof r === 'string' ? parseFloat(r) : r
          return activity.rating! >= ratingNum
        })
      })
    }

    // Filter by categories
    if (updatedFilters.categories.length > 0) {
      filtered = filtered.filter((activity) => {
        const activityCategories = [
          ...(activity.categories || []),
          ...(activity.category ? [activity.category] : []),
        ]
        if (activityCategories.length === 0) return false
        return updatedFilters.categories.some((cat) =>
          activityCategories.some((ac) => ac.toLowerCase().includes(cat.toLowerCase()))
        )
      })
    }

    // Filter by duration
    if (updatedFilters.duration.length > 0) {
      filtered = filtered.filter((activity) => {
        if (!activity.duration) return false
        return updatedFilters.duration.some((dur) =>
          activity.duration!.toLowerCase().includes(dur.toLowerCase())
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

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter((c) => c !== category)
    applyFilters({ categories: newCategories })
  }

  const handleDurationChange = (duration: string, checked: boolean) => {
    const newDurations = checked
      ? [...filters.duration, duration]
      : filters.duration.filter((d) => d !== duration)
    applyFilters({ duration: newDurations })
  }

  const clearFilters = () => {
    const newFilters: FilterState = {
      priceRange: [minPrice, maxPrice],
      rating: [],
      categories: [],
      duration: [],
    }
    setPriceRange([minPrice, maxPrice])
    setFilters(newFilters)
    applyFilters(newFilters, '')
  }

  const hasActiveFilters = filters.rating.length > 0 || 
    filters.categories.length > 0 || 
    filters.duration.length > 0 ||
    filters.priceRange[0] !== minPrice || 
    filters.priceRange[1] !== maxPrice

  return (
    <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button onClick={clearFilters} color="white" className="text-xs px-3 py-1.5">
            Clear all
          </Button>
        )}
      </div>

      {/* Sort */}
      <Fieldset>
        <Label>Sort by</Label>
        <Select
          value={sortBy}
          onChange={(e) => {
            const newSortBy = e.target.value as SortOption
            applyFilters({}, newSortBy)
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
      </Fieldset>

      {/* Price Range */}
      <Fieldset>
        <Label>Price Range</Label>
        <Field>
          <PriceRangeSlider
            key={`${priceRange[0]}-${priceRange[1]}`}
            min={minPrice}
            max={maxPrice}
            defaultValue={priceRange}
            onChange={handlePriceChange}
          />
          <Description>
            {priceRange[0].toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} - {priceRange[1].toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Description>
        </Field>
      </Fieldset>

      {/* Rating */}
      <Fieldset>
        <Label>Rating</Label>
        <CheckboxGroup>
          {[5, 4, 3, 2, 1].map((rating) => (
            <CheckboxField key={rating}>
              <Checkbox
                checked={filters.rating.includes(rating)}
                onChange={(checked) => handleRatingChange(rating, checked)}
              />
              <Label>
                {rating}+ stars
              </Label>
            </CheckboxField>
          ))}
        </CheckboxGroup>
      </Fieldset>

      {/* Categories */}
      {uniqueCategories.length > 0 && (
        <Fieldset>
          <Label>Categories</Label>
          <CheckboxGroup>
            {uniqueCategories.slice(0, 10).map((category) => (
              <CheckboxField key={category}>
                <Checkbox
                  checked={filters.categories.includes(category)}
                  onChange={(checked) => handleCategoryChange(category, checked)}
                />
                <Label>{category}</Label>
              </CheckboxField>
            ))}
          </CheckboxGroup>
        </Fieldset>
      )}

      {/* Duration */}
      {uniqueDurations.length > 0 && (
        <Fieldset>
          <Label>Duration</Label>
          <CheckboxGroup>
            {uniqueDurations.map((duration) => (
              <CheckboxField key={duration}>
                <Checkbox
                  checked={filters.duration.includes(duration)}
                  onChange={(checked) => handleDurationChange(duration, checked)}
                />
                <Label>{duration}</Label>
              </CheckboxField>
            ))}
          </CheckboxGroup>
        </Fieldset>
      )}
    </div>
  )
}

