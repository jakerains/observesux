'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Search,
  RefreshCw,
  Users,
  Shield,
  User,
  Bell,
  Star,
  Smartphone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserDetailDialog } from './UserDetailDialog'

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

interface UsersResponse {
  users: AdminUser[]
  total: number
  limit: number
  offset: number
}

export function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [offset, setOffset] = useState(0)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const limit = 20

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setOffset(0) // Reset pagination on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      params.set('limit', limit.toString())
      params.set('offset', offset.toString())

      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed to fetch users')

      const data: UsersResponse = await res.json()
      setUsers(data.users)
      setTotal(data.total)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUsers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, roleFilter, offset])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value)
    setOffset(0) // Reset pagination on filter change
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

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-between">
                {roleFilter === 'all' ? 'All roles' : roleFilter === 'admin' ? 'Admins' : 'Users'}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleRoleFilterChange('all')}>
                All roles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleFilterChange('admin')}>
                <Shield className="h-4 w-4 mr-2" />
                Admins
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleFilterChange('user')}>
                <User className="h-4 w-4 mr-2" />
                Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchUsers}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {total} users
        </span>
        {roleFilter !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            {roleFilter === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
            {roleFilter}
          </Badge>
        )}
        {debouncedSearch && (
          <Badge variant="outline">
            Searching: {debouncedSearch}
          </Badge>
        )}
      </div>

      {/* Users list */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No users found</p>
            {(debouncedSearch || roleFilter !== 'all') && (
              <p className="text-xs mt-1">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                  <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium truncate">
                      {user.name || user.email.split('@')[0]}
                    </span>
                    {user.role === 'admin' && (
                      <Badge variant="default" className="gap-1 h-5">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Activity stats */}
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                  {user.alertCount > 0 && (
                    <span className="flex items-center gap-1" title="Alert subscriptions">
                      <Bell className="h-3.5 w-3.5" />
                      {user.alertCount}
                    </span>
                  )}
                  {user.watchlistCount > 0 && (
                    <span className="flex items-center gap-1" title="Watchlist items">
                      <Star className="h-3.5 w-3.5" />
                      {user.watchlistCount}
                    </span>
                  )}
                  {user.pushCount > 0 && (
                    <span className="flex items-center gap-1" title="Push subscriptions">
                      <Smartphone className="h-3.5 w-3.5" />
                      {user.pushCount}
                    </span>
                  )}
                  {user.chatCount > 0 && (
                    <span className="flex items-center gap-1" title="Chat sessions">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {user.chatCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User detail dialog */}
      <UserDetailDialog
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onUserUpdated={fetchUsers}
      />
    </div>
  )
}
