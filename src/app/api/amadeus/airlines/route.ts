import { NextRequest, NextResponse } from 'next/server'
import Amadeus from 'amadeus'

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID || '',
  clientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const airlineCodes = searchParams.get('airlineCodes')

    if (!airlineCodes) {
      return NextResponse.json(
        { error: 'Missing airlineCodes parameter' },
        { status: 400 }
      )
    }

    const response = await amadeus.referenceData.airlines.get({
      airlineCodes: airlineCodes,
    })

    return NextResponse.json({ data: response.data }, { status: 200 })
  } catch (error: any) {
    console.error('Amadeus API error:', error)
    return NextResponse.json(
      { error: error.description || 'Failed to fetch airline information' },
      { status: error.response?.statusCode || 500 }
    )
  }
}

