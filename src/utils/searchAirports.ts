import airportsData from '../../data/airports.json'
import { toProperCase } from './toProperCase'

export interface Airport {
  iataCode: string
  name: string
  city: string
  country: string
  countryCode?: string
}

// Cache airports array for quick access
let airportsCache: Airport[] | null = null

// Load airports array from JSON file
function getAirports(): Airport[] {
  if (airportsCache) {
    return airportsCache
  }

  let airports: Airport[]
  if ((airportsData as any).airports) {
    airports = (airportsData as any).airports.map((airport: any) => ({
      iataCode: airport.iataCode || '',
      name: toProperCase(airport.name || ''),
      city: toProperCase(airport.city || ''),
      country: toProperCase(airport.country || ''),
      countryCode: airport.countryCode || '',
    }))
  } else {
    airports = []
  }

  airportsCache = airports
  return airports
}

// Search airports by keyword (searches in name, city, country, and IATA code)
export function searchAirports(keyword: string, limit: number = 20): Airport[] {
  if (!keyword || keyword.length < 2) {
    return []
  }

  const airports = getAirports()
  const lowerKeyword = keyword.toLowerCase().trim()

  // Filter airports that match the keyword
  const matches = airports.filter((airport) => {
    const nameMatch = airport.name.toLowerCase().includes(lowerKeyword)
    const cityMatch = airport.city.toLowerCase().includes(lowerKeyword)
    const countryMatch = airport.country.toLowerCase().includes(lowerKeyword)
    const iataMatch = airport.iataCode.toLowerCase() === lowerKeyword

    return nameMatch || cityMatch || countryMatch || iataMatch
  })

  // Sort by relevance: exact IATA match first, then name matches, then city matches
  matches.sort((a, b) => {
    const aIataExact = a.iataCode.toLowerCase() === lowerKeyword
    const bIataExact = b.iataCode.toLowerCase() === lowerKeyword

    if (aIataExact && !bIataExact) return -1
    if (!aIataExact && bIataExact) return 1

    const aNameStarts = a.name.toLowerCase().startsWith(lowerKeyword)
    const bNameStarts = b.name.toLowerCase().startsWith(lowerKeyword)

    if (aNameStarts && !bNameStarts) return -1
    if (!aNameStarts && bNameStarts) return 1

    const aCityStarts = a.city.toLowerCase().startsWith(lowerKeyword)
    const bCityStarts = b.city.toLowerCase().startsWith(lowerKeyword)

    if (aCityStarts && !bCityStarts) return -1
    if (!aCityStarts && bCityStarts) return 1

    return 0
  })

  return matches.slice(0, limit)
}

// Find airport by IATA code
export function findAirportByIataCode(iataCode: string): Airport | null {
  if (!iataCode) {
    return null
  }

  const airports = getAirports()
  const upperCode = iataCode.toUpperCase().trim()

  return airports.find((airport) => airport.iataCode === upperCode) || null
}

