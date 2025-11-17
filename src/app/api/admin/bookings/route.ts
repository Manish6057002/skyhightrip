import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/admin-auth'
import { prisma } from '@/lib/prisma'

/**
 * Get all bookings (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') // 'flight', 'hotel', 'activity', or null for all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const allBookings: any[] = []
    let totalCount = 0

    // Fetch flight bookings
    if (!type || type === 'flight') {
      const [flightBookings, flightCount] = await Promise.all([
        prisma.flightBooking.findMany({
          skip: type === 'flight' ? skip : 0,
          take: type === 'flight' ? limit : undefined,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        type === 'flight' ? prisma.flightBooking.count() : Promise.resolve(0),
      ])

      flightBookings.forEach((booking: any) => {
        allBookings.push({
          id: booking.id,
          type: 'flight',
          bookingRef: booking.bookingRef,
          status: booking.status,
          title: `${booking.departure} → ${booking.arrival}`,
          location: `${booking.departure} → ${booking.arrival}`,
          date: booking.departureDate,
          dateTo: booking.arrivalDate || undefined,
          price: booking.price,
          currency: booking.currency || undefined,
          airline: booking.airline || undefined,
          user: {
            id: booking.user.id,
            email: booking.user.email,
            name: booking.user.name,
          },
          createdAt: booking.createdAt.toISOString(),
        })
      })

      if (type === 'flight') {
        totalCount = flightCount
      }
    }

    // Fetch hotel bookings
    if (!type || type === 'hotel') {
      const [hotelBookings, hotelCount] = await Promise.all([
        prisma.hotelBooking.findMany({
          skip: type === 'hotel' ? skip : 0,
          take: type === 'hotel' ? limit : undefined,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        type === 'hotel' ? prisma.hotelBooking.count() : Promise.resolve(0),
      ])

      hotelBookings.forEach((booking: any) => {
        allBookings.push({
          id: booking.id,
          type: 'hotel',
          bookingRef: booking.bookingRef,
          status: booking.status,
          title: booking.hotelName,
          location: booking.location || undefined,
          date: booking.checkIn,
          dateTo: booking.checkOut,
          price: booking.price,
          currency: booking.currency || undefined,
          roomType: booking.roomType || undefined,
          user: {
            id: booking.user.id,
            email: booking.user.email,
            name: booking.user.name,
          },
          createdAt: booking.createdAt.toISOString(),
        })
      })

      if (type === 'hotel') {
        totalCount = hotelCount
      }
    }

    // Fetch activity bookings
    if (!type || type === 'activity') {
      const [activityBookings, activityCount] = await Promise.all([
        prisma.activityBooking.findMany({
          skip: type === 'activity' ? skip : 0,
          take: type === 'activity' ? limit : undefined,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        type === 'activity' ? prisma.activityBooking.count() : Promise.resolve(0),
      ])

      activityBookings.forEach((booking: any) => {
        allBookings.push({
          id: booking.id,
          type: 'activity',
          bookingRef: booking.bookingRef,
          status: booking.status,
          title: booking.activityName,
          location: booking.location || undefined,
          date: booking.dateFrom,
          dateTo: booking.dateTo || undefined,
          price: booking.price,
          currency: booking.currency || undefined,
          user: {
            id: booking.user.id,
            email: booking.user.email,
            name: booking.user.name,
          },
          createdAt: booking.createdAt.toISOString(),
        })
      })

      if (type === 'activity') {
        totalCount = activityCount
      }
    }

    // Sort all bookings by creation date (newest first)
    allBookings.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Apply pagination if fetching all types
    const paginatedBookings = !type
      ? allBookings.slice(skip, skip + limit)
      : allBookings

    if (!type) {
      totalCount = allBookings.length
    }

    return NextResponse.json(
      {
        bookings: paginatedBookings,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
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

