'use client'

import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { ClinicalResourceBundleLike } from 'gdc-common-utils-ts/utils/clinical-resource-view'
import {
  clinicalArtifactEditorClaimsFromFhirR4,
  clinicalArtifactFhirR4ToFlat,
  composeFhirDateTimeFromLocalParts,
  splitFhirDateTimeForInput,
  type LocalDateTimeParts,
  type ClinicalArtifactFhirR4Resource,
  type FhirIpsClinicalArtifactType,
} from 'fhir-data-utils-ts'
import {
  buildMultichannelOperationBundle,
  MultichannelOperationMode,
  readMultichannelOperationFromBundle,
  selectMultichannelOperationClaimValues,
  type MultichannelOperationIdValue,
  type MultichannelOperationSchema,
  type MultichannelOperationSchemaNode,
  type MultichannelOperationValues,
} from 'sos-data-utils-ts/multichannel-operation-schemas'
import type { ClinicalDateTimeFieldLabels } from './ClinicalTimeline.js'
import { ClinicalEditorLayer } from './ClinicalEditorLayer.js'
import { ClinicalSpeechInputButton } from './ClinicalSpeechInput.js'

export type ClinicalArtifactSchema = Readonly<{
  resourceType: string
  sectionCode?: string
  requiredClaims: readonly string[]
  optionalClaims: readonly string[]
  terminologyTextClaims?: readonly string[]
  initialClaims?: Readonly<Record<string, string>>
}>

export type ClinicalArtifactEditorRequest = Readonly<{
  resourceType: string
  sectionCode: string
  mode: 'create' | 'update'
  artifactId?: string
  ifMatch?: string
  initialClaims?: Readonly<Record<string, unknown>>
  /** Native FHIR R4 resource hydrated through the selected shared schema. */
  initialResource?: Readonly<Record<string, unknown> & { resourceType: string }>
  /** Authoritative claims-first provider Bundle hydrated through BundleReader. */
  initialBundle?: Readonly<Record<string, unknown>>
}>

export type ClinicalArtifactDraft = Readonly<{
  resourceType: string
  id: string
  sectionCode: string
  mode: 'create' | 'update'
  claims: Readonly<Record<string, string>>
  /** Complete schema-validated operation values when a multichannel schema is supplied. */
  operationValues?: MultichannelOperationValues
  /** Claims-first batch produced by the shared BundleEditor. */
  changesBundle?: ClinicalArtifactChangesBundle
}>

export type ClinicalArtifactChangesBundle = Readonly<{
  resourceType: string
  type: string
  data?: readonly unknown[]
  entry?: readonly unknown[]
}>

export type ClinicalArtifactAuthoringContext = Readonly<{
  subjectReference: string
  language: string
  createdAt: string
  dataAuthorReference: string
  attestationState: 'draft' | 'confirmed'
  attesterReference?: string
  attesterMode?: string
  attestedAt?: string
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
  sources?: readonly string[]
}>

export type ClinicalTerminologySource = Readonly<{ id: string; label?: string; default?: boolean }>
export type ClinicalTerminologySourceSearch = (input: Readonly<{
  resourceType: string; claim: string; language: string; taxonomyId?: string
}>) => Promise<readonly ClinicalTerminologySource[]>

export type ClinicalArtifactEditorCopy = Readonly<{
  title: string
  description: string
  save: string
  saving: string
  cancel: string
  close: string
  terminologyLoading: string
  terminologyUnavailable: string
  terminologySources?: string
  readbackMissing: string
  pending?: string
  retry?: string
  dateTime?: ClinicalDateTimeFieldLabels
}>

export type ClinicalArtifactSaveOutcome = Readonly<
  | { state: 'confirmed'; bundle: ClinicalResourceBundleLike }
  | { state: 'pending' | 'retryable'; message?: string }
  | { state: 'rejected'; message: string }
>

export type ClinicalArtifactEditorProps = Readonly<{
  request: ClinicalArtifactEditorRequest
  schema: ClinicalArtifactSchema
  /** Shared JSON Schema 2020-12 contract used by portal, voice, chat and WhatsApp. */
  operationSchema?: MultichannelOperationSchema
  /** Host-owned subject and provenance; never inferred from the transport sender. */
  authoringContext?: ClinicalArtifactAuthoringContext
  copy: ClinicalArtifactEditorCopy
  locale?: string
  /** IANA zone used to present and compose separate local date/time controls. */
  timeZone?: string
  taxonomyId?: string
  fieldLabel: (claim: string) => string
  searchTerminology?: (input: ClinicalTerminologySearch) => Promise<readonly ClinicalTerminologyCandidate[]>
  loadTerminologySources?: ClinicalTerminologySourceSearch
  saveArtifact: (draft: ClinicalArtifactDraft) => Promise<ClinicalResourceBundleLike | ClinicalArtifactSaveOutcome | undefined>
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
  operationSchema,
  authoringContext,
  copy,
  locale = 'en',
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  taxonomyId,
  fieldLabel,
  searchTerminology,
  loadTerminologySources,
  saveArtifact,
  onCancel,
  onReadback,
}: ClinicalArtifactEditorProps) {
  const titleId = useId()
  const descriptionId = useId()
  const acceptedClaims = useMemo(
    () => operationSchema
      ? Object.keys(operationSchema.properties.claims?.properties ?? {})
      : [...schema.requiredClaims, ...schema.optionalClaims],
    [operationSchema, schema.optionalClaims, schema.requiredClaims],
  )
  const fields = useMemo(() => acceptedClaims
    .filter((claim) => !claim.endsWith('.section') && !claim.endsWith('.user-selected'))
    .filter((claim) => !isHiddenCodingCompanion(request.resourceType, claim, acceptedClaims)),
  [acceptedClaims, request.resourceType])
  const requiredClaims = useMemo(() => new Set(
    operationSchema?.properties.claims?.required ?? schema.requiredClaims,
  ), [operationSchema, schema.requiredClaims])
  const [claims, setClaims] = useState<Record<string, string>>(() => {
    const operationId = operationSchema?.['x-operation-id']
    const initialBundleClaims = request.initialBundle && operationId
      ? readMultichannelOperationFromBundle(operationId, request.initialBundle, {
        operation: request.mode === 'update' ? MultichannelOperationMode.Update : MultichannelOperationMode.Create,
        resourceId: request.artifactId,
        ifMatch: request.ifMatch,
      }).claims
      : {}
    const initialResourceClaims = request.initialResource
      ? operationId
        ? selectMultichannelOperationClaimValues(
          operationId,
          clinicalArtifactFhirR4ToFlat(request.initialResource as ClinicalArtifactFhirR4Resource),
        )
        : clinicalArtifactEditorClaimsFromFhirR4(
          request.initialResource as ClinicalArtifactFhirR4Resource,
          {
            resourceType: request.resourceType as FhirIpsClinicalArtifactType,
            sectionCode: schema.sectionCode ?? request.sectionCode,
            requiredClaims: schema.requiredClaims,
            optionalClaims: schema.optionalClaims,
            terminologyTextClaims: schema.terminologyTextClaims ?? [],
            initialClaims: schema.initialClaims ?? defaultClaims(request.resourceType),
          },
        )
      : {}
    return {
      ...(operationSchema ? jsonSchemaDefaultClaims(operationSchema) : defaultClaims(request.resourceType)),
      ...schema.initialClaims,
      ...stringClaims(initialBundleClaims),
      ...stringClaims(initialResourceClaims),
      ...Object.fromEntries(Object.entries(request.initialClaims ?? {}).map(([claim, value]) => [claim, String(value ?? '')])),
    }
  })
  const [activeTerminologyClaim, setActiveTerminologyClaim] = useState<string>()
  const [candidates, setCandidates] = useState<readonly ClinicalTerminologyCandidate[]>([])
  const [terminologyBusy, setTerminologyBusy] = useState(false)
  const [terminologyError, setTerminologyError] = useState(false)
  const [terminologySources, setTerminologySources] = useState<readonly ClinicalTerminologySource[]>([])
  const [selectedTerminologySources, setSelectedTerminologySources] = useState<readonly string[]>([])
  const [terminologySourcesClaim, setTerminologySourcesClaim] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState('')
  const draftId = useRef(request.artifactId ?? crypto.randomUUID())

  useEffect(() => {
    if (!activeTerminologyClaim || !loadTerminologySources) return
    const codeClaim = terminologyCodeClaim(request.resourceType, activeTerminologyClaim)
    let current = true
    setTerminologySourcesClaim('')
    void loadTerminologySources({ resourceType: request.resourceType, claim: codeClaim, language: locale, taxonomyId }).then((sources) => {
      if (!current) return
      setTerminologySources(sources)
      const defaults = sources.filter(source => source.default).map(source => source.id)
      setSelectedTerminologySources(defaults.length ? defaults : sources[0] ? [sources[0].id] : [])
      setTerminologySourcesClaim(activeTerminologyClaim)
    }).catch(() => {
      if (current) { setTerminologySources([]); setSelectedTerminologySources([]); setTerminologySourcesClaim(activeTerminologyClaim) }
    })
    return () => { current = false }
  }, [activeTerminologyClaim, loadTerminologySources, locale, request.resourceType, taxonomyId])

  useEffect(() => {
    if (!activeTerminologyClaim || !searchTerminology) return
    if (loadTerminologySources && terminologySourcesClaim !== activeTerminologyClaim) return
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
        ...(selectedTerminologySources.length ? { sources: selectedTerminologySources } : {}),
      }).then((nextCandidates) => {
        if (current) setCandidates(nextCandidates)
      }).catch(() => {
        if (current) { setCandidates([]); setTerminologyError(true) }
      }).finally(() => {
        if (current) setTerminologyBusy(false)
      })
    }, 250)
    return () => { current = false; window.clearTimeout(timer) }
  }, [activeTerminologyClaim, claims, loadTerminologySources, locale, request.resourceType, searchTerminology, selectedTerminologySources, taxonomyId, terminologySourcesClaim])

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const result = await saveArtifact({
        resourceType: request.resourceType,
        id: draftId.current,
        sectionCode: request.sectionCode,
        mode: request.mode,
        claims,
        ...(operationSchema ? buildOperationDraft(
          operationSchema,
          authoringContext,
          request,
          draftId.current,
          claims,
        ) : {}),
      })
      if (!result) throw new Error(copy.readbackMissing)
      if (isSaveOutcome(result)) {
        if (result.state === 'confirmed') {
          setPending('')
          onReadback(result.bundle)
          return
        }
        if (result.state === 'rejected') throw new Error(result.message)
        setPending(result.message || copy.pending || copy.readbackMissing)
        return
      }
      setPending('')
      onReadback(result)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setSaving(false)
    }
  }

  return <ClinicalEditorLayer onDismiss={onCancel}><section className="uhcp-clinical-editor" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
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
        const schemaNode = operationSchema?.properties.claims?.properties?.[claim]
        const update = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
          setClaims((current) => ({ ...current, [claim]: event.target.value }))
          if (terminologyEnabled) setActiveTerminologyClaim(claim)
        }
        if (isDateTimeSchemaNode(schemaNode)) return <ClinicalDateTimeClaimField
          key={claim}
          label={label}
          required={requiredClaims.has(claim)}
          value={value}
          timeZone={timeZone}
          labels={copy.dateTime ?? DEFAULT_DATE_TIME_LABELS}
          onChange={(nextValue) => setClaims((current) => ({ ...current, [claim]: nextValue }))}
        />
        const fieldClassName = `uhcp-clinical-editor-field${isMultiline(parameter) ? ' uhcp-clinical-editor-wide' : ''}`
        const appendTranscript = (transcript: string) => {
          setClaims((current) => ({
            ...current,
            [claim]: [current[claim]?.trim(), transcript].filter(Boolean).join(' '),
          }))
          if (terminologyEnabled) setActiveTerminologyClaim(claim)
        }
        return <div key={claim} className={fieldClassName}>
          <span className="uhcp-clinical-editor-field-heading">
            <label htmlFor={inputId}>{label}{requiredClaims.has(claim) ? ' *' : ''}</label>
            {isSpeechCompatibleField(parameter, schemaNode) ? <ClinicalSpeechInputButton
              resourceType={request.resourceType}
              claim={claim}
              locale={locale}
              fieldLabel={label}
              onTranscript={appendTranscript}
            /> : null}
          </span>
          {statusOptions(request.resourceType, parameter) ? <select id={inputId} aria-label={label} value={value} required={requiredClaims.has(claim)} onChange={update}>
            {!requiredClaims.has(claim) ? <option value=""></option> : null}
            {statusOptions(request.resourceType, parameter)!.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}
          </select> : isMultiline(parameter) ? <textarea id={inputId} aria-label={label} value={value} required={requiredClaims.has(claim)} rows={3} onChange={update}/>
            : <input id={inputId} aria-label={label} value={value} required={requiredClaims.has(claim)} type={fieldInputType(parameter, operationSchema?.properties.claims?.properties?.[claim])} onChange={update}/>}
          {terminologyEnabled && activeTerminologyClaim === claim ? <div className="uhcp-terminology-results">
            {terminologySources.length ? <label>{copy.terminologySources || 'Coding systems'}
              <select multiple aria-label={copy.terminologySources || 'Coding systems'} value={[...selectedTerminologySources]} onChange={(event) => setSelectedTerminologySources([...event.currentTarget.selectedOptions].map(option => option.value))}>
                {terminologySources.map(source => <option key={source.id} value={source.id}>{source.label || source.id}</option>)}
              </select>
            </label> : null}
            {terminologyBusy ? <small role="status">{copy.terminologyLoading}</small> : null}
            {terminologyError ? <small role="alert">{copy.terminologyUnavailable}</small> : null}
            {candidates.length ? <ul>{candidates.map((candidate) => <li key={`${candidate.system}|${candidate.code}`}><button type="button" onClick={() => {
              setClaims((current) => selectedCodingClaims(request.resourceType, claim, candidate, acceptedClaims, current))
              setCandidates([])
              setActiveTerminologyClaim(undefined)
            }}>{candidate.display}<small>{candidate.system} · {candidate.code}</small></button></li>)}</ul> : null}
          </div> : null}
        </div>
      })}
      {error ? <p className="uhcp-clinical-editor-error" role="alert">{error}</p> : null}
      {pending ? <p className="uhcp-clinical-editor-pending" role="status">{copy.pending || pending}</p> : null}
      <footer><button type="button" onClick={onCancel}>{copy.cancel}</button><button type="submit" disabled={saving}>{saving ? copy.saving : pending ? (copy.retry || copy.save) : copy.save}</button></footer>
    </form>
  </section></ClinicalEditorLayer>
}

const DEFAULT_DATE_TIME_LABELS: ClinicalDateTimeFieldLabels = Object.freeze({
  date: 'Date',
  time: 'Time',
  useToday: 'Use today',
  useCurrentTime: 'Use current time',
})

function ClinicalDateTimeClaimField({ label, required, value, timeZone, labels, onChange }: Readonly<{
  label: string
  required: boolean
  value: string
  timeZone: string
  labels: ClinicalDateTimeFieldLabels
  onChange: (value: string) => void
}>) {
  const [parts, setParts] = useState<LocalDateTimeParts>(() => splitTemporalClaim(value, timeZone))
  const current = splitFhirDateTimeForInput(new Date(), timeZone)
  const update = (next: LocalDateTimeParts) => {
    setParts(next)
    onChange(composeTemporalClaim(next, timeZone))
  }
  return <fieldset className="uhcp-clinical-editor-date-time">
    <legend>{label}{required ? ' *' : ''}</legend>
    <label><span>{labels.date}</span><input aria-label={`${label}: ${labels.date}`} required={required} type="date" value={parts.date} onChange={(event) => update({ ...parts, date: event.target.value })}/></label>
    <button type="button" title={labels.useToday} aria-label={`${labels.useToday}: ${label}`} onClick={() => update({ ...parts, date: current.date })}>◉</button>
    <label><span>{labels.time}</span><input aria-label={`${label}: ${labels.time}`} type="time" step="1" value={parts.time} onChange={(event) => update({ ...parts, time: event.target.value })}/></label>
    <button type="button" title={labels.useCurrentTime} aria-label={`${labels.useCurrentTime}: ${label}`} onClick={() => update({ ...parts, time: current.time })}>◷</button>
  </fieldset>
}

function splitTemporalClaim(value: string, timeZone: string): LocalDateTimeParts {
  if (!value) return { date: '', time: '' }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date: value, time: '' }
  try { return splitFhirDateTimeForInput(value, timeZone) } catch { return { date: '', time: '' } }
}

function composeTemporalClaim(parts: LocalDateTimeParts, timeZone: string): string {
  if (!parts.date) return ''
  if (!parts.time) return parts.date
  return composeFhirDateTimeFromLocalParts({ ...parts, timeZone })
}

function isDateTimeSchemaNode(schemaNode?: MultichannelOperationSchemaNode): boolean {
  return schemaNode?.format === 'date-time' || schemaNode?.format === 'fhir-date-time'
}

function isSpeechCompatibleField(parameter: string, schemaNode?: MultichannelOperationSchemaNode): boolean {
  if (statusOptions('', parameter)) return false
  if (schemaNode?.type === 'number' || schemaNode?.type === 'integer' || schemaNode?.type === 'boolean') return false
  return fieldInputType(parameter, schemaNode) === 'text'
}

function isSaveOutcome(value: ClinicalResourceBundleLike | ClinicalArtifactSaveOutcome): value is ClinicalArtifactSaveOutcome {
  return typeof value === 'object' && value !== null && 'state' in value
}

function buildOperationDraft(
  operationSchema: MultichannelOperationSchema,
  authoringContext: ClinicalArtifactAuthoringContext | undefined,
  request: ClinicalArtifactEditorRequest,
  resourceId: string,
  claims: Readonly<Record<string, string>>,
): Readonly<{ operationValues: MultichannelOperationValues; changesBundle: ClinicalArtifactChangesBundle }> {
  if (!authoringContext) throw new TypeError('clinical_artifact_authoring_context_required')
  const operationId = operationSchema['x-operation-id'] as MultichannelOperationIdValue
  const operation = request.mode === 'update' ? MultichannelOperationMode.Update : MultichannelOperationMode.Create
  const operationValues = {
    operation,
    resourceId,
    ...authoringContext,
    ...(request.ifMatch ? { ifMatch: request.ifMatch } : {}),
    claims: coerceClaimsFromJsonSchema(operationSchema, claims),
  } as MultichannelOperationValues
  return Object.freeze({
    operationValues,
    changesBundle: buildMultichannelOperationBundle(operationId, operationValues),
  })
}

function coerceClaimsFromJsonSchema(
  schema: MultichannelOperationSchema,
  claims: Readonly<Record<string, string>>,
): Readonly<Record<string, unknown>> {
  const properties = schema.properties.claims?.properties ?? {}
  return Object.freeze(Object.fromEntries(Object.entries(claims)
    .filter(([claim, value]) => properties[claim] && value !== '')
    .map(([claim, value]) => [claim, properties[claim]?.type === 'number' ? Number(value) : value])))
}

function stringClaims(claims: Readonly<Record<string, unknown>>): Record<string, string> {
  return Object.fromEntries(Object.entries(claims).map(([claim, value]) => [claim, String(value ?? '')]))
}

function jsonSchemaDefaultClaims(schema: MultichannelOperationSchema): Record<string, string> {
  return Object.fromEntries(Object.entries(schema.properties.claims?.properties ?? {})
    .filter(([, node]) => node.default !== undefined)
    .map(([claim, node]) => [claim, String(node.default)]))
}

function defaultClaims(resourceType: string): Record<string, string> {
  if (resourceType === 'Immunization') return { 'Immunization.status': 'completed' }
  if (resourceType === 'Observation' || resourceType === 'DiagnosticReport') return { [`${resourceType}.status`]: 'final' }
  if (resourceType === 'Procedure') return { [`${resourceType}.status`]: 'completed' }
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
  // `code-text` is the generic primary-concept alias. Immunization deliberately
  // uses `vaccine-code-text` so vaccine product and target disease remain two
  // independent coded concepts throughout editing and FHIR projection.
  if (parameter === 'code-text') return `${resourceType}.code`
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
function fieldInputType(parameter: string, schemaNode?: MultichannelOperationSchemaNode): 'text' | 'number' {
  if (schemaNode) return schemaNode.type === 'number' || schemaNode.type === 'integer' ? 'number' : 'text'
  if (/(?:^|-)number$|frequency$|dose-sequence$/.test(parameter)) return 'number'
  // FHIR date/search fields may carry a partial date or a complete dateTime
  // with timezone. HTML date inputs silently truncate or reject those values.
  return 'text'
}
