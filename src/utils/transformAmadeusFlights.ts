import { TFlightListing } from '@/data/listings'
import airportsData from '../../data/airports.json'

// Cache airports map for quick lookup
let airportsMapCache: Record<string, { name: string; city: string; country: string }> | null = null

// Load airports map from JSON file
function getAirportsMap(): Record<string, { name: string; city: string; country: string }> {
  if (airportsMapCache) {
    return airportsMapCache
  }

  // Use airportsMap if available, otherwise build from airports array
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

// Get airline logo from Google Static (gstatic) by carrier code
function getAirlineLogo(carrierCode: string): string {
  // Use Google Static CDN for airline logos
  // Format: https://www.gstatic.com/flights/airline_logos/70px/[carrier_code].png
  // Fallback to a default placeholder if logo doesn't exist
  return `https://www.gstatic.com/flights/airline_logos/70px/${carrierCode}.png`
}

// Format duration from ISO 8601 duration (e.g., "PT7H45M") to readable format
function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return duration

  const hours = match[1] ? parseInt(match[1]) : 0
  const minutes = match[2] ? parseInt(match[2]) : 0

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else if (minutes > 0) {
    return `${minutes}m`
  }
  return duration
}

// Format price from Amadeus response in AUD
function formatPrice(price: any): string {
  if (!price || !price.total) return 'A$0'
  const amount = parseFloat(price.total)
  const currency = price.currencyCode || 'AUD'
  // Format as AUD currency
  if (currency === 'AUD') {
    return `A$${Math.round(amount).toLocaleString()}`
  }
  // Fallback for other currencies
  return `${currency} ${Math.round(amount).toLocaleString()}`
}

// Extract fare breakup from Amadeus offer price
function extractFareBreakup(offer: any) {
  if (!offer.price) return undefined
  
  const price = offer.price
  const currency = price.currencyCode || 'AUD'
  const currencySymbol = currency === 'AUD' ? 'A$' : currency + ' '
  
  // Extract base fare
  let baseFare: number | undefined
  if (price.base) {
    baseFare = parseFloat(price.base)
  } else if (price.total) {
    // If base is not available, calculate from total - taxes
    const total = parseFloat(price.total)
    let taxesTotal = 0
    
    // Calculate total taxes
    if (price.taxes && Array.isArray(price.taxes)) {
      taxesTotal = price.taxes.reduce((sum: number, tax: any) => {
        return sum + (parseFloat(tax.amount || '0') || 0)
      }, 0)
    }
    
    baseFare = total - taxesTotal
  }
  
  // Extract fees (if available)
  let fees: number | undefined
  if (price.fees && Array.isArray(price.fees) && price.fees.length > 0) {
    fees = price.fees.reduce((sum: number, fee: any) => {
      return sum + (parseFloat(fee.amount || '0') || 0)
    }, 0)
  }
  
  // Get total
  const total = price.total ? parseFloat(price.total) : undefined
  
  // Extract taxes and individual tax items
  let taxes: number | undefined
  let taxItems: Array<{ code?: string; amount: number; description?: string }> | undefined
  if (price.taxes && Array.isArray(price.taxes) && price.taxes.length > 0) {
    const mappedTaxItems = price.taxes.map((tax: any) => {
      const amount = parseFloat(tax.amount || '0') || 0
      return {
        code: tax.code || undefined,
        amount: Math.round(amount),
        description: tax.description || tax.code || undefined,
      }
    })
    taxItems = mappedTaxItems
    taxes = mappedTaxItems.reduce((sum: number, tax: any) => {
      return sum + tax.amount
    }, 0)
  } else if (total !== undefined && baseFare !== undefined) {
    // If taxes array is not available, calculate taxes as total - baseFare - fees
    const feesAmount = fees !== undefined ? fees : 0
    taxes = Math.max(0, total - baseFare - feesAmount)
  } else if (total !== undefined && baseFare === undefined) {
    // If we have total but no base fare, try to calculate taxes from total
    const feesAmount = fees !== undefined ? fees : 0
    if (price.base) {
      const base = parseFloat(price.base)
      taxes = Math.max(0, total - base - feesAmount)
    }
  }
  
  // Only return if we have at least base fare or total
  if (baseFare !== undefined || total !== undefined) {
    // Always calculate taxes if we have total and baseFare, even if taxes array is not available
    if (taxes === undefined && total !== undefined && baseFare !== undefined) {
      const feesAmount = fees !== undefined ? fees : 0
      taxes = Math.max(0, total - baseFare - feesAmount)
    }
    
    return {
      baseFare: baseFare !== undefined ? Math.round(baseFare) : undefined,
      taxes: taxes !== undefined ? Math.round(taxes) : undefined,
      taxItems: taxItems && taxItems.length > 0 ? taxItems : undefined,
      fees: fees !== undefined ? Math.round(fees) : undefined,
      total: total !== undefined ? Math.round(total) : undefined,
    }
  }
  
  return undefined
}

// Get airport name from IATA code using airports.json file
function getAirportName(iataCode: string): string {
  if (!iataCode) return ''
  
  const airportsMap = getAirportsMap()
  const airport = airportsMap[iataCode]
  
  if (airport && airport.name) {
    return airport.name
  }
  
  // Fallback: return IATA code if not found
  return iataCode
}

// Get full airline name from IATA code (extended mapping)
function getAirlineFullName(iataCode: string): string {
  // Common airline name mappings - can be extended or fetched from Amadeus API
  const airlineNames: Record<string, string> = {
    'AA': 'American Airlines',
    'DL': 'Delta Air Lines',
    'UA': 'United Airlines',
    'BA': 'British Airways',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'KL': 'KLM Royal Dutch Airlines',
    'QF': 'Qantas',
    'EK': 'Emirates',
    'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific',
    'JL': 'Japan Airlines',
    'NH': 'All Nippon Airways',
    'VS': 'Virgin Atlantic',
    'TK': 'Turkish Airlines',
    'EY': 'Etihad Airways',
    'QR': 'Qatar Airways',
    'AC': 'Air Canada',
    'NZ': 'Air New Zealand',
    'VA': 'Virgin Australia',
    'AI': 'Air India',
    'IX': 'Air India Express',
    '6E': 'IndiGo',
    'SG': 'SpiceJet',
    'G8': 'GoAir',
    '9W': 'Jet Airways',
    'UK': 'Vistara',
    'I5': 'AirAsia India',
    '5J': 'Cebu Pacific',
    'FD': 'Thai AirAsia',
    'AK': 'AirAsia',
    'D7': 'AirAsia X',
    'JQ': 'Jetstar Airways',
    'TT': 'Tigerair Australia',
    'DJ': 'Virgin Australia Regional',
  }
  return airlineNames[iataCode] || iataCode
}

// Extract baggage information from Amadeus offer
function extractBaggageInfo(offer: any) {
  const baggageInfo: { 
    carryOn?: { quantity?: number; weight?: string; description?: string }
    checked?: { quantity?: number; weight?: string; description?: string }
  } = {}
  
  // Check for travelerPricings which contains baggage info
  if (offer.travelerPricings && offer.travelerPricings.length > 0) {
    const firstTraveler = offer.travelerPricings[0]
    
    // Check for includedCheckedBags (checked baggage) and cabin baggage
    if (firstTraveler.fareDetailsBySegment && firstTraveler.fareDetailsBySegment.length > 0) {
      // Check all segments for baggage information
      for (const segment of firstTraveler.fareDetailsBySegment) {
        // Checked baggage
        if (segment.includedCheckedBags) {
          const quantity = segment.includedCheckedBags.quantity || 0
          const weight = segment.includedCheckedBags.weight
          const weightStr = weight ? String(weight) : ''
          baggageInfo.checked = {
            quantity: quantity > 0 ? quantity : 0,
            weight: weightStr || undefined,
            description: quantity > 0 ? `${quantity} bag${quantity > 1 ? 's' : ''}${weightStr ? ` (${weightStr})` : ''}` : 'No checked baggage'
          }
        }
        
        // Cabin baggage (carry-on) - check for includedCabinBags
        if (segment.includedCabinBags) {
          const quantity = segment.includedCabinBags.quantity || 1
          const weight = segment.includedCabinBags.weight
          const weightStr = weight ? String(weight) : ''
          baggageInfo.carryOn = {
            quantity: quantity,
            weight: weightStr || undefined,
            description: `${quantity} carry-on bag${quantity > 1 ? 's' : ''}${weightStr ? ` (${weightStr})` : ''}`
          }
        }
        
        // Also check for additionalServices for cabin baggage
        if (segment.additionalServices && segment.additionalServices.length > 0) {
          const cabinBag = segment.additionalServices.find((service: any) => 
            service.type === 'CABIN_BAG' || 
            service.type === 'CARRY_ON' ||
            service.type === 'CABIN'
          )
          if (cabinBag) {
            const weight = cabinBag.weight || cabinBag.amount?.weight
            const weightStr = weight ? String(weight) : undefined
            baggageInfo.carryOn = {
              quantity: cabinBag.quantity || 1,
              weight: weightStr,
              description: cabinBag.description || `${cabinBag.quantity || 1} carry-on bag${weightStr ? ` (${weightStr})` : ''}`
            }
          }
        }
      }
    }
    
    // Check for baggage information in other parts of the response
    // Some Amadeus responses include baggage in the offer level
    if (offer.baggageAllowance) {
      if (offer.baggageAllowance.checked) {
        const checked = offer.baggageAllowance.checked
        const weight = checked.weight
        const weightStr = weight ? String(weight) : undefined
        baggageInfo.checked = {
          quantity: checked.quantity || 0,
          weight: weightStr,
          description: checked.quantity > 0 ? `${checked.quantity} bag${checked.quantity > 1 ? 's' : ''}${weightStr ? ` (${weightStr})` : ''}` : 'No checked baggage'
        }
      }
      if (offer.baggageAllowance.cabin || offer.baggageAllowance.carryOn) {
        const cabin = offer.baggageAllowance.cabin || offer.baggageAllowance.carryOn
        const weight = cabin.weight
        const weightStr = weight ? String(weight) : undefined
        baggageInfo.carryOn = {
          quantity: cabin.quantity || 1,
          weight: weightStr,
          description: `${cabin.quantity || 1} carry-on bag${weightStr ? ` (${weightStr})` : ''}`
        }
      }
    }
    
    // Default cabin baggage if not found (most airlines allow 1 carry-on)
    if (!baggageInfo.carryOn) {
      baggageInfo.carryOn = {
        quantity: 1,
        weight: undefined,
        description: '1 carry-on bag'
      }
    }
  }
  
  return baggageInfo
}

// Extract basic fare rules from Amadeus offer
function extractFareRules(offer: any) {
  const fareRules: { 
    refundable?: boolean
    changeable?: boolean
    cancellationPolicy?: string
    refundDetails?: string
    changeDetails?: string
    rules?: Array<{ category: string; title?: string; description?: string }>
  } = {}
  
  // Only extract basic fare rules, not detailed ones
  // Check for pricing options that might indicate refundability
  if (offer.pricingOptions) {
    if (offer.pricingOptions.refundableFare !== undefined) {
      fareRules.refundable = offer.pricingOptions.refundableFare
    }
    if (offer.pricingOptions.changeableFare !== undefined) {
      fareRules.changeable = offer.pricingOptions.changeableFare
    }
  }
  
  // Extract all basic fare rules from the offer response
  if (offer.fareRules && Array.isArray(offer.fareRules) && offer.fareRules.length > 0) {
    const rules: Array<{ category: string; title?: string; description?: string }> = []
    
    offer.fareRules.forEach((rule: any) => {
      const category = rule.category || ''
      const title = rule.title || ''
      const description = rule.rules || rule.description || ''
      
      rules.push({ category, title, description })
      
      // Extract specific categories for basic display
      if (category === 'VOLUNTARY_REFUNDS' || category === 'REFUNDS') {
        fareRules.refundable = !description?.toLowerCase().includes('non-refundable') && 
                               !description?.toLowerCase().includes('not permitted')
        fareRules.refundDetails = description || title
        if (!fareRules.cancellationPolicy) {
          fareRules.cancellationPolicy = description || title
        }
      }
      
      if (category === 'VOLUNTARY_CHANGES' || category === 'CHANGES') {
        fareRules.changeable = !description?.toLowerCase().includes('not permitted') &&
                              !description?.toLowerCase().includes('changes not allowed')
        fareRules.changeDetails = description || title
      }
      
      if (category === 'CANCELLATION' || category === 'CANCELLATIONS') {
        fareRules.cancellationPolicy = description || title || fareRules.cancellationPolicy
      }
    })
    
    fareRules.rules = rules
  }
  
  // Check for additional fare details in other parts of the response
  if (offer.fareDetailsBySegment && Array.isArray(offer.fareDetailsBySegment)) {
    offer.fareDetailsBySegment.forEach((segment: any) => {
      if (segment.fareBasis) {
        // Some fare basis codes indicate refundability/changeability
        if (!fareRules.refundable && segment.fareBasis.includes('REF')) {
          fareRules.refundable = true
        }
        if (!fareRules.changeable && segment.fareBasis.includes('CHG')) {
          fareRules.changeable = true
        }
      }
    })
  }
  
  return fareRules
}

export function transformAmadeusFlightOffer(offer: any, index: number, dictionaries?: any): TFlightListing {
  const itineraries = offer.itineraries || []
  const firstItinerary = itineraries[0] || {}
  const segments = firstItinerary.segments || []
  const firstSegment = segments[0] || {}
  const lastSegment = segments[segments.length - 1] || {}

  const departure = firstSegment.departure || {}
  const arrival = lastSegment.arrival || {}
  const carrier = firstSegment.carrierCode || 'UNKNOWN'
  const airlineCode = offer.validatingAirlineCodes?.[0] || carrier
  
  // Try to get airline name from the response
  // Amadeus response may include airline information in segments or elsewhere
  let airlineFullName = getAirlineFullName(airlineCode)
  
  // Check if airline name is provided in the response
  // Some responses include airline names in the segments
  if (firstSegment.carrierCode && offer.source === 'GDS') {
    // For GDS sources, we might need to look up the airline name
    // For now, use the mapping function, but this could be enhanced with API lookup
    airlineFullName = getAirlineFullName(firstSegment.carrierCode)
  }
  
  const airlineName = airlineCode

  const departureTime = new Date(departure.at || new Date())
  const arrivalTime = new Date(arrival.at || new Date())
  const duration = firstItinerary.duration || 'PT0H'
  
  // Extract segments information
  const flightSegments = segments.map((seg: any) => {
    // Get aircraft name from dictionaries.aircraft mapping
    const aircraftCode = seg.aircraft?.code || ''
    let aircraftName = aircraftCode
    
    if (dictionaries?.aircraft && aircraftCode) {
      // Look up aircraft name in dictionaries.aircraft
      aircraftName = dictionaries.aircraft[aircraftCode] || aircraftCode
    }
    
    // Get airport names using airports.json
    const departureIata = seg.departure?.iataCode || ''
    const arrivalIata = seg.arrival?.iataCode || ''
    const departureName = getAirportName(departureIata)
    const arrivalName = getAirportName(arrivalIata)
    
    return {
      departure: `${departureName} (${departureIata})`,
      arrival: `${arrivalName} (${arrivalIata})`,
      departureTime: new Date(seg.departure?.at || new Date()),
      arrivalTime: new Date(seg.arrival?.at || new Date()),
      carrier: seg.carrierCode || '',
      flightNumber: `${seg.carrierCode || ''}${seg.number || ''}`,
      aircraft: aircraftName,
      cabin: seg.cabin || '',
    }
  })
  
  // Extract baggage, fare rules, and fare breakup
  const baggageInfo = extractBaggageInfo(offer)
  const fareRules = extractFareRules(offer)
  const fareBreakup = extractFareBreakup(offer)

  // Calculate stops (stops = segments - 1, but only count actual stops, not the final destination)
  const stopNumber = Math.max(0, segments.length - 1)
  const stopAirport = stopNumber > 0 && segments.length > 1 ? segments[1].departure?.iataCode || '' : ''

  // Format airport names using airports.json
  const departureAirport = `${getAirportName(departure.iataCode || '')} (${departure.iataCode || ''})`
  const arrivalAirport = `${getAirportName(arrival.iataCode || '')} (${arrival.iataCode || ''})`

  // Format route name
  const routeName = `${departure.iataCode || ''} → ${arrival.iataCode || ''}`

  // Get price
  const price = formatPrice(offer.price)

  // Round-trip handling
  const returnItinerary = itineraries[1]
  const layover = returnItinerary ? formatDuration(returnItinerary.duration) : ''

  return {
    id: offer.id || `flight-${index}`,
    name: routeName,
    departure: departureAirport,
    arrival: arrivalAirport,
    departureTime,
    arrivalTime,
    duration: formatDuration(duration),
    airlines: {
      name: airlineName,
      logo: getAirlineLogo(carrier),
      fullName: airlineFullName,
    },
    price,
    stopNumber,
    stopAirport: stopAirport || '',
    layover,
    href: `/flight-listings/${offer.id || `flight-${index}`}`,
    baggageInfo: Object.keys(baggageInfo).length > 0 ? baggageInfo : undefined,
    fareRules: Object.keys(fareRules).length > 0 ? fareRules : undefined,
    fareBreakup,
    segments: flightSegments,
    originalOffer: offer, // Store the original Amadeus offer for booking
  }
}

export function transformAmadeusFlights(data: any[], dictionaries?: any): TFlightListing[] {
  if (!data || !Array.isArray(data)) {
    return []
  }

  return data.map((offer, index) => transformAmadeusFlightOffer(offer, index, dictionaries))
}

