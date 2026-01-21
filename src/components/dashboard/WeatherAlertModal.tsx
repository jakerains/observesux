'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, MapPin, Building, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { WeatherAlert } from '@/types'

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'Extreme': return 'bg-red-600 text-white'
    case 'Severe': return 'bg-orange-500 text-white'
    case 'Moderate': return 'bg-yellow-500 text-black'
    case 'Minor': return 'bg-blue-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

function getUrgencyColor(urgency: string) {
  switch (urgency) {
    case 'Immediate': return 'text-red-500'
    case 'Expected': return 'text-orange-500'
    case 'Future': return 'text-yellow-500'
    default: return 'text-muted-foreground'
  }
}

interface WeatherAlertModalProps {
  alert: WeatherAlert
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WeatherAlertModal({ alert, open, onOpenChange }: WeatherAlertModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Weather Alert
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Event name and severity */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold">{alert.event}</h3>
              <Badge className={cn("shrink-0", getSeverityColor(alert.severity))}>
                {alert.severity}
              </Badge>
            </div>

            {/* Headline */}
            <p className="text-sm font-medium text-foreground">
              {alert.headline}
            </p>

            {/* Timing info */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Effective: </span>
                  <span className="font-medium">
                    {format(new Date(alert.effective), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Expires: </span>
                  <span className="font-medium">
                    {format(new Date(alert.expires), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            </div>

            {/* Urgency and certainty badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn("text-xs", getUrgencyColor(alert.urgency))}>
                {alert.urgency} urgency
              </Badge>
              <Badge variant="outline" className="text-xs">
                {alert.certainty} certainty
              </Badge>
            </div>

            {/* Area description */}
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-muted-foreground">Affected area: </span>
                <span>{alert.areaDesc}</span>
              </div>
            </div>

            {/* Full description */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {alert.description}
              </p>
            </div>

            {/* Instructions (if present) */}
            {alert.instruction && (
              <div className="space-y-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                  Instructions
                </h4>
                <p className="text-sm whitespace-pre-wrap">
                  {alert.instruction}
                </p>
              </div>
            )}

            {/* Sender */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <Building className="h-3 w-3" />
              <span>Issued by: {alert.sender}</span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
