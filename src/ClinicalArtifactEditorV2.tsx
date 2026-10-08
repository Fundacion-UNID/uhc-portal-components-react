'use client'

import { useId, useRef, useState } from 'react'
import type { ClinicalResourceBundleLike } from 'gdc-common-utils-ts/utils/clinical-resource-view'
import { ClinicalEditorLayer } from './ClinicalEditorLayer.js'
import { readClinicalAttachment } from './ClinicalArtifactEditor.js'
import {
  CodedConceptPropertyV2,
  CodedSelectPropertyV2,
  DateTimePropertyV2,
  DocumentReferencesPropertyV2,
  OptionalFieldsV2,
  PositiveIntegerPropertyV2,
  type ClinicalPropertyOptionV2,
} from './ClinicalArtifactPropertiesV2.js'
import type {
  ClinicalArtifactAttachment,
  ClinicalArtifactAuthoringContext,
  ClinicalArtifactDraft,
  ClinicalArtifactEditorRequest,
  ClinicalArtifactSaveOutcome,
  ClinicalTerminologyCandidate,
  ClinicalTerminologySearch,
  ClinicalTerminologySourceSearch,
} from './ClinicalArtifactEditor.js'

export type ClinicalArtifactRelatedEntryV2 = Readonly<{
  entryId: string
  resourceType: string
  claims: Readonly<Record<string, string>>
  sectionCode?: string
}>

export type ClinicalArtifactDraftV2 = ClinicalArtifactDraft & Readonly<{
  relatedEntries?: readonly ClinicalArtifactRelatedEntryV2[]
}>

export type ClinicalArtifactFieldV2 = Readonly<{
  claim: string
  kind: 'text' | 'date' | 'date-time' | 'positive-integer' | 'coded-select' | 'coded-concept' | 'documents'
  required?: boolean
  transient?: boolean
  options?: readonly ClinicalPropertyOptionV2[]
  textClaim?: string
  codeClaim?: string
  displayClaim?: string
}>

export type ClinicalArtifactEditorCopyV2 = Readonly<{
  title: string; description: string; resourceType?: string; save: string; saving: string; cancel: string; close: string
  terminologyLoading: string; terminologyUnavailable: string; terminologySources: string; readbackMissing: string
  addField: string; chooseField: string; addSelectedField: string; removeField: string
  searchTerminology: string; clearCoding: string; selectCandidate: string; canonicalCode: string; canonicalDisplay: string
  documents: string; addDocuments: string; removeDocument: string
  date: string; time: string; useToday: string; useCurrentTime: string
}>

export type ClinicalArtifactEditorV2Props = Readonly<{
  request: ClinicalArtifactEditorRequest
  authoringContext: ClinicalArtifactAuthoringContext
  copy: ClinicalArtifactEditorCopyV2
  fields: readonly ClinicalArtifactFieldV2[]
  initialVisibleClaims: readonly string[]
  initialClaims?: Readonly<Record<string, string>>
  locale?: string
  timeZone?: string
  taxonomyId?: string
  fieldLabel: (claim: string) => string
  resourceTypeLabel?: string
  searchTerminology?: (input: ClinicalTerminologySearch) => Promise<readonly ClinicalTerminologyCandidate[]>
  loadTerminologySources?: ClinicalTerminologySourceSearch
  validate?: (claims: Readonly<Record<string, string>>) => void
  buildRelatedEntries?: (claims: Readonly<Record<string, string>>, draftId: string) => readonly ClinicalArtifactRelatedEntryV2[]
  saveArtifact: (draft: ClinicalArtifactDraftV2) => Promise<ClinicalResourceBundleLike | ClinicalArtifactSaveOutcome | undefined>
  onCancel: () => void
  onReadback: (bundle: ClinicalResourceBundleLike) => void
}>

/** Progressive reusable V2 shell. Resource rules are supplied by a specialized editor. */
export function ClinicalArtifactEditorV2({ request, authoringContext, copy, fields, initialVisibleClaims, initialClaims = {}, locale = 'en', timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone, taxonomyId, fieldLabel, resourceTypeLabel, searchTerminology, loadTerminologySources, validate, buildRelatedEntries, saveArtifact, onCancel, onReadback }: ClinicalArtifactEditorV2Props) {
  const titleId = useId()
  const [claims, setClaims] = useState<Record<string, string>>({ ...initialClaims, ...stringClaims(request.initialClaims) })
  const [visibleClaims, setVisibleClaims] = useState<readonly string[]>(() => [...new Set([...initialVisibleClaims, ...Object.keys(request.initialClaims ?? {}).filter(claim => fields.some(field => field.claim === claim))])])
  const [selectedOptional, setSelectedOptional] = useState('')
  const [saving, setSaving] = useState(false)
  const [attachments, setAttachments] = useState<readonly ClinicalArtifactAttachment[]>(request.initialAttachments ?? [])
  const [error, setError] = useState('')
  const draftId = useRef(request.artifactId ?? crypto.randomUUID())
  const optional = fields.filter(field => !field.required && !visibleClaims.includes(field.claim)).map(field => ({ value: field.claim, label: fieldLabel(field.claim) }))
  const update = (claim: string, value: string) => setClaims(current => ({ ...current, [claim]: value }))

  async function submit() {
    setError('')
    try {
      validate?.(claims)
      setSaving(true)
      const draft: ClinicalArtifactDraftV2 = {
        resourceType: request.resourceType,
        id: draftId.current,
        sectionCode: request.sectionCode,
        mode: request.mode,
        claims: cleanClaims(claims, fields),
        attachments,
        relatedEntries: buildRelatedEntries?.(claims, draftId.current) ?? [],
      }
      const result = await saveArtifact(draft)
      if (!result) throw new Error(copy.readbackMissing)
      if ('state' in result) {
        if (result.state === 'confirmed') onReadback(result.bundle)
        else if (result.state === 'rejected') throw new Error(result.message)
        return
      }
      onReadback(result)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally { setSaving(false) }
  }

  return <ClinicalEditorLayer onDismiss={onCancel}><section className="uhcp-clinical-editor uhcp-clinical-editor-v2" role="dialog" aria-modal="true" aria-labelledby={titleId}>
    <header><div><h2 id={titleId}>{copy.title}</h2><p className="uhcp-clinical-editor-resource-type">{copy.resourceType || 'FHIR resource'}: {resourceTypeLabel || request.resourceType}</p><p>{copy.description}</p></div><button type="button" aria-label={copy.close} onClick={onCancel}>×</button></header>
    <form onSubmit={event => { event.preventDefault(); void submit() }}>
      {fields.filter(field => visibleClaims.includes(field.claim)).map(field => <div key={field.claim} className="uhcp-progressive-field-v2">
        {!field.required ? <button type="button" className="uhcp-remove-field-v2" aria-label={`${copy.removeField}: ${fieldLabel(field.claim)}`} onClick={() => { setVisibleClaims(current => current.filter(claim => claim !== field.claim)); if (field.kind === 'documents') setAttachments([]); setClaims(current => { const next = { ...current }; delete next[field.claim]; if (field.codeClaim) delete next[field.codeClaim]; if (field.displayClaim) delete next[field.displayClaim]; return next }) }}>×</button> : null}
        {field.kind === 'documents' ? <DocumentReferencesPropertyV2 copy={copy} attachments={attachments} onFiles={files => { void Promise.all(files.map(readClinicalAttachment)).then(next => setAttachments(current => [...current, ...next])).catch(reason => setError(reason instanceof Error ? reason.message : String(reason))) }} onRemove={id => setAttachments(current => current.filter(attachment => attachment.id !== id))}/>
          : <ClinicalProperty field={field} label={fieldLabel(field.claim)} resourceType={request.resourceType} value={claims[field.claim] ?? ''} claims={claims} locale={locale} timeZone={timeZone} taxonomyId={taxonomyId} copy={copy} update={update} searchTerminology={searchTerminology} loadTerminologySources={loadTerminologySources}/>} 
      </div>)}
      <OptionalFieldsV2 label={copy.addField} choose={copy.chooseField} add={copy.addSelectedField} options={optional} value={selectedOptional} onValueChange={setSelectedOptional} onAdd={() => { if (!selectedOptional) return; setVisibleClaims(current => [...current, selectedOptional]); setSelectedOptional('') }}/>
      {error ? <p className="uhcp-clinical-editor-error" role="alert">{error}</p> : null}
      <footer><button type="button" onClick={onCancel}>{copy.cancel}</button><button type="submit" disabled={saving}>{saving ? copy.saving : copy.save}</button></footer>
    </form>
  </section></ClinicalEditorLayer>
}

function ClinicalProperty({ field, label, resourceType, value, claims, locale, timeZone, taxonomyId, copy, update, searchTerminology, loadTerminologySources }: Readonly<{
  field: ClinicalArtifactFieldV2; label: string; resourceType: string; value: string; claims: Readonly<Record<string, string>>; locale: string; timeZone: string; taxonomyId?: string; copy: ClinicalArtifactEditorCopyV2; update: (claim: string, value: string) => void; searchTerminology?: (input: ClinicalTerminologySearch) => Promise<readonly ClinicalTerminologyCandidate[]>; loadTerminologySources?: ClinicalTerminologySourceSearch
}>) {
  if (field.kind === 'date-time') return <DateTimePropertyV2 label={label} value={value} required={field.required} locale={locale} timeZone={timeZone} copy={copy} onChange={next => update(field.claim, next)}/>
  if (field.kind === 'date') return <label className="uhcp-clinical-property-v2">{label}{field.required ? ' *' : ''}<input aria-label={label} type="date" required={field.required} value={value} onChange={event => update(field.claim, event.currentTarget.value)}/></label>
  if (field.kind === 'positive-integer') return <PositiveIntegerPropertyV2 label={label} value={value} required={field.required} onChange={next => update(field.claim, next)}/>
  if (field.kind === 'coded-select') return <CodedSelectPropertyV2 label={label} value={value} required={field.required} options={field.options ?? []} onChange={next => update(field.claim, next)}/>
  if (field.kind === 'coded-concept' && field.codeClaim) return <CodedConceptPropertyV2 resourceType={resourceType} textClaim={field.textClaim} codeClaim={field.codeClaim} displayClaim={field.displayClaim} label={label} locale={locale} taxonomyId={taxonomyId} text={field.textClaim ? claims[field.textClaim] ?? '' : ''} code={claims[field.codeClaim] ?? ''} display={field.displayClaim ? claims[field.displayClaim] ?? '' : ''} required={field.required} copy={copy} searchTerminology={searchTerminology} loadTerminologySources={loadTerminologySources} onChange={next => { if (field.textClaim) update(field.textClaim, next.text); update(field.codeClaim!, next.code); if (field.displayClaim) update(field.displayClaim, next.display) }}/>
  return <label className="uhcp-clinical-property-v2">{label}{field.required ? ' *' : ''}<input aria-label={label} required={field.required} value={value} onChange={event => update(field.claim, event.currentTarget.value)}/></label>
}

function stringClaims(value: Readonly<Record<string, unknown>> | undefined): Record<string, string> { return Object.fromEntries(Object.entries(value ?? {}).map(([claim, item]) => [claim, String(item ?? '')])) }
function cleanClaims(value: Readonly<Record<string, string>>, fields: readonly ClinicalArtifactFieldV2[]): Readonly<Record<string, string>> {
  const transient = new Set(fields.filter(field => field.transient).map(field => field.claim))
  return Object.fromEntries(Object.entries(value).filter(([claim, item]) => item !== '' && !transient.has(claim)))
}
