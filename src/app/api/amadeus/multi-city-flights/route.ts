import { NextRequest, NextResponse } from 'next/server'
import Amadeus from 'amadeus'

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID || '',
  clientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { segments, adults, children, infants, travelClass, max } = body

    if (!segments || segments.length === 0) {
      return NextResponse.json(
        { error: 'At least one segment is required' },
        { status: 400 }
      )
    }

    // Validate dates are not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (const segment of segments) {
      if (!segment.date) {
        return NextResponse.json(
          { error: 'All segments must have a departure date.' },
          { status: 400 }
        )
      }
      
      const segmentDate = new Date(segment.date)
      segmentDate.setHours(0, 0, 0, 0)
      
      if (segmentDate < today) {
        return NextResponse.json(
          { error: `Departure date for segment ${segments.indexOf(segment) + 1} cannot be in the past. Please select a future date.` },
          { status: 400 }
        )
      }
    }

    const originDestinations = segments.map((segment: any) => ({
      id: segment.id || String(segments.indexOf(segment) + 1),
      originLocationCode: segment.origin,
      destinationLocationCode: segment.destination,
      departureDateTimeRange: {
        date: segment.date,
      },
    }))

    // Collect all origin-destination IDs for cabin restrictions
    const originDestinationIds = originDestinations.map((od: { id: string }) => od.id)

    const searchParams: any = {
      originDestinations,
      travelers: [
        {
          id: '1',
          travelerType: 'ADULT',
        },
      ],
      sources: ['GDS'],
      currencyCode: 'AUD',
      searchCriteria: {
        maxFlightOptions: max || 250, // Increased to show more flights
        flightFilters: {
          cabinRestrictions: [
            {
              cabin: travelClass || 'ECONOMY', // Default to ECONOMY if not specified
              coverage: 'MOST_SEGMENTS',
              originDestinationIds: originDestinationIds, // Required for multi-city flights
            },
          ],
        },
      },
    }

    // Add adults
    if (adults && adults > 1) {
      for (let i = 2; i <= adults; i++) {
        searchParams.travelers.push({
          id: String(i),
          travelerType: 'ADULT',
        })
      }
    }

    // Add children
    if (children) {
      for (let i = 0; i < children; i++) {
        searchParams.travelers.push({
          id: String(searchParams.travelers.length + 1),
          travelerType: 'CHILD',
        })
      }
    }

    // Add infants
    if (infants) {
      for (let i = 0; i < infants; i++) {
        searchParams.travelers.push({
          id: String(searchParams.travelers.length + 1),
          travelerType: 'HELD_INFANT',
          associatedAdultId: '1',
        })
      }
    }

    const response = await amadeus.shopping.flightOffersSearch.post(
      searchParams
    )

    return NextResponse.json({ 
      data: response.data,
      dictionaries: response.dictionaries || null
    }, { status: 200 })
  } catch (error: any) {
    console.error('Amadeus API error:', error)
    
    // Extract error message from Amadeus response
    let errorMessage = 'Failed to search multi-city flights'
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

