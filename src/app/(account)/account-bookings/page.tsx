'use client'

import { Divider } from '@/shared/divider'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Airplane02Icon, House04Icon, HotAirBalloonIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '@/shared/Badge'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { DescriptionList, DescriptionTerm, DescriptionDetails } from '@/shared/description-list'
import ButtonClose from '@/shared/ButtonClose'

interface Booking {
  id: string
  type: 'flight' | 'hotel' | 'activity'
  title: string
  location?: string
  date: string
  dateTo?: string
  status: 'confirmed' | 'pending' | 'cancelled'
  price: string
  currency?: string
  bookingId: string
  createdAt: string
  // Flight specific
  departure?: string
  arrival?: string
  airline?: string
  passenger?: any
  // Hotel specific
  hotelName?: string
  hotelCode?: string
  roomType?: string
  roomCode?: string
  guests?: any
  // Activity specific
  activityName?: string
  activityCode?: string
  passengers?: any
  // Common
  contact?: any
  bookingData?: any
}

const tabs = [
  { name: 'Flights', icon: Airplane02Icon, type: 'flight' as const },
  { name: 'Hotels', icon: House04Icon, type: 'hotel' as const },
  { name: 'Activities', icon: HotAirBalloonIcon, type: 'activity' as const },
]

const Page = () => {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Fetch bookings from API
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/bookings')
        if (!response.ok) {
          if (response.status === 401) {
            // User not logged in, redirect to login
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch bookings')
        }
        const data = await response.json()
        setBookings(data.bookings || [])
      } catch (error) {
        console.error('Error fetching bookings:', error)
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [router])

  const flightBookings = bookings.filter((b) => b.type === 'flight')
  const hotelBookings = bookings.filter((b) => b.type === 'hotel')
  const activityBookings = bookings.filter((b) => b.type === 'activity')

  const renderBookingCard = (booking: Booking) => {
    const getIcon = () => {
      switch (booking.type) {
        case 'flight':
          return Airplane02Icon
        case 'hotel':
          return House04Icon
        case 'activity':
          return HotAirBalloonIcon
      }
    }

    const getStatusColor = () => {
      switch (booking.status) {
        case 'confirmed':
          return 'green'
        case 'pending':
          return 'yellow'
        case 'cancelled':
          return 'red'
      }
    }

    return (
      <div
        key={booking.id}
        onClick={() => {
          setSelectedBooking(booking)
          setIsModalOpen(true)
        }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-neutral-100 bg-white p-6 transition-shadow hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
              <HugeiconsIcon icon={getIcon()} size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{booking.title}</h3>
                <Badge color={getStatusColor()} className="text-xs capitalize">
                  {booking.status}
                </Badge>
              </div>
              {booking.location && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{booking.location}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-300">
                {booking.date && (
                  <span>
                    {booking.type === 'hotel' && booking.dateTo
                      ? `${new Date(booking.date).toLocaleDateString()} - ${new Date(booking.dateTo).toLocaleDateString()}`
                      : new Date(booking.date).toLocaleDateString()}
                  </span>
                )}
                <span>Booking ID: {booking.bookingId}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold text-neutral-900 dark:text-white">
              {booking.currency && booking.currency !== 'undefined' ? `${booking.currency} ` : ''}
              {parseFloat(booking.price || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderBookingsList = (bookings: Booking[]) => {
    if (bookings.length > 0) {
      return (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => renderBookingCard(booking))}
        </div>
      )
    }
    return null
  }

  const renderBookingDetailsModal = () => {
    if (!selectedBooking) return null

    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A'
      try {
        return new Date(dateString).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch {
        return dateString
      }
    }

    const formatDateOnly = (dateString: string) => {
      if (!dateString) return 'N/A'
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      } catch {
        return dateString
      }
    }

    return (
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-neutral-900/50 duration-300 ease-out data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto transform overflow-hidden rounded-2xl bg-white shadow-xl transition duration-200 ease-in-out data-closed:scale-95 data-closed:opacity-0 dark:bg-neutral-800"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800">
              <DialogTitle as="h3" className="text-xl font-semibold text-neutral-900 dark:text-white">
                Booking Details
              </DialogTitle>
              <ButtonClose onClick={() => setIsModalOpen(false)} />
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Booking Overview */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">{selectedBooking.title}</h4>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      Booking Reference: <span className="font-mono">{selectedBooking.bookingId}</span>
                    </p>
                  </div>
                  <Badge color={selectedBooking.status === 'confirmed' ? 'green' : selectedBooking.status === 'pending' ? 'yellow' : 'red'} className="text-xs capitalize">
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>

              {/* Booking Details by Type */}
              <DescriptionList>
                {selectedBooking.type === 'flight' && (
                  <>
                    <DescriptionTerm>Departure</DescriptionTerm>
                    <DescriptionDetails>{selectedBooking.departure || 'N/A'}</DescriptionDetails>
                    <DescriptionTerm>Arrival</DescriptionTerm>
                    <DescriptionDetails>{selectedBooking.arrival || 'N/A'}</DescriptionDetails>
                    <DescriptionTerm>Departure Date</DescriptionTerm>
                    <DescriptionDetails>{formatDate(selectedBooking.date)}</DescriptionDetails>
                    {selectedBooking.dateTo && (
                      <>
                        <DescriptionTerm>Arrival Date</DescriptionTerm>
                        <DescriptionDetails>{formatDate(selectedBooking.dateTo)}</DescriptionDetails>
                      </>
                    )}
                    {selectedBooking.airline && (
                      <>
                        <DescriptionTerm>Airline</DescriptionTerm>
                        <DescriptionDetails>{selectedBooking.airline}</DescriptionDetails>
                      </>
                    )}
                    {selectedBooking.passenger && (
                      <>
                        <DescriptionTerm>Passenger</DescriptionTerm>
                        <DescriptionDetails>
                          {typeof selectedBooking.passenger === 'object' 
                            ? `${selectedBooking.passenger.name || ''} ${selectedBooking.passenger.surname || ''}`.trim() || JSON.stringify(selectedBooking.passenger)
                            : selectedBooking.passenger}
                        </DescriptionDetails>
                      </>
                    )}
                  </>
                )}

                {selectedBooking.type === 'hotel' && (
                  <>
                    <DescriptionTerm>Hotel Name</DescriptionTerm>
                    <DescriptionDetails>{selectedBooking.hotelName || selectedBooking.title}</DescriptionDetails>
                    {selectedBooking.hotelCode && (
                      <>
                        <DescriptionTerm>Hotel Code</DescriptionTerm>
                        <DescriptionDetails>{selectedBooking.hotelCode}</DescriptionDetails>
                      </>
                    )}
                    {selectedBooking.location && (
                      <>
                        <DescriptionTerm>Location</DescriptionTerm>
                        <DescriptionDetails>{selectedBooking.location}</DescriptionDetails>
                      </>
                    )}
                    <DescriptionTerm>Check-in</DescriptionTerm>
                    <DescriptionDetails>{formatDateOnly(selectedBooking.date)}</DescriptionDetails>
                    {selectedBooking.dateTo && (
                      <>
                        <DescriptionTerm>Check-out</DescriptionTerm>
                        <DescriptionDetails>{formatDateOnly(selectedBooking.dateTo)}</DescriptionDetails>
                      </>
                    )}
                    {selectedBooking.roomType && (
                      <>
                        <DescriptionTerm>Room Type</DescriptionTerm>
                        <DescriptionDetails>{selectedBooking.roomType}</DescriptionDetails>
                      </>
                    )}
                    {selectedBooking.guests && (
                      <>
                        <DescriptionTerm>Guests</DescriptionTerm>
                        <DescriptionDetails>
                          {Array.isArray(selectedBooking.guests) 
                            ? selectedBooking.guests.map((guest: any, idx: number) => 
                                `${guest.name || ''} ${guest.surname || ''}`.trim() || `Guest ${idx + 1}`
                              ).join(', ') || JSON.stringify(selectedBooking.guests)
                            : typeof selectedBooking.guests === 'object'
                            ? JSON.stringify(selectedBooking.guests)
                            : selectedBooking.guests}
                        </DescriptionDetails>
                      </>
                    )}
                  </>
                )}

                {selectedBooking.type === 'activity' && (
                  <>
                    <DescriptionTerm>Activity Name</DescriptionTerm>
                    <DescriptionDetails>{selectedBooking.activityName || selectedBooking.title}</DescriptionDetails>
                    {selectedBooking.activityCode && (
                      <>
                        <DescriptionTerm>Activity Code</DescriptionTerm>
                        <DescriptionDetails>{selectedBooking.activityCode}</DescriptionDetails>
                      </>
                    )}
                    {selectedBooking.location && (
                      <>
                        <DescriptionTerm>Location</DescriptionTerm>
                        <DescriptionDetails>{selectedBooking.location}</DescriptionDetails>
                      </>
                    )}
                    <DescriptionTerm>Start Date</DescriptionTerm>
                    <DescriptionDetails>{formatDate(selectedBooking.date)}</DescriptionDetails>
                    {selectedBooking.dateTo && (
                      <>
                        <DescriptionTerm>End Date</DescriptionTerm>
                        <DescriptionDetails>{formatDate(selectedBooking.dateTo)}</DescriptionDetails>
                      </>
                    )}
                    {selectedBooking.passengers && (
                      <>
                        <DescriptionTerm>Passengers</DescriptionTerm>
                        <DescriptionDetails>
                          {Array.isArray(selectedBooking.passengers) 
                            ? selectedBooking.passengers.map((passenger: any, idx: number) => 
                                `${passenger.name || ''} ${passenger.surname || ''}`.trim() || `Passenger ${idx + 1}`
                              ).join(', ') || JSON.stringify(selectedBooking.passengers)
                            : typeof selectedBooking.passengers === 'object'
                            ? JSON.stringify(selectedBooking.passengers)
                            : selectedBooking.passengers}
                        </DescriptionDetails>
                      </>
                    )}
                  </>
                )}

                {/* Common Details */}
                <DescriptionTerm>Total Amount</DescriptionTerm>
                <DescriptionDetails>
                  {selectedBooking.currency && selectedBooking.currency !== 'undefined' ? `${selectedBooking.currency} ` : ''}
                  {parseFloat(selectedBooking.price || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </DescriptionDetails>
                <DescriptionTerm>Booking Date</DescriptionTerm>
                <DescriptionDetails>{formatDate(selectedBooking.createdAt)}</DescriptionDetails>

                {/* Contact Information */}
                {selectedBooking.contact && (
                  <>
                    <DescriptionTerm>Contact Information</DescriptionTerm>
                    <DescriptionDetails>
                      {typeof selectedBooking.contact === 'object' ? (
                        <div className="space-y-1">
                          {(selectedBooking.contact.name || selectedBooking.contact.surname) && (
                            <div>Name: {`${selectedBooking.contact.name || ''} ${selectedBooking.contact.surname || ''}`.trim()}</div>
                          )}
                          {selectedBooking.contact.email && <div>Email: {selectedBooking.contact.email}</div>}
                          {selectedBooking.contact.phone && <div>Phone: {selectedBooking.contact.phone}</div>}
                        </div>
                      ) : (
                        selectedBooking.contact
                      )}
                    </DescriptionDetails>
                  </>
                )}
              </DescriptionList>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {/* HEADING */}
        <div>
          <h1 className="text-3xl font-semibold">My Bookings</h1>
          <Divider className="my-8 w-14!" />
        </div>

      {/* EMPTY STATE - Show when all bookings are empty */}
      {bookings.length === 0 && !loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-16 text-center dark:border-neutral-700 dark:bg-neutral-800">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
            <HugeiconsIcon icon={Airplane02Icon} size={40} className="text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">No bookings yet</h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            Your flight, hotel, and activity bookings will appear here
          </p>
        </div>
      ) : (
        /* TABS */
        <TabGroup>
          <TabList className="hidden-scrollbar flex gap-x-1.5 overflow-x-auto text-sm md:text-base">
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                className="flex items-center gap-2 rounded-full px-4 py-2.5 leading-none font-medium whitespace-nowrap focus-within:outline-hidden data-hover:bg-black/5 data-selected:bg-neutral-900 data-selected:text-white sm:px-6 sm:py-3 dark:data-hover:bg-white/5 dark:data-selected:bg-neutral-100 dark:data-selected:text-neutral-900"
              >
                <HugeiconsIcon icon={tab.icon} size={18} />
                <span>{tab.name}</span>
                <Badge color="zinc" className="ml-1">
                  {tab.type === 'flight' ? flightBookings.length : tab.type === 'hotel' ? hotelBookings.length : activityBookings.length}
                </Badge>
              </Tab>
            ))}
          </TabList>

          <TabPanels className="mt-8">
            {/* FLIGHTS TAB */}
            <TabPanel>
              {renderBookingsList(flightBookings)}
            </TabPanel>

            {/* HOTELS TAB */}
            <TabPanel>
              {renderBookingsList(hotelBookings)}
            </TabPanel>

            {/* ACTIVITIES TAB */}
            <TabPanel>
              {renderBookingsList(activityBookings)}
            </TabPanel>
          </TabPanels>
        </TabGroup>
      )}
      </div>

      {/* Booking Details Modal */}
      {renderBookingDetailsModal()}
    </>
  )
}

export default Page

