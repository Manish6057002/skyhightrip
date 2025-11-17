'use client'

import {
  Bathtub02Icon,
  BodySoapIcon,
  CableCarIcon,
  CctvCameraIcon,
  HairDryerIcon,
  MeetingRoomIcon,
  ShampooIcon,
  Speaker01Icon,
  TvSmartIcon,
  VirtualRealityVr01Icon,
  WaterEnergyIcon,
  WaterPoloIcon,
  Wifi01Icon,
} from '@/components/Icons'
import StartRating from '@/components/StartRating'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonSecondary from '@/shared/ButtonSecondary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import T from '@/utils/getT'
import { UsersIcon, PhoneIcon, EnvelopeIcon, GlobeAltIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useEffect, useState, Fragment, useCallback } from 'react'
import Image from 'next/image'
import HeaderGallery from '../../(listings)/components/HeaderGallery'
import SectionHeader from '../../(listings)/components/SectionHeader'
import { SectionHeading, SectionSubheading } from '../../(listings)/components/SectionHeading'
import SectionListingReviews from '../../(listings)/components/SectionListingReviews'
import SectionMap from '../../(listings)/components/SectionMap'
import DatesRangeInputPopover from '../../(listings)/components/DatesRangeInputPopover'
import GuestsInputPopover from '../../(listings)/components/GuestsInputPopover'
import Form from 'next/form'

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
  images?: string[] // Array of hotel images (up to 15)
  amenities?: string[]
  description?: string
  latitude?: number
  longitude?: number
  rooms?: any[]
  fullData?: any // Store full API response for accessing all images
  email?: string
  website?: string
  phone?: string
}

export default function HotelDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
  
  // Get search parameters (dates and guests) from URL or sessionStorage
  const [searchDates, setSearchDates] = useState<{ checkIn: string | null; checkOut: string | null }>({ checkIn: null, checkOut: null })
  const [searchGuests, setSearchGuests] = useState<{ adults: number; children: number; infants: number }>({ adults: 2, children: 0, infants: 0 })

  // Fetch hotel details with images from content API
  const fetchHotelDetailsWithImages = useCallback(async (hotelCode: string, existingHotel: Hotel | null) => {
    try {
      const response = await fetch(`/api/hotelbeds/hotel-details?code=${encodeURIComponent(hotelCode)}`)
      const data = await response.json()
      
      if (data.error) {
        console.error('Failed to fetch hotel details:', data.error)
        if (existingHotel) {
          // Use existing hotel data even if details fetch failed
          setHotel(existingHotel)
          setLoading(false)
        } else {
          setError('Hotel data not found. Please search for hotels first.')
          setLoading(false)
        }
        return
      }

      const hotelDetails = data.data
      
      // Merge hotel details with existing hotel data
      // According to Hotelbeds docs: images are in 'images' array with 'path' attribute
      // Format: https://photos.hotelbeds.com/giata/{path}
      if (existingHotel) {
        // Format image URLs from hotel details (XL - extra large images)
        const formatImageUrl = (imagePath: string): string => {
          if (!imagePath) return ''
          if (imagePath.startsWith('http')) return imagePath
          const cleanPath = imagePath.replace(/^\/+|\/+$/g, '')
          return `https://photos.hotelbeds.com/giata/xl/${cleanPath}`
        }

        // Collect images from hotel details (up to 15)
        const newImages: string[] = []
        if (hotelDetails.images && Array.isArray(hotelDetails.images)) {
          hotelDetails.images.slice(0, 15).forEach((img: any) => {
            const imagePath = img.path || img.url || img.uri || (typeof img === 'string' ? img : null)
            if (imagePath) {
              const imageUrl = formatImageUrl(imagePath)
              if (imageUrl && !newImages.includes(imageUrl)) {
                newImages.push(imageUrl)
              }
            }
          })
        }
        
        // Fallback to visualizations if no images
        if (newImages.length < 15 && hotelDetails.visualizations && Array.isArray(hotelDetails.visualizations)) {
          hotelDetails.visualizations.forEach((viz: any) => {
            if (newImages.length >= 15) return
            const imagePath = viz.path || viz.url || viz.uri || (typeof viz === 'string' ? viz : null)
            if (imagePath) {
              const imageUrl = formatImageUrl(imagePath)
              if (imageUrl && !newImages.includes(imageUrl)) {
                newImages.push(imageUrl)
              }
            }
          })
        }

        // Extract coordinates from nested coordinates object or direct properties
        const latitude = hotelDetails.coordinates?.latitude 
          ? parseFloat(hotelDetails.coordinates.latitude) 
          : hotelDetails.latitude 
            ? parseFloat(hotelDetails.latitude) 
            : existingHotel.latitude ?? undefined
        const longitude = hotelDetails.coordinates?.longitude 
          ? parseFloat(hotelDetails.coordinates.longitude) 
          : hotelDetails.longitude 
            ? parseFloat(hotelDetails.longitude) 
            : existingHotel.longitude ?? undefined

        // Extract contact information from hotel details
        const email = hotelDetails.email || hotelDetails.contact?.email || existingHotel.email
        const website = hotelDetails.web || hotelDetails.website || hotelDetails.url || hotelDetails.contact?.web || existingHotel.website
        const phone = hotelDetails.phoneNumber || hotelDetails.phone || hotelDetails.contact?.phone || hotelDetails.contact?.phoneNumber || existingHotel.phone

        const mergedHotel = {
          ...existingHotel,
          // Use new images if available, otherwise keep existing images
          images: newImages.length > 0 ? newImages.slice(0, 15) : (existingHotel.images || []),
          // Update description from hotel details if available
          description: hotelDetails.description?.content || hotelDetails.description || existingHotel.description || '',
          // Update contact information
          email: email,
          website: website,
          phone: phone,
          // Update address if available
          address: hotelDetails.address?.content || hotelDetails.address || existingHotel.address,
          // Update coordinates if available
          latitude: latitude,
          longitude: longitude,
          fullData: {
            ...existingHotel.fullData,
            ...hotelDetails,
            // Prioritize new images from API (standard Hotelbeds structure)
            images: hotelDetails.images || existingHotel.fullData?.images || [],
            visualizations: hotelDetails.visualizations || existingHotel.fullData?.visualizations || [],
            mediaFiles: hotelDetails.mediaFiles || existingHotel.fullData?.mediaFiles || [],
          },
        }
        // Update image if we got new images from API
        if (newImages.length > 0) {
          mergedHotel.image = newImages[0]
        } else if (hotelDetails.images && Array.isArray(hotelDetails.images) && hotelDetails.images.length > 0) {
          // Use the first image's path
          const firstImagePath = hotelDetails.images[0]?.path
          if (firstImagePath) {
            mergedHotel.image = formatImageUrl(firstImagePath)
          }
        } else if (hotelDetails.visualizations && Array.isArray(hotelDetails.visualizations) && hotelDetails.visualizations.length > 0) {
          const vizPath = hotelDetails.visualizations[0]?.path || hotelDetails.visualizations[0]?.url
          if (vizPath) {
            mergedHotel.image = formatImageUrl(vizPath)
          } else {
            mergedHotel.image = existingHotel.image
          }
        }
        setHotel(mergedHotel)
      } else {
        // Format image URLs from hotel details (XL - extra large images)
        const formatImageUrl = (imagePath: string): string => {
          if (!imagePath) return ''
          if (imagePath.startsWith('http')) return imagePath
          const cleanPath = imagePath.replace(/^\/+|\/+$/g, '')
          return `https://photos.hotelbeds.com/giata/xl/${cleanPath}`
        }

        // Collect images from hotel details (up to 15)
        const images: string[] = []
        if (hotelDetails.images && Array.isArray(hotelDetails.images)) {
          hotelDetails.images.slice(0, 15).forEach((img: any) => {
            const imagePath = img.path || img.url || img.uri || (typeof img === 'string' ? img : null)
            if (imagePath) {
              const imageUrl = formatImageUrl(imagePath)
              if (imageUrl && !images.includes(imageUrl)) {
                images.push(imageUrl)
              }
            }
          })
        }
        
        // Fallback to visualizations if no images
        if (images.length < 15 && hotelDetails.visualizations && Array.isArray(hotelDetails.visualizations)) {
          hotelDetails.visualizations.forEach((viz: any) => {
            if (images.length >= 15) return
            const imagePath = viz.path || viz.url || viz.uri || (typeof viz === 'string' ? viz : null)
            if (imagePath) {
              const imageUrl = formatImageUrl(imagePath)
              if (imageUrl && !images.includes(imageUrl)) {
                images.push(imageUrl)
              }
            }
          })
        }

        // Extract coordinates from nested coordinates object or direct properties
        const latitude = hotelDetails.coordinates?.latitude 
          ? parseFloat(hotelDetails.coordinates.latitude) 
          : hotelDetails.latitude 
            ? parseFloat(hotelDetails.latitude) 
            : undefined
        const longitude = hotelDetails.coordinates?.longitude 
          ? parseFloat(hotelDetails.coordinates.longitude) 
          : hotelDetails.longitude 
            ? parseFloat(hotelDetails.longitude) 
            : undefined

        // Extract contact information from hotel details
        const email = hotelDetails.email || hotelDetails.contact?.email
        const website = hotelDetails.web || hotelDetails.website || hotelDetails.url || hotelDetails.contact?.web
        const phone = hotelDetails.phoneNumber || hotelDetails.phone || hotelDetails.contact?.phone || hotelDetails.contact?.phoneNumber

        // Create hotel object from details
        setHotel({
          id: String(hotelDetails.code || hotelCode),
          name: hotelDetails.name?.content || hotelDetails.name || 'Hotel',
          address: hotelDetails.address?.content || hotelDetails.address || '',
          city: hotelDetails.city?.name || hotelDetails.city || '',
          country: hotelDetails.country?.name || hotelDetails.country || '',
          rating: hotelDetails.categoryCode ? parseFloat(hotelDetails.categoryCode.replace(/[^\d.]/g, '')) : undefined,
          reviewCount: 0,
          price: undefined,
          currency: 'EUR',
          // Use first image from images array
          image: images.length > 0 ? images[0] : (hotelDetails.images?.[0]?.path ? formatImageUrl(hotelDetails.images[0].path) : (hotelDetails.visualizations?.[0]?.path ? formatImageUrl(hotelDetails.visualizations[0].path) : undefined)),
          images: images.slice(0, 15), // Store up to 15 images
          amenities: hotelDetails.facilities?.map((f: any) => f.description?.content || f.description || f) || [],
          description: hotelDetails.description?.content || hotelDetails.description || '',
          rooms: hotelDetails.rooms || [],
          latitude: latitude,
          longitude: longitude,
          email: email,
          website: website,
          phone: phone,
          fullData: hotelDetails,
        })
      }
      
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching hotel details:', error)
      if (existingHotel) {
        // Use existing hotel data even if details fetch failed
        setHotel(existingHotel)
        setLoading(false)
      } else {
        setError('Failed to load hotel details. Please search for hotels first.')
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const hotelId = params?.id as string
    if (!hotelId) {
      setLoading(false)
      setError('Hotel ID not found')
      return
    }

    // Get search parameters from URL or sessionStorage
    try {
      // First, try to get from URL search params (from hotels list page)
      const searchDataParam = searchParams.get('searchData')
      if (searchDataParam) {
        try {
          const searchData = JSON.parse(decodeURIComponent(searchDataParam))
          if (searchData.checkIn && searchData.checkOut) {
            setSearchDates({ checkIn: searchData.checkIn, checkOut: searchData.checkOut })
          }
          if (searchData.adults !== undefined) {
            setSearchGuests({ 
              adults: searchData.adults || 2, 
              children: searchData.children || 0,
              infants: searchData.infants || 0
            })
          }
        } catch (e) {
          console.error('Failed to parse search data from URL:', e)
        }
      }
      
      // Fallback: try to get from sessionStorage (stored from hotel search)
      const lastHotelSearch = sessionStorage.getItem('lastHotelSearch')
      if (lastHotelSearch) {
        try {
          const searchData = JSON.parse(lastHotelSearch)
          if (searchData.checkIn && searchData.checkOut) {
            setSearchDates({ checkIn: searchData.checkIn, checkOut: searchData.checkOut })
          }
          if (searchData.adults !== undefined) {
            setSearchGuests({ 
              adults: searchData.adults || 2, 
              children: searchData.children || 0,
              infants: searchData.infants || 0
            })
          }
        } catch (e) {
          console.error('Failed to parse search data from sessionStorage:', e)
        }
      }
    } catch (e) {
      console.error('Error getting search parameters:', e)
    }

    // Try to get hotel data from search params first (passed from search results)
    const hotelData = searchParams.get('data')
    if (hotelData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(hotelData))
        setHotel(parsedData)
        
        // Always fetch hotel details with images from content API to ensure we have all images
        fetchHotelDetailsWithImages(hotelId, parsedData)
        return
      } catch (e) {
        console.error('Failed to parse hotel data from URL:', e)
      }
    }

    // If no data in URL, try to get from sessionStorage (fallback)
    try {
      const storedHotels = sessionStorage.getItem('hotels')
      if (storedHotels) {
        const hotels = JSON.parse(storedHotels)
        const foundHotel = hotels.find((h: Hotel) => h.id === hotelId)
        if (foundHotel) {
          setHotel(foundHotel)
          
          // Always fetch hotel details with images from content API to ensure we have all images
          fetchHotelDetailsWithImages(hotelId, foundHotel)
          return
        }
      }
    } catch (e) {
      console.error('Failed to get hotel from sessionStorage:', e)
    }

    // If no data found, try to fetch from content API using hotel code
    fetchHotelDetailsWithImages(hotelId, null)
  }, [params, searchParams, fetchHotelDetailsWithImages])

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
    const hotelId = hotel?.id || 'default'
    let hash = 0
    for (let i = 0; i < hotelId.length; i++) {
      hash = ((hash << 5) - hash) + hotelId.charCodeAt(i)
      hash = hash & hash // Convert to 32-bit integer
    }
    const imageIndex = Math.abs(hash) % hotelImages.length
    return `https://images.unsplash.com/photo-${hotelImages[imageIndex]}?w=800&h=600&fit=crop&auto=format`
  }

  // Format Hotelbeds image URL (XL - extra large images)
  // According to Hotelbeds docs: https://developer.hotelbeds.com/documentation/hotels/content-api/use-images/
  // Images are returned as path segments (not full URLs)
  // Format: https://photos.hotelbeds.com/giata/xl/{path}
  // Example: path = "00/004200/004200a_hb_ro_006.jpg"
  // Result: "https://photos.hotelbeds.com/giata/xl/00/004200/004200a_hb_ro_006.jpg"
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    
    // Clean the image path - remove leading/trailing slashes
    // But preserve the directory structure (e.g., "00/004200/004200a_hb_ro_006.jpg")
    const cleanPath = imagePath.replace(/^\/+|\/+$/g, '')
    
    // Use XL size for hotel images
    // Format: https://photos.hotelbeds.com/giata/xl/{path} for XL images
    return `https://photos.hotelbeds.com/giata/xl/${cleanPath}`
  }

  // Format Hotelbeds image URL for rooms (XL - extra large images)
  const getRoomImageUrl = (imagePath?: string) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    
    // Clean the image path - remove leading/trailing slashes
    const cleanPath = imagePath.replace(/^\/+|\/+$/g, '')
    
    // Use XL size for room images
    // Format: https://photos.hotelbeds.com/giata/xl/{path}
    return `https://photos.hotelbeds.com/giata/xl/${cleanPath}`
  }

  const handleSubmitForm = async (formData: FormData) => {
    if (!selectedRoom || !hotel) {
      return
    }

    // Store hotel booking data in sessionStorage for checkout page
    const bookingData = {
      type: 'hotel',
      hotel: {
        id: hotel.id,
        name: hotel.name,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        image: hotel.image,
        images: hotel.images,
        currency: hotel.currency || 'EUR',
        fullData: hotel.fullData,
      },
      room: selectedRoom,
      checkIn: searchDates.checkIn,
      checkOut: searchDates.checkOut,
      guests: searchGuests,
      // Get rateKey from selected room
      rateKey: selectedRoom.rates && selectedRoom.rates.length > 0 
        ? selectedRoom.rates[0].rateKey 
        : null,
      rateType: selectedRoom.rates && selectedRoom.rates.length > 0
        ? selectedRoom.rates[0].rateType || 'BOOKABLE'
        : 'BOOKABLE',
    }

    try {
      sessionStorage.setItem('hotelBooking', JSON.stringify(bookingData))
    } catch (err) {
      console.error('Failed to store booking data:', err)
    }
    
    // Navigate to checkout page
    router.push('/checkout')
  }

  if (loading) {
    return (
      <div className="container py-20">
        <div className="text-center">Loading hotel details...</div>
      </div>
    )
  }

  if (error && !hotel) {
    return (
      <div className="container py-20">
        <div className="text-center text-lg text-red-600 dark:text-red-400">
          {error || 'Hotel not found'}
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/hotels')}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Back to hotel search
          </button>
        </div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="container py-20">
        <div className="text-center">Loading hotel details...</div>
      </div>
    )
  }

  // Collect all hotel images from API response
  const getAllHotelImages = () => {
    const images: string[] = []
    
    // First, check if hotel already has images array (from search results page)
    if (hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0) {
      // Use the images array directly (already formatted URLs)
      hotel.images.slice(0, 15).forEach((imgUrl: string) => {
        if (imgUrl && !images.includes(imgUrl)) {
          images.push(imgUrl)
        }
      })
      // If we already have 15 images, return them
      if (images.length >= 15) {
        return images.slice(0, 15)
      }
    }
    
    // Get images from hotel.fullData if available (full API response)
    // According to Hotelbeds docs: images are in an 'images' array
    // Each image object has a 'path' attribute
    // Format: https://photos.hotelbeds.com/giata/{path}
    if (hotel.fullData) {
      // Primary: images array (standard Hotelbeds API structure)
      if (hotel.fullData.images && Array.isArray(hotel.fullData.images)) {
        hotel.fullData.images.forEach((img: any) => {
          if (images.length >= 15) return // Stop if we already have 15 images
          // Image object has 'path' attribute according to Hotelbeds docs
          const imagePath = img.path || img.url || img.uri || (typeof img === 'string' ? img : null)
          if (imagePath) {
            const imageUrl = getImageUrl(imagePath)
            if (imageUrl && !images.includes(imageUrl)) {
              images.push(imageUrl)
            }
          }
        })
      }
      
      // Fallback: visualizations array
      if (images.length < 15 && hotel.fullData.visualizations && Array.isArray(hotel.fullData.visualizations)) {
        hotel.fullData.visualizations.forEach((viz: any) => {
          if (images.length >= 15) return
          const imagePath = viz.path || viz.url || viz.uri || viz.imagePath || (typeof viz === 'string' ? viz : null)
          if (imagePath) {
            const imageUrl = getImageUrl(imagePath)
            if (imageUrl && !images.includes(imageUrl)) {
              images.push(imageUrl)
            }
          }
        })
      }
      
      // Fallback: mediaFiles array
      if (images.length < 15 && hotel.fullData.mediaFiles && Array.isArray(hotel.fullData.mediaFiles)) {
        hotel.fullData.mediaFiles.forEach((media: any) => {
          if (images.length >= 15) return
          if (media.type === 'IMAGE' || media.type === 'PHOTO' || !media.type) {
            const imagePath = media.path || media.url || media.uri || media.fileName
            if (imagePath) {
              const imageUrl = getImageUrl(imagePath)
              if (imageUrl && !images.includes(imageUrl)) {
                images.push(imageUrl)
              }
            }
          }
        })
      }
      
      // Fallback: single image property
      if (hotel.fullData.image) {
        let imagePath: string | null = null
        if (typeof hotel.fullData.image === 'object') {
          imagePath = hotel.fullData.image.path || hotel.fullData.image.url || hotel.fullData.image.uri
        } else {
          imagePath = hotel.fullData.image
        }
        if (imagePath) {
          const imageUrl = getImageUrl(imagePath)
          if (imageUrl && !images.includes(imageUrl)) {
            images.unshift(imageUrl) // Add to beginning
          }
        }
      }
    }
    
    // Also check hotel.image (single image from transformed data)
    if (hotel.image) {
      const imageUrl = getImageUrl(hotel.image)
      if (imageUrl && !images.includes(imageUrl)) {
        images.unshift(imageUrl) // Add to beginning
      }
    }
    
    // Collect images from rooms as well (only if we don't have 15 images yet)
    if (images.length < 15 && hotel.rooms && Array.isArray(hotel.rooms)) {
      hotel.rooms.forEach((room: any) => {
        if (images.length >= 15) return
        if (room.images && Array.isArray(room.images)) {
          room.images.forEach((img: any) => {
            if (images.length >= 15) return
            const imagePath = img.path || img.url || img.uri || (typeof img === 'string' ? img : null)
            if (imagePath) {
              const imageUrl = getImageUrl(imagePath)
              if (imageUrl && !images.includes(imageUrl)) {
                images.push(imageUrl)
              }
            }
          })
        }
        // Also check single room image
        if (images.length < 15 && room.image) {
          const imagePath = typeof room.image === 'object' ? (room.image.path || room.image.url || room.image.uri) : room.image
          if (imagePath) {
            const imageUrl = getImageUrl(imagePath)
            if (imageUrl && !images.includes(imageUrl)) {
              images.push(imageUrl)
            }
          }
        }
      })
    }
    
    // Return up to 15 images from API, no placeholders
    return images.slice(0, 15)
  }

  const galleryImages = getAllHotelImages()

  const renderSectionHeader = () => {
    return (
      <SectionHeader
        address={hotel.address || `${hotel.city || ''}${hotel.city && hotel.country ? ', ' : ''}${hotel.country || ''}` || 'Address not available'}
        host={{
          displayName: hotel.name || 'Hotel',
          avatarUrl: hotel.image || getPlaceholderImage() || '',
        }}
        listingCategory={hotel.rating ? `${hotel.rating} Star Hotel` : 'Hotel'}
        reviewCount={hotel.reviewCount || 0}
        reviewStart={hotel.rating || 0}
        title={hotel.name}
      >
        {hotel.rooms && hotel.rooms.length > 0 && (
          <>
            <div className="flex items-center gap-x-3">
              <UsersIcon className="mb-0.5 size-6" />
              <span>{hotel.rooms.length} room{hotel.rooms.length !== 1 ? 's' : ''} available</span>
            </div>
          </>
        )}
      </SectionHeader>
    )
  }

  const renderSectionInfo = () => {
    // Get description from multiple sources
    const description = hotel.description || 
                       hotel.fullData?.description?.content || 
                       hotel.fullData?.description || 
                       ''
    
    return (
      <div className="listingSection__wrap">
        <div>
          <SectionHeading>About this hotel</SectionHeading>
          <SectionSubheading>Hotel information and description</SectionSubheading>
        </div>
        <Divider className="w-14!" />
        <div className="leading-relaxed text-neutral-700 dark:text-neutral-300">
          {description ? (
            <p className="whitespace-pre-line">{description}</p>
          ) : (
            <p>
              Experience comfort and convenience at {hotel.name}. Located in {hotel.city || hotel.country || 'a prime location'}, 
              this hotel offers excellent amenities and services for your stay.
            </p>
          )}
        </div>
      </div>
    )
  }

  const renderSectionContact = () => {
    // Extract contact information with fallback to fullData
    const address = hotel.address || hotel.fullData?.address?.content || hotel.fullData?.address || ''
    const email = hotel.email || hotel.fullData?.email || hotel.fullData?.contact?.email || ''
    const website = hotel.website || hotel.fullData?.web || hotel.fullData?.website || hotel.fullData?.url || hotel.fullData?.contact?.web || ''
    const phone = hotel.phone || hotel.fullData?.phoneNumber || hotel.fullData?.phone || hotel.fullData?.contact?.phone || hotel.fullData?.contact?.phoneNumber || ''
    
    // Check if we have any contact information to display
    const hasContactInfo = address || email || website || phone
    
    if (!hasContactInfo) {
      return null
    }

    return (
      <div className="listingSection__wrap">
        <div>
          <SectionHeading>Contact Information</SectionHeading>
          <SectionSubheading>Get in touch with the hotel</SectionSubheading>
        </div>
        <Divider className="w-14!" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {address && (
            <div className="flex items-start gap-x-3">
              <MapPinIcon className="mt-1 h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-neutral-900 dark:text-white">Address</div>
                <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{address}</div>
              </div>
            </div>
          )}
          {phone && (
            <div className="flex items-start gap-x-3">
              <PhoneIcon className="mt-1 h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-neutral-900 dark:text-white">Phone</div>
                <a 
                  href={`tel:${phone}`}
                  className="mt-1 text-sm text-neutral-600 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
                >
                  {phone}
                </a>
              </div>
            </div>
          )}
          {email && (
            <div className="flex items-start gap-x-3">
              <EnvelopeIcon className="mt-1 h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-neutral-900 dark:text-white">Email</div>
                <a 
                  href={`mailto:${email}`}
                  className="mt-1 text-sm text-neutral-600 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
                >
                  {email}
                </a>
              </div>
            </div>
          )}
          {website && (
            <div className="flex items-start gap-x-3">
              <GlobeAltIcon className="mt-1 h-5 w-5 shrink-0 text-neutral-500 dark:text-neutral-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-neutral-900 dark:text-white">Website</div>
                <a 
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-neutral-600 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
                >
                  {website}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSectionRooms = () => {
    if (!hotel.rooms || hotel.rooms.length === 0) {
      return null
    }

    return (
      <div className="listingSection__wrap">
        <div>
          <SectionHeading>Available Rooms</SectionHeading>
          <SectionSubheading>Select from available room types</SectionSubheading>
        </div>
        <Divider className="w-14!" />

        <div className="space-y-6">
          {hotel.rooms.map((room: any, index: number) => {
            const roomName = room.name || room.typeDescription?.content || room.code || `Room ${index + 1}`
            const roomDescription = room.description?.content || room.description || room.typeDescription?.content || ''
            const roomPrice = room.rates && room.rates.length > 0
              ? parseFloat(room.rates[0].net || room.rates[0].sellingRate || '0')
              : room.minRate ? parseFloat(room.minRate) : undefined

            // Use different images from hotel's image array for each room
            // First try room's own images, then use hotel images with index-based selection
            let roomImage: string | undefined
            if (room.images && Array.isArray(room.images) && room.images.length > 0) {
              // Use room's own image
              roomImage = room.images[0]?.path || room.images[0]?.url || room.images[0]
            } else if (room.image) {
              // Use room's single image
              roomImage = typeof room.image === 'object' ? (room.image.path || room.image.url || room.image.uri) : room.image
            } else if (hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0) {
              // Use different hotel image for each room (cycle through available images)
              // Use index + 1 to skip the first image (which is used as main hotel image)
              const imageIndex = (index + 1) % hotel.images.length
              const selectedImage = hotel.images[imageIndex]
              // Handle both URL strings and path objects
              if (typeof selectedImage === 'string') {
                roomImage = selectedImage
              } else if (selectedImage && typeof selectedImage === 'object') {
                roomImage = (selectedImage as any).path || (selectedImage as any).url || (selectedImage as any).uri || selectedImage
              } else {
                roomImage = selectedImage
              }
            } else if (hotel.fullData?.images && Array.isArray(hotel.fullData.images) && hotel.fullData.images.length > 0) {
              // Fallback to fullData images
              const imageIndex = (index + 1) % hotel.fullData.images.length
              const img = hotel.fullData.images[imageIndex]
              roomImage = img.path || img.url || img.uri || (typeof img === 'string' ? img : null)
            } else {
              // Final fallback to hotel's main image
              roomImage = hotel.image
            }

            const roomImageUrl = getRoomImageUrl(roomImage)

            // Render room image (similar to HotelCard)
            const renderRoomImage = () => {
              if (!roomImageUrl) {
                return (
                  <div className="relative h-full min-h-[220px] w-full shrink-0 overflow-hidden rounded-l-2xl bg-neutral-200 dark:bg-neutral-700 md:w-72 md:min-h-[260px]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">No image</span>
                    </div>
                  </div>
                )
              }

              return (
                <div className="relative h-full min-h-[220px] w-full shrink-0 overflow-hidden rounded-l-2xl md:w-72 md:min-h-[260px]">
                  <Image
                    src={roomImageUrl}
                    alt={roomName}
                    className="object-cover"
                    fill
                    unoptimized
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )
            }

            // Render room content (similar to HotelCard)
            const renderRoomContent = () => {
              return (
                <div className="flex grow flex-col p-4 sm:p-6">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                        {roomName}
                      </h3>
                    </div>
                    
                    {roomDescription && (
                      <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {roomDescription}
                      </p>
                    )}

                    {/* Room Features */}
                    {room.facilities && room.facilities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {room.facilities.slice(0, 5).map((facility: any, idx: number) => (
                          <span
                            key={idx}
                            className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                          >
                            {facility.description?.content || facility.description || facility}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            // Render price section (similar to HotelCard)
            const renderRoomPriceSection = () => {
              const isSelected = selectedRoom && selectedRoom.code === room.code
              
              return (
                <div className="flex shrink-0 flex-col items-end justify-between border-l border-neutral-200 p-4 sm:p-6 dark:border-neutral-700">
                  <div className="w-full text-right">
                    {roomPrice ? (
                      <div>
                        <div className="text-base font-semibold">
                          {hotel.currency || 'EUR'} {roomPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="mt-1 text-sm font-normal text-neutral-500 dark:text-neutral-400">per night</div>
                      </div>
                    ) : (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">Price on request</div>
                    )}
                  </div>
                  <ButtonPrimary 
                    className={`mt-4 w-full sm:w-auto ${isSelected ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={() => {
                      setSelectedRoom(room)
                      // Scroll to booking section
                      setTimeout(() => {
                        const bookingSection = document.getElementById('booking-section')
                        if (bookingSection) {
                          bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }, 100)
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </ButtonPrimary>
                </div>
              )
            }

            const isSelected = selectedRoom && selectedRoom.code === room.code
            
            return (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-2xl border transition-shadow hover:shadow-xl ${
                  isSelected 
                    ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/20' 
                    : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                }`}
              >
                <div className="relative z-10 flex min-h-[220px] flex-col md:min-h-[260px] md:flex-row">
                  {renderRoomImage()}
                  {renderRoomContent()}
                  {renderRoomPriceSection()}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderSectionAmenities = () => {
    // Get all facilities from the API response (fullData)
    const facilities = hotel?.fullData?.facilities || hotel?.amenities || []
    
    if (!facilities || facilities.length === 0) {
      return null
    }

    // Extract facility names from the API response structure
    // Facilities can be: { description: { content: "..." } } or { description: "..." } or just a string
    const facilityNames = facilities.map((facility: any) => {
      if (typeof facility === 'string') {
        return facility
      }
      if (facility?.description?.content) {
        return facility.description.content
      }
      if (facility?.description) {
        return facility.description
      }
      if (facility?.name) {
        return facility.name
      }
      return String(facility)
    }).filter((name: string) => name && name.trim().length > 0)

    if (facilityNames.length === 0) {
      return null
    }

    // Map amenities to icons (simplified mapping)
    const amenityIcons: Record<string, any> = {
      wifi: Wifi01Icon,
      'wi-fi': Wifi01Icon,
      'free wifi': Wifi01Icon,
      bathtub: Bathtub02Icon,
      bathroom: Bathtub02Icon,
      'hair dryer': HairDryerIcon,
      hairdryer: HairDryerIcon,
      tv: TvSmartIcon,
      television: TvSmartIcon,
      'sound system': Speaker01Icon,
      speaker: Speaker01Icon,
      shampoo: ShampooIcon,
      soap: BodySoapIcon,
      'body soap': BodySoapIcon,
    }

    return (
      <div className="listingSection__wrap">
        <div>
          <SectionHeading>Amenities</SectionHeading>
          <SectionSubheading>About the property&apos;s amenities and services</SectionSubheading>
        </div>
        <Divider className="w-14!" />

        <div className="grid grid-cols-1 gap-6 text-sm text-neutral-700 xl:grid-cols-3 dark:text-neutral-300">
          {facilityNames.map((amenity: string, index: number) => {
            const amenityLower = amenity.toLowerCase()
            const IconComponent = Object.keys(amenityIcons).find((key) => amenityLower.includes(key))
              ? amenityIcons[Object.keys(amenityIcons).find((key) => amenityLower.includes(key))!]
              : null

            return (
              <div key={index} className="flex items-center gap-x-3">
                {IconComponent ? <IconComponent className="h-6 w-6" /> : <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-700" />}
                <span>{amenity}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderSidebarPriceAndForm = () => {
    // Calculate price from selected room or hotel default price
    const roomPrice = selectedRoom 
      ? (selectedRoom.rates && selectedRoom.rates.length > 0
          ? parseFloat(selectedRoom.rates[0].net || selectedRoom.rates[0].sellingRate || '0')
          : selectedRoom.minRate ? parseFloat(selectedRoom.minRate) : undefined)
      : hotel.price
    
    const currency = hotel.currency || 'EUR'
    
    // Calculate nights
    const checkInDate = searchDates.checkIn ? new Date(searchDates.checkIn) : null
    const checkOutDate = searchDates.checkOut ? new Date(searchDates.checkOut) : null
    const nights = checkInDate && checkOutDate 
      ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    // Calculate totals
    const pricePerNight = roomPrice || 0
    const subtotal = nights > 0 ? pricePerNight * nights : pricePerNight
    
    return (
      <div id="booking-section" className="listingSection__wrap sm:shadow-xl">
        {/* Selected Room Info */}
        {selectedRoom && (
          <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-3 dark:border-primary-800 dark:bg-primary-900/20">
            <div className="text-sm font-medium text-primary-900 dark:text-primary-100">
              Selected Room
            </div>
            <div className="mt-1 text-sm text-primary-700 dark:text-primary-300">
              {selectedRoom.name || selectedRoom.typeDescription?.content || selectedRoom.code || 'Room'}
            </div>
          </div>
        )}
        
        {/* PRICE */}
        <div className="flex items-end text-2xl font-semibold sm:text-3xl">
          {roomPrice ? (
            <>
              <span className="mx-2">{currency} {roomPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <div className="pb-1">
                <span className="text-base font-normal text-neutral-500 dark:text-neutral-400">/night</span>
              </div>
            </>
          ) : (
            <span className="text-base text-neutral-500 dark:text-neutral-400">
              {selectedRoom ? 'Price on request' : 'Select a room to see price'}
            </span>
          )}
        </div>

        {/* FORM */}
        <Form
          action={handleSubmitForm}
          className="flex flex-col rounded-3xl border border-neutral-200 dark:border-neutral-700"
          id="booking-form"
        >
          <DatesRangeInputPopover 
            className="z-11 flex-1" 
            initialStartDate={searchDates.checkIn ? new Date(searchDates.checkIn) : undefined}
            initialEndDate={searchDates.checkOut ? new Date(searchDates.checkOut) : undefined}
            onChange={(startDate, endDate) => {
              setSearchDates({
                checkIn: startDate ? startDate.toISOString().split('T')[0] : null,
                checkOut: endDate ? endDate.toISOString().split('T')[0] : null,
              })
            }}
          />
          <div className="w-full border-b border-neutral-200 dark:border-neutral-700"></div>
          <GuestsInputPopover 
            className="flex-1"
            initialAdults={searchDates.checkIn ? searchGuests.adults : undefined}
            initialChildren={searchDates.checkIn ? searchGuests.children : undefined}
            initialInfants={searchDates.checkIn ? searchGuests.infants : undefined}
            onChange={(adults, children, infants) => {
              setSearchGuests({ adults, children, infants })
            }}
          />
        </Form>

        <DescriptionList>
          {selectedRoom && nights > 0 && (
            <>
              <DescriptionTerm>
                {currency} {pricePerNight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} x {nights} night{nights !== 1 ? 's' : ''}
              </DescriptionTerm>
              <DescriptionDetails className="sm:text-right">
                {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </DescriptionDetails>
            </>
          )}
          <DescriptionTerm>Service fee</DescriptionTerm>
          <DescriptionDetails className="sm:text-right">Included</DescriptionDetails>
          <DescriptionTerm className="font-semibold text-neutral-900">Total</DescriptionTerm>
          <DescriptionDetails className="font-semibold sm:text-right">
            {roomPrice && nights > 0 
              ? `${currency} ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : roomPrice 
              ? `${currency} ${roomPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : selectedRoom 
              ? 'Price on request'
              : 'Select a room'}
          </DescriptionDetails>
        </DescriptionList>

        {/* SUBMIT */}
        <ButtonPrimary 
          form="booking-form" 
          type="submit" 
          className="w-full"
          disabled={!selectedRoom}
        >
          {selectedRoom ? (T['common']['Reserve'] || 'Reserve') : 'Select a room first'}
        </ButtonPrimary>
      </div>
    )
  }

  return (
    <div>
      {/* HEADER */}
      {galleryImages.length > 0 && (
        <div className="container">
          <HeaderGallery images={galleryImages} />
        </div>
      )}

      {/* MAIN */}
      <div className="container">
        <main className="relative z-[1] mt-10 flex flex-col gap-8 lg:flex-row xl:gap-10">
          {/* CONTENT */}
          <div className="flex w-full flex-col gap-y-8 lg:w-3/5 xl:w-[64%] xl:gap-y-10">
            {renderSectionHeader()}
            {renderSectionInfo()}
            {renderSectionContact()}
            {renderSectionRooms()}
            {renderSectionAmenities()}
          </div>

          {/* SIDEBAR */}
          <div className="grow">
            <div className="sticky top-5">{renderSidebarPriceAndForm()}</div>
          </div>
        </main>

        <Divider className="my-16" />

        <div className="flex flex-col gap-y-10">
          <div className="w-full">
            <SectionListingReviews 
              reviewCount={hotel.reviewCount || 0} 
              reviewStart={hotel.rating || 0} 
              reviews={[]} 
            />
          </div>

          {(hotel.latitude && hotel.longitude) || hotel.address || hotel.city ? (
            <SectionMap 
              heading="Location"
              subheading={hotel.address || `${hotel.city || ''}${hotel.city && hotel.country ? ', ' : ''}${hotel.country || ''}` || 'Hotel location'}
              latitude={hotel.latitude}
              longitude={hotel.longitude}
              address={hotel.address || `${hotel.city || ''}${hotel.city && hotel.country ? ', ' : ''}${hotel.country || ''}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

