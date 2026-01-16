'use client'

import { useState } from 'react'
import Image from 'next/image'
import { DashboardCard } from './DashboardCard'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCameras } from '@/lib/hooks/useDataFetching'
import { Camera, Video, Maximize2, RefreshCw, MapPin } from 'lucide-react'
import type { TrafficCamera } from '@/types'

interface CameraCardProps {
  camera: TrafficCamera
  onExpand: (camera: TrafficCamera) => void
}

function CameraCard({ camera, onExpand }: CameraCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageKey, setImageKey] = useState(0)

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation()
    setImageError(false)
    setImageKey(prev => prev + 1)
  }

  return (
    <div
      className="relative group cursor-pointer rounded-lg overflow-hidden border bg-card hover:border-primary transition-colors"
      onClick={() => onExpand(camera)}
    >
      {/* Camera Image */}
      <div className="relative aspect-video bg-muted">
        {camera.snapshotUrl && !imageError ? (
          <Image
            key={imageKey}
            src={`${camera.snapshotUrl}?t=${Date.now()}`}
            alt={camera.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized // Required for external URLs with cache-busting
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Camera className="h-8 w-8" />
          </div>
        )}

        {/* Overlay with controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Live indicator */}
        {camera.streamUrl && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              <Video className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          </div>
        )}
      </div>

      {/* Camera Info */}
      <div className="p-2">
        <h4 className="text-xs font-medium truncate">{camera.name}</h4>
        {camera.roadway && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {camera.roadway}
            {camera.direction && ` ${camera.direction}`}
          </p>
        )}
      </div>
    </div>
  )
}

interface CameraModalProps {
  camera: TrafficCamera | null
  onClose: () => void
}

function CameraModal({ camera, onClose }: CameraModalProps) {
  const [showVideo, setShowVideo] = useState(false)

  if (!camera) return null

  return (
    <Dialog open={!!camera} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {camera.name}
          </DialogTitle>
        </DialogHeader>

        {camera.streamUrl && (
          <Tabs defaultValue="snapshot" onValueChange={(v) => setShowVideo(v === 'video')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
              <TabsTrigger value="video">Live Video</TabsTrigger>
            </TabsList>

            <TabsContent value="snapshot" className="mt-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {camera.snapshotUrl ? (
                  <Image
                    src={`${camera.snapshotUrl}?t=${Date.now()}`}
                    alt={camera.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {showVideo && camera.streamUrl && (
                  <video
                    className="w-full h-full"
                    controls
                    autoPlay
                    muted
                  >
                    <source src={camera.streamUrl} type="application/x-mpegURL" />
                    Your browser does not support HLS video streams.
                  </video>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: HLS streams require browser support. Some browsers may need HLS.js library.
              </p>
            </TabsContent>
          </Tabs>
        )}

        {!camera.streamUrl && camera.snapshotUrl && (
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <Image
              src={`${camera.snapshotUrl}?t=${Date.now()}`}
              alt={camera.name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {camera.roadway && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {camera.roadway} {camera.direction && `(${camera.direction})`}
            </span>
          )}
          <span>
            {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function CameraGrid() {
  const { data: camerasData, error, isLoading } = useCameras()
  const [selectedCamera, setSelectedCamera] = useState<TrafficCamera | null>(null)
  const [showAllCameras, setShowAllCameras] = useState(false)

  const cameras = camerasData?.data || []
  const displayedCameras = showAllCameras ? cameras : cameras.slice(0, 6)
  const status = error ? 'error' : isLoading ? 'loading' : 'live'

  if (isLoading) {
    return (
      <DashboardCard title="Traffic Cameras" icon={<Camera className="h-4 w-4" />} status="loading">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      </DashboardCard>
    )
  }

  return (
    <>
      <DashboardCard
        title="Traffic Cameras"
        icon={<Camera className="h-4 w-4" />}
        status={status}
        lastUpdated={camerasData?.timestamp ? new Date(camerasData.timestamp) : undefined}
      >
        {cameras.length > 0 ? (
          <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${showAllCameras ? 'max-h-[600px] overflow-y-auto' : ''}`}>
            {displayedCameras.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
                onExpand={setSelectedCamera}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Camera className="h-8 w-8 mx-auto mb-2" />
            <p>No cameras available</p>
          </div>
        )}

        {cameras.length > 6 && (
          <div className="mt-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllCameras(!showAllCameras)}
            >
              {showAllCameras ? 'Show fewer cameras' : `View all ${cameras.length} cameras`}
            </Button>
          </div>
        )}
      </DashboardCard>

      <CameraModal
        camera={selectedCamera}
        onClose={() => setSelectedCamera(null)}
      />
    </>
  )
}
