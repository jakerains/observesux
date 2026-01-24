import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Offline | Siouxland.online',
  description: 'You are currently offline',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">You&apos;re Offline</CardTitle>
          <CardDescription>
            It looks like you&apos;ve lost your internet connection. Some features may be unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>While offline, you can:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>View previously cached dashboard data</li>
              <li>Access recently viewed pages</li>
              <li>Review saved alerts and preferences</li>
            </ul>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>You&apos;ll need internet access to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Get real-time weather updates</li>
              <li>View live traffic cameras</li>
              <li>Check current river levels</li>
              <li>Receive push notifications</li>
            </ul>
          </div>
          <Button
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
