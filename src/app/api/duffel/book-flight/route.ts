import { NextRequest, NextResponse } from 'next/server'
import { Duffel } from '@duffel/api'
import { getCurrentUserFromRequest } from '@/utils/auth-api'
import { prisma } from '@/lib/prisma'

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || '',
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

    // Use the original Duffel offer if available
    const originalOffer = flightData.originalOffer
    
    if (!originalOffer) {
      return NextResponse.json(
        { error: 'Original flight offer not found. Please search for flights again.' },
        { status: 400 }
      )
    }

    // Check if it's a Duffel offer (has 'slices' property)
    if (!originalOffer.slices || !originalOffer.id) {
      return NextResponse.json(
        { error: 'Invalid Duffel offer. Please search for flights again.' },
        { status: 400 }
      )
    }

    // Format date of birth for Duffel (YYYY-MM-DD)
    const dateOfBirth = new Date(passenger.dateOfBirth).toISOString().split('T')[0]
    
    // Format passport expiry date
    const passportExpiry = new Date(passenger.passportExpiry).toISOString().split('T')[0]

    // Parse phone number for Duffel API
    // Duffel requires phone_number in E.164 format: +[country_code][number] (string, no spaces)
    // Use country code from form and clean phone number
    const countryCode = contact.countryCode.trim()
    // Remove all non-digit characters from phone number
    const phoneNumber = contact.phone.replace(/[^0-9]/g, '')

    // Validate phone number - remove all non-digits
    const cleanedPhoneNumber = phoneNumber.replace(/[^0-9]/g, '')
    
    if (cleanedPhoneNumber.length < 6 || cleanedPhoneNumber.length > 15) {
      return NextResponse.json(
        { error: 'Phone number must be between 6 and 15 digits' },
        { status: 400 }
      )
    }

    // Validate country code - must be 1-3 digits, no leading zeros except for single digit
    if (!/^\d{1,3}$/.test(countryCode)) {
      return NextResponse.json(
        { error: 'Country code must be 1-3 digits' },
        { status: 400 }
      )
    }

    // Ensure country code doesn't start with 0 (except for single digit codes like 0)
    if (countryCode.length > 1 && countryCode.startsWith('0')) {
      return NextResponse.json(
        { error: 'Country code cannot start with 0' },
        { status: 400 }
      )
    }

    // Format phone number in E.164 format: +[country_code][number]
    // Duffel API requires phone_number as a string in E.164 format
    const phoneNumberE164 = `+${countryCode}${cleanedPhoneNumber}`

    // Build passengers array for Duffel
    // We need to match the number of passengers in the original offer
    // Try to determine passenger count from the offer structure
    // Check for passenger_identity_documents or other indicators
    let passengerCount = 1 // Default to 1 passenger
    
    // Try to get passenger count from offer structure
    // Some offers have passenger_identity_documents array
    if (originalOffer.passenger_identity_documents && Array.isArray(originalOffer.passenger_identity_documents)) {
      passengerCount = originalOffer.passenger_identity_documents.length
    }
    // Check if offer has passengers array
    else if (originalOffer.passengers && Array.isArray(originalOffer.passengers)) {
      passengerCount = originalOffer.passengers.length
    }
    // Check slices for passenger information
    else if (originalOffer.slices && originalOffer.slices.length > 0) {
      // Check first slice segments for passenger info
      const firstSlice = originalOffer.slices[0]
      if (firstSlice.segments && firstSlice.segments.length > 0) {
        const firstSegment = firstSlice.segments[0]
        if (firstSegment.passengers && Array.isArray(firstSegment.passengers)) {
          passengerCount = firstSegment.passengers.length
        }
      }
    }
    
    // Create passenger array - must match the number of passengers in the offer
    // Duffel requires each passenger to have an 'id' field
    // Note: phone_number might not be required on each passenger, only on contacts
    const passengers = Array(passengerCount).fill(null).map((_, index) => {
      const passengerData: any = {
        id: `passenger_${index + 1}`, // Required by Duffel API
        born_on: dateOfBirth,
        title: (passenger.title || 'mr').toLowerCase(),
        gender: passenger.gender === 'Male' ? 'm' : passenger.gender === 'Female' ? 'f' : 'x',
        given_name: passenger.firstName,
        family_name: passenger.lastName,
        email: contact.email,
        identity_documents: [
          {
            type: 'passport',
            unique_identifier: passenger.passportNumber,
            expires_on: passportExpiry,
            issuing_country_code: passenger.nationality,
          },
        ],
      }
      
      // Add phone_number in E.164 format (required by Duffel API)
      // Duffel requires phone_number as a string in E.164 format: +[country_code][number]
      passengerData.phone_number = phoneNumberE164
      
      return passengerData
    })

    // Get total amount and currency from the offer
    // Duffel offers have total_amount and total_currency fields
    const totalAmount = originalOffer.total_amount || originalOffer.base_amount || '0'
    const currency = originalOffer.total_currency || originalOffer.currency || 'AUD'
    
    // Convert amount to string if it's a number
    const paymentAmount = String(totalAmount)

    // Create order request
    // Duffel API requires: selected_offers, passengers, and payments
    // Payments field is required with amount and currency
    const orderRequest: any = {
      selected_offers: [originalOffer.id],
      passengers,
      payments: [
        {
          type: 'balance', // Payment type - balance means using account balance
          amount: paymentAmount, // Total amount from the offer
          currency: currency, // Currency from the offer (e.g., AUD)
        },
      ],
    }

    // Create the order
    const order = await duffel.orders.create(orderRequest)

    const bookingId = order.data.id || 'confirmed'
    const bookingData = order.data

    // Save booking to database if user is logged in
    try {
      const user = await getCurrentUserFromRequest(request)
      if (user && bookingData) {
        // Extract flight information
        const slices = originalOffer.slices || []
        const firstSlice = slices[0] || {}
        const segments = firstSlice.segments || []
        const firstSegment = segments[0] || {}
        const lastSegment = segments[segments.length - 1] || {}
        
        const departure = firstSegment.origin?.iata_code || body.flightData?.departure || ''
        const arrival = lastSegment.destination?.iata_code || body.flightData?.arrival || ''
        const departureDate = firstSegment.departing_at || body.flightData?.departureTime || new Date().toISOString()
        
        const price = originalOffer.total_amount || body.flightData?.price || '0'
        const currency = originalOffer.total_currency || 'USD'
        const arrivalDate = lastSegment.arriving_at || ''
        const airline = firstSegment.marketing_carrier?.name || firstSegment.marketing_carrier?.iata_code || ''
        
        // Convert bookingData to JSON-compatible format for Prisma
        const bookingDataJson = JSON.parse(JSON.stringify(bookingData)) as any
        
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
            bookingData: bookingDataJson,
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
    console.error('Duffel booking error:', error)
    console.error('Duffel booking error details:', JSON.stringify(error, null, 2))
    
    // Extract error message from Duffel response
    // Duffel errors have structure: { errors: [...], meta: {...}, headers: {...} }
    let errorMessage = 'Failed to book flight'
    let statusCode = 500
    
    // Check for Duffel API error structure
    if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
      const firstError = error.errors[0]
      errorMessage = firstError.message || firstError.title || firstError.detail || errorMessage
      
      // Try to get more specific error information
      if (firstError.type) {
        errorMessage = `${firstError.type}: ${errorMessage}`
      }
      
      // Get status code from error if available
      if (error.meta?.status) {
        statusCode = error.meta.status
      } else if (firstError.code) {
        // Some Duffel errors have codes that map to HTTP status codes
        statusCode = firstError.code
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    // Log full error for debugging
    if (error.meta) {
      console.error('Duffel error meta:', error.meta)
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.errors || error.message,
      },
      { status: statusCode }
    )
  }
}

