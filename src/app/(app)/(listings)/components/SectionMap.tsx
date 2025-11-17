import { Divider } from '@/shared/divider'
import { SectionHeading, SectionSubheading } from './SectionHeading'

interface Props {
  className?: string
  heading?: string
  subheading?: string
  latitude?: number
  longitude?: number
  address?: string
}

const SectionMap = ({ className, heading = 'Location', subheading, latitude, longitude, address }: Props) => {
  // Build Google Maps embed URL
  const getMapUrl = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY || 'AIzaSyAGVJfZMAKYfZ71nzL_v5i3LjTTWnCYwTY'
    
    // If we have coordinates, use them (most accurate)
    if (latitude && longitude) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=15`
    }
    
    // Fallback to address search
    if (address) {
      const encodedAddress = encodeURIComponent(address)
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}&zoom=15`
    }
    
    // Default fallback
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=Eiffel+Tower,Paris+France`
  }

  return (
    <div className={`listingSection__wrap ${className || ''}`}>
      {/* HEADING */}
      <div>
        <SectionHeading>{heading}</SectionHeading>
        {subheading && (
          <SectionSubheading>{subheading}</SectionSubheading>
        )}
      </div>
      <Divider className="w-14!" />

      {/* MAP */}
      <div className="aspect-w-5 rounded-xl ring-1 ring-black/10 aspect-h-6 sm:aspect-h-3 lg:aspect-h-2">
        <div className="z-0 overflow-hidden rounded-xl">
          <iframe
            width="100%"
            height="100%"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={getMapUrl()}
          ></iframe>
        </div>
      </div>
    </div>
  )
}

export default SectionMap
