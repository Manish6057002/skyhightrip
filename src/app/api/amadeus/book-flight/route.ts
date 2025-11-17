import { NextRequest, NextResponse } from 'next/server'
import Amadeus from 'amadeus'
import { getCurrentUserFromRequest } from '@/utils/auth-api'
import { prisma } from '@/lib/prisma'

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID || '',
  clientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flightData, passenger, contact } = body

    if (!flightData || !passenger || !contact) {
      return NextResponse.json(
        { error: 'Missing required booking information' },
        { status: 400 }
      )
    }

    // Validate required passenger fields
    if (!passenger.firstName || !passenger.lastName || !passenger.dateOfBirth || 
        !passenger.passportNumber || !passenger.passportExpiry || !passenger.nationality) {
      return NextResponse.json(
        { error: 'Missing required passenger information' },
        { status: 400 }
      )
    }

    // Validate contact information
    if (!contact.email || !contact.phone || !contact.countryCode) {
      return NextResponse.json(
        { error: 'Missing required contact information' },
        { status: 400 }
      )
    }

    // Format date of birth for Amadeus (YYYY-MM-DD)
    const dateOfBirth = new Date(passenger.dateOfBirth).toISOString().split('T')[0]
    
    // Format passport expiry date
    const passportExpiry = new Date(passenger.passportExpiry).toISOString().split('T')[0]

    // Use the original Amadeus flight offer if available, otherwise reconstruct
    const originalOffer = flightData.originalOffer
    
    if (!originalOffer) {
      return NextResponse.json(
        { error: 'Original flight offer not found. Please search for flights again.' },
        { status: 400 }
      )
    }

    // Parse phone number using country code from form
    const countryCode = contact.countryCode.trim()
    // Remove all non-digit characters from phone number
    const phoneNumber = contact.phone.replace(/[^0-9]/g, '')

    // Validate phone number
    if (phoneNumber.length < 6 || phoneNumber.length > 15) {
      return NextResponse.json(
        { error: 'Phone number must be between 6 and 15 digits' },
        { status: 400 }
      )
    }

    // Validate country code
    if (!/^\d{1,3}$/.test(countryCode)) {
      return NextResponse.json(
        { error: 'Country code must be 1-3 digits' },
        { status: 400 }
      )
    }

    const phoneInfo = {
      countryCallingCode: countryCode,
      number: phoneNumber,
    }
    
    // Step 1: Price the flight offer first (required by Amadeus)
    let pricedOffer = originalOffer
    try {
      const priceRequest = {
        data: {
          type: 'flight-offers-pricing',
          flightOffers: [originalOffer],
        },
      }
      
      const priceResponse = await amadeus.shopping.flightOffers.pricing.post(JSON.stringify(priceRequest))
      
      if (priceResponse.data && priceResponse.data.flightOffers && priceResponse.data.flightOffers.length > 0) {
        pricedOffer = priceResponse.data.flightOffers[0]
      }
    } catch (priceError: any) {
      console.error('Flight pricing error:', priceError)
      // Continue with original offer if pricing fails (for test environment)
      // In production, you should handle this error appropriately
    }
    
    // Step 2: Build the booking request using the priced offer
    const bookingRequest: any = {
      data: {
        type: 'flight-order',
        flightOffers: [pricedOffer], // Use the priced offer
        travelers: [
          {
            id: '1',
            dateOfBirth: dateOfBirth,
            name: {
              firstName: passenger.firstName,
              lastName: passenger.lastName,
            },
            gender: passenger.gender === 'Male' ? 'MALE' : passenger.gender === 'Female' ? 'FEMALE' : 'OTHER',
            contact: {
              emailAddress: contact.email,
              phones: [
                {
                  deviceType: 'MOBILE',
                  countryCallingCode: phoneInfo.countryCallingCode,
                  number: phoneInfo.number,
                },
              ],
            },
            documents: [
              {
                documentType: 'PASSPORT',
                birthPlace: passenger.nationality,
                issuanceLocation: passenger.nationality,
                issuanceDate: dateOfBirth,
                number: passenger.passportNumber,
                expiryDate: passportExpiry,
                issuanceCountry: passenger.nationality,
                validityCountry: passenger.nationality,
                nationality: passenger.nationality,
                holder: true,
              },
            ],
          },
        ],
        remarks: {
          general: [
            {
              subType: 'GENERAL_MISCELLANEOUS',
              text: 'Booking via travel website',
            },
          ],
        },
        ticketingAgreement: {
          option: 'DELAY_TO_CANCEL',
          delay: '6D',
        },
        contacts: [
          {
            addresseeName: {
              firstName: passenger.firstName,
              lastName: passenger.lastName,
            },
            companyName: 'Travel Booking',
            purpose: 'STANDARD',
            phones: [
              {
                deviceType: 'MOBILE',
                countryCallingCode: phoneInfo.countryCallingCode,
                number: phoneInfo.number,
              },
            ],
            emailAddress: contact.email,
            address: {
              lines: ['Travel Booking Address'],
              postalCode: '0000',
              cityName: 'City',
              countryCode: passenger.nationality,
            },
          },
        ],
      },
    }

    // Call Amadeus Flight Create Orders API
    const response = await amadeus.booking.flightOrders.post(JSON.stringify(bookingRequest))

    const bookingId = response.data.id || response.data.associatedRecords?.[0]?.reference || 'confirmed'
    const bookingData = response.data

    // Save booking to database if user is logged in
    try {
      const user = await getCurrentUserFromRequest(request)
      if (user && bookingData) {
        // Extract flight information
        const flightOffer = pricedOffer
        const itineraries = flightOffer.itineraries || []
        const firstItinerary = itineraries[0] || {}
        const segments = firstItinerary.segments || []
        const firstSegment = segments[0] || {}
        const lastSegment = segments[segments.length - 1] || {}
        
        const departure = firstSegment.departure?.iataCode || body.flightData?.departure || ''
        const arrival = lastSegment.arrival?.iataCode || body.flightData?.arrival || ''
        const departureDate = firstSegment.departure?.at || body.flightData?.departureTime || new Date().toISOString()
        
        const price = flightOffer.price?.total || body.flightData?.price || '0'
        const currency = flightOffer.price?.currency || 'USD'
        const arrivalDate = lastSegment.arrival?.at || ''
        const airline = firstSegment.carrierCode || ''
        
        await prisma.flightBooking.create({
          data: {
            userId: user.id,
            bookingRef: bookingId,
            status: 'confirmed',
            departure: departure,
            arrival: arrival,
            departureDate: departureDate,
            arrivalDate: arrivalDate || null,
            airline: airline || null,
            price: price.toString(),
            currency: currency,
            passenger: passenger,
            contact: contact,
            bookingData: bookingData,
          },
        })
        
      }
    } catch (dbError: any) {
      // Log error but don't fail the booking if database save fails
      console.error('Failed to save flight booking to database:', dbError)
    }

    return NextResponse.json(
      {
        success: true,
        bookingId: bookingId,
        data: bookingData,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Amadeus booking error:', error)
    
    // Extract error message from Amadeus response
    let errorMessage = 'Failed to book flight'
    if (error.description && Array.isArray(error.description) && error.description.length > 0) {
      errorMessage = error.description[0].detail || error.description[0].title || errorMessage
    } else if (error.description) {
      errorMessage = error.description
    } else if (error.response?.body?.errors && Array.isArray(error.response.body.errors) && error.response.body.errors.length > 0) {
      errorMessage = error.response.body.errors[0].detail || error.response.body.errors[0].title || errorMessage
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.statusCode || 500 }
    )
  }
}

