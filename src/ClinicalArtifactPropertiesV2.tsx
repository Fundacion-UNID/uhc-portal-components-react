'use client'

import { useEffect, useMemo, useState } from 'react'
import { TerminologyCodePickerV2 } from 'terminology-components-react/code-picker-v2'
import {
  composeFhirDateTimeFromLocalParts,
  splitFhirDateTimeForInput,
  type LocalDateTimeParts,
} from 'fhir-data-utils-ts/fhir-temporal-presentation'
import { ClinicalSpeechInputButton } from './ClinicalSpeechInput.js'
import type {
  ClinicalArtifactAttachment,
  ClinicalTerminologyCandidate,
  ClinicalTerminologySearch,
  ClinicalTerminologySourceSearch,
} from './ClinicalArtifactEditor.js'

export type ClinicalPropertyOptionV2 = Readonly<{ value: string; label: string }>

export function DateTimePropertyV2({ label, value, required, locale, timeZone, copy, onChange }: Readonly<{
  label: string
  value: string
  required?: boolean
  locale: string
  timeZone: string
  copy: Readonly<{ date: string; time: string; useToday: string; useCurrentTime: string }>
  onChange: (value: string) => void
}>) {
  const [parts, setParts] = useState<LocalDateTimeParts>(() => splitDateTime(value, timeZone))
  const current = splitFhirDateTimeForInput(new Date(), timeZone)
  const update = (next: LocalDateTimeParts) => {
    setParts(next)
    onChange(!next.date ? '' : next.time ? composeFhirDateTimeFromLocalParts({ ...next, timeZone }) : next.date)
  }
  return <fieldset className="uhcp-clinical-property-v2 uhcp-date-time-property-v2">
    <legend>{label}{required ? ' *' : ''}</legend>
    <label><span>{copy.date}</span><input aria-label={`${label}: ${copy.date}`} type="date" required={required} value={parts.date} onChange={event => update({ ...parts, date: event.currentTarget.value })}/></label>
    <button type="button" onClick={() => update({ ...parts, date: current.date })}>{copy.useToday}</button>
    <label><span>{copy.time}</span><input aria-label={`${label}: ${copy.time}`} type="time" step="60" value={parts.time.slice(0, 5)} onChange={event => update({ ...parts, time: event.currentTarget.value })}/></label>
    <button type="button" onClick={() => update({ ...parts, time: current.time.slice(0, 5) })}>{copy.useCurrentTime}</button>
  </fieldset>
}

export function CodedConceptPropertyV2({ resourceType, textClaim, codeClaim, displayClaim, label, locale, taxonomyId, text, code, display, required, copy, searchTerminology, loadTerminologySources, onChange }: Readonly<{
  resourceType: string
  textClaim?: string
  codeClaim: string
  displayClaim?: string
  label: string
  locale: string
  taxonomyId?: string
  text: string
  code: string
  display: string
  required?: boolean
  copy: Readonly<{ searchTerminology: string; terminologyLoading: string; terminologyUnavailable: string; terminologyEmpty?: string; terminologySources: string; selectCandidate: string; clearCoding: string; canonicalCode: string; canonicalDisplay: string }>
  searchTerminology?: (input: ClinicalTerminologySearch) => Promise<readonly ClinicalTerminologyCandidate[]>
  loadTerminologySources?: ClinicalTerminologySourceSearch
  onChange: (value: Readonly<{ text: string; code: string; display: string }>) => void
}>) {
  return <TerminologyCodePickerV2
    resourceType={resourceType}
    param={codeClaim}
    language={locale}
    {...(taxonomyId ? { taxonomyId } : {})}
    label={label}
    text={text}
    code={code}
    display={display}
    required={required}
    copy={{ search: copy.searchTerminology, loading: copy.terminologyLoading, unavailable: copy.terminologyUnavailable, empty: copy.terminologyEmpty, sources: copy.terminologySources, select: copy.selectCandidate, clear: copy.clearCoding, canonicalCode: copy.canonicalCode, canonicalDisplay: copy.canonicalDisplay }}
    {...(searchTerminology ? { search: async input => (await searchTerminology({ resourceType: input.resourceType, claim: input.param, language: input.language, text: input.text, limit: input.limit, ...(input.taxonomyId ? { taxonomyId: input.taxonomyId } : {}), ...(input.sources ? { sources: input.sources } : {}) })).map(candidate => ({ ...candidate, text: candidate.text || candidate.display, language: input.language })) } : {})}
    {...(loadTerminologySources ? { loadSources: input => loadTerminologySources({ resourceType: input.resourceType, claim: input.param, language: input.language, ...(input.taxonomyId ? { taxonomyId: input.taxonomyId } : {}) }) } : {})}
    onChange={onChange}
    headingAction={textClaim ? <ClinicalSpeechInputButton resourceType={resourceType} claim={textClaim} locale={locale} fieldLabel={label} onTranscript={transcript => onChange({ text: transcript, code: '', display: '' })}/>: null}
    classNames={{ root: 'uhcp-clinical-property-v2 uhcp-coded-concept-property-v2', heading: 'uhcp-clinical-editor-field-heading', query: 'uhcp-coded-concept-query-v2', searchButton: 'uhcp-icon-button-v2', clearButton: 'uhcp-clear-code-v2', sources: 'uhcp-coding-sources-v2', selected: 'uhcp-selected-code-v2' }}
  />
}

export function CodedSelectPropertyV2({ label, value, required, options, onChange }: Readonly<{ label: string; value: string; required?: boolean; options: readonly ClinicalPropertyOptionV2[]; onChange: (value: string) => void }>) {
  return <label className="uhcp-clinical-property-v2">{label}{required ? ' *' : ''}<select aria-label={label} required={required} value={value} onChange={event => onChange(event.currentTarget.value)}><option value=""></option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

export function PositiveIntegerPropertyV2({ label, value, required, onChange }: Readonly<{ label: string; value: string; required?: boolean; onChange: (value: string) => void }>) {
  return <label className="uhcp-clinical-property-v2">{label}{required ? ' *' : ''}<input aria-label={label} type="number" min="1" step="1" required={required} value={value} onChange={event => onChange(event.currentTarget.value)}/></label>
}

export function OptionalFieldsV2({ label, choose, add, options, value, onValueChange, onAdd }: Readonly<{ label: string; choose: string; add: string; options: readonly ClinicalPropertyOptionV2[]; value: string; onValueChange: (value: string) => void; onAdd: () => void }>) {
  if (!options.length) return null
  return <fieldset className="uhcp-optional-fields-v2"><legend>{label}</legend><select aria-label={choose} value={value} onChange={event => onValueChange(event.currentTarget.value)}><option value="">{choose}</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><button type="button" disabled={!value} onClick={onAdd}>{add}</button></fieldset>
}

export function DocumentReferencesPropertyV2({ copy, attachments, onFiles, onRemove }: Readonly<{
  copy: Readonly<{ documents: string; addDocuments: string; removeDocument: string }>
  attachments: readonly ClinicalArtifactAttachment[]
  onFiles: (files: readonly File[]) => void
  onRemove: (id: string) => void
}>) {
  return <fieldset className="uhcp-clinical-property-v2 uhcp-document-references-property-v2"><legend>{copy.documents}</legend>
    <label>{copy.addDocuments}<input aria-label={copy.addDocuments} type="file" multiple accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg" onChange={event => { const files = [...(event.currentTarget.files ?? [])]; event.currentTarget.value = ''; onFiles(files) }}/></label>
    {attachments.length ? <ul>{attachments.map(attachment => <li key={attachment.id}><span>{attachment.name}</span><button type="button" aria-label={`${copy.removeDocument}: ${attachment.name}`} onClick={() => onRemove(attachment.id)}>×</button></li>)}</ul> : null}
  </fieldset>
}

function splitDateTime(value: string, timeZone: string): LocalDateTimeParts {
  if (!value) return { date: '', time: '' }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date: value, time: '' }
  try { return splitFhirDateTimeForInput(value, timeZone) } catch { return { date: '', time: '' } }
}
