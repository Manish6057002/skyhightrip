'use client'

import Avatar from '@/shared/Avatar'
import { Divider } from '@/shared/divider'
import { Link } from '@/shared/link'
import SwitchDarkMode2 from '@/shared/SwitchDarkMode2'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import {
  BulbChargingIcon,
  Idea01Icon,
  Logout01Icon,
  Task01Icon,
  UserIcon,
  SettingsIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Props {
  className?: string
  user?: {
    id: string
    email: string
    name?: string | null
    isAdmin?: boolean
  } | null
}

// Helper function to get user initials
function getUserInitials(user: Props['user']): string | null {
  if (!user) return null
  
  if (user.name) {
    const parts = user.name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }
  
  if (user.email) {
    return user.email[0].toUpperCase()
  }
  
  return null
}

export default function AvatarDropdown({ className, user: userProp }: Props) {
  const router = useRouter()
  const [user, setUser] = useState<Props['user']>(() => {
    // Validate initial user prop
    if (userProp && typeof userProp === 'object' && userProp.email) {
      return userProp
    }
    return null
  })
  
  // Sync user state when userProp changes
  useEffect(() => {
    if (userProp && typeof userProp === 'object' && userProp.email) {
      setUser(userProp)
    } else {
      setUser(null)
    }
  }, [userProp])
  
  // Fetch user if not provided
  useEffect(() => {
    if (!userProp && !user) {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user && data.user.email && typeof data.user.email === 'string') {
            setUser(data.user)
          }
        })
        .catch((error) => {
          console.error('Error fetching user:', error)
        })
    }
  }, [userProp, user])
  
  // Don't render if no user or invalid user object
  if (!user || typeof user !== 'object' || !user.email || typeof user.email !== 'string') {
    return null
  }
  
  // Ensure user object has required properties with proper defaults
  const safeUser = {
    id: typeof user.id === 'string' ? user.id : '',
    email: typeof user.email === 'string' ? user.email : '',
    name: user.name && typeof user.name === 'string' ? user.name : null,
    isAdmin: Boolean(user.isAdmin),
  }
  
  const initials = getUserInitials(safeUser)

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  // Render avatar with initials or user icon
  const renderAvatar = (size: string) => {
    if (initials) {
      return <Avatar initials={initials} className={size} />
    }
    // Fallback to user icon if no initials
    return (
      <div className={`${size} flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700`}>
        <HugeiconsIcon icon={UserIcon} size={size === 'size-8' ? 20 : 28} className="text-neutral-600 dark:text-neutral-300" />
      </div>
    )
  }

  return (
    <div className={className}>
      <Popover>
        <PopoverButton className="-m-1.5 flex cursor-pointer items-center justify-center rounded-full p-1.5 hover:bg-neutral-100 focus-visible:outline-hidden dark:hover:bg-neutral-800">
          {renderAvatar('size-8')}
        </PopoverButton>

        <PopoverPanel
          transition
          anchor={{
            to: 'bottom end',
            gap: 16,
          }}
          className="z-40 w-80 rounded-3xl shadow-lg ring-1 ring-black/5 transition duration-200 ease-in-out data-closed:translate-y-1 data-closed:opacity-0"
        >
          <div className="relative grid grid-cols-1 gap-6 bg-white px-6 py-7 dark:bg-neutral-800">
            <div className="flex items-center space-x-3">
              {renderAvatar('size-12')}

              <div className="grow">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{safeUser.name || safeUser.email || 'User'}</h4>
                  {safeUser.isAdmin && (
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      Admin
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs">{safeUser.email}</p>
              </div>
            </div>

            <Divider />

            {/* Admin Links - Only show for admins */}
            {safeUser.isAdmin && (
              <>
                <Link
                  href={'/admin'}
                  className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
                >
                  <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                    <HugeiconsIcon icon={SettingsIcon} size={24} strokeWidth={1.5} />
                  </div>
                  <p className="ms-4 text-sm font-medium">Admin Dashboard</p>
                </Link>
                <Link
                  href={'/admin/users'}
                  className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
                >
                  <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                    <HugeiconsIcon icon={UserIcon} size={24} strokeWidth={1.5} />
                  </div>
                  <p className="ms-4 text-sm font-medium">Users</p>
                </Link>
                <Link
                  href={'/admin/bookings'}
                  className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
                >
                  <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                    <HugeiconsIcon icon={Task01Icon} size={24} strokeWidth={1.5} />
                  </div>
                  <p className="ms-4 text-sm font-medium">Bookings</p>
                </Link>
                <Divider />
              </>
            )}

            {/* ------------------ 1 --------------------- */}
            <Link
              href={'/account'}
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={UserIcon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium">{'My Account'}</p>
            </Link>

            {/* ------------------ 2 --------------------- */}
            <Link
              href={'/account-bookings'}
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={Task01Icon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium">My Bookings</p>
            </Link>

            <Divider />

            {/* ------------------ 2 --------------------- */}
            <div className="focus-visible:ring-opacity-50 -m-3 flex items-center justify-between rounded-lg p-2 hover:bg-neutral-100 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 dark:hover:bg-neutral-700">
              <div className="flex items-center">
                <div className="flex flex-shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                  <HugeiconsIcon icon={Idea01Icon} size={24} strokeWidth={1.5} />
                </div>
                <p className="ms-4 text-sm font-medium">Dark theme</p>
              </div>
              <SwitchDarkMode2 />
            </div>

            {/* ------------------ 2 --------------------- */}

            <Link
              href={'#'}
              className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={BulbChargingIcon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium">{'Help'}</p>
            </Link>

            {/* ------------------ 2 --------------------- */}
            <button
              onClick={handleLogout}
              className="-m-3 flex w-full items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-neutral-100 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-orange-500/50 dark:hover:bg-neutral-700"
            >
              <div className="flex shrink-0 items-center justify-center text-neutral-500 dark:text-neutral-300">
                <HugeiconsIcon icon={Logout01Icon} size={24} strokeWidth={1.5} />
              </div>
              <p className="ms-4 text-sm font-medium">{'Log out'}</p>
            </button>
          </div>
        </PopoverPanel>
      </Popover>
    </div>
  )
}
