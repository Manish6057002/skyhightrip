import destinationsData from '@/../../data/destinations.json'

export interface Destination {
  id: string
  name: string
  code: string
  country: string
  countryCode: string
  city: string
  fullData?: any
}

let destinationsCache: Destination[] | null = null

/**
 * Load destinations from the JSON file
 */
export function loadDestinations(): Destination[] {
  if (destinationsCache) {
    return destinationsCache
  }

  try {
    const data = destinationsData as {
      total: number
      fetchedAt: string
      partial: boolean
      destinations: Destination[]
    }
    destinationsCache = data.destinations || []
    return destinationsCache
  } catch (error) {
    console.error('Failed to load destinations:', error)
    return []
  }
}

/**
 * Search destinations by name (case-insensitive)
 */
export function searchDestinationsByName(keyword: string, limit: number = 10): Destination[] {
  if (!keyword || keyword.length < 2) {
    return []
  }

  const destinations = loadDestinations()
  const searchTerm = keyword.toLowerCase().trim()

  // Filter destinations by name, city, or country
  const filtered = destinations.filter((dest) => {
    const name = (dest.name || '').toLowerCase()
    const city = (dest.city || '').toLowerCase()
    const country = (dest.country || '').toLowerCase()
    const code = (dest.code || '').toLowerCase()

    return (
      name.includes(searchTerm) ||
      city.includes(searchTerm) ||
      country.includes(searchTerm) ||
      code.includes(searchTerm)
    )
  })

  // Sort: exact name matches first, then starts with, then contains
  filtered.sort((a, b) => {
    const aName = (a.name || '').toLowerCase()
    const bName = (b.name || '').toLowerCase()

    // Exact match
    if (aName === searchTerm && bName !== searchTerm) return -1
    if (bName === searchTerm && aName !== searchTerm) return 1

    // Starts with
    if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1
    if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1

    return 0
  })

  return filtered.slice(0, limit)
}

/**
 * Search destinations by code (exact or partial match)
 */
export function searchDestinationsByCode(code: string, limit: number = 10): Destination[] {
  if (!code || code.length < 2) {
    return []
  }

  const destinations = loadDestinations()
  const searchTerm = code.toUpperCase().trim()

  // Filter destinations by code
  const filtered = destinations.filter((dest) => {
    const destCode = (dest.code || '').toUpperCase()
    return destCode === searchTerm || destCode.includes(searchTerm)
  })

  // Sort: exact matches first
  filtered.sort((a, b) => {
    const aCode = (a.code || '').toUpperCase()
    const bCode = (b.code || '').toUpperCase()

    if (aCode === searchTerm && bCode !== searchTerm) return -1
    if (bCode === searchTerm && aCode !== searchTerm) return 1

    if (aCode.startsWith(searchTerm) && !bCode.startsWith(searchTerm)) return -1
    if (bCode.startsWith(searchTerm) && !aCode.startsWith(searchTerm)) return 1

    return 0
  })

  return filtered.slice(0, limit)
}

/**
 * Get destination by code
 */
export function getDestinationByCode(code: string): Destination | null {
  const destinations = loadDestinations()
  return destinations.find((dest) => dest.code === code) || null
}

