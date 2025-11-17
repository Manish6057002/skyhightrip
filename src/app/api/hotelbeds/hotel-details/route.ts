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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const hotelCode = searchParams.get('code')

    if (!hotelCode) {
      return NextResponse.json(
        { error: 'Missing required parameter: code' },
        { status: 400 }
      )
    }

    const headers = getHotelbedsHeaders()

    // Fetch hotel details from Hotelbeds Content API
    // According to Hotelbeds docs: /hotels/{code} endpoint returns hotel with images array
    // Each image has a 'path' attribute that needs to be prepended with base URL
    // Format: https://photos.hotelbeds.com/giata/{path}
    const response = await fetch(
      `https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels/${hotelCode}?fields=all&language=ENG`,
      {
        method: 'GET',
        headers,
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

    // Log hotel structure to understand image locations
    // According to Hotelbeds docs: images are in /hotels and /hoteldetails operations
    // Images are returned as path segments (not full URLs)
    // Format: https://photos.hotelbeds.com/giata/{path}
    return NextResponse.json({ 
      data: data.hotel || data,
    }, { status: 200 })
  } catch (error: any) {
    console.error('Hotelbeds API error:', error)
    const errorMessage = error.message || 'Failed to fetch hotel details'
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

