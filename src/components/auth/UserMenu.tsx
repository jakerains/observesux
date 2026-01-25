'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, Bell, Star, Newspaper } from 'lucide-react'
import { useSession, signOut } from '@/lib/auth/client'
import { cn } from '@/lib/utils'
import { SettingsModal } from '@/components/dashboard/SettingsModal'

export function UserMenu() {
  const { data: session, isPending } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isDashboardSettingsOpen, setDashboardSettingsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch - only render dynamic content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Always render the same thing on server and initial client render
  // to avoid hydration mismatch
  if (!mounted || isPending) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <User className="h-4 w-4 opacity-50" />
      </Button>
    )
  }

  // Not logged in - show sign in button
  if (!session?.user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-3 text-sm"
        asChild
      >
        <a href="/auth/sign-in">Sign in</a>
      </Button>
    )
  }

  // Logged in - show user menu
  const userInitial = session.user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              isOpen && "bg-accent"
            )}
          >
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
              {userInitial}
            </div>
            <span className="sr-only">User menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 z-[9999]">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Account</p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/account/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setDashboardSettingsOpen(true)}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            Dashboard Settings
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/account/alerts" className="cursor-pointer">
              <Bell className="mr-2 h-4 w-4" />
              My Alerts
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/account/watchlist" className="cursor-pointer">
              <Star className="mr-2 h-4 w-4" />
              My Watchlist
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/account/digest" className="cursor-pointer">
              <Newspaper className="mr-2 h-4 w-4" />
              Siouxland Digest
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsModal
        trigger={null}
        open={isDashboardSettingsOpen}
        onOpenChange={setDashboardSettingsOpen}
      />
    </>
  )
}
