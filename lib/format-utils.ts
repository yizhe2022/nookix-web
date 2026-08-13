/**
 * Format ratings count with k suffix for numbers >= 1000
 * @param count - The ratings count number
 * @returns Formatted string (e.g., "83.0k" for 83000, "999" for 999)
 */
export function formatRatingsCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

export function formatDurationMinutes(seconds?: number | null, fallback = "30min"): string {
  if (!seconds || seconds <= 0) return fallback
  return `${Math.ceil(seconds / 60)}min`
}

export function formatDurationClock(seconds?: number | null, fallback = "--:--"): string {
  if (!seconds || seconds <= 0) return fallback

  const totalSeconds = Math.round(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}