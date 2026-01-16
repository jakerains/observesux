'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { ReactNode, useState, useEffect } from 'react'

interface DraggableWidgetProps {
  id: string
  children: ReactNode
  className?: string
}

export function DraggableWidget({ id, children, className = '' }: DraggableWidgetProps) {
  const [isMounted, setIsMounted] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  // Only enable drag functionality after hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const style = isMounted ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  } : {}

  return (
    <div
      ref={isMounted ? setNodeRef : undefined}
      style={style}
      className={`relative group h-full ${className}`}
      data-widget-id={id}
    >
      {/* Drag Handle - visible on hover, only after mount */}
      {isMounted && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg hover:scale-110"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Widget Content - stretched to fill */}
      <div className="h-full [&>*]:h-full">
        {children}
      </div>
    </div>
  )
}
