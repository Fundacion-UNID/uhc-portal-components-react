// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
/**
 * Journey:
 * 1. An authorized professional opens one shared IPS Bundle draft for a typed subject.
 * 2. They add a schema-backed resource, optionally using speech and terminology, without persisting it.
 * 3. They edit or remove only entries staged in that draft with the shared icon actions.
 * 4. One explicit final action submits one claims-first batch and clears it only after confirmation.
 * Authorization invariant: the host supplies subject, creator, attester and the final submit capability.
 * Persistence invariant: add, edit and delete are local draft operations; only final submit may persist.
 */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS,
  FhirIpsClinicalArtifactTypes,
} from 'fhir-data-utils-ts'
import {
  MULTICHANNEL_OPERATION_SCHEMAS,
  MultichannelAttestationState,
  MultichannelOperationId,
} from 'sos-data-utils-ts/multichannel-operation-schemas'
import { REPOSITORY_SAFE_EXAMPLES } from 'sos-data-utils-ts/repository-privacy'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClinicalBundleDraftEditor } from '../src/ClinicalBundleDraftEditor.js'

const resourceType = FhirIpsClinicalArtifactTypes.Condition
const schema = FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS[resourceType]
const immunizationType = FhirIpsClinicalArtifactTypes.Immunization
const immunizationSchema = FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS[immunizationType]
const subjectReference = `ResearchSubject/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const creatorReference = `PractitionerRole/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const conceptClaim = `${resourceType}.code-text`
const firstConcept = 'Fracture'
const correctedConcept = 'Closed fracture'

afterEach(cleanup)

function renderDraft(onSubmitDraft = vi.fn().mockResolvedValue({ state: 'confirmed' }), initialBundle?: any, multipleSchemas = false, resourceTypeLabel?: (resourceType: string) => string, onDraftChange?: (bundle: any) => void, artifactCredentialAction?: any) {
  return render(<ClinicalBundleDraftEditor
    schemas={[{
      schema,
      operationSchema: MULTICHANNEL_OPERATION_SCHEMAS[MultichannelOperationId.Condition],
      sectionLabel: 'Problems',
      artifactLabel: 'Condition',
    }, ...(multipleSchemas ? [{
      schema: immunizationSchema,
      operationSchema: MULTICHANNEL_OPERATION_SCHEMAS[MultichannelOperationId.Immunization],
      sectionLabel: 'Immunizations',
      artifactLabel: 'Immunization',
    }] : [])]}
    authoringContext={{
      subjectReference,
      language: 'en',
      createdAt: '2026-10-07T00:00:00Z',
      dataAuthorReference: creatorReference,
      attestationState: MultichannelAttestationState.Confirmed,
      attesterReference: creatorReference,
      attesterMode: 'professional',
      attestedAt: '2026-10-07T00:01:00Z',
    }}
    copy={{
      title: 'Add data', description: 'Build the Bundle before sending it.',
      empty: 'No draft data.', add: 'Add', edit: 'Edit', remove: 'Remove',
      section: 'Section', resourceType: 'Resource type', addSection: 'Add section', addEntry: 'Add entry', chooseResource: 'Choose resource',
      submit: 'Send Bundle', submitting: 'Sending', drafted: 'Added to draft',
      editor: { title: 'Condition', description: 'Add a condition', save: 'Add to draft', saving: 'Adding', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Draft unavailable', attachments: 'Documents', addAttachments: 'Add PDF or image', removeAttachment: 'Remove document' },
    }}
    fieldLabel={(claim) => claim === conceptClaim ? 'Clinical concept' : claim}
    resourceTypeLabel={resourceTypeLabel}
    initialBundle={initialBundle}
    onDraftChange={onDraftChange}
    artifactCredentialAction={artifactCredentialAction}
    onSubmitDraft={onSubmitDraft}
  />)
}

describe('ClinicalBundleDraftEditor', () => {
  it('starts without sections, adds one section, and opens its only resource directly', () => {
    renderDraft(undefined, undefined, true)

    expect(screen.getByLabelText('Section')).toBeTruthy()
    expect(screen.queryByText('Problems (0)')).toBeNull()
    expect(screen.queryByText('Immunizations (0)')).toBeNull()
    expect(screen.queryByLabelText('Resource type')).toBeNull()

    fireEvent.change(screen.getByLabelText('Section'), { target: { value: 'Immunizations' } })
    fireEvent.click(screen.getByRole('button', { name: '+ Add section' }))
    expect(screen.getByText('Immunizations (0)')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '+ Add entry' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('asks for the resource type only when one section supports several resources', () => {
    const sameSectionSchemas = [{
      schema,
      operationSchema: MULTICHANNEL_OPERATION_SCHEMAS[MultichannelOperationId.Condition],
      sectionLabel: 'Clinical events',
      artifactLabel: 'Condition',
    }, {
      schema: immunizationSchema,
      operationSchema: MULTICHANNEL_OPERATION_SCHEMAS[MultichannelOperationId.Immunization],
      sectionLabel: 'Clinical events',
      artifactLabel: 'Immunization',
    }]
    render(<ClinicalBundleDraftEditor
      schemas={sameSectionSchemas}
      authoringContext={{ subjectReference, language: 'en', createdAt: '2026-10-07T00:00:00Z', dataAuthorReference: creatorReference, attestationState: MultichannelAttestationState.Confirmed, attesterReference: creatorReference, attesterMode: 'professional', attestedAt: '2026-10-07T00:01:00Z' }}
      copy={{ title: 'Add data', description: 'Build the Bundle.', empty: 'No draft data.', add: 'Add', edit: 'Edit', remove: 'Remove', section: 'Section', resourceType: 'Resource type', addSection: 'Add section', addEntry: 'Add entry', chooseResource: 'Choose resource', submit: 'Send Bundle', submitting: 'Sending', drafted: 'Added', editor: { title: 'Entry', description: 'Add entry', save: 'Add to draft', saving: 'Adding', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Unavailable', attachments: 'Documents', addAttachments: 'Add documents', removeAttachment: 'Remove document' } }}
      fieldLabel={(claim) => claim}
      onSubmitDraft={vi.fn()}
    />)
    fireEvent.click(screen.getByRole('button', { name: '+ Add section' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add entry' }))
    expect(screen.getByLabelText('Resource type')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Choose resource' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('names the selected FHIR resource in the selector and entry dialog', () => {
    renderDraft(undefined, undefined, true, (candidate) => candidate === resourceType ? 'Problem (Condition)' : 'Vaccination (Immunization)')

    fireEvent.click(screen.getByRole('button', { name: '+ Add section' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add entry' }))
    expect(screen.getByText('FHIR resource: Problem (Condition)')).toBeTruthy()
  })

  it('hydrates claims-first resources from an imported document Bundle for editing before submit', async () => {
    renderDraft(undefined, {
      resourceType: 'Bundle', type: 'document', entry: [
        { resource: { resourceType: 'Composition', subject: { reference: subjectReference } } },
        { resource: { resourceType, id: 'condition-imported', meta: { claims: {
          [conceptClaim]: firstConcept,
          'Condition.subject': subjectReference,
          'Condition.recorder': creatorReference,
        } } } },
      ],
    })

    expect(screen.getByText(firstConcept)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: `Edit ${firstConcept}` }))
    expect((screen.getByLabelText('Clinical concept') as HTMLInputElement).value).toBe(firstConcept)
  })

  it('creates and then views a per-entry credential without persisting the document', async () => {
    const onCreate = vi.fn(async ({ draft }) => ({ ...draft, relatedEntries: [{
      entryId: 'shc-condition', resourceType: 'DocumentReference',
      claims: {
        'DocumentReference.identifier': 'urn:uuid:shc-condition',
        'DocumentReference.status': 'current',
        'DocumentReference.contenttype': 'application/smart-health-card',
        'DocumentReference.subject': subjectReference,
        'DocumentReference.author': creatorReference,
      },
    }] }))
    const onView = vi.fn()
    const credentialAction = {
      createLabel: 'Create SHC', viewLabel: 'View SHC',
      isCreated: (draft: any) => draft.relatedEntries?.some((entry: any) => entry.claims['DocumentReference.contenttype'] === 'application/smart-health-card') ?? false,
      onCreate, onView,
    }
    renderDraft(vi.fn(), {
      resourceType: 'Bundle', type: 'document', entry: [
        { resource: { resourceType: 'Composition', subject: { reference: subjectReference } } },
        { resource: { resourceType, id: 'condition-imported', meta: { claims: {
          [conceptClaim]: firstConcept,
          'Condition.subject': subjectReference,
          'Condition.recorder': creatorReference,
        } } } },
      ],
    }, false, undefined, undefined, credentialAction)

    fireEvent.click(screen.getByRole('button', { name: 'Create SHC' }))
    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    fireEvent.click(await screen.findByRole('button', { name: 'View SHC' }))
    expect(onView).toHaveBeenCalledTimes(1)
  })
  it('stages, edits and removes one schema-backed ResearchSubject entry before submission', async () => {
    const onSubmitDraft = vi.fn().mockResolvedValue({ state: 'confirmed' })
    renderDraft(onSubmitDraft)

    fireEvent.click(screen.getByRole('button', { name: '+ Add section' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add entry' }))
    fireEvent.change(screen.getByLabelText('Clinical concept'), { target: { value: firstConcept } })
    fireEvent.click(screen.getByRole('button', { name: 'Add to draft' }))

    expect(await screen.findByText(firstConcept)).toBeTruthy()
    expect(onSubmitDraft).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: `Edit ${firstConcept}` }))
    fireEvent.change(screen.getByLabelText('Clinical concept'), { target: { value: correctedConcept } })
    fireEvent.click(screen.getByRole('button', { name: 'Add to draft' }))

    expect(await screen.findByText(correctedConcept)).toBeTruthy()
    expect(screen.queryByText(firstConcept)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: `Remove ${correctedConcept}` }))
    expect(screen.getByText('No draft data.')).toBeTruthy()
  })

  it('submits one Composition-first IPS document with typed subject, section and host-owned provenance', async () => {
    const onSubmitDraft = vi.fn().mockResolvedValue({ state: 'confirmed' })
    renderDraft(onSubmitDraft)

    fireEvent.click(screen.getByRole('button', { name: '+ Add section' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add entry' }))
    fireEvent.change(screen.getByLabelText('Clinical concept'), { target: { value: firstConcept } })
    fireEvent.click(screen.getByRole('button', { name: 'Add to draft' }))
    await screen.findByText(firstConcept)
    fireEvent.click(screen.getByRole('button', { name: 'Send Bundle' }))

    await waitFor(() => expect(onSubmitDraft).toHaveBeenCalledTimes(1))
    const bundle = onSubmitDraft.mock.calls[0][0]
    expect(bundle).toMatchObject({ resourceType: 'Bundle', type: 'document' })
    expect(bundle.entry[0]).toMatchObject({ resource: {
      resourceType: 'Composition',
      subject: { reference: subjectReference },
      author: [{ reference: creatorReference }],
      attester: [{ party: { reference: creatorReference }, mode: 'professional' }],
      section: [{ entry: [{ reference: expect.stringMatching(/^Condition\//) }] }],
    } })
    expect(bundle.entry).toContainEqual({ resource: {
      resourceType: 'ResearchSubject',
      id: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    } })
    expect(bundle.entry).toContainEqual({
      resource: expect.objectContaining({ resourceType, meta: { claims: expect.objectContaining({
        'Composition.subject': subjectReference,
        'Composition.author': creatorReference,
        [`${resourceType}.subject`]: subjectReference,
        [conceptClaim]: firstConcept,
      }) } }),
    })
    expect(screen.getByText('No draft data.')).toBeTruthy()
  })

  it('exposes the prepared local Bundle for download or credential generation without submitting it', async () => {
    const onSubmitDraft = vi.fn().mockResolvedValue({ state: 'confirmed' })
    const onDraftChange = vi.fn()
    renderDraft(onSubmitDraft, undefined, false, undefined, onDraftChange)

    fireEvent.click(screen.getByRole('button', { name: '+ Add section' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add entry' }))
    fireEvent.change(screen.getByLabelText('Clinical concept'), { target: { value: firstConcept } })
    fireEvent.click(screen.getByRole('button', { name: 'Add to draft' }))

    await waitFor(() => expect(onDraftChange).toHaveBeenLastCalledWith(expect.objectContaining({ resourceType: 'Bundle', type: 'document' })))
    expect(onSubmitDraft).not.toHaveBeenCalled()
  })

  it('links several PDF or image DocumentReferences to the clinical entry only in the submitted draft', async () => {
    const onSubmitDraft = vi.fn().mockResolvedValue({ state: 'confirmed' })
    renderDraft(onSubmitDraft)

    fireEvent.click(screen.getByRole('button', { name: '+ Add section' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add entry' }))
    fireEvent.change(screen.getByLabelText('Clinical concept'), { target: { value: firstConcept } })
    fireEvent.change(screen.getByLabelText('Add PDF or image'), { target: { files: [
      new File(['pdf evidence'], 'report.pdf', { type: 'application/pdf' }),
      new File(['image evidence'], 'scan.jpg', { type: 'image/jpeg' }),
    ] } })
    expect(await screen.findByText('report.pdf')).toBeTruthy()
    expect(screen.getByText('scan.jpg')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Add to draft' }))
    await screen.findByText(firstConcept)

    expect(onSubmitDraft).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Send Bundle' }))
    await waitFor(() => expect(onSubmitDraft).toHaveBeenCalledTimes(1))

    const bundle = onSubmitDraft.mock.calls[0][0]
    const condition = bundle.entry.find(({ resource }: any) => resource.resourceType === 'Condition').resource
    const documents = bundle.entry.filter(({ resource }: any) => resource.resourceType === 'DocumentReference')
    expect(documents).toHaveLength(2)
    expect(condition.meta.claims['Condition.contained-reference-list']).toContain(`DocumentReference/${documents[0].resource.id}`)
    expect(documents.map(({ resource }: any) => resource.meta.claims['DocumentReference.contenttype'])).toEqual([
      'application/pdf', 'image/jpeg',
    ])
    expect(documents[0].resource.meta.claims['DocumentReference.contentdata']).toBeTruthy()
    expect(documents[0].resource.meta.claims['DocumentReference.contenthash']).toMatch(/^sha256:/)
  })
})
