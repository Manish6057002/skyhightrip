import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getCurrentUserFromRequest } from '@/utils/auth-api'
import { prisma } from '@/lib/prisma'

// Hotelbeds Hotels API authentication helper
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

/**
 * CheckRate - Re-evaluate pricing and availability for RECHECK rates
 * According to Hotelbeds Booking API documentation:
 * https://developer.hotelbeds.com/documentation/hotels/booking-api/workflow/
 */
async function checkRate(rateKey: string, headers: any) {
  try {
    const checkRateRequest = {
      rateKeys: [rateKey],
    }

    const response = await fetch(
      'https://api.test.hotelbeds.com/hotel-api/1.0/checkrates',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(checkRateRequest),
      }
    )

    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = `CheckRate API error: ${response.status}`
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

    const data = JSON.parse(responseText)
    
    // Return the updated rateKey if available, or the original one
    if (data.hotels?.hotels?.[0]?.rooms?.[0]?.rates?.[0]?.rateKey) {
      return data.hotels.hotels[0].rooms[0].rates[0].rateKey
    }
    
    return rateKey
  } catch (error: any) {
    console.error('Error checking rate:', error)
    // If CheckRate fails, return original rateKey and let booking proceed
    return rateKey
  }
}

/**
 * Book hotel room
 * According to Hotelbeds Booking API documentation:
 * https://developer.hotelbeds.com/documentation/hotels/booking-api/api-reference/
 * https://developer.hotelbeds.com/documentation/hotels/booking-api/workflow/
 * 
 * Request structure:
 * {
 *   "holder": { "name": "...", "surname": "..." },
 *   "rooms": [{
 *     "rateKey": "...",
 *     "paxes": [{
 *       "roomId": 1,
 *       "type": "AD",
 *       "name": "...",
 *       "surname": "..."
 *     }]
 *   }],
 *   "clientReference": "...",
 *   "remark": "...",
 *   "tolerance": 2.00
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      rateKey,
      rateType, // 'BOOKABLE' or 'RECHECK'
      rooms, // Array of room objects with rateKey and paxes
      holder, // Contact person: { name, surname, email, phone }
      clientReference, // Optional: unique reference for this booking
      remark, // Optional: booking remarks
      tolerance = 2.00, // Optional: price tolerance (default 2.00)
      language = 'ENG',
    } = body

    // Support both single room booking (rateKey) and multiple rooms (rooms array)
    let roomsToBook: any[] = []
    
    if (rooms && Array.isArray(rooms) && rooms.length > 0) {
      // Multiple rooms booking
      roomsToBook = rooms
    } else if (rateKey) {
      // Single room booking - convert to rooms array format
      if (!body.paxes || !Array.isArray(body.paxes) || body.paxes.length === 0) {
        return NextResponse.json(
          { error: 'Missing required parameter: paxes (array of passenger objects)' },
          { status: 400 }
        )
      }
      roomsToBook = [{
        rateKey: rateKey,
        paxes: body.paxes,
      }]
    } else {
      return NextResponse.json(
        { error: 'Missing required parameter: rateKey or rooms' },
        { status: 400 }
      )
    }

    if (!holder || !holder.name || !holder.surname) {
      return NextResponse.json(
        { error: 'Missing required parameter: holder with name and surname' },
        { status: 400 }
      )
    }

    const headers = getHotelbedsHeaders()

    // If any rate has RECHECK type, we need to call CheckRate first
    let finalRoomsToBook = []
    for (const room of roomsToBook) {
      let finalRateKey = room.rateKey
      
      // Check if this specific rate needs recheck
      // Note: rateType might be at room level or we need to check it from availability response
      if (rateType === 'RECHECK' || room.rateType === 'RECHECK') {
        finalRateKey = await checkRate(room.rateKey, headers)
      }
      
      finalRoomsToBook.push({
        rateKey: finalRateKey,
        paxes: room.paxes.map((pax: any, index: number) => {
          // Convert pax to Hotelbeds format
          // Paxes need: roomId, type (AD/CH/INF), name, surname
          return {
            roomId: room.roomId || 1, // Default to room 1 if not specified
            type: pax.type || (pax.age >= 18 ? 'AD' : pax.age >= 2 ? 'CH' : 'INF'),
            name: pax.name || '',
            surname: pax.surname || '',
            ...(pax.age && pax.type === 'CH' ? { age: pax.age } : {}), // Age only for children
          }
        }),
      })
    }

    // Convert language to 2-character code
    let languageCode = 'en' // Default to English
    if (language) {
      const lang = language.toLowerCase()
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
    let finalClientReference = clientReference || `HTL${Date.now()}`
    if (finalClientReference.length > 20) {
      finalClientReference = finalClientReference.substring(0, 20)
    }

    // Prepare booking request according to Hotelbeds API
    const bookingRequest: any = {
      holder: {
        name: holder.name,
        surname: holder.surname,
      },
      rooms: finalRoomsToBook,
      clientReference: finalClientReference,
      tolerance: tolerance,
    }

    // Add optional fields
    if (remark) {
      bookingRequest.remark = remark
    }

    // Book hotel using Hotelbeds Booking API
    // Endpoint: POST https://api.test.hotelbeds.com/hotel-api/1.0/bookings
    const response = await fetch(
      'https://api.test.hotelbeds.com/hotel-api/1.0/bookings',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(bookingRequest),
      }
    )

    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = `Hotelbeds Booking API error: ${response.status}`
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
      throw new Error('Invalid response from Hotelbeds Booking API')
    }

    // Save booking to database if user is logged in
    try {
      const user = await getCurrentUserFromRequest(request)
      if (user && data.booking) {
        const booking = data.booking
        const hotelData = booking.hotel || {}
        const roomData = hotelData.rooms?.[0] || {}
        const rateData = roomData.rates?.[0] || {}
        
        // Extract booking information
        const bookingRef = booking.reference || booking.clientReference || `HTL${Date.now()}`
        const hotelName = hotelData.name || 'Hotel'
        const location = hotelData.destinationName || `${hotelData.destinationCode || ''}`
        const checkIn = hotelData.checkIn || ''
        const checkOut = hotelData.checkOut || ''
        const totalNet = booking.totalNet || rateData.net || '0'
        const currency = booking.currency || hotelData.currency || 'EUR'
        const status = booking.status?.toLowerCase() || 'confirmed'
        
        // Extract room information
        const roomName = roomData.name || roomData.typeDescription?.content || roomData.code || 'Room'
        
        // Extract holder information
        const holder = booking.holder || {}
        const contact = {
          name: holder.name || '',
          surname: holder.surname || '',
          email: body.holder?.email || '',
          phone: body.holder?.phone || '',
        }
        
        // Extract guests information
        const guests = roomData.paxes || []
        
        await prisma.hotelBooking.create({
          data: {
            userId: user.id,
            bookingRef: bookingRef,
            status: status,
            hotelName: hotelName,
            hotelCode: hotelData.code?.toString() || null,
            location: location,
            checkIn: checkIn,
            checkOut: checkOut,
            roomType: roomName,
            roomCode: roomData.code || null,
            price: totalNet.toString(),
            currency: currency,
            guests: guests.length > 0 ? guests : null,
            contact: contact,
            bookingData: data,
          },
        })
        
      }
    } catch (dbError: any) {
      // Log error but don't fail the booking if database save fails
      console.error('Failed to save booking to database:', dbError)
    }

    return NextResponse.json(
      {
        data: data,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error booking hotel:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to book hotel' },
      { status: 500 }
    )
  }
}

