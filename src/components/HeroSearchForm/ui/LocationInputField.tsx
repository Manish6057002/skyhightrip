'use client'

import { useInteractOutside } from '@/hooks/useInteractOutside'
import { Divider } from '@/shared/divider'
import T from '@/utils/getT'
import { searchAirports, findAirportByIataCode } from '@/utils/searchAirports'
import * as Headless from '@headlessui/react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import {
  BeachIcon,
  EiffelTowerIcon,
  HutIcon,
  LakeIcon,
  Location01Icon,
  TwinTowerIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react'
import clsx from 'clsx'
import _ from 'lodash'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { ClearDataButton } from './ClearDataButton'

type Suggest = {
  id: string
  name: string
  icon?: IconSvgElement
  iataCode?: string
  code?: string
  city?: string
  country?: string
  countryCode?: string
}

const demoInitSuggests: Suggest[] = [
  {
    id: '1',
    name: 'Bangkok, Thailand',
    icon: HutIcon,
  },
  {
    id: '2',
    name: 'Ueno, Taito, Tokyo',
    icon: EiffelTowerIcon,
  },
  {
    id: '3',
    name: 'Ikebukuro, Toshima, Tokyo',
    icon: TwinTowerIcon,
  },
  {
    id: '4',
    name: 'San Diego, CA',
    icon: BeachIcon,
  },
  {
    id: '5',
    name: 'Humboldt Park, Chicago, IL',
    icon: LakeIcon,
  },
]

const demoSearchingSuggests: Suggest[] = [
  {
    id: '1',
    name: 'San Diego, CA',
  },
  {
    id: '2',
    name: 'Humboldt Park, Chicago, IL',
  },
  {
    id: '3',
    name: 'Bangor, Northern Ireland',
  },
  {
    id: '4',
    name: 'New York, NY, United States',
  },
  {
    id: '5',
    name: 'Los Angeles, CA, United States',
  },
]

const styles = {
  button: {
    base: 'relative z-10 shrink-0 w-full cursor-pointer flex items-center gap-x-3 focus:outline-hidden text-start',
    focused: 'rounded-full bg-transparent focus-visible:outline-hidden dark:bg-white/5 custom-shadow-1',
    default: 'px-7 py-4 xl:px-8 xl:py-6',
    small: 'py-3 px-7 xl:px-8',
  },
  input: {
    base: 'block w-full truncate border-none bg-transparent p-0 font-semibold placeholder-neutral-800 focus:placeholder-neutral-300 focus:ring-0 focus:outline-hidden dark:placeholder-neutral-200',
    default: 'text-base xl:text-lg',
    small: 'text-base',
  },
  panel: {
    base: 'absolute start-0 top-full mt-3 hidden-scrollbar max-h-96  overflow-y-auto rounded-3xl bg-white py-3 shadow-xl transition duration-150 data-closed:translate-y-1 data-closed:opacity-0  dark:bg-neutral-800',
    default: 'w-lg sm:py-6',
    small: 'w-md sm:py-5',
  },
}

interface Props {
  placeholder?: string
  description?: string
  className?: string
  inputName?: string
  initSuggests?: Suggest[]
  searchingSuggests?: Suggest[]
  fieldStyle: 'default' | 'small'
  useAmadeus?: boolean
  useHotelbeds?: boolean
  defaultValue?: string
  defaultCode?: string
  panelZIndex?: number
}

export const LocationInputField: FC<Props> = ({
  placeholder = T['HeroSearchForm']['Location'],
  description = T['HeroSearchForm']['Where are you going?'],
  className = 'flex-1',
  inputName = 'location',
  initSuggests = demoInitSuggests,
  searchingSuggests = demoSearchingSuggests,
  fieldStyle = 'default',
  useAmadeus = false,
  useHotelbeds = false,
  defaultValue,
  defaultCode,
  panelZIndex,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showPopover, setShowPopover] = useState(false)
  const [inputValue, setInputValue] = useState<string>('')
  const [selected, setSelected] = useState<Suggest | null>(null)
  const [amadeusSuggests, setAmadeusSuggests] = useState<Suggest[]>([])
  const [hotelbedsSuggests, setHotelbedsSuggests] = useState<Suggest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const _inputFocusTimeOut = setTimeout(() => {
      if (showPopover && inputRef.current) {
        inputRef.current.focus()
      }
    }, 200)
    return () => {
      clearTimeout(_inputFocusTimeOut)
    }
  }, [showPopover])

  // Initialize input value from defaultValue
  useEffect(() => {
    // Reset state when defaultValue changes
    if (!defaultValue) {
      setSelected({ id: '', name: '' })
      setInputValue('')
      return
    }

    // Trim and uppercase the defaultValue to handle IATA codes properly
    const trimmedValue = defaultValue.trim().toUpperCase()
    // Check if it's a valid 3-letter IATA code
    if (useAmadeus && trimmedValue.length === 3 && /^[A-Z]{3}$/.test(trimmedValue)) {
      // Assume it's an IATA code if it's 3 uppercase letters
      const fetchAirportInfo = () => {
        setIsLoading(true)
        try {
          const airport = findAirportByIataCode(trimmedValue)
          
          if (airport) {
            const cityName = airport.city || airport.name.split('(')[0].trim()
            const airportInfo: Suggest = {
              id: airport.iataCode,
              name: `${airport.name} (${airport.iataCode})`,
              iataCode: airport.iataCode,
              city: airport.city,
              country: airport.country,
              icon: Location01Icon,
            }
            setSelected(airportInfo)
            setInputValue(cityName)
          } else {
            // Airport not found, reset state
            setSelected({ id: '', name: '' })
            setInputValue('')
          }
        } catch (error) {
          console.error('Failed to fetch airport info:', error)
          setSelected({ id: '', name: '' })
          setInputValue('')
        } finally {
          setIsLoading(false)
        }
      }
      fetchAirportInfo()
    } else if (useHotelbeds) {
        // For hotelbeds, if we have a code, fetch destination info
        if (defaultCode) {
          const fetchDestinationInfo = async () => {
            setIsLoading(true)
            try {
              const response = await fetch(`/api/hotelbeds/destinations?code=${encodeURIComponent(defaultCode)}`)
              const data = await response.json()
              
              if (data.data && data.data.length > 0) {
                // Find exact match by code
                const destination = data.data.find((dest: any) => dest.code === defaultCode)
                if (destination) {
                  // Extract just the destination name (remove code if it's in parentheses)
                  const destinationName = destination.name ? destination.name.split('(')[0].trim() : (defaultValue || '')
                  const destinationInfo: Suggest = {
                    id: destination.code || destination.id,
                    name: destination.name || `${destinationName} (${destination.code})`,
                    code: destination.code,
                    city: destination.city || destinationName,
                    country: destination.country,
                    countryCode: destination.countryCode,
                    icon: Location01Icon,
                  }
                  setSelected(destinationInfo)
                  // Display just the destination name in the input field
                  setInputValue(destinationName)
                } else if (data.data.length > 0) {
                  // Fallback to first result if exact match not found
                  const destination = data.data[0]
                  // Extract just the destination name (remove code if it's in parentheses)
                  const destinationName = destination.name ? destination.name.split('(')[0].trim() : (defaultValue || '')
                  const destinationInfo: Suggest = {
                    id: destination.code || destination.id,
                    name: destination.name || `${destinationName} (${destination.code})`,
                    code: destination.code,
                    city: destination.city || destinationName,
                    country: destination.country,
                    countryCode: destination.countryCode,
                    icon: Location01Icon,
                  }
                  setSelected(destinationInfo)
                  // Display just the destination name in the input field
                  setInputValue(destinationName)
                }
              } else {
                // If no destination found, just set the input value
                setInputValue(defaultValue || '')
              }
            } catch (error) {
              console.error('Failed to fetch destination info:', error)
              // Fallback to just setting the input value
              setInputValue(defaultValue || '')
            } finally {
              setIsLoading(false)
            }
          }
          fetchDestinationInfo()
        } else {
          // If no code, just set the input value from defaultValue
          setInputValue(defaultValue || '')
        }
    } else {
      // For other cases, just set the input value
      setInputValue(defaultValue)
    }
  }, [defaultValue, defaultCode, useAmadeus, useHotelbeds])

  // for memoization of the close function
  const closePopover = useCallback(() => {
    setShowPopover(false)
  }, [])

  //  a custom hook that listens for clicks outside the container
  useInteractOutside(containerRef, closePopover)

  const fetchAirports = useCallback(
    _.debounce((keyword: string) => {
      if (!useAmadeus || keyword.length < 2) {
        setAmadeusSuggests([])
        return
      }

      setIsLoading(true)
      try {
        const results = searchAirports(keyword, 20)
        
        setAmadeusSuggests(
          results.map((airport) => ({
            id: airport.iataCode,
            name: `${airport.name} (${airport.iataCode})`,
            iataCode: airport.iataCode,
            city: airport.city,
            country: airport.country,
            icon: Location01Icon,
          }))
        )
      } catch (error) {
        console.error('Failed to search airports:', error)
        setAmadeusSuggests([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [useAmadeus]
  )

  const fetchDestinations = useCallback(
    _.debounce(async (keyword: string) => {
      if (!useHotelbeds || keyword.length < 2) {
        setHotelbedsSuggests([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/hotelbeds/destinations?keyword=${encodeURIComponent(keyword)}`)
        const data = await response.json()
        
        if (data.data) {
          setHotelbedsSuggests(
            data.data.map((destination: any) => ({
              id: destination.code || destination.id,
              name: destination.name || `${destination.name} (${destination.code})`,
              code: destination.code,
              city: destination.city || destination.name,
              country: destination.country,
              countryCode: destination.countryCode,
              icon: Location01Icon,
            }))
          )
        }
      } catch (error) {
        console.error('Failed to fetch destinations:', error)
        setHotelbedsSuggests([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [useHotelbeds]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)
      setShowPopover(true)
      
      if (useAmadeus) {
        // Clear selection when user starts typing
        if (value && selected) {
          setSelected(null)
        }
        if (value) {
          fetchAirports(value)
        } else {
          setAmadeusSuggests([])
        }
      } else if (useHotelbeds) {
        // Clear selection when user starts typing
        if (value && selected) {
          setSelected(null)
        }
        if (value) {
          fetchDestinations(value)
        } else {
          setHotelbedsSuggests([])
        }
      } else {
        // Original behavior for non-API fields
        if (value) {
          setSelected({
            id: Date.now().toString(),
            name: value,
          })
        }
      }
    },
    [useAmadeus, useHotelbeds, fetchAirports, fetchDestinations, selected]
  )
  useEffect(() => {
    return () => {
      fetchAirports.cancel()
      fetchDestinations.cancel()
    }
  }, [fetchAirports, fetchDestinations])

  const isShowInitSuggests = (useAmadeus || useHotelbeds) ? false : !selected?.id
  const suggestsToShow = useAmadeus
    ? amadeusSuggests
    : useHotelbeds
      ? hotelbedsSuggests
      : isShowInitSuggests
        ? initSuggests
        : searchingSuggests
  return (
    <div
      className={`group relative z-10 flex ${className}`}
      ref={containerRef}
      {...(showPopover && {
        'data-open': 'true',
      })}
    >
        <Headless.Combobox
        value={selected}
        onChange={(value) => {
          setSelected(value || { id: '', name: '' })
          // Update input value when selection is made - show city name for airports
          if (value) {
            if (useAmadeus && (value as any).iataCode) {
              // Show city name in the input field
              setInputValue((value as any).city || value.name.split('(')[0].trim())
            } else {
              setInputValue(value.name)
            }
          } else {
            setInputValue('')
          }
          // Close the popover when a value is selected
          if (value?.id) {
            setShowPopover(false)
            setTimeout(() => {
              inputRef.current?.blur()
            }, 50)
          }
        }}
      >
        <div
          onMouseDown={() => setShowPopover(true)}
          onTouchStart={() => setShowPopover(true)}
          className={clsx(styles.button.base, styles.button[fieldStyle], showPopover && styles.button.focused)}
        >
          {fieldStyle === 'default' && (
            <MapPinIcon className="size-5 text-neutral-300 lg:size-7 dark:text-neutral-400" />
          )}

          <div className="grow">
            <Headless.ComboboxInput
              ref={inputRef}
              aria-label="Search for a location"
              className={clsx(styles.input.base, styles.input[fieldStyle])}
              name={(useAmadeus || useHotelbeds) ? undefined : inputName}
              placeholder={placeholder}
              autoComplete="off"
              displayValue={(item?: Suggest) => {
                // When an item is selected, format it for display
                if (item) {
                  if (useAmadeus && (item as any).iataCode) {
                    // Show city name in the input field
                    return (item as any).city || item.name.split('(')[0].trim()
                  }
                  if (useHotelbeds && (item as any).code) {
                    // Show just the destination name (remove code if it's in parentheses)
                    return item.name.split('(')[0].trim()
                  }
                  return item.name
                }
                // When no item is selected, return empty string to let user type freely
                return ''
              }}
              onChange={handleInputChange}
              onFocus={() => {
                setShowPopover(true)
                if (useAmadeus && inputValue && inputValue.length >= 2) {
                  fetchAirports(inputValue)
                } else if (useHotelbeds && inputValue && inputValue.length >= 2) {
                  fetchDestinations(inputValue)
                }
              }}
            />
            <div className="mt-0.5 text-start text-sm font-light text-neutral-400">
              {useAmadeus && selected && (selected as any).iataCode ? (
                <span className="line-clamp-1">
                  {(selected as any).iataCode} · {selected.name.split('(')[0].trim()}
                </span>
              ) : (
                <span className="line-clamp-1">{description}</span>
              )}
            </div>

            <ClearDataButton
              className={clsx(!selected?.id && !inputValue && 'sr-only')}
              onClick={() => {
                setSelected({ id: '', name: '' })
                setInputValue('')
                setAmadeusSuggests([])
                setShowPopover(false)
                inputRef.current?.focus()
              }}
            />
            {/* Hidden input to store full airport/destination name for form submission */}
            {useAmadeus && selected && (selected as any).iataCode && (
              <input
                type="hidden"
                name={inputName}
                value={selected.name}
              />
            )}
            {useHotelbeds && selected && (selected as any).code && (
              <input
                type="hidden"
                name={inputName}
                value={selected.name}
              />
            )}
            {useHotelbeds && selected && (selected as any).code && (
              <input
                type="hidden"
                name={`${inputName}_code`}
                value={(selected as any).code}
              />
            )}
          </div>
        </div>

        <Headless.Transition show={showPopover && (suggestsToShow.length > 0 || isLoading || ((useAmadeus || useHotelbeds) && inputValue.length >= 2))} unmount={false}>
          <div 
            className={clsx(styles.panel.base, styles.panel[fieldStyle])}
            style={{ zIndex: panelZIndex || 40 }}
          >
            {isShowInitSuggests && !useAmadeus && (
              <p className="mt-2 mb-3 px-4 text-xs/6 font-normal text-neutral-600 sm:mt-0 sm:px-8 dark:text-neutral-400">
                {T['HeroSearchForm']['Suggested locations']}
              </p>
            )}
            {isShowInitSuggests && !useAmadeus && <Divider className="opacity-50" />}
            <Headless.ComboboxOptions static unmount={false}>
              {isLoading && (
                <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  {useAmadeus ? 'Searching airports...' : useHotelbeds ? 'Searching destinations...' : 'Searching...'}
                </div>
              )}
              {!isLoading && suggestsToShow.length === 0 && useAmadeus && inputValue.length >= 2 && (
                <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  No airports found
                </div>
              )}
              {!isLoading && suggestsToShow.length === 0 && useHotelbeds && inputValue.length >= 2 && (
                <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  No destinations found
                </div>
              )}
              {!isLoading && suggestsToShow.length === 0 && (useAmadeus || useHotelbeds) && inputValue.length < 2 && (
                <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  Type at least 2 characters to search
                </div>
              )}
              {suggestsToShow.map((item) => (
                <Headless.ComboboxOption
                  key={item.id}
                  value={item}
                  className="flex items-center gap-3 p-4 data-focus:bg-neutral-100 sm:gap-4.5 sm:px-8 dark:data-focus:bg-neutral-700"
                >
                  <HugeiconsIcon
                    icon={item.icon || Location01Icon}
                    className="size-4 text-neutral-400 sm:size-6 dark:text-neutral-500"
                  />
                  <div className="flex-1">
                    {useAmadeus && (item as any).iataCode ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="block font-medium text-neutral-700 dark:text-neutral-200">
                            {item.name.split('(')[0].trim()}
                          </span>
                          <span className="rounded bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                            {(item as any).iataCode}
                          </span>
                        </div>
                        {((item as any).city || (item as any).country) && (
                          <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                            {(item as any).city || ''}
                            {(item as any).city && (item as any).country ? ', ' : ''}
                            {(item as any).country || ''}
                          </span>
                        )}
                      </>
                    ) : useHotelbeds && (item as any).code ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="block font-medium text-neutral-700 dark:text-neutral-200">
                            {item.name}
                          </span>
                          <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                            {(item as any).code}
                          </span>
                        </div>
                        {((item as any).city || (item as any).country) && (
                          <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                            {(item as any).city || ''}
                            {(item as any).city && (item as any).country ? ', ' : ''}
                            {(item as any).country || ''}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="block font-medium text-neutral-700 dark:text-neutral-200">{item.name}</span>
                    )}
                  </div>
                </Headless.ComboboxOption>
              ))}
            </Headless.ComboboxOptions>
          </div>
        </Headless.Transition>
      </Headless.Combobox>
    </div>
  )
}
