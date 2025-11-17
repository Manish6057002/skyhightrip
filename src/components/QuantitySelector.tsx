'use client'

interface QuantitySelectorProps {
  label: string
  ageRange?: string
  price?: number
  currency?: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  disabled?: boolean
}

export default function QuantitySelector({
  label,
  ageRange,
  price,
  currency = 'USD',
  value,
  min = 0,
  max = 99,
  onChange,
  disabled = false,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (value > min && !disabled) {
      onChange(value - 1)
    }
  }

  const handleIncrease = () => {
    if (value < max && !disabled) {
      onChange(value + 1)
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-neutral-900 dark:text-neutral-100">{label}</div>
          {ageRange && (
            <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{ageRange}</div>
          )}
          {price !== undefined && (
            <div className="mt-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {currency} {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={value <= min || disabled}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
          >
            <span className="text-lg font-semibold">−</span>
          </button>
          <span className="min-w-[2rem] text-center text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {value}
          </span>
          <button
            type="button"
            onClick={handleIncrease}
            disabled={value >= max || disabled}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
          >
            <span className="text-lg font-semibold">+</span>
          </button>
        </div>
      </div>
    </div>
  )
}

