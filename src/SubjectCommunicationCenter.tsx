import { type ReactNode, useId, useMemo, useState } from 'react'

export type SubjectCommunicationKind = 'message' | 'audio' | 'audio-call' | 'video-call' | 'appointment'
export type SubjectCommunicationCategory = 'emergency' | 'care' | 'other'
export type SubjectCommunicationFilter = 'all' | 'messages' | 'calls' | 'emergency'

export type SubjectCommunicationItem = Readonly<{
  id: string
  kind: SubjectCommunicationKind
  category: SubjectCommunicationCategory
  title: string
  summary?: string
  timestamp?: string
  status?: string
  action?: ReactNode
  direction?: 'incoming' | 'outgoing' | 'system'
  senderLabel?: string
  avatarUrl?: string
}>

export type SubjectCommunicationComposer = Readonly<{
  placeholder: string
  sendLabel: string
  attachLabel?: string
  disabled?: boolean
  onSend(text: string): void | Promise<void>
  onAttach?(): void | Promise<void>
}>

export type SubjectCommunicationCenterCopy = Readonly<{
  heading(subjectLabel: string): string
  filters: Readonly<Record<SubjectCommunicationFilter, string>>
  empty: string
}>

const DEFAULT_COPY: SubjectCommunicationCenterCopy = {
  heading: subjectLabel => `Communications for ${subjectLabel}`,
  filters: { all: 'All', messages: 'Messages', calls: 'Calls', emergency: 'Emergency' },
  empty: 'There are no communications in this view.',
}

const FILTERS: readonly SubjectCommunicationFilter[] = ['all', 'messages', 'calls', 'emergency']

/** Brand-neutral, subject-scoped message and internet-call timeline for personal portals. */
export function SubjectCommunicationCenter({ subjectLabel, items, copy = DEFAULT_COPY, composer }: Readonly<{
  subjectLabel: string
  items: readonly SubjectCommunicationItem[]
  copy?: SubjectCommunicationCenterCopy
  composer?: SubjectCommunicationComposer
}>) {
  const [filter, setFilter] = useState<SubjectCommunicationFilter>('all')
  const visibleItems = useMemo(() => items.filter(item => matchesFilter(item, filter)), [filter, items])

  return <section className="subject-communication-center" aria-labelledby="subject-communication-center-title">
    <h2 id="subject-communication-center-title">{copy.heading(subjectLabel)}</h2>
    <div className="subject-communication-filters" aria-label={copy.heading(subjectLabel)}>
      {FILTERS.map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
        {copy.filters[value]}
      </button>)}
    </div>
    {visibleItems.length === 0 ? <p className="subject-communication-empty">{copy.empty}</p> : <ol className="subject-communication-list" role="log">
      {visibleItems.map(item => <li key={item.id} data-kind={item.kind} data-category={item.category} data-direction={item.direction || 'system'}>
        {item.avatarUrl ? <img className="subject-communication-avatar" src={item.avatarUrl} alt={item.senderLabel || item.title} /> : null}
        <div className="subject-communication-bubble">
          {item.senderLabel ? <span className="subject-communication-sender">{item.senderLabel}</span> : null}
          <strong>{item.title}</strong>{item.summary ? <p>{item.summary}</p> : null}
        </div>
        <div className="subject-communication-meta">
          {item.timestamp ? <time dateTime={item.timestamp}>{item.timestamp}</time> : null}
          {item.status ? <span>{item.status}</span> : null}
          {item.action}
        </div>
      </li>)}
    </ol>}
    {composer ? <SubjectCommunicationComposerPanel composer={composer} /> : null}
  </section>
}

/** Reusable message composer; product BFF adapters retain delivery authority. */
export function SubjectCommunicationComposerPanel({ composer }: Readonly<{
  composer: SubjectCommunicationComposer
}>) {
  const inputId = useId()
  const [draft, setDraft] = useState('')
  return <form className="subject-communication-composer" onSubmit={event => {
      event.preventDefault()
      const text = draft.trim()
      if (!text || composer.disabled) return
      void composer.onSend(text)
      setDraft('')
    }}>
      <label className="subject-communication-composer-label" htmlFor={inputId}>{composer.placeholder}</label>
      <textarea
        id={inputId}
        aria-label={composer.placeholder}
        placeholder={composer.placeholder}
        value={draft}
        disabled={composer.disabled}
        onChange={event => setDraft(event.target.value)}
      />
      <div className="subject-communication-composer-actions">
        {composer.onAttach && composer.attachLabel ? <button type="button" disabled={composer.disabled} onClick={() => void composer.onAttach?.()}>{composer.attachLabel}</button> : null}
        <button type="submit" disabled={composer.disabled || !draft.trim()}>{composer.sendLabel}</button>
      </div>
    </form>
}

function matchesFilter(item: SubjectCommunicationItem, filter: SubjectCommunicationFilter) {
  if (filter === 'all') return true
  if (filter === 'emergency') return item.category === 'emergency'
  if (filter === 'calls') return item.kind === 'audio-call' || item.kind === 'video-call'
  return item.kind === 'message' || item.kind === 'audio' || item.kind === 'appointment'
}
