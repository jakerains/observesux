export type ToolStatus = 'normal' | 'attention' | 'alert'

export function unwrapData<T>(output: unknown): { data: T | null; error?: string } {
  if (!output) {
    return { data: null }
  }

  if (typeof output === 'object') {
    const record = output as Record<string, unknown>
    const error = typeof record.error === 'string' ? record.error : undefined
    if ('data' in record) {
      return { data: (record.data as T) ?? null, error }
    }
    if (typeof record.message === 'string') {
      return { data: null, error: record.message }
    }
  }

  return { data: output as T }
}

export function formatCount(value: number, label: string) {
  return `${value} ${label}${value === 1 ? '' : 's'}`
}

export function formatMaybeNumber(value: number | null | undefined, unit: string) {
  if (typeof value !== 'number') return '--'
  return `${Math.round(value * 10) / 10}${unit}`
}
