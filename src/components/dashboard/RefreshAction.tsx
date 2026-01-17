'use client'

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RefreshActionProps {
  onRefresh: () => void
  isLoading?: boolean
  isValidating?: boolean
  label?: string
}

export function RefreshAction({
  onRefresh,
  isLoading = false,
  isValidating = false,
  label = 'Refresh',
}: RefreshActionProps) {
  const isDisabled = isLoading || isValidating
  const tooltipLabel = isValidating ? 'Refreshing…' : label

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onRefresh}
          disabled={isDisabled}
          aria-label={label}
        >
          <RefreshCw className={cn("h-4 w-4", isValidating && "animate-spin")} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltipLabel}</TooltipContent>
    </Tooltip>
  )
}
