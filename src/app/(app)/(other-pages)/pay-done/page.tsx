'use client'

import ButtonPrimary from '@/shared/ButtonPrimary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import T from '@/utils/getT'
import { HomeIcon } from '@heroicons/react/24/outline'
import { Calendar04Icon, UserIcon, Airplane01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const Page = () => {
  const searchParams = useSearchParams()
  const [bookingData, setBookingData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'instant',
    })

    // Get booking data from URL parameters
    const type = searchParams.get('type')
    const dataParam = searchParams.get('data')
    
    if (dataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(dataParam))
        
        if (type === 'flight' && decoded.flightData) {
          // Convert date strings back to Date objects for flights
          if (decoded.flightData.departureTime) {
            decoded.flightData.departureTime = new Date(decoded.flightData.departureTime)
          }
          if (decoded.flightData.arrivalTime) {
            decoded.flightData.arrivalTime = new Date(decoded.flightData.arrivalTime)
          }
          if (decoded.flightData.segments) {
            decoded.flightData.segments = decoded.flightData.segments.map((segment: any) => ({
              ...segment,
              departureTime: segment.departureTime ? new Date(segment.departureTime) : new Date(),
              arrivalTime: segment.arrivalTime ? new Date(segment.arrivalTime) : new Date(),
            }))
          }
        }
        
        setBookingData(decoded)
      } catch (error) {
        console.error('Error parsing booking data:', error)
      }
    }
    setLoading(false)
  }, [searchParams])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatBookingDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const renderFlightBooking = () => {
    if (!bookingData || !bookingData.flightData) return null

    const { flightData, passenger, contact, bookingId, bookingData: amadeusBooking } = bookingData
    const priceValue = flightData.price.replace(/[^0-9]/g, '')
    const basePrice = parseInt(priceValue) || 0
    const tax = Math.round(basePrice * 0.1)
    const total = basePrice + tax

    return (
      <>
        <h1 className="text-4xl font-semibold sm:text-5xl">{T['common']['Congratulation']} 🎉</h1>
        <Divider />

        <div>
          <h3 className="text-2xl font-semibold">{T['common']['Your booking']}</h3>
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center">
            <div className="w-full shrink-0 sm:w-24">
              <div className="aspect-w-1 overflow-hidden rounded-2xl aspect-h-1">
                <Image
                  alt={flightData.airlines.name}
                  fill
                  sizes="96px"
                  src={flightData.airlines.logo}
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://www.gstatic.com/flights/airline_logos/70px/XX.png`
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-y-3 pt-5 sm:px-5 sm:pb-5">
              <div>
                <span className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {flightData.departure} → {flightData.arrival}
                </span>
                <span className="mt-1 block text-base font-medium sm:text-lg">
                  {flightData.airlines.fullName || flightData.airlines.name}
                </span>
              </div>
              <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                {formatDate(flightData.departureTime)} · {formatTime(flightData.departureTime)} - {formatTime(flightData.arrivalTime)}
              </span>
              <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                {flightData.duration} · {flightData.stopNumber === 0 ? 'Non-stop' : `${flightData.stopNumber} stop${flightData.stopNumber > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-neutral-200 rounded-3xl border border-neutral-200 text-neutral-500 sm:flex-row sm:divide-x sm:divide-y-0 dark:divide-neutral-700 dark:border-neutral-700 dark:text-neutral-400">
          <div className="flex flex-1 gap-x-4 p-5">
            <HugeiconsIcon icon={Calendar04Icon} size={32} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Departure Date</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatDate(flightData.departureTime)}
              </span>
            </div>
          </div>
          <div className="flex flex-1 gap-x-4 p-5">
            <HugeiconsIcon icon={Airplane01Icon} size={32} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Route</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {flightData.departure} → {flightData.arrival}
              </span>
            </div>
          </div>
          <div className="flex flex-1 gap-x-4 p-5">
            <HugeiconsIcon icon={UserIcon} size={32} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Passenger</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {passenger?.title} {passenger?.firstName} {passenger?.lastName}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold">Booking detail</h3>
          <DescriptionList className="mt-5">
            <DescriptionTerm>Booking code</DescriptionTerm>
            <DescriptionDetails>{bookingId || amadeusBooking?.id || 'N/A'}</DescriptionDetails>
            <DescriptionTerm>Booking date</DescriptionTerm>
            <DescriptionDetails>{formatBookingDate(amadeusBooking?.creationDate || amadeusBooking?.createdAt)}</DescriptionDetails>
            <DescriptionTerm>Flight price</DescriptionTerm>
            <DescriptionDetails>{flightData.price}</DescriptionDetails>
            <DescriptionTerm>Tax</DescriptionTerm>
            <DescriptionDetails>A${tax.toLocaleString()}</DescriptionDetails>
            <DescriptionTerm className="font-semibold text-neutral-900">Total</DescriptionTerm>
            <DescriptionDetails className="font-semibold">A${total.toLocaleString()}</DescriptionDetails>
            <DescriptionTerm>Passenger name</DescriptionTerm>
            <DescriptionDetails>{passenger?.title} {passenger?.firstName} {passenger?.lastName}</DescriptionDetails>
            <DescriptionTerm>Email</DescriptionTerm>
            <DescriptionDetails>{contact?.email}</DescriptionDetails>
            <DescriptionTerm>Phone</DescriptionTerm>
            <DescriptionDetails>{contact?.phone}</DescriptionDetails>
            <DescriptionTerm>Passport number</DescriptionTerm>
            <DescriptionDetails>{passenger?.passportNumber}</DescriptionDetails>
          </DescriptionList>
        </div>

        <div>
          <ButtonPrimary href="/">
            <HomeIcon className="size-5" />
            Explore more flights
          </ButtonPrimary>
        </div>
      </>
    )
  }

  const renderDefaultBooking = () => {
    return (
      <>
        <h1 className="text-4xl font-semibold sm:text-5xl">{T['common']['Congratulation']} 🎉</h1>
        <Divider />

        <div>
          <h3 className="text-2xl font-semibold">{T['common']['Your booking']}</h3>
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center">
            <div className="w-full shrink-0 sm:w-40">
              <div className="aspect-w-4 overflow-hidden rounded-2xl aspect-h-3 sm:aspect-h-4">
                <Image
                  fill
                  alt=""
                  className="object-cover"
                  src="https://images.pexels.com/photos/6373478/pexels-photo-6373478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  sizes="200px"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col gap-y-3 pt-5 sm:px-5 sm:pb-5">
              <div>
                <span className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Hotel room in Tokyo, Jappan
                </span>
                <span className="mt-1 block text-base font-medium sm:text-lg">The Lounge & Bar</span>
              </div>
              <span className="block text-sm text-neutral-500 dark:text-neutral-400">2 beds · 2 baths</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-neutral-200 rounded-3xl border border-neutral-200 text-neutral-500 sm:flex-row sm:divide-x sm:divide-y-0 dark:divide-neutral-700 dark:border-neutral-700 dark:text-neutral-400">
          <div className="flex flex-1 gap-x-4 p-5">
            <HugeiconsIcon icon={Calendar04Icon} size={32} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Date</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Aug 12 - 16, 2025
              </span>
            </div>
          </div>
          <div className="flex flex-1 gap-x-4 p-5">
            <HugeiconsIcon icon={UserIcon} size={32} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Guests</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">3 Guests</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold">Booking detail</h3>
          <DescriptionList className="mt-5">
            <DescriptionTerm>Booking code</DescriptionTerm>
            <DescriptionDetails>#222-333-111</DescriptionDetails>
            <DescriptionTerm>Date</DescriptionTerm>
            <DescriptionDetails>12 Aug, 2021</DescriptionDetails>
            <DescriptionTerm>Total</DescriptionTerm>
            <DescriptionDetails>$199</DescriptionDetails>
            <DescriptionTerm>Payment method</DescriptionTerm>
            <DescriptionDetails>Credit card</DescriptionDetails>
          </DescriptionList>
        </div>

        <div>
          <ButtonPrimary href="/">
            <HomeIcon className="size-5" />
            Explore more stays
          </ButtonPrimary>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <main className="container mt-10 mb-24 sm:mt-16 lg:mb-32">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-y-12 px-0 sm:rounded-2xl sm:p-6 xl:p-8">
          <div className="text-center text-lg text-neutral-600 dark:text-neutral-400">Loading...</div>
        </div>
      </main>
    )
  }

  const renderHotelBooking = () => {
    if (!bookingData || !bookingData.booking) return null

    const { booking, hotel, room, checkIn, checkOut, guests, holder } = bookingData
    const bookingRef = booking.reference || booking.clientReference || 'N/A'
    const bookingDate = booking.creationDate || new Date().toISOString().split('T')[0]
    const hotelData = booking.hotel || {}
    const roomData = hotelData.rooms?.[0] || room || {}
    const rateData = roomData.rates?.[0] || {}
    const totalNet = booking.totalNet || rateData.net || '0'
    const currency = booking.currency || hotelData.currency || 'EUR'
    
    // Calculate nights
    const checkInDate = checkIn ? new Date(checkIn) : null
    const checkOutDate = checkOut ? new Date(checkOut) : null
    const nights = checkInDate && checkOutDate 
      ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const hotelImage = hotel?.images && hotel.images.length > 0 
      ? hotel.images[0] 
      : hotel?.image || 'https://images.pexels.com/photos/6373478/pexels-photo-6373478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'
    
    const hotelName = hotelData.name || hotel?.name || 'Hotel'
    const roomName = roomData.name || room?.name || room?.typeDescription?.content || 'Room'
    const location = hotelData.destinationName || (hotel?.city && hotel?.country ? `${hotel.city}, ${hotel.country}` : hotel?.address || 'N/A')

    return (
      <>
        <h1 className="text-4xl font-semibold sm:text-5xl">{T['common']['Congratulation']} 🎉</h1>
        <Divider />

        <div>
          <h3 className="text-2xl font-semibold">{T['common']['Your booking']}</h3>
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center">
            <div className="w-full shrink-0 sm:w-40">
              <div className="aspect-w-4 overflow-hidden rounded-2xl aspect-h-3 sm:aspect-h-4">
                <Image
                  fill
                  alt={hotelName}
                  className="object-cover"
                  src={hotelImage}
                  sizes="200px"
                  priority
                  unoptimized
                />
              </div>
            </div>
            <div className="flex flex-col gap-y-3 pt-5 sm:px-5 sm:pb-5">
              <div>
                <span className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {location}
                </span>
                <span className="mt-1 block text-base font-medium sm:text-lg">{hotelName}</span>
              </div>
              <span className="block text-sm text-neutral-500 dark:text-neutral-400">{roomName}</span>
              {checkIn && checkOut && (
                <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                  {formatBookingDate(checkIn)} - {formatBookingDate(checkOut)} · {nights} night{nights !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-neutral-200 rounded-3xl border border-neutral-200 text-neutral-500 sm:flex-row sm:divide-x sm:divide-y-0 dark:divide-neutral-700 dark:border-neutral-700 dark:text-neutral-400">
          <div className="flex flex-1 gap-x-4 p-5">
            <HugeiconsIcon icon={Calendar04Icon} size={32} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Check-in</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {checkIn ? formatBookingDate(checkIn) : 'N/A'}
              </span>
            </div>
          </div>
          <div className="flex flex-1 gap-x-4 p-5">
            <HugeiconsIcon icon={Calendar04Icon} size={32} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Check-out</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {checkOut ? formatBookingDate(checkOut) : 'N/A'}
              </span>
            </div>
          </div>
          <div className="flex flex-1 gap-x-4 p-5">
            <HugeiconsIcon icon={UserIcon} size={32} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-sm text-neutral-400">Guests</span>
              <span className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {guests ? `${(guests.adults || 0) + (guests.children || 0)} Guest${((guests.adults || 0) + (guests.children || 0)) !== 1 ? 's' : ''}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold">Booking detail</h3>
          <DescriptionList className="mt-5">
            <DescriptionTerm>Booking reference</DescriptionTerm>
            <DescriptionDetails>{bookingRef}</DescriptionDetails>
            <DescriptionTerm>Booking date</DescriptionTerm>
            <DescriptionDetails>{formatBookingDate(bookingDate)}</DescriptionDetails>
            <DescriptionTerm>Hotel</DescriptionTerm>
            <DescriptionDetails>{hotelName}</DescriptionDetails>
            <DescriptionTerm>Room type</DescriptionTerm>
            <DescriptionDetails>{roomName}</DescriptionDetails>
            {nights > 0 && (
              <>
                <DescriptionTerm>Nights</DescriptionTerm>
                <DescriptionDetails>{nights} night{nights !== 1 ? 's' : ''}</DescriptionDetails>
              </>
            )}
            <DescriptionTerm>Total amount</DescriptionTerm>
            <DescriptionDetails>{currency} {parseFloat(totalNet).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</DescriptionDetails>
            <DescriptionTerm>Status</DescriptionTerm>
            <DescriptionDetails className="capitalize">{booking.status || 'CONFIRMED'}</DescriptionDetails>
            {holder && (
              <>
                <DescriptionTerm>Contact name</DescriptionTerm>
                <DescriptionDetails>{holder.name} {holder.surname}</DescriptionDetails>
                {holder.email && (
                  <>
                    <DescriptionTerm>Email</DescriptionTerm>
                    <DescriptionDetails>{holder.email}</DescriptionDetails>
                  </>
                )}
                {holder.phone && (
                  <>
                    <DescriptionTerm>Phone</DescriptionTerm>
                    <DescriptionDetails>{holder.phone}</DescriptionDetails>
                  </>
                )}
              </>
            )}
            {booking.modificationPolicies && (
              <>
                <DescriptionTerm>Cancellation</DescriptionTerm>
                <DescriptionDetails>{booking.modificationPolicies.cancellation ? 'Allowed' : 'Not allowed'}</DescriptionDetails>
                <DescriptionTerm>Modification</DescriptionTerm>
                <DescriptionDetails>{booking.modificationPolicies.modification ? 'Allowed' : 'Not allowed'}</DescriptionDetails>
              </>
            )}
          </DescriptionList>
        </div>

        <div>
          <ButtonPrimary href="/hotels">
            <HomeIcon className="size-5" />
            Explore more hotels
          </ButtonPrimary>
        </div>
      </>
    )
  }

  return (
    <main className="container mt-10 mb-24 sm:mt-16 lg:mb-32">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-y-12 px-0 sm:rounded-2xl sm:p-6 xl:p-8">
        {bookingData && bookingData.type === 'hotel' ? renderHotelBooking() : bookingData && bookingData.flightData ? renderFlightBooking() : renderDefaultBooking()}
      </div>
    </main>
  )
}

export default Page
