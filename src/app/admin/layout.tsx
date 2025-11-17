'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AuthModal from '@/components/Header/AuthModal'
import Avatar from '@/shared/Avatar'
import SwitchDarkMode from '@/shared/SwitchDarkMode'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Logout01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { 
  HomeIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() // Must be called before any conditional returns
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        
        if (!data.user) {
          setShowLoginModal(true)
          setLoading(false)
          return
        }

        // Check if user is admin
        const adminResponse = await fetch('/api/admin/check')
        if (!adminResponse.ok) {
          router.push('/')
          return
        }

        setUser(data.user)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setShowLoginModal(true)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-white">
              Admin Access Required
            </h2>
            <p className="mb-6 text-neutral-600 dark:text-neutral-400">
              Please log in with an admin account to access this page.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="rounded-lg bg-primary-600 px-6 py-3 text-white hover:bg-primary-700"
            >
              Login
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showLoginModal}
          onClose={async () => {
            // After modal closes, check if user is now logged in
            const response = await fetch('/api/auth/me')
            const data = await response.json()
            if (data.user) {
              const adminResponse = await fetch('/api/admin/check')
              if (adminResponse.ok) {
                setUser(data.user)
                setShowLoginModal(false)
                return
              }
            }
            setShowLoginModal(false)
            router.push('/')
          }}
          initialMode="login"
          redirectTo="/admin"
        />
      </>
    )
  }

  // Helper function to get user initials
  const getUserInitials = (user: any): string | null => {
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

  const initials = getUserInitials(user)

  return (
    <div className="flex h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Admin Dashboard Header */}
      <div className="shrink-0 border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex w-full items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          
          {/* Right side: Dark Mode Toggle and User Profile */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <SwitchDarkMode className="h-10 w-10" />
            
            {/* User Profile Dropdown */}
            {user && (
              <Popover className="relative">
              <PopoverButton className="-m-1.5 flex cursor-pointer items-center justify-center rounded-full p-1.5 hover:bg-neutral-100 focus-visible:outline-hidden dark:hover:bg-neutral-800">
                {initials ? (
                  <Avatar initials={initials} className="size-8" />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
                    <HugeiconsIcon icon={UserIcon} size={20} className="text-neutral-600 dark:text-neutral-300" />
                  </div>
                )}
              </PopoverButton>

              <PopoverPanel
                transition
                anchor={{
                  to: 'bottom end',
                  gap: 8,
                }}
                className="z-40 w-64 rounded-2xl bg-white shadow-lg ring-1 ring-black/5 transition duration-200 ease-in-out data-closed:translate-y-1 data-closed:opacity-0 dark:bg-neutral-800"
              >
                <div className="px-4 py-3">
                  {/* User Info */}
                  <div className="mb-3 border-b border-neutral-200 pb-3 dark:border-neutral-700">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {user.name || 'Admin User'}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {user.email}
                    </p>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    <HugeiconsIcon icon={Logout01Icon} size={20} strokeWidth={1.5} />
                    <span>Log out</span>
                  </button>
                </div>
              </PopoverPanel>
            </Popover>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="h-full w-64 shrink-0 border-r border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <nav className="h-full p-4 space-y-2">
            <Link
              href="/admin"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                pathname === '/admin'
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                pathname === '/admin/users'
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              <UsersIcon className="h-5 w-5" />
              Users
            </Link>
            <Link
              href="/admin/bookings"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                pathname === '/admin/bookings'
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              <ClipboardDocumentListIcon className="h-5 w-5" />
              Bookings
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

