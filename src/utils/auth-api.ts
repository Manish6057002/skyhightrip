import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Get current user from API request (for use in API routes)
 */
export async function getCurrentUserFromRequest(request: NextRequest) {
  try {
    const token = request.cookies.get('session-token')?.value

    if (!token) {
      return null
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
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    }
  } catch (error) {
    console.error('Get current user from request error:', error)
    return null
  }
}

