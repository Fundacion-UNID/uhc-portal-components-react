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
const subjectReference = `ResearchSubject/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const creatorReference = `PractitionerRole/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const conceptClaim = `${resourceType}.code-text`
const firstConcept = 'Fracture'
const correctedConcept = 'Closed fracture'

afterEach(cleanup)

function renderDraft(onSubmitDraft = vi.fn().mockResolvedValue({ state: 'confirmed' }), initialBundle?: any) {
  return render(<ClinicalBundleDraftEditor
    schemas={[{
      schema,
      operationSchema: MULTICHANNEL_OPERATION_SCHEMAS[MultichannelOperationId.Condition],
      sectionLabel: 'Problems',
      artifactLabel: 'Condition',
    }]}
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
      submit: 'Send Bundle', submitting: 'Sending', drafted: 'Added to draft',
      editor: { title: 'Condition', description: 'Add a condition', save: 'Add to draft', saving: 'Adding', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Draft unavailable' },
    }}
    fieldLabel={(claim) => claim === conceptClaim ? 'Clinical concept' : claim}
    initialBundle={initialBundle}
    onSubmitDraft={onSubmitDraft}
  />)
}

describe('ClinicalBundleDraftEditor', () => {
  it('hydrates claims-first resources from an imported document Bundle for editing before submit', async () => {
    renderDraft(undefined, {
      resourceType: 'Bundle', type: 'document', entry: [
        { resource: { resourceType: 'Composition', subject: { reference: subjectReference } } },
        { resource: { resourceType, id: 'condition-imported', meta: { claims: { [conceptClaim]: firstConcept } } } },
      ],
    })

    expect(screen.getByText(firstConcept)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: `Edit ${firstConcept}` }))
    expect((screen.getByLabelText('Clinical concept') as HTMLInputElement).value).toBe(firstConcept)
  })
  it('stages, edits and removes one schema-backed ResearchSubject entry before submission', async () => {
    const onSubmitDraft = vi.fn().mockResolvedValue({ state: 'confirmed' })
    renderDraft(onSubmitDraft)

    fireEvent.click(screen.getByRole('button', { name: 'Add Condition' }))
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

    fireEvent.click(screen.getByRole('button', { name: 'Add Condition' }))
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
})
