import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/admin-auth'
import { prisma } from '@/lib/prisma'

/**
 * Get all users (admin only)
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Fetch users with booking counts
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          createdAt: true,
          _count: {
            select: {
              flightBookings: true,
              hotelBookings: true,
              activityBookings: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
    ])

    // Format users for frontend
    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
      bookingCounts: {
        flights: user._count.flightBookings,
        hotels: user._count.hotelBookings,
        activities: user._count.activityBookings,
        total: user._count.flightBookings + user._count.hotelBookings + user._count.activityBookings,
      },
    }))

    return NextResponse.json(
      {
        users: formattedUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

