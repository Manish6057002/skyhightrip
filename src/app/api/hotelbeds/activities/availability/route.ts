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
 * Get available dates for a specific activity
 * This endpoint searches for the activity in a date range and returns available dates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      activityCode, // Activity code from Hotelbeds
      destinationCode, // Destination code (3 characters, e.g., "BCN")
      dateFrom, // Start date for search range (YYYY-MM-DD)
      dateTo, // End date for search range (YYYY-MM-DD)
      adults = 1, // Number of adults
      children = 0, // Number of children
      infants = 0, // Number of infants
    } = body

    if (!activityCode || !destinationCode || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Missing required parameters: activityCode, destinationCode, dateFrom, dateTo' },
        { status: 400 }
      )
    }

    // Validate destination code (max 3 characters)
    if (destinationCode.length > 3) {
      return NextResponse.json(
        { error: 'Invalid destination code. Must be 3 characters or less.' },
        { status: 400 }
      )
    }

    const headers = getHotelbedsHeaders()

    // Build paxes array
    const paxes: Array<{ age: number }> = []
    for (let i = 0; i < adults; i++) {
      paxes.push({ age: 25 })
    }
    for (let i = 0; i < children; i++) {
      paxes.push({ age: 8 })
    }
    for (let i = 0; i < infants; i++) {
      paxes.push({ age: 1 })
    }

    // Ensure at least one adult
    if (paxes.length === 0) {
      paxes.push({ age: 25 })
    }

    // Search for activities in the date range
    // Note: Hotelbeds API v3.0 may not support activityCode filter directly
    // We'll search by destination and filter results by activity code
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
      paxes,
    }

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

    // Extract available dates from the response
    // The API returns activities with availability information
    const activities = data.activities || []
    
    // Find the specific activity
    const activity = activities.find((a: any) => 
      a.code === activityCode || a.activityCode === activityCode
    )

    if (!activity) {
      return NextResponse.json(
        {
          available: false,
          message: 'Activity not available for the selected date range',
          availableDates: [],
        },
        { status: 200 }
      )
    }

    // Extract available dates from modalities
    // Each modality may have different availability dates
    const availableDates: string[] = []
    
    if (activity.modalities && Array.isArray(activity.modalities)) {
      activity.modalities.forEach((modality: any) => {
        if (modality.rates && Array.isArray(modality.rates)) {
          modality.rates.forEach((rate: any) => {
            if (rate.rateDetails && Array.isArray(rate.rateDetails)) {
              rate.rateDetails.forEach((rateDetail: any) => {
                // Extract date from rateKey or check availability dates
                if (rateDetail.from) {
                  const date = rateDetail.from.split('T')[0] // Get date part only
                  if (!availableDates.includes(date)) {
                    availableDates.push(date)
                  }
                }
              })
            }
          })
        }
      })
    }

    // If no specific dates found, check if activity is available in the range
    // Return the search date range as available if activity was found
    if (availableDates.length === 0 && activity) {
      // Generate dates in the range
      const startDate = new Date(dateFrom)
      const endDate = new Date(dateTo)
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        availableDates.push(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    return NextResponse.json(
      {
        available: true,
        activity: {
          code: activity.code || activity.activityCode,
          name: activity.name || activity.content?.name,
        },
        availableDates: availableDates.sort(),
        priceInfo: {
          adult: activity.modalities?.[0]?.amountsFrom?.find((a: any) => a.paxType === 'ADULT')?.amount,
          child: activity.modalities?.[0]?.amountsFrom?.find((a: any) => a.paxType === 'CHILD')?.amount,
          currency: activity.currency || 'EUR',
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching activity availability:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch activity availability',
        available: false,
        availableDates: [],
      },
      { status: 500 }
    )
  }
}

