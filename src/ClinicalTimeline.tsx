import { useMemo, useState, type ReactNode } from 'react'
import {
  composeFhirDateTimeFromLocalParts,
  formatFhirTemporalForLocale,
  isFhirTemporalWithinRange,
  splitFhirDateTimeForInput,
  type LocalDateTimeParts,
} from 'fhir-data-utils-ts/fhir-temporal-presentation'

export type ClinicalTimelineEntry = Readonly<{
  id: string
  title: string
  dateTime: string
  facets?: Readonly<Record<string, readonly string[]>>
  content?: ReactNode
}>

export type ClinicalTimelineFacet = Readonly<{
  id: string
  label: string
  options: readonly Readonly<{ id: string; label: string }>[]
}>

export type ClinicalTimelineLabels = Readonly<{
  from: string
  to: string
  date: string
  time: string
  useToday: string
  useCurrentTime: string
  previous: string
  next: string
  showAll: string
  empty: string
}>

export type ClinicalDateTimeFieldLabels = Readonly<{
  date: string
  time: string
  useToday: string
  useCurrentTime: string
}>

export function ClinicalDateTimeFields({
  value,
  onChange,
  labels,
  timeZone,
  now = new Date(),
  includeSeconds = true,
}: Readonly<{
  value: LocalDateTimeParts
  onChange: (value: LocalDateTimeParts) => void
  labels: ClinicalDateTimeFieldLabels
  timeZone: string
  now?: Date
  includeSeconds?: boolean
}>) {
  const current = splitFhirDateTimeForInput(now, timeZone)
  const time = includeSeconds ? current.time : current.time.slice(0, 5)
  return (
    <div className="uhcp-clinical-date-time-fields">
      <label>{labels.date}<input type="date" value={value.date} onChange={(event) => onChange({ ...value, date: event.target.value })} /></label>
      <button type="button" title={labels.useToday} aria-label={labels.useToday} onClick={() => onChange({ ...value, date: current.date })}>◉</button>
      <label>{labels.time}<input type="time" step={includeSeconds ? 1 : 60} value={value.time} onChange={(event) => onChange({ ...value, time: event.target.value })} /></label>
      <button type="button" title={labels.useCurrentTime} aria-label={labels.useCurrentTime} onClick={() => onChange({ ...value, time })}>◷</button>
    </div>
  )
}

export function ClinicalTimeline({ entries, facets = [], locale, timeZone, labels, now = new Date() }: Readonly<{
  entries: readonly ClinicalTimelineEntry[]
  facets?: readonly ClinicalTimelineFacet[]
  locale: string
  timeZone: string
  labels: ClinicalTimelineLabels
  now?: Date
}>) {
  const [selectedFacets, setSelectedFacets] = useState<Readonly<Record<string, readonly string[]>>>({})
  const [from, setFrom] = useState<LocalDateTimeParts>({ date: '', time: '' })
  const [to, setTo] = useState<LocalDateTimeParts>({ date: '', time: '' })
  const [requestedIndex, setRequestedIndex] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const current = splitFhirDateTimeForInput(now, timeZone)

  const filtered = useMemo(() => [...entries]
    .filter((entry) => matchesEverySelectedFacet(entry, selectedFacets))
    .filter((entry) => isFhirTemporalWithinRange(entry.dateTime, {
      from: composeOptionalBoundary(from, timeZone, 'from'),
      to: composeOptionalBoundary(to, timeZone, 'to'),
    }, now))
    .sort((left, right) => new Date(right.dateTime).getTime() - new Date(left.dateTime).getTime()),
  [entries, from, now, selectedFacets, timeZone, to])
  const index = Math.min(requestedIndex, Math.max(filtered.length - 1, 0))
  const selected = filtered[index]

  return (
    <section className="uhcp-clinical-timeline">
      <div className="uhcp-clinical-filters">
        <div className="uhcp-clinical-range">
          <DateTimeBoundary label={labels.from} labels={labels} current={current} value={from} onChange={(value) => { setFrom(value); setRequestedIndex(0) }} />
          <DateTimeBoundary label={labels.to} labels={labels} current={current} value={to} onChange={(value) => { setTo(value); setRequestedIndex(0) }} />
        </div>
        {facets.map((facet) => <fieldset key={facet.id}>
          <legend>{facet.label}</legend>
          {facet.options.map((option) => <label key={option.id}>
            <input type="checkbox" checked={selectedFacets[facet.id]?.includes(option.id) ?? false} onChange={() => {
              setSelectedFacets((current) => toggleFacet(current, facet.id, option.id))
              setRequestedIndex(0)
            }} />{option.label}
          </label>)}
        </fieldset>)}
      </div>
      {selected ? <>
        <article className="uhcp-clinical-timeline-card">
          <h4>{selected.title}</h4>
          <time dateTime={selected.dateTime}>{formatFhirTemporalForLocale(selected.dateTime, locale, { timeZone, includeTime: true })}</time>
          {selected.content}
        </article>
        <nav className="uhcp-clinical-timeline-navigation" aria-label={`${selected.title} history`}>
          <button type="button" disabled={index === 0} onClick={() => setRequestedIndex((value) => Math.max(0, value - 1))}>{labels.previous}</button>
          <output aria-live="polite">{index + 1} / {filtered.length}</output>
          <button type="button" disabled={index >= filtered.length - 1} onClick={() => setRequestedIndex((value) => value + 1)}>{labels.next}</button>
          <button type="button" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>{labels.showAll}</button>
        </nav>
        {showAll ? <ol className="uhcp-clinical-timeline-list">{filtered.map((entry) => <li key={entry.id}>
          <strong>{entry.title}</strong>
          <time dateTime={entry.dateTime}>{formatFhirTemporalForLocale(entry.dateTime, locale, { timeZone, includeTime: true })}</time>
        </li>)}</ol> : null}
      </> : <p className="uhcp-clinical-empty">{labels.empty}</p>}
    </section>
  )
}

function DateTimeBoundary({ label, labels, current, value, onChange }: Readonly<{
  label: string
  labels: ClinicalTimelineLabels
  current: LocalDateTimeParts
  value: LocalDateTimeParts
  onChange: (value: LocalDateTimeParts) => void
}>) {
  return <fieldset><legend>{label}</legend>
    <label>{labels.date}<input aria-label={`${label} ${labels.date}`} type="date" value={value.date} onChange={(event) => onChange({ ...value, date: event.target.value })} /></label>
    <button type="button" title={`${labels.useToday} (${label})`} aria-label={`${labels.useToday} (${label})`} onClick={() => onChange({ ...value, date: current.date })}>◉</button>
    <label>{labels.time}<input aria-label={`${label} ${labels.time}`} type="time" step="1" value={value.time} onChange={(event) => onChange({ ...value, time: event.target.value })} /></label>
    <button type="button" title={`${labels.useCurrentTime} (${label})`} aria-label={`${labels.useCurrentTime} (${label})`} onClick={() => onChange({ ...value, time: current.time })}>◷</button>
  </fieldset>
}

function composeOptionalBoundary(parts: LocalDateTimeParts, timeZone: string, edge: 'from' | 'to'): string | undefined {
  if (!parts.date) return undefined
  const defaultTime = edge === 'from' ? '00:00:00' : '23:59:59'
  return composeFhirDateTimeFromLocalParts({ date: parts.date, time: parts.time || defaultTime, timeZone })
}

function matchesEverySelectedFacet(entry: ClinicalTimelineEntry, selected: Readonly<Record<string, readonly string[]>>): boolean {
  return Object.entries(selected).every(([facetId, selectedOptions]) =>
    selectedOptions.length === 0 || selectedOptions.some((option) => entry.facets?.[facetId]?.includes(option)),
  )
}

function toggleFacet(current: Readonly<Record<string, readonly string[]>>, facetId: string, optionId: string): Readonly<Record<string, readonly string[]>> {
  const existing = current[facetId] ?? []
  const next = existing.includes(optionId) ? existing.filter((id) => id !== optionId) : [...existing, optionId]
  return { ...current, [facetId]: next }
}
