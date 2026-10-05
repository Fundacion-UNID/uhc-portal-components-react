'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export type PortalCurrentSubject = Readonly<{
  id: string
  displayName: string
  photoUrl?: string
  secondaryLabel?: string
}>

export type PortalCurrentSubjectLabels = Readonly<{
  current: string
  change: string
}>

export type PortalCurrentSubjectRegistration = Readonly<{
  subject?: PortalCurrentSubject
  labels: PortalCurrentSubjectLabels
  canChange: boolean
  onChange?: () => void
}>

type PortalCurrentSubjectContextValue = Readonly<{
  registration?: PortalCurrentSubjectRegistration
  setRegistration: (registration?: PortalCurrentSubjectRegistration) => void
}>

const PortalCurrentSubjectContext = createContext<PortalCurrentSubjectContextValue | undefined>(undefined)

export function PortalCurrentSubjectProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [registration, setRegistration] = useState<PortalCurrentSubjectRegistration>()
  return <PortalCurrentSubjectContext.Provider value={{ registration, setRegistration }}>{children}</PortalCurrentSubjectContext.Provider>
}

export function usePortalCurrentSubjectRegistration(registration?: PortalCurrentSubjectRegistration) {
  const context = useContext(PortalCurrentSubjectContext)
  const setRegistration = context?.setRegistration
  useEffect(() => {
    if (!setRegistration) return
    setRegistration(registration)
    return () => setRegistration(undefined)
  }, [
    setRegistration,
    registration?.subject?.id,
    registration?.subject?.displayName,
    registration?.subject?.photoUrl,
    registration?.subject?.secondaryLabel,
    registration?.labels.current,
    registration?.labels.change,
    registration?.canChange,
    registration?.onChange,
  ])
}

export function PortalCurrentSubjectSlot() {
  const registration = useContext(PortalCurrentSubjectContext)?.registration
  return registration ? <PortalCurrentSubjectControl {...registration}/> : null
}

export function PortalCurrentSubjectControl({
  subject,
  labels,
  canChange,
  onChange,
}: Readonly<{
  subject?: PortalCurrentSubject
  labels: PortalCurrentSubjectLabels
  canChange: boolean
  onChange?: () => void
}>) {
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    window.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      window.removeEventListener('keydown', closeEscape)
    }
  }, [])

  if (!subject) return null

  return <div className="uhcp-current-subject" ref={container}>
    <button
      type="button"
      className="uhcp-current-subject-trigger"
      aria-label={`${labels.current}: ${subject.displayName}`}
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
    >
      <SubjectAvatar subject={subject}/>
      <span>{subject.displayName}</span>
      <span aria-hidden="true">⌄</span>
    </button>
    {open ? <section className="uhcp-current-subject-menu" aria-label={labels.current}>
      <div className="uhcp-current-subject-summary">
        <SubjectAvatar subject={subject}/>
        <span><small>{labels.current}</small><strong>{subject.displayName}</strong>{subject.secondaryLabel ? <span>{subject.secondaryLabel}</span> : null}</span>
      </div>
      {canChange && onChange ? <button type="button" onClick={() => { setOpen(false); onChange() }}>{labels.change}</button> : null}
    </section> : null}
  </div>
}

function SubjectAvatar({ subject }: Readonly<{ subject: PortalCurrentSubject }>) {
  if (subject.photoUrl) return <img className="uhcp-current-subject-avatar" src={subject.photoUrl} alt=""/>
  return <span className="uhcp-current-subject-avatar uhcp-current-subject-initial" aria-hidden="true">{subject.displayName.trim().slice(0, 1).toLocaleUpperCase() || '•'}</span>
}
