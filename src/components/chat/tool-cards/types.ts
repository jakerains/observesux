import type { ComponentType } from 'react'

/**
 * Props interface for all tool card components.
 * Tool cards render rich UI for AI tool outputs in the chat widget.
 */
export interface ToolCardProps<T = unknown> {
  /** The data returned from the tool execution */
  data: T
  /** Error message if the tool failed */
  error?: string | null
  /** Current state of the card */
  state: 'loading' | 'success' | 'error'
}

/**
 * Type for a tool card component that accepts ToolCardProps
 */
export type ToolCardComponent<T = unknown> = ComponentType<ToolCardProps<T>>

/**
 * Status level for visual styling
 */
export type StatusLevel = 'normal' | 'attention' | 'alert'

/**
 * Helper to determine status level from data conditions
 */
export function getStatusLevel(conditions: {
  isAlert?: boolean
  isWarning?: boolean
}): StatusLevel {
  if (conditions.isAlert) return 'alert'
  if (conditions.isWarning) return 'attention'
  return 'normal'
}
