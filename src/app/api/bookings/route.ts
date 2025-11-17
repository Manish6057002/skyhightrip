import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest } from '@/utils/auth-api'
import { prisma } from '@/lib/prisma'

/**
 * Get bookings for the current logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // 'flight', 'hotel', 'activity', or null for all

    const formattedBookings: any[] = []

    // Fetch flight bookings
    if (!type || type === 'flight') {
      const flightBookings = await prisma.flightBooking.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })

      flightBookings.forEach((booking: any) => {
        formattedBookings.push({
          id: booking.id,
          type: 'flight',
          title: `${booking.departure} → ${booking.arrival}`,
          location: `${booking.departure} → ${booking.arrival}`,
          date: booking.departureDate,
          dateTo: booking.arrivalDate || undefined,
          status: booking.status,
          price: booking.price,
          currency: booking.currency || undefined,
          bookingId: booking.bookingRef,
          createdAt: booking.createdAt.toISOString(),
          // Full details
          departure: booking.departure,
          arrival: booking.arrival,
          airline: booking.airline,
          passenger: booking.passenger,
          contact: booking.contact,
          bookingData: booking.bookingData,
        })
      })
    }

    // Fetch hotel bookings
    if (!type || type === 'hotel') {
      const hotelBookings = await prisma.hotelBooking.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })

      hotelBookings.forEach((booking: any) => {
        formattedBookings.push({
          id: booking.id,
          type: 'hotel',
          title: booking.hotelName,
          location: booking.location || undefined,
          date: booking.checkIn,
          dateTo: booking.checkOut,
          status: booking.status,
          price: booking.price,
          currency: booking.currency || undefined,
          bookingId: booking.bookingRef,
          createdAt: booking.createdAt.toISOString(),
          // Full details
          hotelName: booking.hotelName,
          hotelCode: booking.hotelCode,
          roomType: booking.roomType,
          roomCode: booking.roomCode,
          guests: booking.guests,
          contact: booking.contact,
          bookingData: booking.bookingData,
        })
      })
    }

    // Fetch activity bookings
    if (!type || type === 'activity') {
      const activityBookings = await prisma.activityBooking.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })

      activityBookings.forEach((booking: any) => {
        formattedBookings.push({
          id: booking.id,
          type: 'activity',
          title: booking.activityName,
          location: booking.location || undefined,
          date: booking.dateFrom,
          dateTo: booking.dateTo || undefined,
          status: booking.status,
          price: booking.price,
          currency: booking.currency || undefined,
          bookingId: booking.bookingRef,
          createdAt: booking.createdAt.toISOString(),
          // Full details
          activityName: booking.activityName,
          activityCode: booking.activityCode,
          passengers: booking.passengers,
          contact: booking.contact,
          bookingData: booking.bookingData,
        })
      })
    }

    // Sort all bookings by creation date (newest first)
    formattedBookings.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json(
      {
        bookings: formattedBookings,
        total: formattedBookings.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

