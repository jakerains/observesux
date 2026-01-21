'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Shield,
  User,
  Bell,
  Star,
  Smartphone,
  MessageSquare,
  Loader2,
  Trash2,
  Mail,
  Calendar,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AdminUser {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string | null
  emailVerified: boolean
  createdAt: string
  alertCount: number
  watchlistCount: number
  pushCount: number
  chatCount: number
}

interface UserActivity {
  alerts: Array<{
    id: string
    alertType: string
    enabled: boolean
    createdAt: string
  }>
  watchlist: Array<{
    id: string
    itemType: string
    itemId: string
    itemName: string | null
    createdAt: string
  }>
  pushSubscriptions: Array<{
    id: string
    createdAt: string
  }>
  chatSessions: Array<{
    id: string
    startedAt: string
    messageCount: number
  }>
}

interface UserDetailResponse {
  user: AdminUser
  activity: UserActivity
}

interface UserDetailDialogProps {
  userId: string | null
  onClose: () => void
  onUserUpdated: () => void
}

export function UserDetailDialog({ userId, onClose, onUserUpdated }: UserDetailDialogProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [activity, setActivity] = useState<UserActivity | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchUserDetail = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch user')
      }

      const data: UserDetailResponse = await res.json()
      setUser(data.user)
      setActivity(data.activity)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch user')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchUserDetail()
    } else {
      setUser(null)
      setActivity(null)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }, [userId, fetchUserDetail])

  const handleRoleChange = async (newRole: string) => {
    if (!user || newRole === user.role) return

    setUpdating(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update role')
      }

      // Update local state
      setUser({ ...user, role: newRole })
      onUserUpdated()
    } catch (err) {
      console.error('Failed to update role:', err)
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!user || deleteConfirmText !== user.email) return

    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      onUserUpdated()
      onClose()
    } catch (err) {
      console.error('Failed to delete user:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  const formatAlertType = (type: string) => {
    const types: Record<string, string> = {
      weather: 'Weather Alerts',
      river: 'River Levels',
      air_quality: 'Air Quality',
      traffic: 'Traffic Events',
    }
    return types[type] || type
  }

  const formatItemType = (type: string) => {
    const types: Record<string, string> = {
      camera: 'Traffic Camera',
      bus_route: 'Bus Route',
      river_gauge: 'River Gauge',
      gas_station: 'Gas Station',
    }
    return types[type] || type
  }

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {loading ? (
          <div className="py-8 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-[300px]" />
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : user ? (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                  <AvatarFallback className="text-lg">{getInitials(user.name, user.email)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="truncate">
                      {user.name || user.email.split('@')[0]}
                    </DialogTitle>
                    {user.role === 'admin' && (
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <DialogDescription className="flex flex-col gap-1 mt-1">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Activity stats summary */}
            <div className="flex items-center gap-4 py-3 px-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.alertCount}</span>
                <span className="text-muted-foreground">alerts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.watchlistCount}</span>
                <span className="text-muted-foreground">watchlist</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.pushCount}</span>
                <span className="text-muted-foreground">push</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.chatCount}</span>
                <span className="text-muted-foreground">chats</span>
              </div>
            </div>

            {/* Tabs for activity details */}
            <Tabs defaultValue="alerts" className="flex-1 min-h-0">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="alerts" className="gap-1.5">
                  <Bell className="h-3.5 w-3.5" />
                  Alerts
                </TabsTrigger>
                <TabsTrigger value="watchlist" className="gap-1.5">
                  <Star className="h-3.5 w-3.5" />
                  Watchlist
                </TabsTrigger>
                <TabsTrigger value="sessions" className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger value="manage" className="gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Manage
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[200px] mt-3">
                <TabsContent value="alerts" className="mt-0">
                  {activity?.alerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No alert subscriptions
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activity?.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div>
                            <p className="text-sm font-medium">{formatAlertType(alert.alertType)}</p>
                            <p className="text-xs text-muted-foreground">
                              Created {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge variant={alert.enabled ? 'default' : 'secondary'}>
                            {alert.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="watchlist" className="mt-0">
                  {activity?.watchlist.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No watchlist items
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activity?.watchlist.map((item) => (
                        <div key={item.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{formatItemType(item.itemType)}</Badge>
                            <span className="text-sm font-medium truncate">
                              {item.itemName || item.itemId}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Added {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="sessions" className="mt-0">
                  {activity?.chatSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No chat sessions
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activity?.chatSessions.map((session) => (
                        <div key={session.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {format(new Date(session.startedAt), 'MMM d, yyyy h:mm a')}
                            </span>
                            <Badge variant="secondary">{session.messageCount} messages</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="manage" className="mt-0 space-y-6">
                  {/* Role Management */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Role</h4>
                    <div className="flex items-center gap-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-[180px] justify-between"
                            disabled={updating}
                          >
                            <span className="flex items-center gap-2">
                              {user.role === 'admin' ? (
                                <>
                                  <Shield className="h-4 w-4" />
                                  Admin
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4" />
                                  User
                                </>
                              )}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleRoleChange('user')}>
                            <User className="h-4 w-4 mr-2" />
                            User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange('admin')}>
                            <Shield className="h-4 w-4 mr-2" />
                            Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Admins can access the admin panel and manage other users.
                    </p>
                  </div>

                  {/* Delete User */}
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                    {!showDeleteConfirm ? (
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete User
                      </Button>
                    ) : (
                      <div className="space-y-3 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                        <p className="text-sm">
                          This will permanently delete the user and all their data including alerts, watchlist,
                          push subscriptions, and preferences. This action cannot be undone.
                        </p>
                        <p className="text-sm font-medium">
                          Type <code className="bg-muted px-1.5 py-0.5 rounded">{user.email}</code> to confirm:
                        </p>
                        <Input
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Enter email to confirm"
                          className="max-w-sm"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteConfirmText !== user.email || deleting}
                            className="gap-2"
                          >
                            {deleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Confirm Delete
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              setDeleteConfirmText('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Note: You cannot delete your own account from this panel.
                    </p>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
