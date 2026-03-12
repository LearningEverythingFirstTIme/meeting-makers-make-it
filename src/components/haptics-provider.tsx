'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useWebHaptics } from 'web-haptics/react'

interface HapticsContextType {
  trigger: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => void
  isSupported: boolean
}

const HapticsContext = createContext<HapticsContextType>({
  trigger: () => {},
  isSupported: false,
})

export function HapticsProvider({ children }: { children: ReactNode }) {
  const { trigger, isSupported } = useWebHaptics()

  // Wrap trigger to make it sync and handle the Promise
  const wrappedTrigger = (type?: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') => {
    if (!isSupported || !type) return
    const triggerFn = trigger
    if (!triggerFn) return
    // Fire and forget - don't await
    void triggerFn(type)
  }

  return (
    <HapticsContext.Provider value={{ trigger: wrappedTrigger, isSupported }}>
      {children}
    </HapticsContext.Provider>
  )
}

export function useHaptics() {
  return useContext(HapticsContext)
}