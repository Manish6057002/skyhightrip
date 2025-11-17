declare module 'amadeus' {
  interface AmadeusConfig {
    clientId: string
    clientSecret: string
    hostname?: string
    port?: number
    ssl?: boolean
    customAppVersion?: string
    customAppId?: string
    logLevel?: string
  }

  interface AmadeusResponse<T = any> {
    data: T
    dictionaries?: any
    result?: any
    statusCode?: number
    description?: string
    [key: string]: any
  }

  interface ReferenceData {
    locations: {
      get(params: {
        keyword: string
        subType?: string
        'page[limit]'?: number
        [key: string]: any
      }): Promise<AmadeusResponse>
    }
    airlines: {
      get(params: {
        airlineCodes: string
        [key: string]: any
      }): Promise<AmadeusResponse>
    }
  }

  interface Shopping {
    flightOffersSearch: {
      get(params: {
        originLocationCode: string
        destinationLocationCode: string
        departureDate: string
        returnDate?: string
        adults?: number
        children?: number
        infants?: number
        travelClass?: string
        currencyCode?: string
        max?: number
        [key: string]: any
      }): Promise<AmadeusResponse>
      post(body: {
        originDestinations: Array<{
          id: string
          originLocationCode: string
          destinationLocationCode: string
          departureDateTimeRange: {
            date: string
            time?: string
          }
        }>
        travelers: Array<{
          id: string
          dateOfBirth: string
          name: {
            firstName: string
            lastName: string
          }
          contact?: {
            emailAddress: string
            phones: Array<{
              deviceType: string
              countryCallingCode: string
              number: string
            }>
          }
          [key: string]: any
        }>
        sources: string[]
        searchCriteria?: {
          maxFlightOptions?: number
          flightFilters?: any
          [key: string]: any
        }
        [key: string]: any
      }): Promise<AmadeusResponse>
    }
    flightOffers: {
      pricing: {
        post(body: string | {
          data: {
            type: string
            flightOffers: any[]
            [key: string]: any
          }
          [key: string]: any
        }): Promise<AmadeusResponse>
      }
    }
  }

  interface Booking {
    flightOrders: {
      post(body: any): Promise<AmadeusResponse>
    }
  }

  class Amadeus {
    constructor(config: AmadeusConfig)
    referenceData: ReferenceData
    shopping: Shopping
    booking: Booking
    [key: string]: any
  }

  export default Amadeus
}

