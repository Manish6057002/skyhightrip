'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Divider } from '@/shared/divider'
import { Badge } from '@/shared/Badge'
import { UsersIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  createdAt: string
  bookingCounts: {
    flights: number
    hotels: number
    activities: number
    total: number
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [page])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/admin/users?page=${page}&limit=20`)
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Users</h1>
        <Divider className="my-6 w-14!" />
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-16 text-center dark:border-neutral-700 dark:bg-neutral-800">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <UsersIcon className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">No users found</h3>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
            <table className="w-full">
              <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">Bookings</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <td className="px-6 py-4 text-sm text-neutral-900 dark:text-white">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {user.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {user.isAdmin ? (
                        <Badge color="red" className="text-xs">Admin</Badge>
                      ) : (
                        <Badge color="zinc" className="text-xs">User</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      <div className="flex flex-col gap-1">
                        <span>Total: {user.bookingCounts.total}</span>
                        <span className="text-xs text-neutral-500">
                          Flights: {user.bookingCounts.flights} · Hotels: {user.bookingCounts.hotels} · Activities: {user.bookingCounts.activities}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

