import { NextRequest, NextResponse } from 'next/server'
import Amadeus from 'amadeus'

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID || '',
  clientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const keyword = searchParams.get('keyword')

    if (!keyword || keyword.length < 2) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const response = await amadeus.referenceData.locations.get({
      keyword: keyword,
      subType: 'AIRPORT',
      'page[limit]': 10,
    })

    const airports = response.data.map((airport: any) => ({
      id: airport.iataCode || airport.id,
      name: `${airport.name} (${airport.iataCode})`,
      city: airport.address?.cityName || '',
      country: airport.address?.countryName || '',
      iataCode: airport.iataCode,
      fullName: `${airport.name}, ${airport.address?.cityName || ''}, ${airport.address?.countryName || ''}`,
    }))

    return NextResponse.json({ data: airports }, { status: 200 })
  } catch (error: any) {
    console.error('Amadeus API error:', error)
    return NextResponse.json(
      { error: error.description || 'Failed to fetch airports' },
      { status: error.response?.statusCode || 500 }
    )
  }
}

