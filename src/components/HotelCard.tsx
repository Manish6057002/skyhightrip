'use client'

import StartRating from '@/components/StartRating'
import { Badge } from '@/shared/Badge'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { ButtonCircle } from '@/shared/Button'
import { Location06Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { StarIcon } from '@heroicons/react/24/solid'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import { FC, useState } from 'react'
import clsx from 'clsx'

interface HotelCardProps {
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
    amenities?: string[]
    description?: string
    rooms?: any[]
    fullData?: any // Store full API response for detail page
  }
  size?: 'default' | 'small'
}

const HotelCard: FC<HotelCardProps> = ({ size = 'default', className = '', data }) => {
  const {
    id,
    name,
    address,
    city,
    country,
    rating,
    reviewCount,
    price,
    currency = 'USD',
    image,
    amenities = [],
    description,
    fullData,
  } = data

  // Get placeholder image URL (using Unsplash for hotel images)
  const getPlaceholderImage = () => {
    // Use hotel ID to get a consistent image (hash the ID to get a number between 1-10)
    const hotelImages = [
      '1566073771259-6a8506099945', // Hotel room
      '1551884170-09c70a23bffe', // Hotel lobby
      '1571896349842-33c89424da2c', // Hotel exterior
      '1551882547-27421c4d62f4', // Hotel pool
      '1564501049412-7c27d28cf0a9', // Hotel bedroom
      '1571003123894-1f0595d1b078', // Hotel bathroom
      '1551884170-09c70a23bffe', // Hotel restaurant
      '1566073771259-6a8506099945', // Hotel view
      '1571896349842-33c89424da2c', // Hotel suite
      '1551882547-27421c4d62f4', // Hotel amenities
    ]
    // Create a simple hash from the hotel ID
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i)
      hash = hash & hash // Convert to 32-bit integer
    }
    const imageIndex = Math.abs(hash) % hotelImages.length
    return `https://images.unsplash.com/photo-${hotelImages[imageIndex]}?w=800&h=600&fit=crop&auto=format`
  }

  // Format Hotelbeds image URL (XL - extra large images)
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null
    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) return imagePath
    
    // Clean the image path - remove leading/trailing slashes
    const cleanPath = imagePath.replace(/^\/+|\/+$/g, '')
    
    // Construct Hotelbeds image URL for XL images
    // Format: https://photos.hotelbeds.com/giata/xl/{path}
    return `https://photos.hotelbeds.com/giata/xl/${cleanPath}`
  }

  // Get all available images from the hotel
  const getAllImages = (): string[] => {
    const imageList: string[] = []

    // Add main image
    if (image) {
      const imageUrl = getImageUrl(image)
      if (imageUrl && !imageList.includes(imageUrl)) {
        imageList.push(imageUrl)
      }
    }

    // Add images array (if it exists in data)
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((img: string) => {
        if (img && typeof img === 'string') {
          const imageUrl = getImageUrl(img) || img
          if (imageUrl && !imageList.includes(imageUrl)) {
            imageList.push(imageUrl)
          }
        }
      })
    }

    // Extract images from fullData (Hotelbeds API structure)
    if (fullData?.images && Array.isArray(fullData.images)) {
      fullData.images.forEach((img: any) => {
        const imagePath = img.path || img.url || img.uri || img.fileName
        if (imagePath) {
          const imageUrl = getImageUrl(imagePath)
          if (imageUrl && !imageList.includes(imageUrl)) {
            imageList.push(imageUrl)
          }
        }
      })
    }

    // Also check mediaFiles in fullData
    if (fullData?.mediaFiles && Array.isArray(fullData.mediaFiles)) {
      fullData.mediaFiles.forEach((media: any) => {
        if (media.type === 'IMAGE' || media.type === 'PHOTO' || !media.type) {
          const imagePath = media.path || media.url || media.uri || media.fileName
          if (imagePath) {
            const imageUrl = getImageUrl(imagePath)
            if (imageUrl && !imageList.includes(imageUrl)) {
              imageList.push(imageUrl)
            }
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
    if (!currentImage) {
      return (
        <div className="relative h-full min-h-[220px] w-full shrink-0 overflow-hidden rounded-l-2xl bg-neutral-200 dark:bg-neutral-700 md:w-72 md:min-h-[260px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">No image</span>
          </div>
        </div>
      )
    }

    return (
      <div className="group/image relative h-full min-h-[220px] w-full shrink-0 overflow-hidden rounded-l-2xl md:w-72 md:min-h-[260px]">
        <Image
          src={currentImage}
          alt={name}
          className="object-cover transition-opacity duration-300"
          fill
          unoptimized
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            // Hide image if it fails to load
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
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

  const renderAmenities = () => {
    if (amenities.length === 0) return null
    
    const displayAmenities = amenities.slice(0, 5)
    const remainingCount = amenities.length - displayAmenities.length

    return (
      <div className="flex flex-wrap gap-2">
        {displayAmenities.map((amenity, index) => (
          <Badge key={index} color="zinc" className="flex items-center gap-1.5 text-xs">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-green-500" />
            {amenity}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge color="zinc" className="text-xs">
            +{remainingCount} more
          </Badge>
        )}
      </div>
    )
  }

  const renderContent = () => {
    return (
      <div className="flex grow flex-col p-4 sm:p-6">
        {/* Hotel Info Section */}
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              {name}
            </h2>
            <div className="mt-1 flex items-center gap-x-1 text-sm">
              {rating && (
                <>
                  <div className="flex items-center">
                    {Array.from({ length: Math.floor(rating) }).map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4 text-orange-400" />
                    ))}
                  </div>
                  {reviewCount !== undefined && reviewCount > 0 && (
                    <span className="text-neutral-500 dark:text-neutral-400">{reviewCount}</span>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-x-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            <HugeiconsIcon icon={Location06Icon} size={16} color="currentColor" strokeWidth={1.5} />
            <span>{address || `${city || ''}${city && country ? ', ' : ''}${country || ''}` || 'Address not available'}</span>
          </div>

          {/* Refundable Badge */}
          <div>
            <Badge color="green" className="text-xs">
              REFUNDABLE
            </Badge>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="mt-3">
              {renderAmenities()}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Store hotel data in sessionStorage before navigation to avoid URL length issues
  // Only pass hotel ID in URL, details page will fetch from sessionStorage
  const hotelHref = `/hotels/${id}`

  const renderPriceSection = () => {
    return (
      <div className="flex shrink-0 flex-col items-end justify-between border-l border-neutral-200 p-4 sm:p-6 dark:border-neutral-700">
        <div className="w-full text-right">
          {price ? (
            <div>
              <div className="text-base font-semibold">
                {currency} {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-sm font-normal text-neutral-500 dark:text-neutral-400">per night</div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Price on request</div>
          )}
        </div>
        <Link 
          href={hotelHref} 
          onClick={(e) => {
            e.stopPropagation()
            // Store hotel data in sessionStorage before navigation
            try {
              const storedHotels = sessionStorage.getItem('hotels')
              if (storedHotels) {
                const hotels = JSON.parse(storedHotels)
                const hotelIndex = hotels.findIndex((h: any) => h.id === id)
                if (hotelIndex !== -1) {
                  // Update existing hotel in the array
                  hotels[hotelIndex] = data
                } else {
                  // Add new hotel to the array
                  hotels.push(data)
                }
                sessionStorage.setItem('hotels', JSON.stringify(hotels))
              } else {
                // Create new array with this hotel
                sessionStorage.setItem('hotels', JSON.stringify([data]))
              }
            } catch (err) {
              console.error('Failed to store hotel in sessionStorage:', err)
            }
          }}
        >
          <ButtonPrimary className="mt-4 w-full sm:w-auto">
            Select Room
          </ButtonPrimary>
        </Link>
      </div>
    )
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      <Link 
        href={hotelHref} 
        className="absolute inset-0 z-0"
        onClick={(e) => {
          // Store hotel data in sessionStorage before navigation
          try {
            const storedHotels = sessionStorage.getItem('hotels')
            if (storedHotels) {
              const hotels = JSON.parse(storedHotels)
              const hotelIndex = hotels.findIndex((h: any) => h.id === id)
              if (hotelIndex !== -1) {
                // Update existing hotel in the array
                hotels[hotelIndex] = data
              } else {
                // Add new hotel to the array
                hotels.push(data)
              }
              sessionStorage.setItem('hotels', JSON.stringify(hotels))
            } else {
              // Create new array with this hotel
              sessionStorage.setItem('hotels', JSON.stringify([data]))
            }
          } catch (err) {
            console.error('Failed to store hotel in sessionStorage:', err)
          }
        }}
      />
      <div className="relative z-10 flex min-h-[220px] flex-col md:min-h-[260px] md:flex-row">
        {renderImage()}
        {renderContent()}
        {renderPriceSection()}
      </div>
    </div>
  )
}

export default HotelCard

