import { type ReactNode, useMemo, useState } from 'react'

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
export function SubjectCommunicationCenter({ subjectLabel, items, copy = DEFAULT_COPY }: Readonly<{
  subjectLabel: string
  items: readonly SubjectCommunicationItem[]
  copy?: SubjectCommunicationCenterCopy
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
    {visibleItems.length === 0 ? <p className="subject-communication-empty">{copy.empty}</p> : <ol className="subject-communication-list">
      {visibleItems.map(item => <li key={item.id} data-kind={item.kind} data-category={item.category}>
        <div><strong>{item.title}</strong>{item.summary ? <p>{item.summary}</p> : null}</div>
        <div className="subject-communication-meta">
          {item.timestamp ? <time dateTime={item.timestamp}>{item.timestamp}</time> : null}
          {item.status ? <span>{item.status}</span> : null}
          {item.action}
        </div>
      </li>)}
    </ol>}
  </section>
}

function matchesFilter(item: SubjectCommunicationItem, filter: SubjectCommunicationFilter) {
  if (filter === 'all') return true
  if (filter === 'emergency') return item.category === 'emergency'
  if (filter === 'calls') return item.kind === 'audio-call' || item.kind === 'video-call'
  return item.kind === 'message' || item.kind === 'audio' || item.kind === 'appointment'
}
