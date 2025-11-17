import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/utils/admin-auth'

/**
 * Check if current user is admin
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { isAdmin: false },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { isAdmin: true, user: admin },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error checking admin status:', error)
    return NextResponse.json(
      { isAdmin: false },
      { status: 500 }
    )
  }
}

