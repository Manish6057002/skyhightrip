'use client'

import DatePickerCustomDay from '@/components/DatePickerCustomDay'
import DatePickerCustomHeaderTwoMonth from '@/components/DatePickerCustomHeaderTwoMonth'
import T from '@/utils/getT'
import { parseLocalDate, formatLocalDate } from '@/utils/parseLocalDate'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { CalendarIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { FC, useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import { ClearDataButton } from './ClearDataButton'

const styles = {
  button: {
    base: 'relative z-10 shrink-0 w-full cursor-pointer flex items-center gap-x-3 focus:outline-hidden text-start',
    focused: 'rounded-full bg-transparent focus-visible:outline-hidden dark:bg-white/5 custom-shadow-1',
    default: 'px-7 py-4 xl:px-8 xl:py-6',
    small: 'py-3 px-7 xl:px-8',
  },
  mainText: {
    default: 'text-base xl:text-lg',
    small: 'text-base',
  },
  panel: {
    base: 'absolute top-full mt-3 w-3xl transition duration-150 data-closed:translate-y-1 data-closed:opacity-0 start-1/2 -translate-x-1/2 overflow-hidden rounded-3xl bg-white p-8 shadow-lg ring-1 ring-black/5 dark:bg-neutral-800',
    default: '',
    small: '',
  },
}

interface Props {
  className?: string
  fieldStyle: 'default' | 'small'
  clearDataButtonClassName?: string
  description?: string
  panelClassName?: string
  panelZIndex?: number
  isOnlySingleDate?: boolean
  inputName?: string
  defaultValue?: Date | null
  defaultEndValue?: Date | null
}

export const DateRangeField: FC<Props> = ({
  className = 'flex-1',
  fieldStyle = 'default',
  clearDataButtonClassName,
  description = `${T['HeroSearchForm']['CheckIn']} - ${T['HeroSearchForm']['CheckOut']}`,
  panelClassName,
  panelZIndex,
  isOnlySingleDate = false,
  inputName = 'checkin',
  defaultValue,
  defaultEndValue,
}) => {
  // Set minimum date to today (no past dates allowed for flights)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Default to today for departure date
  const defaultStartDate = new Date(today)
  
  // Default to 2 days ahead for return date
  const defaultEndDate = new Date(today)
  defaultEndDate.setDate(defaultEndDate.getDate() + 2)
  
  // Initialize with provided values or defaults (only use defaults if no values provided at all)
  const getInitialStartDate = () => {
    // If defaultValue is explicitly provided (even if null), use it
    if (defaultValue !== undefined) return defaultValue
    // Only use default if no value was provided
    return defaultStartDate
  }
  const getInitialEndDate = () => {
    // If defaultEndValue is explicitly provided (even if null), use it
    if (defaultEndValue !== undefined) return defaultEndValue
    // Only use default if no value was provided
    return defaultEndDate
  }
  
  const [startDate, setStartDate] = useState<Date | null>(getInitialStartDate())
  const [endDate, setEndDate] = useState<Date | null>(getInitialEndDate())

  // Update dates when default values change (e.g., when search params are loaded)
  // This ensures dates from query parameters override any defaults
  useEffect(() => {
    // Always update if defaultValue is provided (even if null)
    if (defaultValue !== undefined) {
      setStartDate(defaultValue)
    }
    // Always update if defaultEndValue is provided (even if null)
    if (defaultEndValue !== undefined) {
      setEndDate(defaultEndValue)
    }
  }, [defaultValue, defaultEndValue])

  return (
    <>
      <Popover className={`group relative z-10 flex ${className}`}>
        {({ open: showPopover }) => (
          <>
            <PopoverButton
              className={clsx(styles.button.base, styles.button[fieldStyle], showPopover && styles.button.focused)}
            >
              {fieldStyle === 'default' && (
                <CalendarIcon className="size-5 text-neutral-300 lg:size-7 dark:text-neutral-400" />
              )}

              <div className="flex-1 text-start">
                <span className={clsx('block font-semibold', styles.mainText[fieldStyle])}>
                  {startDate?.toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                  }) || T['HeroSearchForm']['Add dates']}
                  {endDate && !isOnlySingleDate
                    ? ' - ' +
                      endDate?.toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                      })
                    : ''}
                </span>
                <span className="mt-1 block text-sm leading-none font-light text-neutral-400">
                  {description || T['HeroSearchForm']['Add dates']}
                </span>
              </div>
            </PopoverButton>

            <ClearDataButton
              className={clsx(!startDate && !endDate && 'sr-only', clearDataButtonClassName)}
              onClick={() => {
                setStartDate(null)
                setEndDate(null)
              }}
            />

            <PopoverPanel
              unmount={false}
              transition
              className={clsx(panelClassName, styles.panel.base, styles.panel[fieldStyle])}
              style={{ zIndex: panelZIndex || 10 }}
            >
              {isOnlySingleDate ? (
                <DatePicker
                  selected={startDate}
                  onChange={(date) => {
                    setStartDate(date)
                    // set end-date = start-date + 2 day
                    setEndDate(new Date((date?.getTime() || 0) + 2 * 24 * 60 * 60 * 1000))
                  }}
                  startDate={startDate}
                  minDate={today}
                  monthsShown={2}
                  showPopperArrow={false}
                  inline
                  renderCustomHeader={(p) => <DatePickerCustomHeaderTwoMonth {...p} />}
                  renderDayContents={(day, date) => <DatePickerCustomDay dayOfMonth={day} date={date} />}
                />
              ) : (
                <DatePicker
                  selected={startDate}
                  onChange={(dates) => {
                    const [start, end] = dates
                    setStartDate(start)
                    setEndDate(end)
                  }}
                  startDate={startDate}
                  endDate={endDate}
                  minDate={today}
                  selectsRange
                  monthsShown={2}
                  showPopperArrow={false}
                  inline
                  renderCustomHeader={(p) => <DatePickerCustomHeaderTwoMonth {...p} />}
                  renderDayContents={(day, date) => <DatePickerCustomDay dayOfMonth={day} date={date} />}
                />
              )}
            </PopoverPanel>
          </>
        )}
      </Popover>

      {/* input:hidde */}
      <input type="hidden" name={inputName} value={formatLocalDate(startDate)} />
      {!isOnlySingleDate && (
        <input type="hidden" name={inputName.replace('checkin', 'checkout')} value={formatLocalDate(endDate)} />
      )}
    </>
  )
}
