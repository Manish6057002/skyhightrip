import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Cache for destinations data
let destinationsCache: any[] | null = null

/**
 * Load destinations from the JSON file
 */
function loadDestinations(): any[] {
  if (destinationsCache) {
    return destinationsCache
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'destinations.json')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent)
    destinationsCache = data.destinations || []
    return destinationsCache || []
  } catch (error) {
    console.error('Failed to load destinations from JSON file:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const keyword = searchParams.get('keyword')
    const code = searchParams.get('code')

    // If searching by code, use code parameter
    const searchByCode = code && code.length > 0
    const searchTerm = searchByCode ? code : keyword

    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    // Load destinations from JSON file
    const destinations = loadDestinations()
    
    if (destinations.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }
    
    // Filter destinations by keyword or code
    let filteredDestinations = destinations.filter((dest: any) => {
      const searchTermLower = searchTerm.toLowerCase()
      const name = (dest.name || '').toLowerCase()
      const country = (dest.country || '').toLowerCase()
      const city = (dest.city || '').toLowerCase()
      const destCode = (dest.code || '').toLowerCase()
      
      if (searchByCode) {
        // When searching by code, prioritize exact matches and case-insensitive matches
        return destCode === searchTermLower || 
               destCode.includes(searchTermLower) ||
               dest.code === searchTerm // Exact case-sensitive match
      } else {
        // Regular keyword search (name, city, country, and code)
        return name.includes(searchTermLower) || 
               city.includes(searchTermLower) ||
               country.includes(searchTermLower) || 
               destCode.includes(searchTermLower)
      }
    })

    // Sort results: exact matches first, then partial matches
    if (searchByCode) {
      filteredDestinations.sort((a: any, b: any) => {
        const aCode = (a.code || '').toLowerCase()
        const bCode = (b.code || '').toLowerCase()
        const searchTermLower = searchTerm.toLowerCase()
        
        // Exact match gets highest priority
        if (aCode === searchTermLower && bCode !== searchTermLower) return -1
        if (bCode === searchTermLower && aCode !== searchTermLower) return 1
        
        // Then prioritize starts with
        if (aCode.startsWith(searchTermLower) && !bCode.startsWith(searchTermLower)) return -1
        if (bCode.startsWith(searchTermLower) && !aCode.startsWith(searchTermLower)) return 1
        
        return 0
      })
    } else {
      // Sort by name relevance for keyword search
      filteredDestinations.sort((a: any, b: any) => {
        const aName = (a.name || '').toLowerCase()
        const bName = (b.name || '').toLowerCase()
        const searchTermLower = searchTerm.toLowerCase()
        
        // Exact match gets highest priority
        if (aName === searchTermLower && bName !== searchTermLower) return -1
        if (bName === searchTermLower && aName !== searchTermLower) return 1
        
        // Then prioritize starts with
        if (aName.startsWith(searchTermLower) && !bName.startsWith(searchTermLower)) return -1
        if (bName.startsWith(searchTermLower) && !aName.startsWith(searchTermLower)) return 1
        
        return 0
      })
    }

    filteredDestinations = filteredDestinations
      .slice(0, 10)
      .map((dest: any) => ({
        id: dest.code || dest.id || '',
        name: dest.name || '',
        code: dest.code || '',
        country: dest.country || '',
        countryCode: dest.countryCode || '',
        city: dest.city || dest.name || '',
      }))

    return NextResponse.json({ data: filteredDestinations }, { status: 200 })
  } catch (error: any) {
    console.error('Error searching destinations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search destinations' },
      { status: 500 }
    )
  }
}

