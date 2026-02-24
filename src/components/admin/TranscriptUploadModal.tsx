'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, X, Loader2, AlertCircle, ListVideo } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CouncilMeeting } from '@/types/council-meetings'
import { format } from 'date-fns'

export interface TranscriptUploadData {
  title: string
  meetingDate: string
  videoId?: string
  transcript: string
}

export interface TranscriptPrefillData {
  title: string
  videoId: string
  meetingDate?: string
}

interface TranscriptUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TranscriptUploadData) => void
  isSubmitting?: boolean
  meetings?: CouncilMeeting[]
  prefillData?: TranscriptPrefillData | null
}

interface ValidationErrors {
  title?: string
  meetingDate?: string
  videoId?: string
  transcript?: string
}

export function TranscriptUploadModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  meetings = [],
  prefillData = null,
}: TranscriptUploadModalProps) {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [videoId, setVideoId] = useState('')
  const [transcript, setTranscript] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Apply prefill data when the modal opens with prefill values
  useEffect(() => {
    if (open && prefillData) {
      setTitle(prefillData.title)
      setVideoId(prefillData.videoId)
      setMeetingDate(prefillData.meetingDate || '')
      setSelectedMeetingId('new')
      setErrors({})
    }
  }, [open, prefillData])

  // Group meetings by status for the dropdown
  const groupedMeetings = useMemo(() => {
    const needsTranscript = meetings.filter(
      (m) => m.status === 'no_captions' || m.status === 'failed'
    )
    const completed = meetings.filter((m) => m.status === 'completed')
    const other = meetings.filter(
      (m) => m.status !== 'no_captions' && m.status !== 'failed' && m.status !== 'completed'
    )
    return { needsTranscript, completed, other }
  }, [meetings])

  const handleMeetingSelect = useCallback((meetingId: string) => {
    setSelectedMeetingId(meetingId)
    if (meetingId === 'new') {
      // Clear form for new manual entry
      setTitle('')
      setMeetingDate('')
      setVideoId('')
      setErrors({})
      return
    }

    const meeting = meetings.find((m) => m.id === meetingId)
    if (meeting) {
      setTitle(meeting.title)
      setMeetingDate(meeting.meetingDate || '')
      setVideoId(meeting.videoId)
      setErrors({})
    }
  }, [meetings])

  const formatMeetingDate = (dateStr: string | null): string => {
    if (!dateStr) return ''
    try {
      return format(new Date(dateStr), 'MMM d, yyyy')
    } catch {
      return dateStr
    }
  }

  const resetForm = useCallback(() => {
    setSelectedMeetingId('')
    setTitle('')
    setMeetingDate('')
    setVideoId('')
    setTranscript('')
    setFileName(null)
    setErrors({})
  }, [])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetForm()
      }
      onOpenChange(newOpen)
    },
    [onOpenChange, resetForm]
  )

  const validateField = useCallback(
    (field: keyof ValidationErrors, value: string): string | undefined => {
      switch (field) {
        case 'title':
          if (!value.trim()) return 'Title is required'
          if (value.trim().length < 10) return 'Title must be at least 10 characters'
          return undefined
        case 'meetingDate':
          if (!value) return 'Meeting date is required'
          const date = new Date(value)
          if (isNaN(date.getTime())) return 'Invalid date'
          if (date > new Date()) return 'Date cannot be in the future'
          return undefined
        case 'videoId':
          if (value && !/^[a-zA-Z0-9_-]{11}$/.test(value)) {
            return 'Invalid YouTube video ID (should be 11 characters)'
          }
          return undefined
        case 'transcript':
          if (!value.trim()) return 'Transcript is required'
          if (value.trim().length < 500) return 'Transcript must be at least 500 characters'
          return undefined
        default:
          return undefined
      }
    },
    []
  )

  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {
      title: validateField('title', title),
      meetingDate: validateField('meetingDate', meetingDate),
      videoId: validateField('videoId', videoId),
      transcript: validateField('transcript', transcript),
    }
    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }, [title, meetingDate, videoId, transcript, validateField])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!validate()) return

      onSubmit({
        title: title.trim(),
        meetingDate,
        videoId: videoId.trim() || undefined,
        transcript: transcript.trim(),
      })
    },
    [title, meetingDate, videoId, transcript, validate, onSubmit]
  )

  const handleFileRead = useCallback((file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      setErrors((prev) => ({ ...prev, transcript: 'Only .md and .txt files are accepted' }))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setTranscript(text)
      setFileName(file.name)
      setErrors((prev) => ({ ...prev, transcript: validateField('transcript', text) }))
    }
    reader.onerror = () => {
      setErrors((prev) => ({ ...prev, transcript: 'Failed to read file' }))
    }
    reader.readAsText(file)
  }, [validateField])

  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer?.files[0]
      if (file) {
        handleFileRead(file)
      }
    },
    [handleFileRead]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileRead(file)
      }
    },
    [handleFileRead]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const clearFile = useCallback(() => {
    setTranscript('')
    setFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Transcript
          </DialogTitle>
          <DialogDescription>
            Manually upload a transcript for a council meeting. This can be used to provide
            transcripts when YouTube captions are unavailable or to override auto-generated ones.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meeting Selector */}
          {meetings.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="meeting-select">
                <div className="flex items-center gap-2">
                  <ListVideo className="h-4 w-4" />
                  Select Existing Meeting (optional)
                </div>
              </Label>
              <Select value={selectedMeetingId} onValueChange={handleMeetingSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a meeting or enter details manually..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectGroup>
                    <SelectItem value="new">
                      <span className="text-muted-foreground">Enter details manually</span>
                    </SelectItem>
                  </SelectGroup>

                  {groupedMeetings.needsTranscript.length > 0 && (
                    <>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Needs Transcript</SelectLabel>
                        {groupedMeetings.needsTranscript.map((meeting) => (
                          <SelectItem key={meeting.id} value={meeting.id}>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={meeting.status === 'failed' ? 'destructive' : 'outline'}
                                className="text-[10px] px-1 py-0"
                              >
                                {meeting.status === 'no_captions' ? 'No captions' : 'Failed'}
                              </Badge>
                              <span className="truncate max-w-[300px]">
                                {formatMeetingDate(meeting.meetingDate)} — {meeting.title}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </>
                  )}

                  {groupedMeetings.completed.length > 0 && (
                    <>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Completed (Override)</SelectLabel>
                        {groupedMeetings.completed.slice(0, 10).map((meeting) => (
                          <SelectItem key={meeting.id} value={meeting.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                v{meeting.version}
                              </Badge>
                              <span className="truncate max-w-[300px]">
                                {formatMeetingDate(meeting.meetingDate)} — {meeting.title}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {groupedMeetings.completed.length > 10 && (
                          <SelectLabel className="text-muted-foreground/70">
                            +{groupedMeetings.completed.length - 10} more...
                          </SelectLabel>
                        )}
                      </SelectGroup>
                    </>
                  )}

                  {groupedMeetings.other.length > 0 && (
                    <>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Other</SelectLabel>
                        {groupedMeetings.other.map((meeting) => (
                          <SelectItem key={meeting.id} value={meeting.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {meeting.status}
                              </Badge>
                              <span className="truncate max-w-[300px]">
                                {formatMeetingDate(meeting.meetingDate)} — {meeting.title}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a meeting to pre-fill the details below, or leave empty to create a new entry.
              </p>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Meeting Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="City of Sioux City Council Meeting - January 15, 2026"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: validateField('title', e.target.value) }))
                }
              }}
              onBlur={(e) =>
                setErrors((prev) => ({ ...prev, title: validateField('title', e.target.value) }))
              }
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Meeting Date */}
          <div className="space-y-2">
            <Label htmlFor="meetingDate">
              Meeting Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="meetingDate"
              type="date"
              value={meetingDate}
              onChange={(e) => {
                setMeetingDate(e.target.value)
                if (errors.meetingDate) {
                  setErrors((prev) => ({
                    ...prev,
                    meetingDate: validateField('meetingDate', e.target.value),
                  }))
                }
              }}
              onBlur={(e) =>
                setErrors((prev) => ({
                  ...prev,
                  meetingDate: validateField('meetingDate', e.target.value),
                }))
              }
              aria-invalid={!!errors.meetingDate}
            />
            {errors.meetingDate && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.meetingDate}
              </p>
            )}
          </div>

          {/* Video ID (optional) */}
          <div className="space-y-2">
            <Label htmlFor="videoId">YouTube Video ID (optional)</Label>
            <Input
              id="videoId"
              placeholder="dQw4w9WgXcQ"
              value={videoId}
              onChange={(e) => {
                setVideoId(e.target.value)
                if (errors.videoId) {
                  setErrors((prev) => ({
                    ...prev,
                    videoId: validateField('videoId', e.target.value),
                  }))
                }
              }}
              onBlur={(e) =>
                setErrors((prev) => ({
                  ...prev,
                  videoId: validateField('videoId', e.target.value),
                }))
              }
              aria-invalid={!!errors.videoId}
            />
            <p className="text-xs text-muted-foreground">
              If provided, this links the transcript to an existing YouTube video. Leave empty for
              purely manual entries.
            </p>
            {errors.videoId && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.videoId}
              </p>
            )}
          </div>

          {/* Transcript */}
          <div className="space-y-2">
            <Label htmlFor="transcript">
              Transcript <span className="text-destructive">*</span>
            </Label>

            {/* File drop zone */}
            <div
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                errors.transcript && 'border-destructive/50'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              {fileName ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{fileName}</span>
                  <span className="text-xs text-muted-foreground">
                    ({transcript.length.toLocaleString()} chars)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearFile()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drop a <strong>.md</strong> or <strong>.txt</strong> file here, or click to
                    browse
                  </p>
                </div>
              )}
            </div>

            {/* Textarea fallback */}
            <Textarea
              id="transcript"
              placeholder="Paste transcript text here, or use the file upload above..."
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value)
                setFileName(null) // Clear file name if user types directly
                if (errors.transcript) {
                  setErrors((prev) => ({
                    ...prev,
                    transcript: validateField('transcript', e.target.value),
                  }))
                }
              }}
              onBlur={(e) =>
                setErrors((prev) => ({
                  ...prev,
                  transcript: validateField('transcript', e.target.value),
                }))
              }
              className="min-h-[200px] font-mono text-xs"
              aria-invalid={!!errors.transcript}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{transcript.length.toLocaleString()} characters</span>
              {transcript.length > 0 && transcript.length < 500 && (
                <span className="text-yellow-600">Minimum 500 characters required</span>
              )}
            </div>
            {errors.transcript && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.transcript}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Transcript
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
