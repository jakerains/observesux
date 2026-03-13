import Link from 'next/link'
import { Home, Search, Newspaper, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription>
            We couldn&apos;t find what you were looking for. It may have been moved or no longer exists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Here are some places to check out instead:</p>
          </div>
          <div className="grid gap-2">
            <Button asChild variant="default" className="w-full justify-start">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/digest">
                <Newspaper className="h-4 w-4 mr-2" />
                Daily Digest
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/council">
                <Landmark className="h-4 w-4 mr-2" />
                Council Recaps
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
