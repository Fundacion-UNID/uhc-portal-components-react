'use client'

import { useEffect, useState } from 'react'

/** Renders one accessible status and elapsed counter for a long portal operation. */
export function ElapsedOperationStatus({ busy, status, fallback, tone = 'warning', testId }: Readonly<{
  busy: boolean
  status: string
  fallback: string
  tone?: 'info' | 'warning' | 'success' | 'error'
  testId?: string
}>) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  useEffect(() => {
    if (!busy) {
      setElapsedSeconds(0)
      return
    }
    const startedAt = Date.now()
    setElapsedSeconds(0)
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [busy])
  const text = status || (busy ? fallback : '')
  if (!text) return null
  return <p role={tone === 'error' ? 'alert' : 'status'} data-testid={testId} className={`notice notice-${tone}`}>
    {text}{busy ? ` (${elapsedSeconds}s)` : ''}
  </p>
}
