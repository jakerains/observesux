'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Loader2, Cloud, Droplets, Wind, Car } from 'lucide-react'
import type { AlertType } from '@/lib/db/alerts'

interface AlertTypeCardProps {
  type: AlertType
  config: Record<string, unknown>
  enabled: boolean
  onSave: (config: Record<string, unknown>, enabled: boolean) => Promise<void>
  onToggle: (enabled: boolean) => Promise<void>
}

const ALERT_INFO: Record<AlertType, {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = {
  weather: {
    title: 'Weather Alerts',
    description: 'NWS severe weather warnings for the Siouxland area',
    icon: Cloud
  },
  river: {
    title: 'River Flooding',
    description: 'Missouri River flood stage alerts',
    icon: Droplets
  },
  air_quality: {
    title: 'Air Quality',
    description: 'AQI threshold alerts for poor air quality',
    icon: Wind
  },
  traffic: {
    title: 'Traffic Incidents',
    description: 'Major traffic incidents and road closures',
    icon: Car
  }
}

const WEATHER_SEVERITIES = ['Moderate', 'Severe', 'Extreme']
const RIVER_STAGES = ['action', 'minor', 'moderate', 'major']
const TRAFFIC_SEVERITIES = ['moderate', 'major', 'critical']

export function AlertTypeCard({
  type,
  config,
  enabled,
  onSave,
  onToggle
}: AlertTypeCardProps) {
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(config)
  const [localEnabled, setLocalEnabled] = useState(enabled)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const info = ALERT_INFO[type]
  const Icon = info.icon

  const handleToggle = async (checked: boolean) => {
    setLocalEnabled(checked)
    await onToggle(checked)
  }

  const handleConfigChange = (key: string, value: unknown) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(localConfig, localEnabled)
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleArrayItem = (key: string, item: string) => {
    const current = (localConfig[key] as string[]) || []
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item]
    handleConfigChange(key, updated)
  }

  const renderConfig = () => {
    switch (type) {
      case 'weather':
        const weatherSeverities = (localConfig.severities as string[]) || ['Severe', 'Extreme']
        return (
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Alert Severities</Label>
            <div className="flex flex-wrap gap-2">
              {WEATHER_SEVERITIES.map(severity => (
                <Badge
                  key={severity}
                  variant={weatherSeverities.includes(severity) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem('severities', severity)}
                >
                  {severity}
                </Badge>
              ))}
            </div>
          </div>
        )

      case 'river':
        const riverStages = (localConfig.stages as string[]) || ['minor', 'moderate', 'major']
        return (
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Flood Stages</Label>
            <div className="flex flex-wrap gap-2">
              {RIVER_STAGES.map(stage => (
                <Badge
                  key={stage}
                  variant={riverStages.includes(stage) ? 'default' : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleArrayItem('stages', stage)}
                >
                  {stage}
                </Badge>
              ))}
            </div>
          </div>
        )

      case 'air_quality':
        const minAqi = (localConfig.minAqi as number) || 101
        return (
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">
              Minimum AQI to Alert: {minAqi}
            </Label>
            <Slider
              value={[minAqi]}
              onValueChange={([value]) => handleConfigChange('minAqi', value)}
              min={51}
              max={201}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>51 (Moderate)</span>
              <span>101 (Unhealthy-Sensitive)</span>
              <span>201 (Very Unhealthy)</span>
            </div>
          </div>
        )

      case 'traffic':
        const trafficSeverities = (localConfig.severities as string[]) || ['major', 'critical']
        return (
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Incident Severities</Label>
            <div className="flex flex-wrap gap-2">
              {TRAFFIC_SEVERITIES.map(severity => (
                <Badge
                  key={severity}
                  variant={trafficSeverities.includes(severity) ? 'default' : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleArrayItem('severities', severity)}
                >
                  {severity}
                </Badge>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{info.title}</CardTitle>
              <CardDescription className="text-sm">{info.description}</CardDescription>
            </div>
          </div>
          <Switch
            checked={localEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardHeader>
      {localEnabled && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {renderConfig()}
            {hasChanges && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
