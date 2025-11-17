'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Divider } from '@/shared/divider'
import { 
  UsersIcon, 
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import { 
  AirplaneTakeOff01Icon,
  House04Icon,
  HotAirBalloonIcon 
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, allBookingsRes, flightBookingsRes, hotelBookingsRes, activityBookingsRes, chartRes] = await Promise.all([
          fetch('/api/admin/users?limit=1'),
          fetch('/api/admin/bookings?limit=1'),
          fetch('/api/admin/bookings?type=flight&limit=1'),
          fetch('/api/admin/bookings?type=hotel&limit=1'),
          fetch('/api/admin/bookings?type=activity&limit=1'),
          fetch(`/api/admin/stats?period=${period}`),
        ])

        if (!usersRes.ok || !allBookingsRes.ok) {
          if (usersRes.status === 403 || allBookingsRes.status === 403) {
            router.push('/')
            return
          }
          router.push('/login')
          return
        }

        const usersData = await usersRes.json()
        const allBookingsData = await allBookingsRes.json()
        const flightBookingsData = await flightBookingsRes.json()
        const hotelBookingsData = await hotelBookingsRes.json()
        const activityBookingsData = await activityBookingsRes.json()
        const chartDataResponse = await chartRes.json()

        setStats({
          totalUsers: usersData.total,
          totalBookings: allBookingsData.total,
          flightBookings: flightBookingsData.total,
          hotelBookings: hotelBookingsData.total,
          activityBookings: activityBookingsData.total,
        })

        setChartData(chartDataResponse)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [router, period])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Colors for charts
  const COLORS = {
    flights: '#9333ea', // purple
    hotels: '#ea580c', // orange
    activities: '#ec4899', // pink
    confirmed: '#22c55e', // green
    pending: '#eab308', // yellow
    cancelled: '#ef4444', // red
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">Loading dashboard...</div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <Divider className="my-6 w-14!" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
              <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Users</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                {stats.totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
              <ClipboardDocumentListIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Bookings</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                {stats.totalBookings}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/20">
              <HugeiconsIcon icon={AirplaneTakeOff01Icon} size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Flight Bookings</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                {stats.flightBookings}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
              <HugeiconsIcon icon={House04Icon} size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Hotel Bookings</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                {stats.hotelBookings}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 dark:bg-pink-900/20">
              <HugeiconsIcon icon={HotAirBalloonIcon} size={24} className="text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Activity Bookings</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
                {stats.activityBookings}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {chartData && (
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Analytics</h2>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          {/* Charts Grid - Two Columns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Bookings Over Time Chart */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
              <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
                Bookings Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => formatDate(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="flights"
                    stroke={COLORS.flights}
                    strokeWidth={2}
                    name="Flights"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hotels"
                    stroke={COLORS.hotels}
                    strokeWidth={2}
                    name="Hotels"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activities"
                    stroke={COLORS.activities}
                    strokeWidth={2}
                    name="Activities"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* User Growth Chart */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
              <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
                User Growth Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => formatDate(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="New Users"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bookings by Type Pie Chart */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
              <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
                Bookings by Type
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Flights', value: chartData.bookingsByType.flights },
                      { name: 'Hotels', value: chartData.bookingsByType.hotels },
                      { name: 'Activities', value: chartData.bookingsByType.activities },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={COLORS.flights} />
                    <Cell fill={COLORS.hotels} />
                    <Cell fill={COLORS.activities} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bookings by Status Bar Chart */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
              <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
                Bookings by Status
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'Flights',
                      Confirmed: chartData.bookingsByStatus.flights.confirmed,
                      Pending: chartData.bookingsByStatus.flights.pending,
                      Cancelled: chartData.bookingsByStatus.flights.cancelled,
                    },
                    {
                      name: 'Hotels',
                      Confirmed: chartData.bookingsByStatus.hotels.confirmed,
                      Pending: chartData.bookingsByStatus.hotels.pending,
                      Cancelled: chartData.bookingsByStatus.hotels.cancelled,
                    },
                    {
                      name: 'Activities',
                      Confirmed: chartData.bookingsByStatus.activities.confirmed,
                      Pending: chartData.bookingsByStatus.activities.pending,
                      Cancelled: chartData.bookingsByStatus.activities.cancelled,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Confirmed" fill={COLORS.confirmed} />
                  <Bar dataKey="Pending" fill={COLORS.pending} />
                  <Bar dataKey="Cancelled" fill={COLORS.cancelled} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

