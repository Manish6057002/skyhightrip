/**
 * Parses a date string in "YYYY-MM-DD" format as a local date (not UTC).
 * This prevents timezone shifts when parsing date-only strings.
 * 
 * @param dateString - Date string in "YYYY-MM-DD" format
 * @returns Date object representing the date in local timezone, or null if invalid
 */
export function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null
  }

  // Remove any whitespace
  const trimmed = dateString.trim()
  if (!trimmed) {
    return null
  }

  // Check if it's in YYYY-MM-DD format
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/
  const match = trimmed.match(dateRegex)
  
  if (!match) {
    // If not in YYYY-MM-DD format, try standard Date parsing
    const date = new Date(trimmed)
    return isNaN(date.getTime()) ? null : date
  }

  // Parse as local date (month is 0-indexed in Date constructor)
  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1 // Convert to 0-indexed
  const day = parseInt(match[3], 10)

  const date = new Date(year, month, day)
  
  // Validate the date (handles invalid dates like 2025-13-45)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

/**
 * Formats a Date object as a local date string in "YYYY-MM-DD" format (not UTC).
 * This prevents timezone shifts when formatting date-only values.
 * 
 * @param date - Date object to format
 * @returns Date string in "YYYY-MM-DD" format, or empty string if date is null/invalid
 */
export function formatLocalDate(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return ''
  }

  // Use local date methods to avoid timezone conversion
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // getMonth() is 0-indexed, so add 1
  const day = date.getDate()

  // Format as YYYY-MM-DD with zero-padding
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

