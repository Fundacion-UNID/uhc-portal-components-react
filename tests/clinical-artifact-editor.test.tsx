// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
/**
 * Journey:
 * 1. A controller opens the shared IPS editor for one provider-authorized subject.
 * 2. They enter human-readable clinical text and explicitly select a terminology candidate.
 * 3. The host persists the typed flat claims and returns a fresh provider readback Bundle.
 * 4. The editor publishes only that readback to the reader.
 * Authorization invariant: the component owns no session, provider URL or write capability.
 * Persistence invariant: local form state never counts as a successful clinical write.
 */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ResourceTypesFhirR4 } from 'gdc-common-utils-ts/constants/fhir-resource-types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClinicalArtifactEditor } from '../src/ClinicalArtifactEditor.js'

const resourceType = ResourceTypesFhirR4.Immunization
const sourceTextClaim = `${resourceType}.vaccine-code-text`
const codeClaim = `${resourceType}.vaccine-code`
const displayClaim = `${resourceType}.vaccine-code-display`
const statusClaim = `${resourceType}.status`
const sourceText = 'Seasonal influenza vaccine'
const terminologyCandidate = Object.freeze({
  system: 'http://snomed.info/sct',
  code: '836377006',
  display: 'Influenza vaccine',
  text: sourceText,
})
const providerReadback = Object.freeze({ resourceType: 'Bundle', type: 'document', entry: [] })

afterEach(cleanup)

describe('ClinicalArtifactEditor', () => {
  it('keeps source text and submits only the explicitly selected terminology code', async () => {
    const searchTerminology = vi.fn().mockResolvedValue([terminologyCandidate])
    const saveArtifact = vi.fn().mockResolvedValue(providerReadback)
    const onReadback = vi.fn()

    render(<ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'create' }}
      schema={{ resourceType, requiredClaims: [sourceTextClaim, statusClaim], optionalClaims: [codeClaim, displayClaim] }}
      copy={{ title: 'Vaccination', description: 'Add a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={(claim) => claim === sourceTextClaim ? 'Vaccine or product' : 'Status'}
      searchTerminology={searchTerminology}
      saveArtifact={saveArtifact}
      onCancel={() => undefined}
      onReadback={onReadback}
    />)

    fireEvent.change(screen.getByLabelText('Vaccine or product'), { target: { value: sourceText } })
    await waitFor(() => expect(searchTerminology).toHaveBeenCalledWith(expect.objectContaining({ claim: codeClaim, text: sourceText })))
    fireEvent.click(await screen.findByRole('button', { name: /Influenza vaccine/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(saveArtifact).toHaveBeenCalledWith(expect.objectContaining({
      resourceType,
      sectionCode: '11369-6',
      claims: expect.objectContaining({
        [sourceTextClaim]: sourceText,
        [codeClaim]: `${terminologyCandidate.system}|${terminologyCandidate.code}`,
        [displayClaim]: terminologyCandidate.display,
      }),
    })))
    expect(onReadback).toHaveBeenCalledWith(providerReadback)
  })

  it('does not publish local state when the provider omits authoritative readback', async () => {
    const onReadback = vi.fn()
    render(<ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'create' }}
      schema={{ resourceType, requiredClaims: [sourceTextClaim], optionalClaims: [] }}
      copy={{ title: 'Vaccination', description: 'Add a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={() => 'Vaccine or product'}
      saveArtifact={vi.fn().mockResolvedValue(undefined)}
      onCancel={() => undefined}
      onReadback={onReadback}
    />)

    fireEvent.change(screen.getByLabelText('Vaccine or product'), { target: { value: sourceText } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect((await screen.findByRole('alert')).textContent).toContain('Readback missing')
    expect(onReadback).not.toHaveBeenCalled()
  })
})
