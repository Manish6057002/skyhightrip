import { NextRequest, NextResponse } from 'next/server'
import { Duffel } from '@duffel/api'

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass,
      max,
    } = body

    if (!originLocationCode || !destinationLocationCode || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate dates are not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const departure = new Date(departureDate)
    departure.setHours(0, 0, 0, 0)
    
    if (departure < today) {
      return NextResponse.json(
        { error: 'Departure date cannot be in the past. Please select a future date.' },
        { status: 400 }
      )
    }

    if (returnDate) {
      const returnD = new Date(returnDate)
      returnD.setHours(0, 0, 0, 0)
      
      if (returnD < today) {
        return NextResponse.json(
          { error: 'Return date cannot be in the past. Please select a future date.' },
          { status: 400 }
        )
      }
      
      if (returnD < departure) {
        return NextResponse.json(
          { error: 'Return date must be after departure date.' },
          { status: 400 }
        )
      }
    }

    // Build passengers array
    // Duffel API: Use 'type' OR 'age', not both
    const passengers: any[] = []
    
    // Add adults
    for (let i = 0; i < (adults || 1); i++) {
      passengers.push({
        type: 'adult',
      })
    }
    
    // Add children
    for (let i = 0; i < (children || 0); i++) {
      passengers.push({
        type: 'child',
      })
    }
    
    // Add infants
    for (let i = 0; i < (infants || 0); i++) {
      passengers.push({
        type: 'infant_without_seat',
      })
    }

    // Create offer request
    // Use type assertion to bypass TypeScript strict checking
    // The Duffel API accepts departure_date and type-only passengers
    // Set currency to AUD (Australian Dollar)
    const offerRequestParams: any = {
      slices: returnDate
        ? [
            {
              origin: originLocationCode,
              destination: destinationLocationCode,
              departure_date: departureDate,
            },
            {
              origin: destinationLocationCode,
              destination: originLocationCode,
              departure_date: returnDate,
            },
          ]
        : [
            {
              origin: originLocationCode,
              destination: destinationLocationCode,
              departure_date: departureDate,
            },
          ],
      passengers,
      cabin_class: travelClass?.toLowerCase() || 'economy',
      currency: 'AUD', // Set currency to Australian Dollar
    }
    
    const offerRequest = await duffel.offerRequests.create(offerRequestParams)

    // Get offers
    const offers = await duffel.offers.list({
      offer_request_id: offerRequest.data.id,
      sort: 'total_amount',
      limit: max || 250,
    })

    return NextResponse.json(
      {
        data: offers.data || [],
        offerRequestId: offerRequest.data.id,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Duffel API error:', error)
    
    // Extract error message from Duffel response
    let errorMessage = 'Failed to search flights'
    if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
      errorMessage = error.errors[0].message || error.errors[0].title || errorMessage
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: error.status || 500 }
    )
  }
}

