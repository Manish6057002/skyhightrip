import { NextRequest, NextResponse } from 'next/server'
import Amadeus from 'amadeus'

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID || '',
  clientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
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

    const searchParams: any = {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults: adults || 1,
      currencyCode: 'AUD',
      max: max || 250, // Increased to show more flights
      travelClass: travelClass || 'ECONOMY', // Default to ECONOMY if not specified
    }

    if (returnDate) {
      searchParams.returnDate = returnDate
    }

    if (children) {
      searchParams.children = children
    }

    if (infants) {
      searchParams.infants = infants
    }

    const response = await amadeus.shopping.flightOffersSearch.get(searchParams)

    return NextResponse.json({ 
      data: response.data,
      dictionaries: response.dictionaries || null
    }, { status: 200 })
  } catch (error: any) {
    console.error('Amadeus API error:', error)
    
    // Extract error message from Amadeus response
    let errorMessage = 'Failed to search flights'
    if (error.description && Array.isArray(error.description) && error.description.length > 0) {
      errorMessage = error.description[0].detail || error.description[0].title || errorMessage
    } else if (error.description) {
      errorMessage = error.description
    } else if (error.response?.body?.errors && Array.isArray(error.response.body.errors) && error.response.body.errors.length > 0) {
      errorMessage = error.response.body.errors[0].detail || error.response.body.errors[0].title || errorMessage
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.statusCode || 500 }
    )
  }
}

