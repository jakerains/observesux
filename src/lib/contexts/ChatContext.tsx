'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ChatContextValue {
  isOpen: boolean
  isFullscreen: boolean
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
  toggleFullscreen: () => void
  setFullscreen: (value: boolean) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => {
    setIsOpen(false)
    // Reset fullscreen when closing
    setIsFullscreen(false)
  }, [])
  const toggleChat = useCallback(() => setIsOpen(prev => !prev), [])
  const toggleFullscreen = useCallback(() => setIsFullscreen(prev => !prev), [])
  const setFullscreen = useCallback((value: boolean) => setIsFullscreen(value), [])

  return (
    <ChatContext.Provider value={{
      isOpen,
      isFullscreen,
      openChat,
      closeChat,
      toggleChat,
      toggleFullscreen,
      setFullscreen
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatSheet() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatSheet must be used within a ChatProvider')
  }
  return context
}
