import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/admin-auth'
import { prisma } from '@/lib/prisma'

/**
 * Get statistics for charts (admin only)
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
    const period = searchParams.get('period') || '30' // days

    const days = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get users created over time (grouped by date)
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Get bookings over time
    const [flightBookings, hotelBookings, activityBookings] = await Promise.all([
      prisma.flightBooking.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      prisma.hotelBooking.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      prisma.activityBooking.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ])

    // Group data by date
    const groupByDate = (items: { createdAt: Date }[]) => {
      const grouped: { [key: string]: number } = {}
      items.forEach((item) => {
        const date = new Date(item.createdAt).toISOString().split('T')[0]
        grouped[date] = (grouped[date] || 0) + 1
      })
      return grouped
    }

    const usersByDate = groupByDate(users)
    const flightsByDate = groupByDate(flightBookings)
    const hotelsByDate = groupByDate(hotelBookings)
    const activitiesByDate = groupByDate(activityBookings)

    // Generate all dates in range
    const dates: string[] = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }

    // Build time series data
    const timeSeriesData = dates.map((date) => ({
      date,
      users: usersByDate[date] || 0,
      flights: flightsByDate[date] || 0,
      hotels: hotelsByDate[date] || 0,
      activities: activitiesByDate[date] || 0,
      total: (flightsByDate[date] || 0) + (hotelsByDate[date] || 0) + (activitiesByDate[date] || 0),
    }))

    // Get total counts by type
    const [totalFlights, totalHotels, totalActivities] = await Promise.all([
      prisma.flightBooking.count(),
      prisma.hotelBooking.count(),
      prisma.activityBooking.count(),
    ])

    // Get total users
    const totalUsers = await prisma.user.count()

    // Get bookings by status
    const [confirmedFlights, pendingFlights, cancelledFlights] = await Promise.all([
      prisma.flightBooking.count({ where: { status: 'confirmed' } }),
      prisma.flightBooking.count({ where: { status: 'pending' } }),
      prisma.flightBooking.count({ where: { status: 'cancelled' } }),
    ])

    const [confirmedHotels, pendingHotels, cancelledHotels] = await Promise.all([
      prisma.hotelBooking.count({ where: { status: 'confirmed' } }),
      prisma.hotelBooking.count({ where: { status: 'pending' } }),
      prisma.hotelBooking.count({ where: { status: 'cancelled' } }),
    ])

    const [confirmedActivities, pendingActivities, cancelledActivities] = await Promise.all([
      prisma.activityBooking.count({ where: { status: 'confirmed' } }),
      prisma.activityBooking.count({ where: { status: 'pending' } }),
      prisma.activityBooking.count({ where: { status: 'cancelled' } }),
    ])

    return NextResponse.json(
      {
        timeSeries: timeSeriesData,
        bookingsByType: {
          flights: totalFlights,
          hotels: totalHotels,
          activities: totalActivities,
        },
        bookingsByStatus: {
          flights: {
            confirmed: confirmedFlights,
            pending: pendingFlights,
            cancelled: cancelledFlights,
          },
          hotels: {
            confirmed: confirmedHotels,
            pending: pendingHotels,
            cancelled: cancelledHotels,
          },
          activities: {
            confirmed: confirmedActivities,
            pending: pendingActivities,
            cancelled: cancelledActivities,
          },
        },
        totalUsers,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

