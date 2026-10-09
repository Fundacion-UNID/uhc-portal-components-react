'use client'

import { useEffect, useMemo, useState } from 'react'
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
  const [query, setQuery] = useState(text || display)
  const [sources, setSources] = useState<readonly Readonly<{ id: string; label?: string; default?: boolean }>[]>([])
  const [selectedSources, setSelectedSources] = useState<readonly string[]>([])
  const [candidates, setCandidates] = useState<readonly ClinicalTerminologyCandidate[]>([])
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [searched, setSearched] = useState(false)
  useEffect(() => {
    if (!loadTerminologySources) return
    let current = true
    void loadTerminologySources({ resourceType, claim: codeClaim, language: locale, taxonomyId }).then(next => {
      if (!current) return
      setSources(next)
      const defaults = next.filter(source => source.default).map(source => source.id)
      setSelectedSources(defaults.length ? defaults : next[0] ? [next[0].id] : [])
    }).catch(() => current && setSources([]))
    return () => { current = false }
  }, [codeClaim, loadTerminologySources, locale, resourceType, taxonomyId])
  const selectedToken = useMemo(() => code, [code])
  const search = async () => {
    if (!searchTerminology || query.trim().length < 2 || busy) return
    setBusy(true); setFailed(false); setSearched(false)
    try {
      let governedSources = selectedSources
      if (!governedSources.length && loadTerminologySources) {
        const loaded = await loadTerminologySources({ resourceType, claim: codeClaim, language: locale, taxonomyId })
        const defaults = loaded.filter(source => source.default).map(source => source.id)
        governedSources = defaults.length ? defaults : loaded[0] ? [loaded[0].id] : []
        setSources(loaded); setSelectedSources(governedSources)
      }
      setCandidates(await searchTerminology({ resourceType, claim: codeClaim, language: locale, text: query.trim(), taxonomyId, limit: 20, ...(governedSources.length ? { sources: governedSources } : {}) }))
      setSearched(true)
    } catch { setCandidates([]); setFailed(true) } finally { setBusy(false) }
  }
  return <div className="uhcp-clinical-property-v2 uhcp-coded-concept-property-v2">
    <span className="uhcp-clinical-editor-field-heading"><label htmlFor={`${codeClaim}-query`}>{label}{required ? ' *' : ''}</label>{textClaim ? <ClinicalSpeechInputButton resourceType={resourceType} claim={textClaim} locale={locale} fieldLabel={label} onTranscript={transcript => { setQuery(transcript); onChange({ text: transcript, code: '', display: '' }) }}/>: null}</span>
    <div className="uhcp-coded-concept-query-v2">
      <input id={`${codeClaim}-query`} aria-label={label} required={required} readOnly={Boolean(code)} value={code ? (text || query || display) : query} onChange={event => { setQuery(event.currentTarget.value); setCandidates([]); setSearched(false); setFailed(false); onChange({ text: event.currentTarget.value, code: '', display: '' }) }}/>
      <button type="button" className="uhcp-icon-button-v2" aria-label={copy.searchTerminology} title={copy.searchTerminology} disabled={Boolean(code) || busy || query.trim().length < 2} onClick={() => void search()}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/></svg></button>
      {code ? <button type="button" className="uhcp-clear-code-v2" aria-label={copy.clearCoding} title={copy.clearCoding} onClick={() => { setQuery(''); setCandidates([]); onChange({ text: '', code: '', display: '' }) }}>×</button> : null}
    </div>
    {sources.length ? <fieldset className="uhcp-coding-sources-v2"><legend>{copy.terminologySources}</legend>{sources.map(source => <label key={source.id}><input type="checkbox" checked={selectedSources.includes(source.id)} onChange={event => { const checked = event.currentTarget.checked; setSelectedSources(current => checked ? [...new Set([...current, source.id])] : current.filter(value => value !== source.id)); setCandidates([]); setSearched(false); setFailed(false) }}/>{source.label || source.id}</label>)}</fieldset> : null}
    {busy ? <small role="status">{copy.terminologyLoading}</small> : null}
    {failed ? <small role="alert">{copy.terminologyUnavailable}</small> : null}
    {searched && !busy && !failed && candidates.length === 0 ? <small role="status">{copy.terminologyEmpty || copy.terminologyUnavailable}</small> : null}
    {candidates.length ? <label>{copy.selectCandidate}<select aria-label={copy.selectCandidate} value={selectedToken} onChange={event => {
      const candidate = candidates.find(value => `${value.system}|${value.code}` === event.currentTarget.value)
      if (!candidate) return
      const localText = candidate.text || query || candidate.display
      setQuery(localText); onChange({ text: localText, code: `${candidate.system}|${candidate.code}`, display: candidate.display }); setCandidates([])
    }}><option value=""></option>{candidates.map(candidate => <option key={`${candidate.system}|${candidate.code}`} value={`${candidate.system}|${candidate.code}`}>{candidate.text && candidate.text !== candidate.display ? `${candidate.text} — ${candidate.display}` : candidate.display} ({candidate.code})</option>)}</select></label> : null}
    {code ? <div className="uhcp-selected-code-v2"><label>{copy.canonicalCode}<input aria-label={copy.canonicalCode} readOnly value={code}/></label><label>{copy.canonicalDisplay}<input aria-label={copy.canonicalDisplay} readOnly value={display}/></label></div> : null}
  </div>
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
