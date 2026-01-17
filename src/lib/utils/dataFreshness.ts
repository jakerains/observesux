export type DataFreshness = 'live' | 'stale'

interface DataFreshnessOptions {
  lastUpdated?: Date | string | number | null
  refreshInterval: number
  multiplier?: number
}

export function getDataFreshness({
  lastUpdated,
  refreshInterval,
  multiplier = 2,
}: DataFreshnessOptions): DataFreshness {
  if (!lastUpdated || refreshInterval <= 0) {
    return 'stale'
  }

  const lastUpdatedMs =
    lastUpdated instanceof Date ? lastUpdated.getTime() : new Date(lastUpdated).getTime()

  if (Number.isNaN(lastUpdatedMs)) {
    return 'stale'
  }

  const thresholdMs = refreshInterval * multiplier
  const ageMs = Date.now() - lastUpdatedMs

  return ageMs > thresholdMs ? 'stale' : 'live'
}
