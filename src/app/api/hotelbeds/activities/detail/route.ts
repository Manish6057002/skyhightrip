import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Hotelbeds Activities API authentication helper
function getHotelbedsHeaders() {
  const apiKey = process.env.HOTELBEDS_ACTIVITIES_API_KEY || process.env.HOTELBEDS_API_KEY || ''
  const secret = process.env.HOTELBEDS_ACTIVITIES_SECRET || process.env.HOTELBEDS_SECRET || ''
  
  if (!apiKey || !secret) {
    throw new Error('Hotelbeds Activities API credentials not configured')
  }

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

/**
 * Get activity detail/checkRate
 * According to Hotelbeds Activities API documentation:
 * https://developer.hotelbeds.com/documentation/activities/booking-api/details-checkrate/
 * 
 * This endpoint is used to get detailed information about an activity rate before booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      rateKey,
      language = 'ENG',
    } = body

    if (!rateKey) {
      return NextResponse.json(
        { error: 'Missing required parameter: rateKey' },
        { status: 400 }
      )
    }

    const headers = getHotelbedsHeaders()

    // Prepare detail request
    // According to Hotelbeds API: /activity-api/3.0/activities/detail
    const detailRequest = {
      rateKey: rateKey,
      language: language,
    }

    // Get activity detail using Hotelbeds Activities Booking API v3.0
    const response = await fetch(
      `https://api.test.hotelbeds.com/activity-api/3.0/activities/detail`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(detailRequest),
      }
    )

    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = `Hotelbeds Activities API error: ${response.status}`
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
      throw new Error('Invalid response from Hotelbeds Activities API')
    }

    return NextResponse.json(
      {
        data: data,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching activity detail:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activity detail' },
      { status: 500 }
    )
  }
}

