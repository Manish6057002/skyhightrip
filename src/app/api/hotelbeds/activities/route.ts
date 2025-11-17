import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Hotelbeds Activities API authentication helper
// Uses separate credentials for Activities API (HOTELBEDS_ACTIVITIES_API_KEY and HOTELBEDS_ACTIVITIES_SECRET)
// Falls back to regular Hotelbeds credentials if Activities-specific ones are not set
function getHotelbedsHeaders() {
  // Try Activities-specific credentials first, then fall back to regular credentials
  const apiKey = process.env.HOTELBEDS_ACTIVITIES_API_KEY || process.env.HOTELBEDS_API_KEY || ''
  const secret = process.env.HOTELBEDS_ACTIVITIES_SECRET || process.env.HOTELBEDS_SECRET || ''
  
  if (!apiKey || !secret) {
    throw new Error('Hotelbeds Activities API credentials not configured. Please set HOTELBEDS_ACTIVITIES_API_KEY and HOTELBEDS_ACTIVITIES_SECRET (or HOTELBEDS_API_KEY and HOTELBEDS_SECRET) environment variables.')
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
      dateFrom,
      dateTo,
      paxes,
    } = body

    if (!destinationCode || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Missing required parameters: destinationCode, dateFrom, dateTo' },
        { status: 400 }
      )
    }

    // Validate paxes (passengers)
    if (!paxes || !Array.isArray(paxes) || paxes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameter: paxes (array of passenger objects)' },
        { status: 400 }
      )
    }

    const headers = getHotelbedsHeaders()

    // Prepare activities availability request
    // According to Hotelbeds Activities API documentation v3.0
    // Documentation: https://developer.hotelbeds.com/documentation/activities/booking-api/availability/availability-/
    const searchRequest = {
      filters: [
        {
          searchFilterItems: [
            {
              type: "destination",
              value: destinationCode,
            },
          ],
        },
      ],
      from: dateFrom,
      to: dateTo,
      paxes: paxes.map((pax: any) => {
        // Convert pax type to age format required by API
        // AD (adult) -> age 25, CH (child) -> use provided age or default 8, INF (infant) -> use provided age or default 1
        if (pax.type === 'AD') {
          return { age: 25 }
        } else if (pax.type === 'CH') {
          return { age: pax.age || 8 }
        } else if (pax.type === 'INF') {
          return { age: pax.age || 1 }
        }
        return { age: 25 } // Default to adult
      }),
    }

    // Search for activities using Hotelbeds Activities Booking API v3.0
    // Using test environment - change to api.hotelbeds.com for production
    const response = await fetch(
      `https://api.test.hotelbeds.com/activity-api/3.0/activities/availability`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(searchRequest),
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

    // Return the activities data
    // Response structure from v3.0 API: { activities: [...], pagination: {...}, ... }
    const activities = data.activities || []
    const total = data.pagination?.totalItems || data.total || activities.length
    
    return NextResponse.json(
      {
        data: activities,
        total: total,
        pagination: data.pagination,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error searching activities:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search activities' },
      { status: 500 }
    )
  }
}

