'use client'

import { DashboardCard } from './DashboardCard'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFlights } from '@/lib/hooks/useDataFetching'
import { Plane, PlaneLanding, PlaneTakeoff, Clock, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Flight } from '@/types'

function getStatusColor(status: Flight['status']) {
  switch (status) {
    case 'arrived':
    case 'departed':
      return 'bg-green-500'
    case 'boarding':
    case 'landed':
      return 'bg-blue-500'
    case 'in_air':
      return 'bg-sky-500'
    case 'delayed':
      return 'bg-yellow-500'
    case 'cancelled':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

function getStatusLabel(status: Flight['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

interface FlightRowProps {
  flight: Flight
  type: 'arrival' | 'departure'
}

function FlightRow({ flight, type }: FlightRowProps) {
  const city = type === 'arrival' ? flight.originCity : flight.destinationCity
  const code = type === 'arrival' ? flight.origin : flight.destination

  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[60px]">
          <div className="font-mono font-bold text-sm">{flight.flightNumber}</div>
          <div className="text-xs text-muted-foreground">{flight.airline}</div>
        </div>

        <div className="flex items-center gap-1">
          {type === 'arrival' ? (
            <PlaneLanding className="h-4 w-4 text-muted-foreground" />
          ) : (
            <PlaneTakeoff className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <div className="text-sm font-medium">{code}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
              {city}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-mono text-sm">
            {format(new Date(flight.scheduledTime), 'h:mm a')}
          </div>
          {flight.gate && (
            <div className="text-xs text-muted-foreground">
              Gate {flight.gate}
            </div>
          )}
        </div>

        <Badge
          variant="outline"
          className={cn(
            "min-w-[70px] justify-center text-xs",
            flight.status === 'delayed' && "border-yellow-500 text-yellow-500",
            flight.status === 'cancelled' && "border-red-500 text-red-500"
          )}
        >
          <span className={cn("w-2 h-2 rounded-full mr-1.5", getStatusColor(flight.status))} />
          {getStatusLabel(flight.status)}
        </Badge>
      </div>
    </div>
  )
}

export function FlightBoard() {
  const { data: flightsData, error, isLoading } = useFlights()

  const flights = flightsData?.data
  const arrivals = flights?.arrivals || []
  const departures = flights?.departures || []
  const status = error ? 'error' : isLoading ? 'loading' : 'live'

  if (isLoading) {
    return (
      <DashboardCard title="SUX Airport" icon={<Plane className="h-4 w-4" />} status="loading">
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Sioux Gateway Airport (SUX)"
      icon={<Plane className="h-4 w-4" />}
      status={status}
      lastUpdated={flightsData?.timestamp ? new Date(flightsData.timestamp) : undefined}
    >
      <Tabs defaultValue="arrivals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="arrivals" className="flex items-center gap-1">
            <PlaneLanding className="h-4 w-4" />
            Arrivals ({arrivals.length})
          </TabsTrigger>
          <TabsTrigger value="departures" className="flex items-center gap-1">
            <PlaneTakeoff className="h-4 w-4" />
            Departures ({departures.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arrivals" className="mt-3">
          <ScrollArea className="h-[200px]">
            {arrivals.length > 0 ? (
              <div className="space-y-1">
                {arrivals.map((flight) => (
                  <FlightRow key={flight.flightNumber} flight={flight} type="arrival" />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <PlaneLanding className="h-8 w-8 mx-auto mb-2" />
                <p>No scheduled arrivals</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="departures" className="mt-3">
          <ScrollArea className="h-[200px]">
            {departures.length > 0 ? (
              <div className="space-y-1">
                {departures.map((flight) => (
                  <FlightRow key={flight.flightNumber} flight={flight} type="departure" />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <PlaneTakeoff className="h-8 w-8 mx-auto mb-2" />
                <p>No scheduled departures</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Airport Info */}
      <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          KSUX · 42.40°N, 96.38°W
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {format(new Date(), 'h:mm a')} Local
        </span>
      </div>
    </DashboardCard>
  )
}
