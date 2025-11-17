import clsx from 'clsx'
import Image from 'next/image'

const HeroSectionWithSearchForm1 = ({
  className,
  searchForm,
  description,
  heading,
  imageAlt,
  image,
  formClassName,
}: {
  className?: string
  heading: string | React.ReactNode
  description: string | React.ReactNode
  image: string | {
    src: string
    width: number
    height: number
  }
  imageAlt: string
  searchForm: React.ReactNode
  formClassName?: string
}) => {
  // Handle both string URL and object format
  const imageSrc = typeof image === 'string' ? image : image.src
  const imageWidth = typeof image === 'string' ? 1260 : image.width
  const imageHeight = typeof image === 'string' ? 750 : image.height

  return (
    <div className={clsx('relative flex flex-col-reverse pt-10 lg:flex-col lg:pt-12', className)}>
      <div className="flex flex-col lg:flex-row">
        <div className="relative flex w-full flex-col items-start gap-y-8 pb-16 lg:pe-10 lg:pt-12 lg:pb-12 xl:gap-y-10 xl:pe-14">
          <h2
            className="text-5xl/[1.15] font-medium tracking-tight text-pretty xl:text-7xl/[1.1]"
            dangerouslySetInnerHTML={{ __html: heading || '' }}
          />
          {description}
          <div className={clsx("absolute start-0 top-[calc(100%-12rem-20rem)] mt-48 hidden w-screen max-w-4xl lg:block xl:max-w-6xl", formClassName)}>{searchForm}</div>
        </div>

        <div className="w-full">
          <Image 
            className="w-full" 
            src={imageSrc} 
            alt={imageAlt} 
            width={imageWidth}
            height={imageHeight}
            priority 
          />
        </div>
      </div>
    </div>
  )
}

export default HeroSectionWithSearchForm1
