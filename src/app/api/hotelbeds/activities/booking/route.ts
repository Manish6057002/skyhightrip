import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getCurrentUserFromRequest } from '@/utils/auth-api'
import { prisma } from '@/lib/prisma'

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
 * Book activity (Confirm or Preconfirm)
 * According to Hotelbeds Activities API documentation:
 * https://developer.hotelbeds.com/documentation/activities/booking-api/booking-post-booking/booking-confirm/
 * https://developer.hotelbeds.com/documentation/activities/knowledge-base/booking-flow/
 * 
 * For payment scenarios, use Preconfirm -> Reconfirm (30 min window)
 * For direct booking, use Confirm
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      rateKey,
      paxes, // Array of passenger objects with name, surname, age, type
      holder, // Contact person: { name, surname, email, phone }
      answers = [], // Array of activity question answers: [{ question: { code }, answer }]
      language = 'ENG',
      bookingType = 'confirm', // 'confirm' or 'preconfirm'
      clientReference, // Optional: unique reference for this booking
      dateFrom, // Activity start date (required for v3.0 API)
      dateTo, // Activity end date (required for v3.0 API)
    } = body

    if (!rateKey || !paxes || !holder) {
      return NextResponse.json(
        { error: 'Missing required parameters: rateKey, paxes, holder' },
        { status: 400 }
      )
    }

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Missing required parameters: dateFrom, dateTo' },
        { status: 400 }
      )
    }

    if (!holder.name || !holder.surname) {
      return NextResponse.json(
        { error: 'Holder must have name and surname' },
        { status: 400 }
      )
    }

    const headers = getHotelbedsHeaders()

    // Prepare booking request
    // According to Hotelbeds API v3.0: /activity-api/3.0/bookings (POST)
    // Request structure:
    // {
    //   "holder": {...},
    //   "clientReference": "...",
    //   "language": "en",
    //   "activities": [{
    //     "rateKey": "...",
    //     "paxes": [...]
    //   }]
    // }
    // According to Hotelbeds API documentation:
    // Holder should only have name and surname
    // Language should be 2 characters (e.g., "en" instead of "ENG" or "eng")
    // ClientReference must be max 20 characters
    
    // Convert language to 2-character code
    let languageCode = 'en' // Default to English
    if (language) {
      const lang = language.toLowerCase()
      // Map common language codes to 2-character format
      if (lang.startsWith('en')) languageCode = 'en'
      else if (lang.startsWith('es')) languageCode = 'es'
      else if (lang.startsWith('fr')) languageCode = 'fr'
      else if (lang.startsWith('de')) languageCode = 'de'
      else if (lang.startsWith('it')) languageCode = 'it'
      else if (lang.startsWith('pt')) languageCode = 'pt'
      else if (lang.length === 2) languageCode = lang
      else languageCode = lang.substring(0, 2)
    }
    
    // Generate clientReference (max 20 characters)
    let finalClientReference = clientReference || `BK${Date.now()}`
    if (finalClientReference.length > 20) {
      // Truncate to 20 characters if too long
      finalClientReference = finalClientReference.substring(0, 20)
    }
    
    // According to Hotelbeds Activities Booking API documentation
    // The v3.0 API uses PUT for confirmations
    // Endpoint: PUT https://api.test.hotelbeds.com/activity-api/3.0/bookings
    // The request body should contain the booking details
    const endpoint = 'https://api.test.hotelbeds.com/activity-api/3.0/bookings'
    const method = 'PUT' // Hotelbeds Activities API v3.0 uses PUT for confirmations
    
    // Build booking request according to Hotelbeds API v3.0 format
    // The request structure should match the API documentation exactly
    const bookingRequest: any = {
      holder: {
        name: holder.name,
        surname: holder.surname,
      },
      clientReference: finalClientReference,
      language: languageCode,
      activities: [
        {
          rateKey: rateKey,
          from: dateFrom, // Required: activity start date
          to: dateTo, // Required: activity end date
          paxes: paxes.map((pax: any) => {
            // Convert to Hotelbeds format
            // Paxes need name, surname, and age
            return {
              name: pax.name || '',
              surname: pax.surname || '',
              age: pax.age || (pax.type === 'AD' ? 25 : pax.type === 'CH' ? 8 : 1),
            }
          }),
          // Include activity question answers if provided
          // According to Hotelbeds API: answers array with { question: { code }, answer }
          ...(answers && answers.length > 0 ? { answers: answers } : {}),
        },
      ],
    }
    
    // Note: For preconfirm, we might need to use a different endpoint or add a flag
    // But based on the API response, PUT is required for the v3.0 endpoint
    // Book activity using Hotelbeds Activities Booking API v3.0
    const response = await fetch(endpoint, {
      method: method as any,
      headers,
      body: JSON.stringify(bookingRequest),
    })

    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = `Hotelbeds Activities API error: ${response.status}`
      let errorDetails: any = {}
      
      try {
        const errorData = JSON.parse(responseText)
        errorDetails = errorData
        
        // Extract error message from various possible formats
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const firstError = errorData.errors[0]
          errorMessage = firstError.text || firstError.message || errorMessage
          console.error('Hotelbeds API Error Details:', {
            code: firstError.code,
            text: firstError.text,
            message: firstError.message,
          })
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else {
          errorMessage = responseText
        }
      } catch (e) {
        errorMessage = responseText || errorMessage
      }
      
      // Provide more context in error message
      const fullErrorMessage = `${errorMessage}${errorDetails.operationId ? ` (Operation ID: ${errorDetails.operationId})` : ''}`
      throw new Error(fullErrorMessage)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse response as JSON:', e)
      throw new Error('Invalid response from Hotelbeds Activities API')
    }

    // Save booking to database if user is logged in
    try {
      const user = await getCurrentUserFromRequest(request)
      if (user && data.booking) {
        const booking = data.booking
        const activity = booking.activity || {}
        
        // Extract booking information
        const bookingRef = booking.reference || booking.clientReference || `ACT${Date.now()}`
        const activityName = activity.name || activity.content?.name || 'Activity'
        const location = activity.destination?.name || activity.destinationCode || ''
        const activityDateFrom = activity.from || body.dateFrom || ''
        const activityDateTo = activity.to || body.dateTo || ''
        const totalNet = booking.totalNet || activity.amount?.amount || '0'
        const currency = booking.currency || activity.amount?.currency || 'EUR'
        const status = booking.status?.toLowerCase() || 'confirmed'
        
        // Extract holder information
        const holder = booking.holder || {}
        const contact = {
          name: holder.name || '',
          surname: holder.surname || '',
          email: body.holder?.email || '',
          phone: body.holder?.phone || '',
        }
        
        // Extract passengers information
        const passengers = activity.paxes || []
        
        await prisma.activityBooking.create({
          data: {
            userId: user.id,
            bookingRef: bookingRef,
            status: status,
            activityName: activityName,
            activityCode: activity.code?.toString() || null,
            location: location,
            dateFrom: activityDateFrom,
            dateTo: activityDateTo || null,
            price: totalNet.toString(),
            currency: currency,
            passengers: passengers.length > 0 ? passengers : null,
            contact: contact,
            bookingData: data,
          },
        })
        
      }
    } catch (dbError: any) {
      // Log error but don't fail the booking if database save fails
      console.error('Failed to save activity booking to database:', dbError)
    }

    return NextResponse.json(
      {
        data: data,
        bookingType: bookingType,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error booking activity:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to book activity' },
      { status: 500 }
    )
  }
}

/**
 * Reconfirm a preconfirmed booking
 * According to Hotelbeds Activities API documentation:
 * https://developer.hotelbeds.com/documentation/activities/booking-api/booking-post-booking/booking-confirm/
 * 
 * Must be called within 30 minutes of preconfirm
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      preconfirmId, // ID from preconfirm response
    } = body

    if (!preconfirmId) {
      return NextResponse.json(
        { error: 'Missing required parameter: preconfirmId' },
        { status: 400 }
      )
    }

    const headers = getHotelbedsHeaders()

    // Reconfirm booking
    // According to Hotelbeds API: PUT https://api.test.hotelbeds.com/activity-booking-api/1.0/bookings/es
    const reconfirmRequest = {
      preconfirmId: preconfirmId,
    }

    const response = await fetch(
      `https://api.test.hotelbeds.com/activity-booking-api/1.0/bookings/es`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(reconfirmRequest),
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
    console.error('Error reconfirming booking:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reconfirm booking' },
      { status: 500 }
    )
  }
}

