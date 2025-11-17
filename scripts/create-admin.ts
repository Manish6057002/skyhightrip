/**
 * Script to create an admin user
 * Usage: npx tsx scripts/create-admin.ts <email> <password> [name]
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> <password> [name]')
    process.exit(1)
  }

  const [email, password, name] = args

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Update existing user to admin
      const hashedPassword = await bcrypt.hash(password, 10)
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          isAdmin: true,
          ...(name && { name }),
        },
      })
      console.log('✅ User updated to admin:', updatedUser.email)
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10)
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          isAdmin: true,
          name: name || null,
        },
      })
      console.log('✅ Admin user created:', newUser.email)
    }
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

