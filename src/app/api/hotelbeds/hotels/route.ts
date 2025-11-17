import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Hotelbeds API authentication helper
function getHotelbedsHeaders() {
  const apiKey = process.env.HOTELBEDS_API_KEY || ''
  const secret = process.env.HOTELBEDS_SECRET || ''
  
  if (!apiKey || !secret) {
    throw new Error('Hotelbeds API credentials not configured')
  }

  // Create signature for authentication (SHA256 hash of apiKey + secret + timestamp)
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = crypto.createHash('sha256').update(apiKey + secret + timestamp).digest('hex')

  return {
    'Api-Key': apiKey,
    'X-Signature': signature,
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      destinationCode,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
    } = body

    if (!destinationCode || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required parameters: destinationCode, checkIn, checkOut' },
        { status: 400 }
      )
    }

    const headers = getHotelbedsHeaders()

    // Prepare hotel search request using destination code
    // Note: Hotelbeds API requires only ONE filter: Destination, Geolocation, or Hotels
    // Since we have a destination code, we use only the destination filter
    const searchRequest = {
      stay: {
        checkIn,
        checkOut,
      },
      occupancies: [
        {
          rooms: rooms || 1,
          adults: adults || 1,
          children: children || 0,
        },
      ],
      filter: {
        maxHotels: 250,
      },
      // Use destination code in the request (only one filter allowed)
      destination: {
        code: destinationCode,
      },
    }

    // Search for hotels using Hotelbeds Booking API with destination code
    const response = await fetch(
      `https://api.test.hotelbeds.com/hotel-api/1.0/hotels`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(searchRequest),
      }
    )

    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = `Hotelbeds API error: ${response.status}`
      try {
        const errorData = JSON.parse(responseText)
        if (errorData.error?.message) {
          errorMessage = errorData.error.message
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else {
          errorMessage = responseText
        }
      } catch (e) {
        errorMessage = responseText || errorMessage
      }
      throw new Error(errorMessage)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse response as JSON:', e)
      throw new Error('Invalid response from Hotelbeds API')
    }

    // Handle different possible response structures
    // Hotelbeds API returns: { hotels: { hotels: [...] } }
    let hotels = []
    if (data.hotels?.hotels && Array.isArray(data.hotels.hotels)) {
      hotels = data.hotels.hotels
    } else if (Array.isArray(data.hotels)) {
      hotels = data.hotels
    } else if (data.data?.hotels && Array.isArray(data.data.hotels)) {
      hotels = data.data.hotels
    } else if (Array.isArray(data.data)) {
      hotels = data.data
    }

    return NextResponse.json({ 
      data: hotels,
      total: hotels.length,
    }, { status: 200 })
  } catch (error: any) {
    console.error('Hotelbeds API error:', error)
    const errorMessage = error.message || 'Failed to search hotels'
    console.error('Error details:', {
      message: errorMessage,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.statusCode || 500 }
    )
  }
}

