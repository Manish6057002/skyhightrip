import { NextRequest } from 'next/server'
import { getCurrentUserFromRequest } from '@/utils/auth-api'
import { prisma } from '@/lib/prisma'

/**
 * Check if the current user is an admin
 * Returns the user if admin, null otherwise
 */
export async function requireAdmin(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  
  if (!user) {
    return null
  }

  // Check if user is admin
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, isAdmin: true },
  })

  if (!userRecord || !userRecord.isAdmin) {
    return null
  }

  return {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    isAdmin: true,
  }
}

