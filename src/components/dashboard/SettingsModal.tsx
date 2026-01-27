'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Settings, RotateCcw, GripVertical, Eye, EyeOff } from 'lucide-react'
import { useDashboardLayout, WidgetConfig } from '@/lib/contexts/DashboardLayoutContext'
import { track } from '@vercel/analytics'

interface SettingsModalProps {
  trigger?: React.ReactNode | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function getWidgetIcon(id: string): string {
  const icons: Record<string, string> = {
    'weather': '🌤️',
    'river': '🌊',
    'air-quality': '💨',
    'cameras': '📷',
    'traffic-events': '🚧',
    'scanner': '📻',
    'outages': '⚡',
    'flights': '✈️',
    'news': '📰',
    'earthquakes': '🌍',
    'map': '🗺️',
  }
  return icons[id] || '📊'
}

function WidgetToggle({ widget, onToggle }: { widget: WidgetConfig; onToggle: (enabled: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-xl">{getWidgetIcon(widget.id)}</span>
        <div className="flex flex-col">
          <Label htmlFor={`widget-${widget.id}`} className="text-sm font-medium cursor-pointer">
            {widget.name}
          </Label>
          <span className="text-xs text-muted-foreground">{widget.description}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {widget.size}
        </Badge>
        <Switch
          id={`widget-${widget.id}`}
          checked={widget.enabled}
          onCheckedChange={onToggle}
        />
      </div>
    </div>
  )
}

export function SettingsModal({ trigger, open: openProp, onOpenChange }: SettingsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const { widgets, widgetOrder, setWidgetEnabled, resetToDefault } = useDashboardLayout()

  // Get widgets in order
  const orderedWidgets = widgetOrder
    .map(id => widgets.find(w => w.id === id))
    .filter((w): w is WidgetConfig => w !== undefined)

  const enabledCount = widgets.filter(w => w.enabled).length
  const totalCount = widgets.length

  const handleReset = () => {
    if (confirm('Reset all dashboard settings to defaults? This will restore all widgets and their positions.')) {
      track('dashboard_reset')
      resetToDefault()
    }
  }

  const handleEnableAll = () => {
    track('widgets_show_all')
    orderedWidgets.forEach(widget => {
      if (!widget.enabled) {
        setWidgetEnabled(widget.id, true)
      }
    })
  }

  const handleDisableAll = () => {
    track('widgets_hide_all')
    orderedWidgets.forEach(widget => {
      if (widget.enabled) {
        setWidgetEnabled(widget.id, false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Settings
          </DialogTitle>
          <DialogDescription>
            Customize which widgets appear on your dashboard. Drag widgets on the dashboard to reorder them.
          </DialogDescription>
        </DialogHeader>

        {/* Quick Actions */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{enabledCount}/{totalCount}</Badge>
            <span>widgets enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEnableAll}>
              <Eye className="h-3 w-3 mr-1" />
              Show All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDisableAll}>
              <EyeOff className="h-3 w-3 mr-1" />
              Hide All
            </Button>
          </div>
        </div>

        <Separator />

        {/* Widget Toggles */}
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-1">
            {orderedWidgets.map((widget) => (
              <WidgetToggle
                key={widget.id}
                widget={widget}
                onToggle={(enabled) => {
                  track('widget_toggled', { widget: widget.id, enabled })
                  setWidgetEnabled(widget.id, enabled)
                }}
              />
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {/* Drag Instructions */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <GripVertical className="h-4 w-4" />
          <span>Drag widgets by their header to reorder them on the dashboard</span>
        </div>

        {/* Reset Button */}
        <div className="flex justify-between items-center pt-2">
          <Button variant="destructive" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
