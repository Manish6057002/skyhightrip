/**
 * Converts a string to proper case (title case)
 * Handles special cases like "Mc", "Mac", "O'", etc.
 * @param text - The text to convert
 * @returns The text in proper case
 */
export function toProperCase(text: string): string {
  if (!text) return ''
  
  // Split by common delimiters (space, hyphen, slash)
  const words = text.split(/(\s+|-|\/)/)
  
  return words.map((word, index) => {
    // Preserve delimiters as-is
    if (/^\s+$/.test(word) || word === '-' || word === '/') {
      return word
    }
    
    // Skip empty strings
    if (!word.trim()) {
      return word
    }
    
    // Convert to lowercase first
    const lowerWord = word.toLowerCase()
    
    // Handle special prefixes
    if (lowerWord.startsWith('mc') && lowerWord.length > 2) {
      return 'Mc' + lowerWord.charAt(2).toUpperCase() + lowerWord.slice(3)
    }
    
    if (lowerWord.startsWith('mac') && lowerWord.length > 3) {
      return 'Mac' + lowerWord.charAt(3).toUpperCase() + lowerWord.slice(4)
    }
    
    if (lowerWord.startsWith("o'") && lowerWord.length > 2) {
      return "O'" + lowerWord.charAt(2).toUpperCase() + lowerWord.slice(3)
    }
    
    if (lowerWord.startsWith("d'") && lowerWord.length > 2) {
      return "D'" + lowerWord.charAt(2).toUpperCase() + lowerWord.slice(3)
    }
    
    // Handle words with apostrophes (e.g., "O'Hare")
    if (lowerWord.includes("'")) {
      const parts = lowerWord.split("'")
      return parts.map((part, i) => {
        if (i === 0) {
          return part.charAt(0).toUpperCase() + part.slice(1)
        }
        return "'" + part.charAt(0).toUpperCase() + part.slice(1)
      }).join('')
    }
    
    // Standard title case: capitalize first letter, lowercase the rest
    return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1)
  }).join('')
}

