'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Divider } from '@/shared/divider'
import { Badge } from '@/shared/Badge'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { 
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import { 
  AirplaneTakeOff01Icon,
  House04Icon,
  HotAirBalloonIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

interface Booking {
  id: string
  type: 'flight' | 'hotel' | 'activity'
  bookingRef: string
  status: string
  title: string
  location?: string
  date: string
  dateTo?: string
  price: string
  currency?: string
  user: {
    id: string
    email: string
    name: string | null
  }
  createdAt: string
  airline?: string
  roomType?: string
}

export default function AdminBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'all' | 'flight' | 'hotel' | 'activity'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchBookings()
  }, [selectedTab, page])

  const fetchBookings = async () => {
    try {
      const type = selectedTab === 'all' ? null : selectedTab
      const response = await fetch(`/api/admin/bookings?${type ? `type=${type}&` : ''}page=${page}&limit=20`)
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data.bookings || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'green'
      case 'pending':
        return 'yellow'
      case 'cancelled':
        return 'red'
      default:
        return 'zinc'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return AirplaneTakeOff01Icon
      case 'hotel':
        return House04Icon
      case 'activity':
        return HotAirBalloonIcon
      default:
        // For default, we need to use a Hugeicons icon or handle it differently
        // Since ClipboardDocumentListIcon is from Heroicons, we'll use HotAirBalloonIcon as fallback
        return HotAirBalloonIcon
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">Loading bookings...</div>
      </div>
    )
  }

  const renderBookingsTable = () => {
    if (bookings.length === 0) {
      return (
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-16 text-center dark:border-neutral-700 dark:bg-neutral-800">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <ClipboardDocumentListIcon className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">No bookings found</h3>
        </div>
      )
    }

    return (
      <>
        <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">Booking</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">Price</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 dark:text-white">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={getTypeIcon(booking.type)} size={20} className="text-neutral-500" />
                    <span className="text-sm font-medium capitalize text-neutral-900 dark:text-white">
                      {booking.type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{booking.title}</span>
                    {booking.location && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{booking.location}</span>
                    )}
                    {booking.airline && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">Airline: {booking.airline}</span>
                    )}
                    {booking.roomType && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">Room: {booking.roomType}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-900 dark:text-white">{booking.user.email}</span>
                    {booking.user.name && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{booking.user.name}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                  {booking.type === 'hotel' && booking.dateTo
                    ? `${new Date(booking.date).toLocaleDateString()} - ${new Date(booking.dateTo).toLocaleDateString()}`
                    : new Date(booking.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-neutral-900 dark:text-white">
                  {booking.currency && booking.currency !== 'undefined' ? `${booking.currency} ` : ''}
                  {parseFloat(booking.price || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                  <Badge color={getStatusColor(booking.status)} className="text-xs capitalize">
                    {booking.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                  {booking.bookingRef}
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
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Bookings</h1>
        <Divider className="my-6 w-14!" />
      </div>

      {/* Tabs */}
      <TabGroup
        selectedIndex={selectedTab === 'all' ? 0 : selectedTab === 'flight' ? 1 : selectedTab === 'hotel' ? 2 : 3}
        onChange={(index) => {
          const tabs: ('all' | 'flight' | 'hotel' | 'activity')[] = ['all', 'flight', 'hotel', 'activity']
          setSelectedTab(tabs[index])
          setPage(1)
        }}
      >
        <TabList className="flex gap-2 border-b border-neutral-200 dark:border-neutral-700">
          <Tab className="px-4 py-2 text-sm font-medium data-selected:border-b-2 data-selected:border-primary-600 data-selected:text-primary-600 dark:data-selected:text-primary-400">
            All Bookings
          </Tab>
          <Tab className="px-4 py-2 text-sm font-medium data-selected:border-b-2 data-selected:border-primary-600 data-selected:text-primary-600 dark:data-selected:text-primary-400">
            Flights
          </Tab>
          <Tab className="px-4 py-2 text-sm font-medium data-selected:border-b-2 data-selected:border-primary-600 data-selected:text-primary-600 dark:data-selected:text-primary-400">
            Hotels
          </Tab>
          <Tab className="px-4 py-2 text-sm font-medium data-selected:border-b-2 data-selected:border-primary-600 data-selected:text-primary-600 dark:data-selected:text-primary-400">
            Activities
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {renderBookingsTable()}
          </TabPanel>
          <TabPanel>
            {renderBookingsTable()}
          </TabPanel>
          <TabPanel>
            {renderBookingsTable()}
          </TabPanel>
          <TabPanel>
            {renderBookingsTable()}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}

