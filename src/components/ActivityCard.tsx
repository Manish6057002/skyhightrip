'use client'

import StartRating from '@/components/StartRating'
import { Badge } from '@/shared/Badge'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { ButtonCircle } from '@/shared/Button'
import { Location06Icon, ClockIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import { FC, useState } from 'react'
import clsx from 'clsx'

interface ActivityCardProps {
  className?: string
  data: {
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
    images?: string[]
    description?: string
    duration?: string
    category?: string
    categories?: string[]
    fullData?: any // Store full API response for detail page
  }
  size?: 'default' | 'small'
  searchParams?: {
    dateFrom?: string
    dateTo?: string
    destinationCode?: string
    adults?: number
    children?: number
    infants?: number
  }
}

const ActivityCard: FC<ActivityCardProps> = ({ size = 'default', className = '', data, searchParams }) => {
  const {
    id,
    name,
    address,
    city,
    country,
    rating,
    reviewCount,
    price,
    currency = 'EUR',
    image,
    images = [],
    description,
    duration,
    category,
    categories = [],
    fullData,
  } = data

  // Get placeholder image URL
  const getPlaceholderImage = () => {
    const activityImages = [
      '1571896349842-33c89424da2c', // Activity
      '1551882547-27421c4d62f4', // Adventure
      '1564501049412-7c27d28cf0a9', // Tour
      '1571003123894-1f0595d1b078', // Experience
      '1551884170-09c70a23bffe', // Sightseeing
      '1566073771259-6a8506099945', // Outdoor
      '1571896349842-33c89424da2c', // Cultural
      '1551882547-27421c4d62f4', // Entertainment
    ]
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i)
      hash = hash & hash
    }
    const imageIndex = Math.abs(hash) % activityImages.length
    return `https://images.unsplash.com/photo-${activityImages[imageIndex]}?w=800&h=600&fit=crop&auto=format`
  }

  // Get all available images from the activity
  const getAllImages = (): string[] => {
    const imageList: string[] = []

    // Add main image
    if (image) {
      imageList.push(image)
    }

    // Add images array
    if (images && Array.isArray(images)) {
      images.forEach((img) => {
        if (img && typeof img === 'string' && !imageList.includes(img)) {
          imageList.push(img)
        }
      })
    }

    // Extract images from fullData (Hotelbeds API structure)
    if (fullData?.content?.media?.images && Array.isArray(fullData.content.media.images)) {
      fullData.content.media.images.forEach((img: any) => {
        if (img.urls && Array.isArray(img.urls)) {
          // Prefer XLARGE, then LARGE, then LARGE2
          const xlarge = img.urls.find((u: any) => u.sizeType === 'XLARGE')
          const large = img.urls.find((u: any) => u.sizeType === 'LARGE')
          const large2 = img.urls.find((u: any) => u.sizeType === 'LARGE2')
          const url = xlarge?.resource || large?.resource || large2?.resource || img.urls[0]?.resource
          if (url && !imageList.includes(url)) {
            imageList.push(url)
          }
        }
      })
    }

    // If no images found, use placeholder
    if (imageList.length === 0) {
      imageList.push(getPlaceholderImage())
    }

    return imageList
  }

  const allImages = getAllImages()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const hasMultipleImages = allImages.length > 1

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
  }

  const currentImage = allImages[currentImageIndex] || allImages[0]

  const renderImage = () => {
    return (
      <div className="group/image relative h-full min-h-[220px] w-full shrink-0 overflow-hidden rounded-l-2xl md:w-72 md:min-h-[260px]">
        <Image
          src={currentImage}
          alt={name}
          className="object-cover transition-opacity duration-300"
          fill
          unoptimized
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.target as HTMLImageElement
            target.src = getPlaceholderImage()
          }}
        />
        
        {/* Navigation buttons on hover */}
        {hasMultipleImages && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/image:opacity-100">
            {/* Previous button */}
            <div className="absolute start-2 top-1/2 -translate-y-1/2 z-10">
              <ButtonCircle 
                color="white" 
                onClick={handlePrevious}
                className="size-7 shadow-lg hover:scale-110 transition-transform"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="size-3.5 rtl:rotate-180" />
              </ButtonCircle>
            </div>
            
            {/* Next button */}
            <div className="absolute end-2 top-1/2 -translate-y-1/2 z-10">
              <ButtonCircle 
                color="white" 
                onClick={handleNext}
                className="size-7 shadow-lg hover:scale-110 transition-transform"
                aria-label="Next image"
              >
                <ChevronRightIcon className="size-3.5 rtl:rotate-180" />
              </ButtonCircle>
            </div>
          </div>
        )}

        {/* Image indicator dots */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center gap-x-1.5 opacity-0 transition-opacity duration-300 group-hover/image:opacity-100 z-10">
            {allImages.map((_, index) => (
              <button
                key={index}
                className={clsx(
                  "h-1.5 rounded-full transition-all",
                  index === currentImageIndex 
                    ? "bg-white w-6" 
                    : "bg-white/60 w-1.5 hover:bg-white/80"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex(index)
                }}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderCategories = () => {
    const displayCategories = categories.length > 0 ? categories : (category ? [category] : [])
    if (displayCategories.length === 0) return null

    return (
      <div className="flex flex-wrap gap-2">
        {displayCategories.slice(0, 3).map((cat, index) => (
          <Badge key={index} color="zinc" className="text-xs">
            {cat}
          </Badge>
        ))}
      </div>
    )
  }

  const renderContent = () => {
    return (
      <div className="flex grow flex-col p-4 sm:p-6">
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              {name}
            </h2>
            {rating && (
              <div className="mt-1">
                <StartRating reviewCount={reviewCount} point={rating} />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-x-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            <HugeiconsIcon icon={Location06Icon} size={16} color="currentColor" strokeWidth={1.5} />
            <span>{address || `${city || ''}${city && country ? ', ' : ''}${country || ''}` || 'Location not available'}</span>
          </div>

          {duration && (
            <div className="flex items-center gap-x-1.5 text-sm text-neutral-500 dark:text-neutral-400">
              <HugeiconsIcon icon={ClockIcon} size={16} color="currentColor" strokeWidth={1.5} />
              <span>{duration}</span>
            </div>
          )}

          {description && (
            <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          )}

          {renderCategories()}
        </div>
      </div>
    )
  }

  // Build activity href with search params (dates, destination, passengers) for booking flow
  const buildActivityHref = () => {
    let href = `/activities/${id}`
    const params = new URLSearchParams()
    if (searchParams?.dateFrom) params.set('dateFrom', searchParams.dateFrom)
    if (searchParams?.dateTo) params.set('dateTo', searchParams.dateTo)
    if (searchParams?.destinationCode) params.set('destinationCode', searchParams.destinationCode)
    if (searchParams?.adults) params.set('adults', String(searchParams.adults))
    if (searchParams?.children) params.set('children', String(searchParams.children))
    if (searchParams?.infants) params.set('infants', String(searchParams.infants))
    const queryString = params.toString()
    return queryString ? `${href}?${queryString}` : href
  }

  const activityHref = buildActivityHref()

  const renderPriceSection = () => {
    return (
      <div className="flex shrink-0 flex-col items-end justify-between border-l border-neutral-200 p-4 sm:p-6 dark:border-neutral-700">
        <div className="w-full text-right">
          {price ? (
            <div>
              <div className="text-base font-semibold">
                {currency} {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-sm font-normal text-neutral-500 dark:text-neutral-400">per person</div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Price on request</div>
          )}
        </div>
        <Link href={activityHref}>
          <ButtonPrimary className="mt-4 w-full sm:w-auto">
            View Details
          </ButtonPrimary>
        </Link>
      </div>
    )
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      <div className="relative z-10 flex min-h-[220px] flex-col md:min-h-[260px] md:flex-row">
        {renderImage()}
        {renderContent()}
        {renderPriceSection()}
      </div>
    </div>
  )
}

export default ActivityCard

