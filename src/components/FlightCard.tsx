'use client'

import { TFlightListing } from '@/data/listings'
import { ButtonCircle } from '@/shared/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/table'
import { Disclosure, DisclosureButton, DisclosurePanel, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { ArrowUpRight01Icon, Luggage01Icon, File01Icon, Calculator01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Image from 'next/image'
import { FC, useState } from 'react'
import { getAirportDisplay, getAirportInfoFromString } from '@/utils/getAirportInfo'

interface FlightCardProps {
  className?: string
  data: TFlightListing
}

const FlightCard: FC<FlightCardProps> = ({ className = '', data }) => {
  const {
    departure,
    arrival,
    airlines,
    duration,
    href,
    id,
    layover,
    name,
    price,
    stopAirport,
    stopNumber,
    arrivalTime,
    departureTime,
    baggageInfo,
    fareRules,
    fareBreakup,
    segments,
  } = data

  const [selectedTab, setSelectedTab] = useState(0)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateTransitTime = (arrivalTime: Date, nextDepartureTime: Date): string => {
    const transitDuration = nextDepartureTime.getTime() - arrivalTime.getTime()
    const hours = Math.floor(transitDuration / (1000 * 60 * 60))
    const minutes = Math.floor((transitDuration % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h`
    } else if (minutes > 0) {
      return `${minutes}m`
    }
    return '0m'
  }

  const renderFlightItem = (segmentData?: NonNullable<TFlightListing['segments']>[0], index?: number) => {
    const segment = segmentData || {
      departure,
      arrival,
      departureTime,
      arrivalTime,
      carrier: airlines.name,
      flightNumber: '',
      aircraft: '',
      cabin: '',
    }

    return (
      <div>
        <div className="flex flex-col md:flex-row">
          <div className="w-24 shrink-0 md:w-20 md:pt-7 lg:w-24">
            <Image 
              src={airlines.logo} 
              className="w-10" 
              alt="" 
              sizes="40px" 
              width={40} 
              height={40}
              onError={(e) => {
                // Fallback to a default airline logo if gstatic logo doesn't exist
                const target = e.target as HTMLImageElement
                target.src = `https://www.gstatic.com/flights/airline_logos/70px/XX.png`
              }}
            />
          </div>
          <div className="my-5 flex md:my-0">
            <div className="flex shrink-0 flex-col items-center py-2">
              <span className="block h-6 w-6 rounded-full border border-neutral-400"></span>
              <span className="my-1 block grow border-l border-dashed border-neutral-400"></span>
              <span className="block h-6 w-6 rounded-full border border-neutral-400"></span>
            </div>
            <div className="ms-4 space-y-10 text-sm">
              <div className="flex flex-col space-y-1">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {formatDate(segment.departureTime)} · {formatTime(segment.departureTime)}
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold">{getAirportDisplay(segment.departure)}</span>
                  {(() => {
                    const airportInfo = getAirportInfoFromString(segment.departure)
                    if (airportInfo && (airportInfo.city || airportInfo.country)) {
                      return (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {[airportInfo.city, airportInfo.country].filter(Boolean).join(', ')}
                        </span>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {formatDate(segment.arrivalTime)} · {formatTime(segment.arrivalTime)}
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold">{getAirportDisplay(segment.arrival)}</span>
                  {(() => {
                    const airportInfo = getAirportInfoFromString(segment.arrival)
                    if (airportInfo && (airportInfo.city || airportInfo.country)) {
                      return (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {[airportInfo.city, airportInfo.country].filter(Boolean).join(', ')}
                        </span>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
            </div>
          </div>
          <div className="border-l border-neutral-200 md:mx-6 lg:mx-10 dark:border-neutral-700"></div>
          <ul className="space-y-1 text-sm text-neutral-500 md:space-y-2 dark:text-neutral-400">
            <li>
              Trip time: {(() => {
                const segmentDuration = segment.arrivalTime.getTime() - segment.departureTime.getTime()
                const hours = Math.floor(segmentDuration / (1000 * 60 * 60))
                const minutes = Math.floor((segmentDuration % (1000 * 60 * 60)) / (1000 * 60))
                return hours > 0 && minutes > 0 ? `${hours}h ${minutes}m` : hours > 0 ? `${hours}h` : minutes > 0 ? `${minutes}m` : duration
              })()}
            </li>
            <li>
              {airlines.fullName || airlines.name}
              {segment.cabin ? ` · ${segment.cabin}` : ''}
              {segment.aircraft ? ` · ${segment.aircraft}` : ''}
              {segment.flightNumber ? ` · ${segment.flightNumber}` : ''}
            </li>
          </ul>
        </div>
      </div>
    )
  }

  const departureTimeFormatted = new Date(departureTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const arrivalTimeFormatted = new Date(arrivalTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Disclosure
      as={'div'}
      className={`relative space-y-6 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4 transition-shadow hover:shadow-lg sm:p-6 dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      <DisclosureButton as="div" tabIndex={0} className="relative sm:pe-20">
        <div className="absolute end-0 bottom-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2">
          <ButtonCircle 
            color="white" 
            href={`/flight-booking?data=${encodeURIComponent(JSON.stringify(data))}`}
            aria-label="Book flight"
          >
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              size={20}
              color="currentColor"
              className="rtl:rotate-270"
              strokeWidth={1.5}
            />
          </ButtonCircle>
        </div>

        <div className="flex flex-col gap-y-6 sm:gap-y-0 md:flex-row md:items-center">
          {/* LOGO IMG */}
          <div className="w-24 shrink-0 lg:w-32">
            <Image 
              src={airlines.logo} 
              width={40} 
              height={40} 
              className="w-10" 
              alt={airlines.name} 
              sizes="40px"
              onError={(e) => {
                // Fallback to a default airline logo if gstatic logo doesn't exist
                const target = e.target as HTMLImageElement
                target.src = `https://www.gstatic.com/flights/airline_logos/70px/XX.png`
              }}
            />
          </div>

          {/* FOR MOBILE RESPONSIVE */}
          <div className="block space-y-1 lg:hidden">
            <div className="flex font-semibold">
              <div>
                <span>{departureTimeFormatted}</span>
                <span className="mt-0.5 flex items-center text-sm font-normal text-neutral-500">{getAirportDisplay(departure)}</span>
              </div>
              <span className="flex w-12 justify-center">
                <ArrowRightIcon className="mt-0.5 size-4" />
              </span>
              <div>
                <span>{arrivalTimeFormatted}</span>
                <span className="mt-0.5 flex items-center text-sm font-normal text-neutral-500">{getAirportDisplay(arrival)}</span>
              </div>
            </div>

            <div className="mt-0.5 text-sm font-normal text-neutral-500">
              <span className="VG3hNb">
                {!stopNumber ? 'Non-stop' : `${stopNumber} stop${stopNumber > 1 ? 's' : ''}`}
              </span>
              <span className="mx-2">·</span>
              <span>{duration}</span>
            </div>
          </div>

          {/* TIME - NAME */}
          <div className="hidden min-w-[150px] flex-4 lg:block">
            <div className="text-lg font-medium">
              {departureTimeFormatted} - {arrivalTimeFormatted}
            </div>
            <div className="mt-0.5 text-sm font-normal text-neutral-500">
              {airlines.fullName || airlines.name}
            </div>
          </div>

          {/* TIMME */}
          <div className="hidden flex-4 whitespace-nowrap lg:block">
            <div className="text-lg font-medium">{name}</div>
            <div className="mt-0.5 text-sm font-normal text-neutral-500">{duration}</div>
          </div>

          {/* stop */}
          <div className="hidden flex-4 whitespace-nowrap lg:block">
            <div className="text-lg font-medium">
              {!stopNumber ? 'Non-stop' : `${stopNumber} stop${stopNumber > 1 ? 's' : ''}`}
            </div>
            <div className="mt-0.5 text-sm font-normal text-neutral-500">
              {duration}
            </div>
          </div>

          {/* PRICE */}
          <div className="flex-4 whitespace-nowrap sm:text-right">
            <p className="text-lg font-semibold text-secondary-600">{price}</p>
            <div className="mt-0.5 text-xs font-normal text-neutral-500 lg:text-sm">Includes taxes and fees</div>
          </div>
        </div>
      </DisclosureButton>

      {/* DETAIL */}

      <DisclosurePanel className="rounded-2xl border border-neutral-200 p-4 md:p-8 dark:border-neutral-700">
        {segments && segments.length > 0 ? (
          segments.map((segment, index) => {
            const nextSegment = segments[index + 1]
            const transitTime = nextSegment 
              ? calculateTransitTime(segment.arrivalTime, nextSegment.departureTime)
              : null
            const transitAirport = nextSegment ? segment.arrival : stopAirport
            
            return (
              <div key={index}>
                {renderFlightItem(segment, index)}
                {index < segments.length - 1 && nextSegment && (
                  <div className="my-7 space-y-5 md:my-10 md:ps-24">
                    <div className="border-t border-neutral-200 dark:border-neutral-700" />
                    <div className="text-sm text-neutral-700 md:text-base dark:text-neutral-300">
                      Transit time: {transitTime} - {getAirportDisplay(transitAirport)}
                    </div>
                    <div className="border-t border-neutral-200 dark:border-neutral-700" />
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <>
            {renderFlightItem()}
            {layover && (
              <div className="my-7 space-y-5 md:my-10 md:ps-24">
                <div className="border-t border-neutral-200 dark:border-neutral-700" />
                <div className="text-sm text-neutral-700 md:text-base dark:text-neutral-300">
                  Transit time: {layover} - {getAirportDisplay(stopAirport)}
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-700" />
              </div>
            )}
          </>
        )}
        
        {/* Baggage Information, Fare Rules, and Fare Breakup in Tabs */}
        {(baggageInfo || fareRules || fareBreakup) && (
          <div className="my-7 md:my-10 md:ps-24">
            <div className="border-t border-neutral-200 dark:border-neutral-700" />
            <TabGroup 
              selectedIndex={selectedTab}
              onChange={setSelectedTab}
              className="mt-6"
            >
              <TabList className="flex sm:gap-x-1.5">
                {baggageInfo && (
                  <Tab className="flex items-center gap-2 rounded-full px-4 py-2.5 leading-none font-medium whitespace-nowrap focus-within:outline-hidden data-hover:bg-black/5 data-selected:bg-neutral-900 data-selected:text-white sm:px-6 sm:py-3 dark:data-selected:bg-neutral-100 dark:data-selected:text-neutral-900">
                    <HugeiconsIcon icon={Luggage01Icon} size={18} />
                    <span>Baggage</span>
                  </Tab>
                )}
                {fareRules && (
                  <Tab className="flex items-center gap-2 rounded-full px-4 py-2.5 leading-none font-medium whitespace-nowrap focus-within:outline-hidden data-hover:bg-black/5 data-selected:bg-neutral-900 data-selected:text-white sm:px-6 sm:py-3 dark:data-selected:bg-neutral-100 dark:data-selected:text-neutral-900">
                    <HugeiconsIcon icon={File01Icon} size={18} />
                    <span>Fare Rules</span>
                  </Tab>
                )}
                {fareBreakup && (
                  <Tab className="flex items-center gap-2 rounded-full px-4 py-2.5 leading-none font-medium whitespace-nowrap focus-within:outline-hidden data-hover:bg-black/5 data-selected:bg-neutral-900 data-selected:text-white sm:px-6 sm:py-3 dark:data-selected:bg-neutral-100 dark:data-selected:text-neutral-900">
                    <HugeiconsIcon icon={Calculator01Icon} size={18} />
                    <span>Fare Summary</span>
                  </Tab>
                )}
              </TabList>
              <TabPanels className="mt-4">
                {/* Baggage Tab */}
                {baggageInfo && (
                  <TabPanel className="space-y-4">
                    {baggageInfo.carryOn && (
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <HugeiconsIcon icon={Luggage01Icon} size={20} className="text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Cabin Baggage (Carry-on)</h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Personal item allowed in cabin</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                          {baggageInfo.carryOn.quantity !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-600 dark:text-neutral-400">Quantity:</span>
                              <span className="font-medium">{baggageInfo.carryOn.quantity} bag{baggageInfo.carryOn.quantity > 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {baggageInfo.carryOn.weight && (
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-600 dark:text-neutral-400">Weight:</span>
                              <span className="font-medium">
                                {typeof baggageInfo.carryOn.weight === 'string' 
                                  ? baggageInfo.carryOn.weight.replace(/\s*kg\s*/gi, '').trim()
                                  : String(baggageInfo.carryOn.weight).replace(/\s*kg\s*/gi, '').trim()}
                                <span className="text-neutral-500 dark:text-neutral-400 ml-1">kg</span>
                              </span>
                            </div>
                          )}
                          {baggageInfo.carryOn.description && !baggageInfo.carryOn.weight && (
                            <div className="text-neutral-600 dark:text-neutral-400">{baggageInfo.carryOn.description}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {baggageInfo.checked && (
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-100 dark:bg-secondary-900/30">
                            <HugeiconsIcon icon={Luggage01Icon} size={20} className="text-secondary-600 dark:text-secondary-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Checked Baggage</h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Checked at airport counter</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                          {baggageInfo.checked.quantity !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-600 dark:text-neutral-400">Quantity:</span>
                              <span className="font-medium">{baggageInfo.checked.quantity} bag{baggageInfo.checked.quantity > 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {baggageInfo.checked.weight && (
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-600 dark:text-neutral-400">Weight:</span>
                              <span className="font-medium">
                                {typeof baggageInfo.checked.weight === 'string' 
                                  ? baggageInfo.checked.weight.replace(/\s*kg\s*/gi, '').trim()
                                  : String(baggageInfo.checked.weight).replace(/\s*kg\s*/gi, '').trim()}
                                <span className="text-neutral-500 dark:text-neutral-400 ml-1">kg</span>
                              </span>
                            </div>
                          )}
                          {baggageInfo.checked.description && !baggageInfo.checked.weight && (
                            <div className="text-neutral-600 dark:text-neutral-400">{baggageInfo.checked.description}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabPanel>
                )}
                {/* Fare Rules Tab */}
                {fareRules && (
                  <TabPanel className="space-y-4">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                      <h4 className="text-sm font-semibold text-neutral-900 mb-4 dark:text-neutral-100">Fare Conditions</h4>
                      <div className="space-y-3 text-sm">
                        {fareRules.refundable !== undefined && (
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                              {fareRules.refundable ? (
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓</span>
                              ) : (
                                <span className="text-xs font-semibold text-red-600 dark:text-red-400">✗</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-neutral-900 dark:text-neutral-100">Refundable</div>
                              <div className="text-neutral-600 dark:text-neutral-400">
                                {fareRules.refundable ? 'This fare is refundable' : 'This fare is non-refundable'}
                              </div>
                              {fareRules.refundDetails && (
                                <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{fareRules.refundDetails}</div>
                              )}
                            </div>
                          </div>
                        )}
                        {fareRules.changeable !== undefined && (
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                              {fareRules.changeable ? (
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">✓</span>
                              ) : (
                                <span className="text-xs font-semibold text-red-600 dark:text-red-400">✗</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-neutral-900 dark:text-neutral-100">Changeable</div>
                              <div className="text-neutral-600 dark:text-neutral-400">
                                {fareRules.changeable ? 'Changes are permitted' : 'Changes are not permitted'}
                              </div>
                              {fareRules.changeDetails && (
                                <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{fareRules.changeDetails}</div>
                              )}
                            </div>
                          </div>
                        )}
                        {fareRules.cancellationPolicy && (
                          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Cancellation Policy</div>
                            <div className="text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed">{fareRules.cancellationPolicy}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Fare Rules Table */}
                    {fareRules.rules && fareRules.rules.length > 0 && (
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                        <h4 className="text-sm font-semibold text-neutral-900 mb-4 dark:text-neutral-100">Fare Rules</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableHeader>Category</TableHeader>
                                <TableHeader>Title</TableHeader>
                                <TableHeader>Description</TableHeader>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {fareRules.rules.map((rule, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {rule.category || 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-neutral-700 dark:text-neutral-300">
                                    {rule.title || '-'}
                                  </TableCell>
                                  <TableCell className="text-neutral-600 dark:text-neutral-400 text-sm">
                                    {rule.description || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </TabPanel>
                )}
                {/* Fare Breakup Tab */}
                {fareBreakup && (
                  <TabPanel className="space-y-4">
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                      <h4 className="text-sm font-semibold text-neutral-900 mb-4 dark:text-neutral-100">Fare Breakup</h4>
                      <div className="space-y-3">
                        {fareBreakup.baseFare !== undefined && (
                          <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">Base Fare</span>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {typeof fareBreakup.baseFare === 'number' 
                                ? `A$${fareBreakup.baseFare.toLocaleString()}` 
                                : fareBreakup.baseFare}
                            </span>
                          </div>
                        )}
                        {(fareBreakup.taxes !== undefined && fareBreakup.taxes !== null) && (
                          <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">Taxes</span>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {typeof fareBreakup.taxes === 'number' 
                                ? `A$${fareBreakup.taxes.toLocaleString()}` 
                                : fareBreakup.taxes}
                            </span>
                          </div>
                        )}
                        {fareBreakup.fees !== undefined && (
                          <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">Fees</span>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {typeof fareBreakup.fees === 'number' 
                                ? `A$${fareBreakup.fees.toLocaleString()}` 
                                : fareBreakup.fees}
                            </span>
                          </div>
                        )}
                        {fareBreakup.serviceCharge !== undefined && (
                          <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">Service Charge</span>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {typeof fareBreakup.serviceCharge === 'number' 
                                ? `A$${fareBreakup.serviceCharge.toLocaleString()}` 
                                : fareBreakup.serviceCharge}
                            </span>
                          </div>
                        )}
                        {(fareBreakup.total !== undefined || price) && (
                          <div className="flex items-center justify-between py-2 pt-3">
                            <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Total</span>
                            <span className="text-base font-semibold text-secondary-600 dark:text-secondary-400">
                              {fareBreakup.total !== undefined
                                ? (typeof fareBreakup.total === 'number' 
                                    ? `A$${fareBreakup.total.toLocaleString()}` 
                                    : fareBreakup.total)
                                : price}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabPanel>
                )}
              </TabPanels>
            </TabGroup>
          </div>
        )}
      </DisclosurePanel>
    </Disclosure>
  )
}

export default FlightCard
