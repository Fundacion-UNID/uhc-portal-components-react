'use client'

import { useEffect, useId, useMemo, useState, type ChangeEvent } from 'react'
import type { ClinicalResourceBundleLike } from 'gdc-common-utils-ts/utils/clinical-resource-view'

export type ClinicalArtifactSchema = Readonly<{
  resourceType: string
  requiredClaims: readonly string[]
  optionalClaims: readonly string[]
}>

export type ClinicalArtifactEditorRequest = Readonly<{
  resourceType: string
  sectionCode: string
  mode: 'create' | 'update'
  artifactId?: string
  initialClaims?: Readonly<Record<string, unknown>>
}>

export type ClinicalArtifactDraft = Readonly<{
  resourceType: string
  id: string
  sectionCode: string
  mode: 'create' | 'update'
  claims: Readonly<Record<string, string>>
}>

export type ClinicalTerminologyCandidate = Readonly<{
  system: string
  code: string
  display: string
  text?: string
}>

export type ClinicalTerminologySearch = Readonly<{
  resourceType: string
  claim: string
  language: string
  text: string
  taxonomyId?: string
  limit: number
}>

export type ClinicalArtifactEditorCopy = Readonly<{
  title: string
  description: string
  save: string
  saving: string
  cancel: string
  close: string
  terminologyLoading: string
  terminologyUnavailable: string
  readbackMissing: string
}>

export type ClinicalArtifactEditorProps = Readonly<{
  request: ClinicalArtifactEditorRequest
  schema: ClinicalArtifactSchema
  copy: ClinicalArtifactEditorCopy
  locale?: string
  taxonomyId?: string
  fieldLabel: (claim: string) => string
  searchTerminology?: (input: ClinicalTerminologySearch) => Promise<readonly ClinicalTerminologyCandidate[]>
  saveArtifact: (draft: ClinicalArtifactDraft) => Promise<ClinicalResourceBundleLike | undefined>
  onCancel: () => void
  onReadback: (bundle: ClinicalResourceBundleLike) => void
}>

/**
 * Shared human/animal clinical editor. The host owns authorization, transport,
 * persistence and terminology service access. A successful form submission is
 * published only after the host returns a fresh provider readback Bundle.
 */
export function ClinicalArtifactEditor({
  request,
  schema,
  copy,
  locale = 'en',
  taxonomyId,
  fieldLabel,
  searchTerminology,
  saveArtifact,
  onCancel,
  onReadback,
}: ClinicalArtifactEditorProps) {
  const titleId = useId()
  const descriptionId = useId()
  const acceptedClaims = useMemo(
    () => [...schema.requiredClaims, ...schema.optionalClaims],
    [schema.optionalClaims, schema.requiredClaims],
  )
  const fields = useMemo(() => acceptedClaims
    .filter((claim) => !claim.endsWith('.section') && !claim.endsWith('.user-selected'))
    .filter((claim) => !isHiddenCodingCompanion(request.resourceType, claim, acceptedClaims)),
  [acceptedClaims, request.resourceType])
  const requiredClaims = useMemo(() => new Set(schema.requiredClaims), [schema.requiredClaims])
  const [claims, setClaims] = useState<Record<string, string>>(() => ({
    ...defaultClaims(request.resourceType),
    ...Object.fromEntries(Object.entries(request.initialClaims ?? {}).map(([claim, value]) => [claim, String(value ?? '')])),
  }))
  const [activeTerminologyClaim, setActiveTerminologyClaim] = useState<string>()
  const [candidates, setCandidates] = useState<readonly ClinicalTerminologyCandidate[]>([])
  const [terminologyBusy, setTerminologyBusy] = useState(false)
  const [terminologyError, setTerminologyError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!activeTerminologyClaim || !searchTerminology) return
    const sourceText = claims[activeTerminologyClaim]?.trim() ?? ''
    if (sourceText.length < 2) { setCandidates([]); return }
    const codeClaim = terminologyCodeClaim(request.resourceType, activeTerminologyClaim)
    let current = true
    setTerminologyBusy(true)
    setTerminologyError(false)
    const timer = window.setTimeout(() => {
      void searchTerminology({
        resourceType: request.resourceType,
        claim: codeClaim,
        language: locale,
        text: sourceText,
        taxonomyId,
        limit: 20,
      }).then((nextCandidates) => {
        if (current) setCandidates(nextCandidates)
      }).catch(() => {
        if (current) { setCandidates([]); setTerminologyError(true) }
      }).finally(() => {
        if (current) setTerminologyBusy(false)
      })
    }, 250)
    return () => { current = false; window.clearTimeout(timer) }
  }, [activeTerminologyClaim, claims, locale, request.resourceType, searchTerminology, taxonomyId])

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const readback = await saveArtifact({
        resourceType: request.resourceType,
        id: request.artifactId ?? crypto.randomUUID(),
        sectionCode: request.sectionCode,
        mode: request.mode,
        claims,
      })
      if (!readback) throw new Error(copy.readbackMissing)
      onReadback(readback)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setSaving(false)
    }
  }

  return <section className="uhcp-clinical-editor" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
    <header>
      <div><h2 id={titleId}>{copy.title}</h2><p id={descriptionId}>{copy.description}</p></div>
      <button type="button" onClick={onCancel} aria-label={copy.close}>×</button>
    </header>
    <form onSubmit={(event) => { event.preventDefault(); void submit() }}>
      {fields.map((claim) => {
        const parameter = claim.slice(request.resourceType.length + 1)
        const label = fieldLabel(claim)
        const terminologyEnabled = Boolean(searchTerminology && terminologyCodeClaim(request.resourceType, claim))
        const inputId = `${titleId}-${claim}`
        const value = claims[claim] ?? ''
        const update = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
          setClaims((current) => ({ ...current, [claim]: event.target.value }))
          if (terminologyEnabled) setActiveTerminologyClaim(claim)
        }
        return <label key={claim} className={isMultiline(parameter) ? 'uhcp-clinical-editor-wide' : undefined} htmlFor={inputId}>
          <span>{label}{requiredClaims.has(claim) ? ' *' : ''}</span>
          {statusOptions(request.resourceType, parameter) ? <select id={inputId} aria-label={label} value={value} required={requiredClaims.has(claim)} onChange={update}>
            {statusOptions(request.resourceType, parameter)!.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}
          </select> : isMultiline(parameter) ? <textarea id={inputId} aria-label={label} value={value} required={requiredClaims.has(claim)} rows={3} onChange={update}/>
            : <input id={inputId} aria-label={label} value={value} required={requiredClaims.has(claim)} type={fieldInputType(parameter)} onChange={update}/>} 
          {terminologyEnabled && activeTerminologyClaim === claim ? <div className="uhcp-terminology-results">
            {terminologyBusy ? <small role="status">{copy.terminologyLoading}</small> : null}
            {terminologyError ? <small role="alert">{copy.terminologyUnavailable}</small> : null}
            {candidates.length ? <ul>{candidates.map((candidate) => <li key={`${candidate.system}|${candidate.code}`}><button type="button" onClick={() => {
              setClaims((current) => selectedCodingClaims(request.resourceType, claim, candidate, acceptedClaims, current))
              setCandidates([])
              setActiveTerminologyClaim(undefined)
            }}>{candidate.display}<small>{candidate.system} · {candidate.code}</small></button></li>)}</ul> : null}
          </div> : null}
        </label>
      })}
      {error ? <p className="uhcp-clinical-editor-error" role="alert">{error}</p> : null}
      <footer><button type="button" onClick={onCancel}>{copy.cancel}</button><button type="submit" disabled={saving}>{saving ? copy.saving : copy.save}</button></footer>
    </form>
  </section>
}

function defaultClaims(resourceType: string): Record<string, string> {
  if (resourceType === 'Immunization') return { 'Immunization.status': 'completed' }
  if (resourceType === 'Observation' || resourceType === 'DiagnosticReport' || resourceType === 'Procedure') return { [`${resourceType}.status`]: 'final' }
  if (resourceType === 'Condition' || resourceType === 'AllergyIntolerance') return { [`${resourceType}.clinical-status`]: 'active' }
  return {}
}

function statusOptions(resourceType: string, parameter: string): readonly string[] | undefined {
  if (parameter !== 'status' && !parameter.endsWith('-status')) return undefined
  if (resourceType === 'Immunization') return ['completed', 'not-done', 'entered-in-error']
  if (resourceType === 'Observation' || resourceType === 'DiagnosticReport') return ['final', 'preliminary', 'amended', 'entered-in-error']
  return ['active', 'completed', 'inactive', 'entered-in-error']
}

function terminologyCodeClaim(resourceType: string, inputClaim: string): string {
  const parameter = inputClaim.slice(resourceType.length + 1)
  if (parameter.endsWith('-code-text')) return `${resourceType}.${parameter.slice(0, -5)}`
  if (resourceType === 'MedicationStatement' && parameter === 'medication-text') return 'MedicationStatement.code'
  if (parameter === 'target-disease' || parameter.endsWith('-code') || parameter === 'code') return inputClaim
  return ''
}

function isHiddenCodingCompanion(resourceType: string, claim: string, acceptedClaims: readonly string[]): boolean {
  if (claim.endsWith('-display') && acceptedClaims.includes(`${claim.slice(0, -8)}-text`)) return true
  if (acceptedClaims.includes(`${claim}-text`)) return true
  return resourceType === 'MedicationStatement' && claim === 'MedicationStatement.code'
    && acceptedClaims.includes('MedicationStatement.medication-text')
}

function selectedCodingClaims(resourceType: string, inputClaim: string, candidate: ClinicalTerminologyCandidate, acceptedClaims: readonly string[], current: Record<string, string>): Record<string, string> {
  const codeClaim = terminologyCodeClaim(resourceType, inputClaim)
  const next = { ...current, [inputClaim]: current[inputClaim] || candidate.text || candidate.display }
  if (acceptedClaims.includes(codeClaim)) next[codeClaim] = `${candidate.system}|${candidate.code}`
  const displayClaim = `${codeClaim}-display`
  if (acceptedClaims.includes(displayClaim)) next[displayClaim] = candidate.display
  return next
}

function isMultiline(parameter: string): boolean { return /note|description|summary|instruction|outcome|reference-range-text/.test(parameter) }
function humanize(value: string): string { return value ? value[0].toUpperCase() + value.slice(1).replaceAll('_', ' ') : value }
function fieldInputType(parameter: string): 'text' | 'number' | 'date' {
  if (/(?:^|-)number$|frequency$|dose-sequence$/.test(parameter)) return 'number'
  if (parameter === 'date' || parameter.endsWith('-date') || parameter.endsWith('-datetime')) return 'date'
  return 'text'
}
