import { TFlightListing } from '@/data/listings'
import airportsData from '../../data/airports.json'

// Cache airports map for quick lookup
let airportsMapCache: Record<string, { name: string; city: string; country: string }> | null = null

// Load airports map from JSON file
function getAirportsMap(): Record<string, { name: string; city: string; country: string }> {
  if (airportsMapCache) {
    return airportsMapCache
  }

  if ((airportsData as any).airportsMap) {
    airportsMapCache = (airportsData as any).airportsMap as Record<string, { name: string; city: string; country: string }>
  } else if ((airportsData as any).airports) {
    const map: Record<string, { name: string; city: string; country: string }> = {}
    ;(airportsData as any).airports.forEach((airport: any) => {
      if (airport.iataCode) {
        map[airport.iataCode] = {
          name: airport.name || '',
          city: airport.city || '',
          country: airport.country || '',
        }
      }
    })
    airportsMapCache = map
  } else {
    airportsMapCache = {}
  }

  return airportsMapCache
}

// Get airport name from IATA code
function getAirportName(iataCode: string): string {
  const airportsMap = getAirportsMap()
  const airport = airportsMap[iataCode]
  return airport ? airport.name : iataCode
}

// Get airline logo from Google Static (gstatic) by carrier code
function getAirlineLogo(carrierCode: string): string {
  return `https://www.gstatic.com/flights/airline_logos/70px/${carrierCode}.png`
}

// Format duration from minutes to readable format
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else if (mins > 0) {
    return `${mins}m`
  }
  return '0m'
}

// Format price from Duffel response
function formatPrice(totalAmount: string, currency: string = 'AUD'): string {
  if (!totalAmount) return 'A$0'
  const amount = parseFloat(totalAmount)
  if (currency === 'AUD' || currency === 'AUD') {
    return `A$${Math.round(amount).toLocaleString()}`
  }
  return `${currency} ${Math.round(amount).toLocaleString()}`
}

// Extract fare breakup from Duffel offer
function extractFareBreakup(offer: any) {
  if (!offer.total_amount || !offer.total_currency) return undefined

  const total = parseFloat(offer.total_amount)
  const currency = offer.total_currency || 'AUD'

  // Duffel provides base_amount and tax_amount separately
  const baseFare = offer.base_amount ? parseFloat(offer.base_amount) : undefined
  const taxes = offer.tax_amount ? parseFloat(offer.tax_amount) : undefined

  return {
    baseFare: baseFare !== undefined ? Math.round(baseFare) : undefined,
    taxes: taxes !== undefined ? Math.round(taxes) : undefined,
    total: Math.round(total),
  }
}

// Extract baggage information from Duffel offer
function extractBaggageInfo(offer: any) {
  const baggageInfo: { 
    carryOn?: { quantity?: number; weight?: string; description?: string }
    checked?: { quantity?: number; weight?: string; description?: string }
  } = {}
  
  // Check for passenger baggage allowances
  if (offer.passenger_identity_documents && offer.passenger_identity_documents.length > 0) {
    // Duffel may include baggage in passenger documents or services
    // Check the first passenger's baggage allowance
    const firstPassenger = offer.passenger_identity_documents[0]
    if (firstPassenger.baggage_allowance) {
      const allowance = firstPassenger.baggage_allowance
      if (allowance.carry_on_baggage) {
        const carryOn = allowance.carry_on_baggage
        baggageInfo.carryOn = {
          quantity: carryOn.quantity || 1,
          weight: carryOn.weight ? `${carryOn.weight}${carryOn.weight_unit || 'kg'}` : undefined,
          description: `${carryOn.quantity || 1} carry-on bag${(carryOn.quantity || 1) > 1 ? 's' : ''}${carryOn.weight ? ` (${carryOn.weight}${carryOn.weight_unit || 'kg'})` : ''}`
        }
      }
      if (allowance.checked_baggage) {
        const checked = allowance.checked_baggage
        baggageInfo.checked = {
          quantity: checked.quantity || 0,
          weight: checked.weight ? `${checked.weight}${checked.weight_unit || 'kg'}` : undefined,
          description: checked.quantity > 0 ? `${checked.quantity} bag${checked.quantity > 1 ? 's' : ''}${checked.weight ? ` (${checked.weight}${checked.weight_unit || 'kg'})` : ''}` : 'No checked baggage'
        }
      }
    }
  }
  
  // Check for baggage in services
  if (offer.services && Array.isArray(offer.services)) {
    for (const service of offer.services) {
      if (service.type === 'baggage') {
        const baggage = service.baggage
        if (baggage) {
          if (baggage.type === 'carry_on' || baggage.type === 'cabin') {
            baggageInfo.carryOn = {
              quantity: baggage.quantity || 1,
              weight: baggage.weight ? `${baggage.weight}${baggage.weight_unit || 'kg'}` : undefined,
              description: `${baggage.quantity || 1} carry-on bag${(baggage.quantity || 1) > 1 ? 's' : ''}${baggage.weight ? ` (${baggage.weight}${baggage.weight_unit || 'kg'})` : ''}`
            }
          } else if (baggage.type === 'checked') {
            baggageInfo.checked = {
              quantity: baggage.quantity || 0,
              weight: baggage.weight ? `${baggage.weight}${baggage.weight_unit || 'kg'}` : undefined,
              description: baggage.quantity > 0 ? `${baggage.quantity} bag${baggage.quantity > 1 ? 's' : ''}${baggage.weight ? ` (${baggage.weight}${baggage.weight_unit || 'kg'})` : ''}` : 'No checked baggage'
            }
          }
        }
      }
    }
  }
  
  // Check for baggage in conditions
  if (offer.conditions && offer.conditions.baggage) {
    const baggage = offer.conditions.baggage
    if (baggage.carry_on) {
      const carryOn = baggage.carry_on
      baggageInfo.carryOn = {
        quantity: carryOn.quantity || 1,
        weight: carryOn.weight ? `${carryOn.weight}${carryOn.weight_unit || 'kg'}` : undefined,
        description: `${carryOn.quantity || 1} carry-on bag${(carryOn.quantity || 1) > 1 ? 's' : ''}${carryOn.weight ? ` (${carryOn.weight}${carryOn.weight_unit || 'kg'})` : ''}`
      }
    }
    if (baggage.checked) {
      const checked = baggage.checked
      baggageInfo.checked = {
        quantity: checked.quantity || 0,
        weight: checked.weight ? `${checked.weight}${checked.weight_unit || 'kg'}` : undefined,
        description: checked.quantity > 0 ? `${checked.quantity} bag${checked.quantity > 1 ? 's' : ''}${checked.weight ? ` (${checked.weight}${checked.weight_unit || 'kg'})` : ''}` : 'No checked baggage'
      }
    }
  }
  
  // Check slices for baggage information
  // Duffel stores baggage in segment.passengers[].baggages[]
  if (offer.slices && Array.isArray(offer.slices)) {
    for (const slice of offer.slices) {
      if (slice.segments && Array.isArray(slice.segments)) {
        for (const segment of slice.segments) {
          // Check segment passengers for baggage
          if (segment.passengers && Array.isArray(segment.passengers)) {
            for (const passenger of segment.passengers) {
              if (passenger.baggages && Array.isArray(passenger.baggages)) {
                for (const baggage of passenger.baggages) {
                  if (baggage.type === 'carry_on' || baggage.type === 'cabin') {
                    if (!baggageInfo.carryOn) {
                      baggageInfo.carryOn = {
                        quantity: baggage.quantity || 1,
                        weight: baggage.weight ? `${baggage.weight}${baggage.weight_unit || 'kg'}` : undefined,
                        description: `${baggage.quantity || 1} carry-on bag${(baggage.quantity || 1) > 1 ? 's' : ''}${baggage.weight ? ` (${baggage.weight}${baggage.weight_unit || 'kg'})` : ''}`
                      }
                    }
                  } else if (baggage.type === 'checked') {
                    if (!baggageInfo.checked) {
                      baggageInfo.checked = {
                        quantity: baggage.quantity || 0,
                        weight: baggage.weight ? `${baggage.weight}${baggage.weight_unit || 'kg'}` : undefined,
                        description: baggage.quantity > 0 ? `${baggage.quantity} bag${baggage.quantity > 1 ? 's' : ''}${baggage.weight ? ` (${baggage.weight}${baggage.weight_unit || 'kg'})` : ''}` : 'No checked baggage'
                      }
                    }
                  }
                }
              }
            }
          }
          
          // Also check segment conditions for baggage (fallback)
          if (segment.conditions && segment.conditions.baggage) {
            const baggage = segment.conditions.baggage
            if (baggage.carry_on && !baggageInfo.carryOn) {
              const carryOn = baggage.carry_on
              baggageInfo.carryOn = {
                quantity: carryOn.quantity || 1,
                weight: carryOn.weight ? `${carryOn.weight}${carryOn.weight_unit || 'kg'}` : undefined,
                description: `${carryOn.quantity || 1} carry-on bag${(carryOn.quantity || 1) > 1 ? 's' : ''}${carryOn.weight ? ` (${carryOn.weight}${carryOn.weight_unit || 'kg'})` : ''}`
              }
            }
            if (baggage.checked && !baggageInfo.checked) {
              const checked = baggage.checked
              baggageInfo.checked = {
                quantity: checked.quantity || 0,
                weight: checked.weight ? `${checked.weight}${checked.weight_unit || 'kg'}` : undefined,
                description: checked.quantity > 0 ? `${checked.quantity} bag${checked.quantity > 1 ? 's' : ''}${checked.weight ? ` (${checked.weight}${checked.weight_unit || 'kg'})` : ''}` : 'No checked baggage'
              }
            }
          }
        }
      }
    }
  }
  
  // Default cabin baggage if not found (most airlines allow 1 carry-on)
  if (!baggageInfo.carryOn) {
    baggageInfo.carryOn = {
      quantity: 1,
      description: '1 carry-on bag'
    }
  }
  
  return baggageInfo
}

// Transform Duffel offer to TFlightListing
export function transformDuffelOffer(offer: any, index: number): TFlightListing {
  const slices = offer.slices || []
  const firstSlice = slices[0] || {}
  const lastSlice = slices[slices.length - 1] || {}
  
  const firstSegment = firstSlice.segments?.[0] || {}
  const lastSegment = lastSlice.segments?.[lastSlice.segments?.length - 1] || {}

  const departure = firstSegment.origin || {}
  const arrival = lastSegment.destination || {}
  const carrier = firstSegment.marketing_carrier?.iata_code || firstSegment.operating_carrier?.iata_code || 'UNKNOWN'
  const airlineCode = carrier

  const departureTime = new Date(firstSegment.departing_at || new Date())
  const arrivalTime = new Date(lastSegment.arriving_at || new Date())

  // Calculate total duration
  // If duration_in_minutes is not available, calculate from first and last segment times
  let totalDurationMinutes = slices.reduce((total: number, slice: any) => {
    return total + (slice.duration_in_minutes || 0)
  }, 0)
  
  // If duration is 0 or undefined, calculate from segment times
  if (totalDurationMinutes === 0 && firstSegment.departing_at && lastSegment.arriving_at) {
    const depTime = new Date(firstSegment.departing_at).getTime()
    const arrTime = new Date(lastSegment.arriving_at).getTime()
    totalDurationMinutes = Math.floor((arrTime - depTime) / (1000 * 60))
  }
  
  const duration = formatDuration(totalDurationMinutes)

  // Extract segments information
  const flightSegments: TFlightListing['segments'] = []
  
  slices.forEach((slice: any) => {
    const sliceSegments = slice.segments || []
    sliceSegments.forEach((seg: any) => {
      const departureIata = seg.origin?.iata_code || ''
      const arrivalIata = seg.destination?.iata_code || ''
      const departureName = getAirportName(departureIata)
      const arrivalName = getAirportName(arrivalIata)

      flightSegments.push({
        departure: `${departureName} (${departureIata})`,
        arrival: `${arrivalName} (${arrivalIata})`,
        departureTime: new Date(seg.departing_at || new Date()),
        arrivalTime: new Date(seg.arriving_at || new Date()),
        carrier: seg.marketing_carrier?.iata_code || seg.operating_carrier?.iata_code || '',
        flightNumber: `${seg.marketing_carrier?.iata_code || seg.operating_carrier?.iata_code || ''}${seg.marketing_carrier_flight_number || seg.operating_carrier_flight_number || ''}`,
        aircraft: seg.aircraft?.name || seg.aircraft?.iata_code || '',
        cabin: seg.passengers?.[0]?.cabin_class || offer.cabin_class || '',
      })
    })
  })

  // Calculate stops
  const totalSegments = flightSegments.length
  const stopNumber = Math.max(0, totalSegments - 1)
  // Stop airport is the arrival airport of the first segment (where the layover happens)
  const stopAirport = stopNumber > 0 && flightSegments.length > 1 ? flightSegments[0].arrival : ''

  // Format airport names
  const departureAirport = `${getAirportName(departure.iata_code || '')} (${departure.iata_code || ''})`
  const arrivalAirport = `${getAirportName(arrival.iata_code || '')} (${arrival.iata_code || ''})`

  // Format route name
  const routeName = `${departure.iata_code || ''} → ${arrival.iata_code || ''}`

  // Get price - convert to AUD if needed
  const currency = offer.total_currency || 'AUD'
  const price = formatPrice(offer.total_amount, currency)

  // Extract fare breakup and baggage info
  const fareBreakup = extractFareBreakup(offer)
  const baggageInfo = extractBaggageInfo(offer)

  return {
    id: offer.id || `duffel-flight-${index}`,
    name: routeName,
    departure: departureAirport,
    arrival: arrivalAirport,
    departureTime,
    arrivalTime,
    duration,
    airlines: {
      name: airlineCode,
      logo: getAirlineLogo(carrier),
      fullName: firstSegment.marketing_carrier?.name || firstSegment.operating_carrier?.name || airlineCode,
    },
    price,
    stopNumber,
    stopAirport: stopAirport || '',
    layover: '',
    href: `/flight-listings/${offer.id || `duffel-flight-${index}`}`,
    baggageInfo: Object.keys(baggageInfo).length > 0 ? baggageInfo : undefined,
    fareBreakup,
    segments: flightSegments.length > 0 ? flightSegments : undefined,
    originalOffer: offer,
  }
}

export function transformDuffelFlights(data: any[]): TFlightListing[] {
  if (!data || !Array.isArray(data)) {
    return []
  }

  return data.map((offer, index) => transformDuffelOffer(offer, index))
}

