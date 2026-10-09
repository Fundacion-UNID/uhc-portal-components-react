'use client'

import { useEffect, useMemo, useState } from 'react'
import { BundleEditor, type CompositionAttesterInput } from 'gdc-common-utils-ts/utils/bundle-editor-core'
import { BundleTypes } from 'gdc-common-utils-ts/models/bundle-editor-types'
import { HealthcareDocumentTypes } from 'gdc-common-utils-ts/constants/healthcare'
import { ClinicalResourceEntryEditor } from 'gdc-common-utils-ts/utils/clinical-resource-entry-editor'
import { buildDocumentReferenceFlatEntry } from 'fhir-data-utils-ts/flat-claim-resource-graph'
import 'gdc-common-utils-ts/utils/allergy-intolerance-entry-editor'
import 'gdc-common-utils-ts/utils/condition-entry-editor'
import 'gdc-common-utils-ts/utils/document-reference-entry-editor'
import 'gdc-common-utils-ts/utils/immunization-entry-editor'
import 'gdc-common-utils-ts/utils/medication-statement-entry-editor'
import 'gdc-common-utils-ts/utils/observation-entry-editor'
import 'gdc-common-utils-ts/utils/procedure-entry-editor'
import type { MultichannelOperationSchema } from 'sos-data-utils-ts/multichannel-operation-schemas'
import {
  ClinicalArtifactEditor,
  type ClinicalArtifactAuthoringContext,
  type ClinicalArtifactDraft,
  type ClinicalArtifactEditorCopy,
  type ClinicalArtifactEditorRequest,
  type ClinicalArtifactSchema,
  type ClinicalTerminologySearch,
  type ClinicalTerminologyCandidate,
  type ClinicalTerminologySourceSearch,
} from './ClinicalArtifactEditor.js'
import { ClinicalActionButton } from './ClinicalActionButton.js'
import {
  ImmunizationArtifactEditorV2,
  type ImmunizationArtifactEditorCopyV2,
} from './ImmunizationArtifactEditorV2.js'
import type { ClinicalArtifactDraftV2 } from './ClinicalArtifactEditorV2.js'
import { SchemaClinicalArtifactEditorV2 } from './SchemaClinicalArtifactEditorV2.js'

export type ClinicalBundleDraftSchema = Readonly<{
  schema: ClinicalArtifactSchema
  operationSchema: MultichannelOperationSchema
  sectionLabel: string
  artifactLabel: string
}>

export type ClinicalBundleDraft = Readonly<{
  resourceType: 'Bundle'
  type: 'document'
  entry: readonly unknown[]
}>

export type ClinicalBundleDraftSubmitOutcome = Readonly<{
  state: 'confirmed' | 'pending' | 'retryable' | 'rejected'
  message?: string
}>

export type ClinicalBundleDraftEditorCopy = Readonly<{
  title: string
  description: string
  empty: string
  add: string
  section?: string
  resourceType?: string
  addSection?: string
  addEntry?: string
  chooseResource?: string
  edit: string
  remove: string
  submit: string
  submitting: string
  drafted: string
  editor: ClinicalArtifactEditorCopy
}>

export type ClinicalBundleDraftEditorProps = Readonly<{
  schemas: readonly ClinicalBundleDraftSchema[]
  authoringContext: ClinicalArtifactAuthoringContext
  copy: ClinicalBundleDraftEditorCopy
  locale?: string
  timeZone?: string
  taxonomyId?: string
  fieldLabel: (claim: string) => string
  resourceTypeLabel?: (resourceType: string) => string
  searchTerminology?: (input: ClinicalTerminologySearch) => Promise<readonly ClinicalTerminologyCandidate[]>
  loadTerminologySources?: ClinicalTerminologySourceSearch
  /** Optional claims-first document Bundle loaded into the local draft; loading it never persists. */
  initialBundle?: ClinicalBundleDraft
  /** Observes the local draft only; it does not persist or submit it. */
  onDraftChange?: (bundle: ClinicalBundleDraft | undefined) => void
  onSubmitDraft: (bundle: ClinicalBundleDraft) => Promise<ClinicalBundleDraftSubmitOutcome>
  editorVersion?: 'v1' | 'v2'
  editorV2Copy?: ImmunizationArtifactEditorCopyV2
  artifactCredentialAction?: Readonly<{
    createLabel: string
    viewLabel: string
    isCreated: (draft: ClinicalArtifactDraftV2) => boolean
    onCreate: (input: Readonly<{ draft: ClinicalArtifactDraftV2; bundle: ClinicalBundleDraft }>) => ClinicalArtifactDraftV2 | Promise<ClinicalArtifactDraftV2>
    onView: (input: Readonly<{ draft: ClinicalArtifactDraftV2; bundle: ClinicalBundleDraft }>) => void
  }>
}>

type StagedArtifact = Readonly<{
  schema: ClinicalBundleDraftSchema
  draft: ClinicalArtifactDraft
}>

type EditorState = Readonly<{
  schema: ClinicalBundleDraftSchema
  draft?: ClinicalArtifactDraft
}>

type ResourceChooserState = Readonly<{
  sectionLabel: string
  schemaKey: string
}>

/**
 * Shared local-first IPS authoring workspace.
 *
 * The component stages schema-validated claims-first operations in one Bundle.
 * It owns no authorization or persistence: the host supplies subject and
 * provenance and only `onSubmitDraft` may cross a persistence boundary.
 */
export function ClinicalBundleDraftEditor({
  schemas,
  authoringContext,
  copy,
  locale = 'en',
  timeZone,
  taxonomyId,
  fieldLabel,
  resourceTypeLabel,
  searchTerminology,
  loadTerminologySources,
  initialBundle,
  onDraftChange,
  onSubmitDraft,
  editorVersion = 'v1',
  editorV2Copy,
  artifactCredentialAction,
}: ClinicalBundleDraftEditorProps) {
  const [artifacts, setArtifacts] = useState<readonly StagedArtifact[]>(() => importedArtifacts(initialBundle, schemas))
  const [editor, setEditor] = useState<EditorState>()
  const [resourceChooser, setResourceChooser] = useState<ResourceChooserState>()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const sections = useMemo(() => groupSchemas(schemas), [schemas])
  const [activeSections, setActiveSections] = useState<readonly string[]>(() => [...new Set(importedArtifacts(initialBundle, schemas).map(artifact => artifact.schema.sectionLabel))])
  const [selectedSection, setSelectedSection] = useState(() => groupSchemas(schemas)[0]?.label ?? '')
  const availableSections = sections.filter(section => !activeSections.includes(section.label))

  useEffect(() => {
    onDraftChange?.(artifacts.length ? combineClinicalDrafts(artifacts, authoringContext, copy.title) : undefined)
  }, [artifacts, authoringContext, copy.title, onDraftChange])

  function stageArtifact(draft: ClinicalArtifactDraft) {
    if (!editor) throw new TypeError('clinical_bundle_draft_editor_schema_required')
    setArtifacts((current) => {
      const next = current.filter((candidate) => candidate.draft.id !== draft.id)
      return [...next, { schema: editor.schema, draft }]
    })
    setNotice(copy.drafted)
    return { resourceType: 'Bundle', type: 'batch', data: [] } as const
  }

  async function submitDraft() {
    if (artifacts.length === 0 || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const outcome = await onSubmitDraft(combineClinicalDrafts(artifacts, authoringContext, copy.title))
      if (outcome.state === 'confirmed') {
        setArtifacts([])
        setActiveSections([])
        setNotice(outcome.message || '')
      } else if (outcome.state === 'rejected') {
        setError(outcome.message || copy.editor.readbackMissing)
      } else {
        setNotice(outcome.message || copy.editor.pending || copy.editor.readbackMissing)
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="uhcp-clinical-bundle-draft" data-clinical-bundle-draft>
    <header><h2>{copy.title}</h2><p>{copy.description}</p></header>
    {notice ? <p role="status">{notice}</p> : null}
    {error ? <p role="alert" className="uhcp-clinical-editor-error">{error}</p> : null}
    {availableSections.length ? <div className="uhcp-clinical-bundle-draft-create">
      <label>{copy.section || 'Section'}<select value={availableSections.some(section => section.label === selectedSection) ? selectedSection : availableSections[0]?.label} onChange={(event) => setSelectedSection(event.currentTarget.value)}>{availableSections.map(section => <option key={section.label} value={section.label}>{section.label}</option>)}</select></label>
      <button type="button" onClick={() => {
        const label = availableSections.some(section => section.label === selectedSection) ? selectedSection : availableSections[0]?.label
        if (!label) return
        setActiveSections(current => [...current, label])
        const nextAvailable = availableSections.find(section => section.label !== label)
        setSelectedSection(nextAvailable?.label ?? '')
      }}>+ {copy.addSection || copy.add}</button>
    </div> : null}
    {sections.filter(section => activeSections.includes(section.label)).map(({ label, schemas: sectionSchemas }) => {
      const sectionArtifacts = artifacts.filter((artifact) => artifact.schema.sectionLabel === label)
      return <details key={label} open>
        <summary>{label} ({sectionArtifacts.length})</summary>
        <button type="button" onClick={() => {
          if (sectionSchemas.length === 1) setEditor({ schema: sectionSchemas[0] })
          else setResourceChooser({ sectionLabel: label, schemaKey: schemaKey(sectionSchemas[0]) })
        }}>+ {copy.addEntry || copy.add}</button>
        {resourceChooser?.sectionLabel === label ? <div className="uhcp-clinical-bundle-resource-choice">
          <label>{copy.resourceType || 'Resource type'}<select value={resourceChooser.schemaKey} onChange={event => setResourceChooser({ sectionLabel: label, schemaKey: event.currentTarget.value })}>
            {sectionSchemas.map(candidate => <option key={schemaKey(candidate)} value={schemaKey(candidate)}>{resourceTypeLabel?.(candidate.schema.resourceType) || candidate.artifactLabel}</option>)}
          </select></label>
          <button type="button" onClick={() => {
            const selected = sectionSchemas.find(candidate => schemaKey(candidate) === resourceChooser.schemaKey)
            if (selected) setEditor({ schema: selected })
            setResourceChooser(undefined)
          }}>{copy.chooseResource || copy.add}</button>
        </div> : null}
        {sectionArtifacts.length === 0 ? <p>{copy.empty}</p> : <ul>
          {sectionArtifacts.map((artifact) => {
            const title = artifactTitle(artifact.draft)
            return <li key={artifact.draft.id}>
              <span><strong>{title}</strong><small>{artifact.draft.resourceType}</small></span>
              <span>
                {artifactCredentialAction ? <button type="button" className="uhcp-clinical-entry-credential-action" onClick={() => {
                  const draft = artifact.draft as ClinicalArtifactDraftV2
                  const bundle = combineClinicalDrafts([artifact], authoringContext, copy.title)
                  if (artifactCredentialAction.isCreated(draft)) {
                    artifactCredentialAction.onView({ draft, bundle })
                    return
                  }
                  void Promise.resolve(artifactCredentialAction.onCreate({ draft, bundle })).then(nextDraft => {
                    setArtifacts(current => current.map(candidate => candidate.draft.id === draft.id ? { ...candidate, draft: nextDraft } : candidate))
                  }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
                }}>{artifactCredentialAction.isCreated(artifact.draft as ClinicalArtifactDraftV2) ? artifactCredentialAction.viewLabel : artifactCredentialAction.createLabel}</button> : null}
                <ClinicalActionButton kind="edit" label={`${copy.edit} ${title}`} onClick={() => setEditor({ schema: artifact.schema, draft: artifact.draft })}/>
                <ClinicalActionButton kind="delete" label={`${copy.remove} ${title}`} onClick={() => setArtifacts((current) => current.filter((candidate) => candidate.draft.id !== artifact.draft.id))}/>
              </span>
            </li>
          })}
        </ul>}
      </details>
    })}
    {activeSections.length === 0 ? <p>{copy.empty}</p> : null}
    <footer><button type="button" disabled={artifacts.length === 0 || submitting} onClick={() => void submitDraft()}>{submitting ? copy.submitting : copy.submit}</button></footer>
    {editor && editorVersion === 'v2' && editor.schema.schema.resourceType === 'Immunization' && editorV2Copy ? <ImmunizationArtifactEditorV2
      request={editorRequest(editor)}
      authoringContext={authoringContext}
      copy={editorV2Copy}
      locale={locale}
      timeZone={timeZone}
      taxonomyId={taxonomyId}
      fieldLabel={fieldLabel}
      resourceTypeLabel={resourceTypeLabel?.(editor.schema.schema.resourceType) || editor.schema.artifactLabel}
      searchTerminology={searchTerminology}
      loadTerminologySources={loadTerminologySources}
      saveArtifact={async (draft) => stageArtifact(draft)}
      onCancel={() => setEditor(undefined)}
      onReadback={() => setEditor(undefined)}
    /> : editor && editorVersion === 'v2' && editorV2Copy ? <SchemaClinicalArtifactEditorV2
      request={editorRequest(editor)}
      schema={editor.schema.schema}
      authoringContext={authoringContext}
      copy={editorV2Copy}
      locale={locale}
      timeZone={timeZone}
      taxonomyId={taxonomyId}
      fieldLabel={fieldLabel}
      resourceTypeLabel={resourceTypeLabel?.(editor.schema.schema.resourceType) || editor.schema.artifactLabel}
      searchTerminology={searchTerminology}
      loadTerminologySources={loadTerminologySources}
      saveArtifact={async (draft) => stageArtifact(draft)}
      onCancel={() => setEditor(undefined)}
      onReadback={() => setEditor(undefined)}
    /> : editor ? <ClinicalArtifactEditor
      request={editorRequest(editor)}
      schema={editor.schema.schema}
      operationSchema={editor.schema.operationSchema}
      authoringContext={authoringContext}
      copy={copy.editor}
      locale={locale}
      timeZone={timeZone}
      taxonomyId={taxonomyId}
      fieldLabel={fieldLabel}
      resourceTypeLabel={resourceTypeLabel?.(editor.schema.schema.resourceType) || editor.schema.artifactLabel}
      searchTerminology={searchTerminology}
      loadTerminologySources={loadTerminologySources}
      saveArtifact={async (draft) => stageArtifact(draft)}
      onCancel={() => setEditor(undefined)}
      onReadback={() => setEditor(undefined)}
    /> : null}
  </section>
}

function editorRequest(editor: EditorState): ClinicalArtifactEditorRequest {
  return {
    resourceType: editor.schema.schema.resourceType,
    sectionCode: editor.schema.schema.sectionCode ?? '',
    mode: 'create',
    ...(editor.draft ? { artifactId: editor.draft.id, initialClaims: editor.draft.claims, initialAttachments: editor.draft.attachments } : { initialClaims: editor.schema.schema.initialClaims }),
  }
}

export function combineClinicalDrafts(
  artifacts: readonly StagedArtifact[],
  authoringContext: ClinicalArtifactAuthoringContext,
  documentTitle: string,
): ClinicalBundleDraft {
  const editor = new BundleEditor()
    .setBundleType(BundleTypes.document)
    .setCompositionSubject(authoringContext.subjectReference)
    .setCompositionType(HealthcareDocumentTypes.IPS.attributeValue)
    .setCompositionTitle(documentTitle)
    .setCompositionDate(authoringContext.createdAt)
    .setCompositionAuthorList([authoringContext.dataAuthorReference])

  if (authoringContext.attestationState === 'confirmed') {
    if (!authoringContext.attesterReference || !authoringContext.attesterMode || !authoringContext.attestedAt) {
      throw new TypeError('clinical_bundle_draft_attester_required')
    }
    editor.setCompositionAttesterList([{
      reference: authoringContext.attesterReference,
      mode: authoringContext.attesterMode,
      time: authoringContext.attestedAt,
    } as CompositionAttesterInput])
  }

  for (const { draft } of artifacts) {
    const attachments = draft.attachments ?? []
    const claims = {
      ...(draft.changesBundle ? operationClaims(draft) : draft.claims),
      ...(attachments.length ? { [`${draft.resourceType}.contained-reference-list`]: attachments.map(attachment => `DocumentReference/${attachment.id}`).join(',') } : {}),
    }
    const entry = editor.newEntryAs(draft.resourceType, draft.id)
    for (const [claim, value] of Object.entries(claims)) entry.setClaim(claim, value)
    if (!(entry instanceof ClinicalResourceEntryEditor)) {
      throw new TypeError(`clinical_bundle_draft_resource_unsupported:${draft.resourceType}`)
    }
    entry.setSectionList([draft.sectionCode])
    for (const attachment of attachments) {
      const document = buildDocumentReferenceFlatEntry({
        entryId: attachment.id,
        identifier: attachment.id,
        contentType: attachment.contentType,
        contentHash: attachment.contentHash,
        title: attachment.name,
        dataBase64: attachment.dataBase64,
      })
      const documentEntry = editor.newEntryAs(document.resourceType, document.entryId)
      for (const [claim, value] of Object.entries(document.claims)) documentEntry.setClaim(claim, value)
      documentEntry.setClaim('DocumentReference.subject', authoringContext.subjectReference)
      documentEntry.setClaim('DocumentReference.author', authoringContext.dataAuthorReference)
    }
    for (const related of (draft as ClinicalArtifactDraftV2).relatedEntries ?? []) {
      const relatedEntry = editor.newEntryAs(related.resourceType, related.entryId)
      for (const [claim, value] of Object.entries(related.claims)) relatedEntry.setClaim(claim, value)
      if (related.sectionCode && relatedEntry instanceof ClinicalResourceEntryEditor) relatedEntry.setSectionList([related.sectionCode])
    }
  }

  return editor.buildDocument() as ClinicalBundleDraft
}

export type ClinicalBundleDraftEditorV2Props = Omit<ClinicalBundleDraftEditorProps, 'editorVersion' | 'editorV2Copy'> & Readonly<{
  editorV2Copy: ImmunizationArtifactEditorCopyV2
}>

/** V2 opt-in wrapper; the original editor remains the default everywhere else. */
export function ClinicalBundleDraftEditorV2(props: ClinicalBundleDraftEditorV2Props) {
  return <ClinicalBundleDraftEditor {...props} editorVersion="v2" />
}

function operationClaims(draft: ClinicalArtifactDraft): Readonly<Record<string, unknown>> {
  const entries = draft.changesBundle?.data ?? draft.changesBundle?.entry ?? []
  const first = entries[0]
  if (!first || typeof first !== 'object' || !('resource' in first)) {
    throw new TypeError('clinical_bundle_draft_operation_entry_required')
  }
  const resource = first.resource
  if (!resource || typeof resource !== 'object' || !('meta' in resource)) {
    throw new TypeError('clinical_bundle_draft_operation_claims_required')
  }
  const meta = resource.meta
  if (!meta || typeof meta !== 'object' || !('claims' in meta) || !meta.claims || typeof meta.claims !== 'object') {
    throw new TypeError('clinical_bundle_draft_operation_claims_required')
  }
  return meta.claims as Readonly<Record<string, unknown>>
}

function groupSchemas(schemas: readonly ClinicalBundleDraftSchema[]) {
  const sections = new Map<string, ClinicalBundleDraftSchema[]>()
  for (const schema of schemas) sections.set(schema.sectionLabel, [...(sections.get(schema.sectionLabel) ?? []), schema])
  return [...sections].map(([label, grouped]) => ({ label, schemas: grouped }))
}

function schemaKey(schema: ClinicalBundleDraftSchema): string {
  return `${schema.schema.sectionCode ?? ''}:${schema.operationSchema['x-operation-id']}`
}

function artifactTitle(draft: ClinicalArtifactDraft): string {
  const preferred = Object.entries(draft.claims).find(([claim, value]) =>
    typeof value === 'string' && value.trim() && (claim.endsWith('-text') || claim.endsWith('.note') || claim.endsWith('.description')),
  )?.[1]
  return typeof preferred === 'string' ? preferred : draft.resourceType
}

function importedArtifacts(bundle: ClinicalBundleDraft | undefined, schemas: readonly ClinicalBundleDraftSchema[]): readonly StagedArtifact[] {
  if (!bundle || bundle.resourceType !== 'Bundle' || bundle.type !== 'document' || !Array.isArray(bundle.entry)) return []
  return bundle.entry.flatMap((entry) => {
    const resource = record(record(entry).resource)
    const schema = schemas.find(candidate => candidate.schema.resourceType === resource.resourceType)
    const claims = record(record(resource.meta).claims)
    const id = String(resource.id || '').trim()
    if (!schema || !id || Object.keys(claims).length === 0) return []
    const stringValues = Object.fromEntries(Object.entries(claims).map(([claim, value]) => [claim, String(value ?? '')]))
    return [{ schema, draft: {
      resourceType: schema.schema.resourceType,
      id,
      sectionCode: schema.schema.sectionCode ?? '',
      mode: 'update',
      claims: stringValues,
      changesBundle: { resourceType: 'Bundle', type: 'batch', data: [{ resource }] },
    } satisfies ClinicalArtifactDraft }]
  })
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
