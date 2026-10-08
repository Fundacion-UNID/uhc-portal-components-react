'use client'

import { useMemo, useState } from 'react'
import { BundleEditor, type CompositionAttesterInput } from 'gdc-common-utils-ts/utils/bundle-editor-core'
import { BundleTypes } from 'gdc-common-utils-ts/models/bundle-editor-types'
import { HealthcareDocumentTypes } from 'gdc-common-utils-ts/constants/healthcare'
import { ClinicalResourceEntryEditor } from 'gdc-common-utils-ts/utils/clinical-resource-entry-editor'
import 'gdc-common-utils-ts/utils/allergy-intolerance-entry-editor'
import 'gdc-common-utils-ts/utils/condition-entry-editor'
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
  searchTerminology?: (input: ClinicalTerminologySearch) => Promise<readonly ClinicalTerminologyCandidate[]>
  loadTerminologySources?: ClinicalTerminologySourceSearch
  /** Optional claims-first document Bundle loaded into the local draft; loading it never persists. */
  initialBundle?: ClinicalBundleDraft
  onSubmitDraft: (bundle: ClinicalBundleDraft) => Promise<ClinicalBundleDraftSubmitOutcome>
}>

type StagedArtifact = Readonly<{
  schema: ClinicalBundleDraftSchema
  draft: ClinicalArtifactDraft
}>

type EditorState = Readonly<{
  schema: ClinicalBundleDraftSchema
  draft?: ClinicalArtifactDraft
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
  searchTerminology,
  loadTerminologySources,
  initialBundle,
  onSubmitDraft,
}: ClinicalBundleDraftEditorProps) {
  const [artifacts, setArtifacts] = useState<readonly StagedArtifact[]>(() => importedArtifacts(initialBundle, schemas))
  const [editor, setEditor] = useState<EditorState>()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const sections = useMemo(() => groupSchemas(schemas), [schemas])

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
      const outcome = await onSubmitDraft(combineDrafts(artifacts, authoringContext, copy.title))
      if (outcome.state === 'confirmed') {
        setArtifacts([])
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
    {sections.map(({ label, schemas: sectionSchemas }) => {
      const sectionArtifacts = artifacts.filter((artifact) => artifact.schema.sectionLabel === label)
      return <details key={label} open>
        <summary>{label} ({sectionArtifacts.length})</summary>
        <div className="uhcp-clinical-bundle-draft-add">
          {sectionSchemas.map((candidate) => <ClinicalActionButton
            key={schemaKey(candidate)}
            kind="add"
            label={`${copy.add} ${candidate.artifactLabel}`}
            onClick={() => setEditor({ schema: candidate })}
          />)}
        </div>
        {sectionArtifacts.length === 0 ? <p>{copy.empty}</p> : <ul>
          {sectionArtifacts.map((artifact) => {
            const title = artifactTitle(artifact.draft)
            return <li key={artifact.draft.id}>
              <span><strong>{title}</strong><small>{artifact.draft.resourceType}</small></span>
              <span>
                <ClinicalActionButton kind="edit" label={`${copy.edit} ${title}`} onClick={() => setEditor({ schema: artifact.schema, draft: artifact.draft })}/>
                <ClinicalActionButton kind="delete" label={`${copy.remove} ${title}`} onClick={() => setArtifacts((current) => current.filter((candidate) => candidate.draft.id !== artifact.draft.id))}/>
              </span>
            </li>
          })}
        </ul>}
      </details>
    })}
    {artifacts.length === 0 && sections.length === 0 ? <p>{copy.empty}</p> : null}
    <footer><button type="button" disabled={artifacts.length === 0 || submitting} onClick={() => void submitDraft()}>{submitting ? copy.submitting : copy.submit}</button></footer>
    {editor ? <ClinicalArtifactEditor
      request={editorRequest(editor)}
      schema={editor.schema.schema}
      operationSchema={editor.schema.operationSchema}
      authoringContext={authoringContext}
      copy={copy.editor}
      locale={locale}
      timeZone={timeZone}
      taxonomyId={taxonomyId}
      fieldLabel={fieldLabel}
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
    ...(editor.draft ? { artifactId: editor.draft.id, initialClaims: editor.draft.claims } : { initialClaims: editor.schema.schema.initialClaims }),
  }
}

function combineDrafts(
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
    const entry = editor.newEntryAs(draft.resourceType, draft.id)
    for (const [claim, value] of Object.entries(operationClaims(draft))) entry.setClaim(claim, value)
    if (!(entry instanceof ClinicalResourceEntryEditor)) {
      throw new TypeError(`clinical_bundle_draft_resource_unsupported:${draft.resourceType}`)
    }
    entry.setSectionList([draft.sectionCode])
  }

  return editor.buildDocument() as ClinicalBundleDraft
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
