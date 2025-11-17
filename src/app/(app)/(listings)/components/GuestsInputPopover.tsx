'use client'

import NcInputNumber from '@/components/NcInputNumber'
import { GuestsObject } from '@/type'
import T from '@/utils/getT'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { UserPlusIcon } from '@heroicons/react/24/outline'
import { FC, useState, useEffect } from 'react'

interface Props {
  className?: string
  initialAdults?: number
  initialChildren?: number
  initialInfants?: number
  onChange?: (adults: number, children: number, infants: number) => void
}

const GuestsInputPopover: FC<Props> = ({ className = 'flex-1', initialAdults, initialChildren, initialInfants, onChange }) => {
  // Use initial values if provided, otherwise use defaults
  const getInitialAdults = () => initialAdults !== undefined ? initialAdults : 2
  const getInitialChildren = () => initialChildren !== undefined ? initialChildren : 0
  const getInitialInfants = () => initialInfants !== undefined ? initialInfants : 0
  
  const [guestAdultsInputValue, setGuestAdultsInputValue] = useState(getInitialAdults())
  const [guestChildrenInputValue, setGuestChildrenInputValue] = useState(getInitialChildren())
  const [guestInfantsInputValue, setGuestInfantsInputValue] = useState(getInitialInfants())
  
  // Update guest counts when initial values change
  useEffect(() => {
    if (initialAdults !== undefined) setGuestAdultsInputValue(initialAdults)
    if (initialChildren !== undefined) setGuestChildrenInputValue(initialChildren)
    if (initialInfants !== undefined) setGuestInfantsInputValue(initialInfants)
  }, [initialAdults, initialChildren, initialInfants])

  const handleChangeData = (value: number, type: keyof GuestsObject) => {
    let newAdults = guestAdultsInputValue
    let newChildren = guestChildrenInputValue
    let newInfants = guestInfantsInputValue
    
    if (type === 'guestAdults') {
      setGuestAdultsInputValue(value)
      newAdults = value
    }
    if (type === 'guestChildren') {
      setGuestChildrenInputValue(value)
      newChildren = value
    }
    if (type === 'guestInfants') {
      setGuestInfantsInputValue(value)
      newInfants = value
    }
    
    // Call onChange callback if provided
    if (onChange) {
      onChange(newAdults, newChildren, newInfants)
    }
  }

  // Calculate total guests: adults + children + infants (if infants were part of the search)
  // If initialInfants was provided (meaning it was in the search), always include infants in the count
  const includeInfants = initialInfants !== undefined
  const totalGuests = guestAdultsInputValue + guestChildrenInputValue + (includeInfants ? guestInfantsInputValue : 0)
  return (
    <Popover className={`relative flex ${className}`}>
      {({ open }) => (
        <>
          <div className={`flex flex-1 items-center rounded-b-3xl focus:outline-hidden ${open ? 'shadow-lg' : ''}`}>
            <PopoverButton className="relative z-10 flex flex-1 cursor-pointer items-center gap-x-3 p-3 text-start focus:outline-hidden">
              <div className="text-neutral-300 dark:text-neutral-400">
                <UserPlusIcon className="h-5 w-5 lg:h-7 lg:w-7" />
              </div>
              <div className="grow">
                <span className="block font-semibold xl:text-lg">
                  {totalGuests > 0 ? `${totalGuests} ${T['HeroSearchForm']['Guests']}` : T['HeroSearchForm']['Add guests']}
                </span>
                <span className="mt-1 block text-sm leading-none font-light text-neutral-400">
                  {totalGuests > 0 ? T['HeroSearchForm']['Guests'] : T['HeroSearchForm']['Add guests']}
                </span>
              </div>
            </PopoverButton>
          </div>

          <PopoverPanel
            transition
            unmount={false}
            className="absolute end-0 top-full z-10 mt-3 w-full rounded-3xl bg-white px-4 py-5 shadow-xl ring-1 ring-black/5 transition duration-150 data-closed:translate-y-1 data-closed:opacity-0 sm:min-w-[340px] sm:px-8 sm:py-6 dark:bg-neutral-800"
          >
            <NcInputNumber
              className="w-full"
              defaultValue={guestAdultsInputValue}
              onChange={(value) => handleChangeData(value, 'guestAdults')}
              inputName="guestAdults"
              max={10}
              min={1}
              label={T['HeroSearchForm']['Adults']}
              description={T['HeroSearchForm']['Ages 13 or above']}
            />
            <NcInputNumber
              className="mt-6 w-full"
              defaultValue={guestChildrenInputValue}
              onChange={(value) => handleChangeData(value, 'guestChildren')}
              inputName="guestChildren"
              max={4}
              label={T['HeroSearchForm']['Children']}
              description={T['HeroSearchForm']['Ages 2–12']}
            />

            <NcInputNumber
              className="mt-6 w-full"
              defaultValue={guestInfantsInputValue}
              onChange={(value) => handleChangeData(value, 'guestInfants')}
              inputName="guestInfants"
              max={4}
              label={T['HeroSearchForm']['Infants']}
              description={T['HeroSearchForm']['Ages 0–2']}
            />
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}

export default GuestsInputPopover
