'use client'

import StartRating from '@/components/StartRating'
import ButtonPrimary from '@/shared/ButtonPrimary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import { Field, Label } from '@/shared/fieldset'
import Input from '@/shared/Input'
import Form from 'next/form'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import PayWith from './PayWith'
import YourTrip from './YourTrip'

interface HotelBookingData {
  type: 'hotel'
  hotel: {
    id: string
    name: string
    address?: string
    city?: string
    country?: string
    image?: string
    images?: string[]
    currency?: string
    fullData?: any
  }
  room: any
  checkIn: string | null
  checkOut: string | null
  guests: {
    adults: number
    children: number
    infants: number
  }
  rateKey: string | null
  rateType: string
}

const Page = () => {
  const router = useRouter()
  const [hotelBooking, setHotelBooking] = useState<HotelBookingData | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)

  useEffect(() => {
    document.documentElement.scrollTo({
      top: 0,
      behavior: 'instant',
    })

    // Load hotel booking data from sessionStorage
    try {
      const storedBooking = sessionStorage.getItem('hotelBooking')
      if (storedBooking) {
        const booking: HotelBookingData = JSON.parse(storedBooking)
        setHotelBooking(booking)
      }
    } catch (err) {
      console.error('Failed to load hotel booking data:', err)
    }
  }, [])

  const handleSubmitForm = async (formData: FormData) => {
    if (!hotelBooking) {
      // Handle other booking types (existing logic)
      router.push('/pay-done')
      return
    }

    // Prevent double submission
    if (bookingLoading || bookingSuccess) {
      return
    }

    setBookingLoading(true)
    setBookingError(null)

    try {
      // Validate required fields
      const holderName = formData.get('holderName') as string
      const holderSurname = formData.get('holderSurname') as string
      const holderEmail = formData.get('holderEmail') as string
      const holderPhone = formData.get('holderPhone') as string

      if (!holderName || !holderSurname || !holderEmail) {
        throw new Error('Please fill in all required contact information')
      }

      if (!hotelBooking.rateKey) {
        throw new Error('Invalid room selection. Please go back and select a room again.')
      }

      if (!hotelBooking.checkIn || !hotelBooking.checkOut) {
        throw new Error('Please select check-in and check-out dates')
      }

      // Build passengers array from form data
      const paxes: any[] = []
      const adults = hotelBooking.guests.adults || 1
      const children = hotelBooking.guests.children || 0
      const infants = hotelBooking.guests.infants || 0

      // Add adults
      for (let i = 0; i < adults; i++) {
        const name = formData.get(`passengerName_${i}`) as string || holderName
        const surname = formData.get(`passengerSurname_${i}`) as string || holderSurname
        paxes.push({
          roomId: 1,
          type: 'AD',
          name: name.trim(),
          surname: surname.trim(),
        })
      }

      // Add children
      for (let i = 0; i < children; i++) {
        const name = formData.get(`passengerName_${adults + i}`) as string || `Child ${i + 1}`
        const surname = formData.get(`passengerSurname_${adults + i}`) as string || holderSurname
        const age = parseInt(formData.get(`passengerAge_${adults + i}`) as string || '8')
        paxes.push({
          roomId: 1,
          type: 'CH',
          name: name.trim(),
          surname: surname.trim(),
          age: age,
        })
      }

      // Add infants
      for (let i = 0; i < infants; i++) {
        const name = formData.get(`passengerName_${adults + children + i}`) as string || `Infant ${i + 1}`
        const surname = formData.get(`passengerSurname_${adults + children + i}`) as string || holderSurname
        const age = parseInt(formData.get(`passengerAge_${adults + children + i}`) as string || '1')
        paxes.push({
          roomId: 1,
          type: 'INF',
          name: name.trim(),
          surname: surname.trim(),
          age: age,
        })
      }

      // Call hotel booking API
      const bookingResponse = await fetch('/api/hotelbeds/hotels/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rateKey: hotelBooking.rateKey,
          rateType: hotelBooking.rateType,
          paxes: paxes,
          holder: {
            name: holderName.trim(),
            surname: holderSurname.trim(),
            email: holderEmail.trim(),
            phone: holderPhone?.trim() || '',
          },
          clientReference: `HTL${Date.now()}`,
          remark: formData.get('remark') as string || '',
        }),
      })

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json()
        throw new Error(errorData.error || 'Failed to complete booking')
      }

      const bookingResult = await bookingResponse.json()
      setBookingData(bookingResult.data)
      setBookingSuccess(true)

      // Prepare booking data for confirmation page
      const bookingConfirmationData = {
        type: 'hotel',
        booking: bookingResult.data.booking || bookingResult.data,
        hotel: hotelBooking.hotel,
        room: hotelBooking.room,
        checkIn: hotelBooking.checkIn,
        checkOut: hotelBooking.checkOut,
        guests: hotelBooking.guests,
        holder: {
          name: holderName.trim(),
          surname: holderSurname.trim(),
          email: holderEmail.trim(),
          phone: holderPhone?.trim() || '',
        },
      }

      // Clear booking data from sessionStorage
      try {
        sessionStorage.removeItem('hotelBooking')
      } catch (err) {
        console.error('Failed to clear booking data:', err)
      }

      // Redirect to success page with booking data
      const bookingDataParam = encodeURIComponent(JSON.stringify(bookingConfirmationData))
      router.push(`/pay-done?type=hotel&data=${bookingDataParam}`)
    } catch (error: any) {
      console.error('Booking error:', error)
      setBookingError(error.message || 'Failed to complete booking. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  const renderSidebar = () => {
    if (!hotelBooking) {
      // Default sidebar for other booking types
      return (
        <div className="flex w-full flex-col gap-y-6 border-neutral-200 px-0 sm:gap-y-8 sm:rounded-4xl sm:p-6 lg:border xl:p-8 dark:border-neutral-700">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="w-full shrink-0 sm:w-40">
              <div className="aspect-w-4 overflow-hidden rounded-2xl aspect-h-3 sm:aspect-h-4">
                <Image
                  alt=""
                  fill
                  sizes="200px"
                  src="https://images.pexels.com/photos/6373478/pexels-photo-6373478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                />
              </div>
            </div>
            <div className="flex flex-col gap-y-3 py-5 text-start sm:ps-5">
              <div>
                <span className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Hotel room in Tokyo, Jappan
                </span>
                <span className="mt-1 block text-base font-medium">The Lounge & Bar</span>
              </div>
              <p className="block text-sm text-neutral-500 dark:text-neutral-400">2 beds · 2 baths</p>
              <Divider className="w-10!" />
              <StartRating />
            </div>
          </div>

          <Divider className="block lg:hidden" />

          <DescriptionList>
            <DescriptionTerm>$19.00 x 3 day</DescriptionTerm>
            <DescriptionDetails className="sm:text-right">$57.00</DescriptionDetails>
            <DescriptionTerm>Service charge</DescriptionTerm>
            <DescriptionDetails className="sm:text-right">$0.00</DescriptionDetails>
            <DescriptionTerm>Fee</DescriptionTerm>
            <DescriptionDetails className="sm:text-right">$0.00</DescriptionDetails>
            <DescriptionTerm>Tax</DescriptionTerm>
            <DescriptionDetails className="sm:text-right">$0.00</DescriptionDetails>
            <DescriptionTerm className="font-semibold text-neutral-900">Total</DescriptionTerm>
            <DescriptionDetails className="font-semibold sm:text-right">$57.00</DescriptionDetails>
          </DescriptionList>
        </div>
      )
    }

    // Hotel booking sidebar
    const { hotel, room, checkIn, checkOut, guests } = hotelBooking
    const roomPrice = room.rates && room.rates.length > 0
      ? parseFloat(room.rates[0].net || room.rates[0].sellingRate || '0')
      : room.minRate ? parseFloat(room.minRate) : 0
    
    const currency = hotel.currency || 'EUR'
    
    // Calculate nights
    const checkInDate = checkIn ? new Date(checkIn) : null
    const checkOutDate = checkOut ? new Date(checkOut) : null
    const nights = checkInDate && checkOutDate 
      ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    const pricePerNight = roomPrice || 0
    const subtotal = nights > 0 ? pricePerNight * nights : pricePerNight

    const hotelImage = hotel.images && hotel.images.length > 0 
      ? hotel.images[0] 
      : hotel.image || 'https://images.pexels.com/photos/6373478/pexels-photo-6373478.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'
    
    const roomName = room.name || room.typeDescription?.content || room.code || 'Room'

    return (
      <div className="flex w-full flex-col gap-y-6 border-neutral-200 px-0 sm:gap-y-8 sm:rounded-4xl sm:p-6 lg:border xl:p-8 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <div className="w-full shrink-0 sm:w-40">
            <div className="aspect-w-4 overflow-hidden rounded-2xl aspect-h-3 sm:aspect-h-4">
              <Image
                alt={hotel.name}
                fill
                sizes="200px"
                src={hotelImage}
                unoptimized
              />
            </div>
          </div>
          <div className="flex flex-col gap-y-3 py-5 text-start sm:ps-5">
            <div>
              <span className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                {hotel.city && hotel.country ? `${hotel.city}, ${hotel.country}` : hotel.address || 'Hotel'}
              </span>
              <span className="mt-1 block text-base font-medium">{hotel.name}</span>
            </div>
            <p className="block text-sm text-neutral-500 dark:text-neutral-400">{roomName}</p>
            {checkIn && checkOut && (
              <p className="block text-sm text-neutral-500 dark:text-neutral-400">
                {new Date(checkIn).toLocaleDateString()} - {new Date(checkOut).toLocaleDateString()}
              </p>
            )}
            <Divider className="w-10!" />
          </div>
        </div>

        <Divider className="block lg:hidden" />

        <DescriptionList>
          {nights > 0 && pricePerNight > 0 && (
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
            {pricePerNight > 0 && nights > 0
              ? `${currency} ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'Price on request'}
          </DescriptionDetails>
        </DescriptionList>
      </div>
    )
  }

  const renderMain = () => {
    if (!hotelBooking) {
      // Default form for other booking types
      return (
        <Form
          action={handleSubmitForm}
          className="flex w-full flex-col gap-y-8 border-neutral-200 px-0 sm:rounded-4xl sm:border sm:p-6 xl:p-8 dark:border-neutral-700"
        >
          <h1 className="text-3xl font-semibold lg:text-4xl">Confirm and payment</h1>
          <Divider />
          <YourTrip />
          <PayWith />
          <div>
            <ButtonPrimary type="submit" className="mt-10 text-base/6!">
              Confirm and pay
            </ButtonPrimary>
          </div>
        </Form>
      )
    }

    // Hotel booking form
    const { hotel, guests } = hotelBooking
    const adults = guests.adults || 1
    const children = guests.children || 0
    const infants = guests.infants || 0
    const totalPassengers = adults + children + infants

    return (
      <Form
        action={handleSubmitForm}
        className="flex w-full flex-col gap-y-8 border-neutral-200 px-0 sm:rounded-4xl sm:border sm:p-6 xl:p-8 dark:border-neutral-700"
        onSubmit={(e) => {
          if (bookingLoading || bookingSuccess) {
            e.preventDefault()
            return false
          }
        }}
      >
        <h1 className="text-3xl font-semibold lg:text-4xl">Confirm booking</h1>
        <Divider />

        {/* Hotel Details */}
        <div>
          <h3 className="text-2xl font-semibold">Hotel Details</h3>
          <DescriptionList className="mt-4">
            <DescriptionTerm>Hotel</DescriptionTerm>
            <DescriptionDetails>{hotel.name}</DescriptionDetails>
            {hotel.city && hotel.country && (
              <>
                <DescriptionTerm>Location</DescriptionTerm>
                <DescriptionDetails>{hotel.city}, {hotel.country}</DescriptionDetails>
              </>
            )}
            {hotelBooking.checkIn && hotelBooking.checkOut && (
              <>
                <DescriptionTerm>Check-in</DescriptionTerm>
                <DescriptionDetails>{new Date(hotelBooking.checkIn).toLocaleDateString()}</DescriptionDetails>
                <DescriptionTerm>Check-out</DescriptionTerm>
                <DescriptionDetails>{new Date(hotelBooking.checkOut).toLocaleDateString()}</DescriptionDetails>
              </>
            )}
          </DescriptionList>
        </div>

        <Divider />

        {/* Contact Information */}
        <div>
          <h3 className="text-2xl font-semibold">Contact Information</h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <Field>
              <Label>First Name *</Label>
              <Input
                name="holderName"
                className="mt-1.5"
                placeholder="John"
                required
              />
            </Field>
            <Field>
              <Label>Last Name *</Label>
              <Input
                name="holderSurname"
                className="mt-1.5"
                placeholder="Doe"
                required
              />
            </Field>
            <Field className="sm:col-span-2">
              <Label>Email *</Label>
              <Input
                name="holderEmail"
                type="email"
                className="mt-1.5"
                placeholder="john.doe@example.com"
                required
              />
            </Field>
            <Field className="sm:col-span-2">
              <Label>Phone Number</Label>
              <Input
                name="holderPhone"
                type="tel"
                className="mt-1.5"
                placeholder="+1234567890"
              />
            </Field>
          </div>
        </div>

        <Divider />

        {/* Passenger Information */}
        {totalPassengers > 0 && (
          <>
            <div>
              <h3 className="text-2xl font-semibold">Passenger Information</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Please provide information for all passengers ({adults} adult{adults !== 1 ? 's' : ''}, {children} child{children !== 1 ? 'ren' : ''}, {infants} infant{infants !== 1 ? 's' : ''}).
              </p>
              <div className="mt-4 space-y-6">
                {/* Adults */}
                {Array.from({ length: adults }).map((_, index) => (
                  <div key={`adult-${index}`} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
                    <h4 className="mb-4 font-medium">Adult {index + 1}</h4>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field>
                        <Label>First Name *</Label>
                        <Input
                          name={`passengerName_${index}`}
                          className="mt-1.5"
                          placeholder="First name"
                          required
                        />
                      </Field>
                      <Field>
                        <Label>Last Name *</Label>
                        <Input
                          name={`passengerSurname_${index}`}
                          className="mt-1.5"
                          placeholder="Last name"
                          required
                        />
                      </Field>
                    </div>
                  </div>
                ))}

                {/* Children */}
                {Array.from({ length: children }).map((_, index) => (
                  <div key={`child-${index}`} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
                    <h4 className="mb-4 font-medium">Child {index + 1}</h4>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field>
                        <Label>First Name *</Label>
                        <Input
                          name={`passengerName_${adults + index}`}
                          className="mt-1.5"
                          placeholder="First name"
                          required
                        />
                      </Field>
                      <Field>
                        <Label>Last Name *</Label>
                        <Input
                          name={`passengerSurname_${adults + index}`}
                          className="mt-1.5"
                          placeholder="Last name"
                          required
                        />
                      </Field>
                      <Field>
                        <Label>Age *</Label>
                        <Input
                          name={`passengerAge_${adults + index}`}
                          type="number"
                          min="0"
                          max="17"
                          className="mt-1.5"
                          placeholder="Age"
                          required
                        />
                      </Field>
                    </div>
                  </div>
                ))}

                {/* Infants */}
                {Array.from({ length: infants }).map((_, index) => (
                  <div key={`infant-${index}`} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
                    <h4 className="mb-4 font-medium">Infant {index + 1}</h4>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field>
                        <Label>First Name *</Label>
                        <Input
                          name={`passengerName_${adults + children + index}`}
                          className="mt-1.5"
                          placeholder="First name"
                          required
                        />
                      </Field>
                      <Field>
                        <Label>Last Name *</Label>
                        <Input
                          name={`passengerSurname_${adults + children + index}`}
                          className="mt-1.5"
                          placeholder="Last name"
                          required
                        />
                      </Field>
                      <Field>
                        <Label>Age *</Label>
                        <Input
                          name={`passengerAge_${adults + children + index}`}
                          type="number"
                          min="0"
                          max="2"
                          className="mt-1.5"
                          placeholder="Age"
                          required
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* Remarks */}
        <div>
          <Field>
            <Label>Special Requests (Optional)</Label>
            <Input
              name="remark"
              className="mt-1.5"
              placeholder="Any special requests or notes..."
            />
          </Field>
        </div>

        {bookingError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{bookingError}</p>
          </div>
        )}

        <div>
          <ButtonPrimary
            type="submit"
            className="mt-10 w-full text-base/6!"
            disabled={bookingLoading}
          >
            {bookingLoading ? 'Processing...' : 'Confirm Booking'}
          </ButtonPrimary>
        </div>
      </Form>
    )
  }

  return (
    <main className="container mt-10 mb-24 flex flex-col gap-14 lg:mb-32 lg:flex-row lg:gap-10">
      <div className="w-full lg:w-3/5 xl:w-2/3">{renderMain()}</div>
      <Divider className="block lg:hidden" />
      <div className="grow">{renderSidebar()}</div>
    </main>
  )
}

export default Page
