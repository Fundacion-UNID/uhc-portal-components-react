'use client'

import { useState, type ReactNode, type SyntheticEvent } from 'react'

/** Keeps one portal phase mounted while allowing its content to be collapsed. */
export function CollapsiblePortalSection({
  title,
  description,
  children,
  className = '',
  initiallyOpen = true,
}: Readonly<{
  title: string
  description?: string
  children: ReactNode
  className?: string
  initiallyOpen?: boolean
}>) {
  const [open, setOpen] = useState(initiallyOpen)
  function retainDisclosureState(event: SyntheticEvent<HTMLDetailsElement>) {
    setOpen(event.currentTarget.open)
  }
  return <details
    className={`research-import-disclosure ${className}`.trim()}
    open={open}
    onToggle={retainDisclosureState}
  >
    <summary><strong>{title}</strong>{description ? <span>{description}</span> : null}</summary>
    <div className="research-import-disclosure-content">{children}</div>
  </details>
}
