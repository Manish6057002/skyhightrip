import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session-token')?.value

    if (!token) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      )
    }

    // Find session
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      // Delete expired session
      if (session) {
        await prisma.session.delete({
          where: { id: session.id },
        })
      }

      const response = NextResponse.json(
        { user: null },
        { status: 200 }
      )
      response.cookies.delete('session-token')
      return response
    }

    return NextResponse.json(
      {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          isAdmin: session.user.isAdmin || false,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { user: null },
      { status: 200 }
    )
  }
}

