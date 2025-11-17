import airportsData from '../../data/airports.json'
import { toProperCase } from './toProperCase'

// Cache airports map for quick lookup
let airportsMapCache: Record<string, { name: string; city: string; country: string }> | null = null

// Load airports map from JSON file
function getAirportsMap(): Record<string, { name: string; city: string; country: string }> {
  if (airportsMapCache) {
    return airportsMapCache
  }

  // Use airportsMap if available, otherwise build from airports array
  if ((airportsData as any).airportsMap) {
    const rawMap = (airportsData as any).airportsMap as Record<string, { name: string; city: string; country: string }>
    // Convert to proper case
    const properCaseMap: Record<string, { name: string; city: string; country: string }> = {}
    for (const [code, airport] of Object.entries(rawMap)) {
      properCaseMap[code] = {
        name: toProperCase(airport.name || ''),
        city: toProperCase(airport.city || ''),
        country: toProperCase(airport.country || ''),
      }
    }
    airportsMapCache = properCaseMap
  } else if ((airportsData as any).airports) {
    const map: Record<string, { name: string; city: string; country: string }> = {}
    ;(airportsData as any).airports.forEach((airport: any) => {
      if (airport.iataCode) {
        map[airport.iataCode] = {
          name: toProperCase(airport.name || ''),
          city: toProperCase(airport.city || ''),
          country: toProperCase(airport.country || ''),
        }
      }
    })
    airportsMapCache = map
  } else {
    airportsMapCache = {}
  }

  return airportsMapCache
}

// Extract IATA code from a string (handles formats like "Airport Name (IATA)" or just "IATA")
function extractIataCode(airportString: string): string {
  if (!airportString) return ''
  
  // Check if it's already in format "Name (IATA)"
  const match = airportString.match(/\(([A-Z]{3})\)/)
  if (match) {
    return match[1]
  }
  
  // Check if it's just a 3-letter uppercase code
  if (/^[A-Z]{3}$/.test(airportString.trim())) {
    return airportString.trim()
  }
  
  // Try to extract any 3-letter uppercase code
  const codeMatch = airportString.match(/\b([A-Z]{3})\b/)
  if (codeMatch) {
    return codeMatch[1]
  }
  
  return airportString
}

// Get airport name from IATA code using airports.json file
export function getAirportName(iataCode: string): string {
  if (!iataCode) return ''
  
  const airportsMap = getAirportsMap()
  const airport = airportsMap[iataCode]
  
  if (airport && airport.name) {
    return airport.name
  }
  
  // Fallback: return IATA code if not found
  return iataCode
}

// Get formatted airport display string with name and IATA code
export function getAirportDisplay(airportString: string): string {
  if (!airportString) return ''
  
  // Extract IATA code from the string
  const iataCode = extractIataCode(airportString)
  
  if (!iataCode) {
    return airportString
  }
  
  // Get airport name from airports.json
  const airportName = getAirportName(iataCode)
  
  // If we found a name and it's different from the IATA code, format as "Name (IATA)"
  if (airportName && airportName !== iataCode) {
    return `${airportName} (${iataCode})`
  }
  
  // Otherwise, just return the IATA code
  return iataCode
}

// Get airport info object from IATA code
export function getAirportInfo(iataCode: string): { name: string; city: string; country: string; iataCode: string } | null {
  if (!iataCode) return null
  
  const airportsMap = getAirportsMap()
  const airport = airportsMap[iataCode]
  
  if (airport) {
    return {
      ...airport,
      iataCode,
    }
  }
  
  return null
}

// Get airport info object from airport string (handles formats like "Airport Name (IATA)" or just "IATA")
export function getAirportInfoFromString(airportString: string): { name: string; city: string; country: string; iataCode: string } | null {
  if (!airportString) return null
  
  // Extract IATA code from the string
  const iataCode = extractIataCode(airportString)
  
  if (!iataCode) {
    return null
  }
  
  return getAirportInfo(iataCode)
}

