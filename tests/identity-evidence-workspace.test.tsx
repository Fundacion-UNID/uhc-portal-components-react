// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IdentityEvidenceWorkspace } from '../src/IdentityEvidenceWorkspace.js'

/**
 * Flow contract: the authenticated portal shows the exact authorized subject,
 * keeps subject data separate from the controller's reusable identifiers, and
 * offers evidence upload only through capabilities confirmed by the host. A
 * self upload and an organization-worker upload identify the uploader but do
 * not claim that the signature or identity has already been verified.
 */
describe('IdentityEvidenceWorkspace', () => {
  afterEach(cleanup)

  const copy = {
    title: 'Identity and supporting documents',
    intro: 'Choose who you are managing, check their details and add evidence.',
    selectedSubject: 'Selected individual',
    subjectStepTitle: 'Check the individual',
    subjectStepBody: 'Make sure these details belong to the right individual.',
    editSubject: 'Edit individual details',
    controllerStepTitle: 'Choose your identity',
    controllerStepBody: 'You may use more than one identity document.',
    noIdentifiers: 'No identity documents have been added yet.',
    addIdentifier: 'Add identity document',
    evidenceStepTitle: 'Add supporting evidence',
    evidenceStepBody: 'A trusted service checks the signature after upload.',
    selfUpload: 'Upload my signed document',
    selfUploadHelp: 'I signed and am uploading this document.',
    organizationUpload: 'Add a document supplied by the person',
    organizationUploadHelp: 'I am an authorized worker uploading it for the person.',
    professionalAttestation: 'Record an in-person check',
    statusLabels: {
      verified: 'Verified',
      pending: 'Waiting for verification',
      rejected: 'Could not be verified',
    },
  } as const

  it('shows multiple controller identifiers independently from the selected subject', () => {
    const onEditSubject = vi.fn()
    const onSelectIdentifier = vi.fn()
    render(<IdentityEvidenceWorkspace
      copy={copy}
      subject={{ id: 'animal-1', displayName: 'Mochi', kind: 'animal' }}
      identifiers={[
        { id: 'dni', typeLabel: 'Spanish national identity document', jurisdictionLabel: 'Spain', displayValue: '***678Z', status: 'verified' },
        { id: 'bc-dl', typeLabel: "Driver's licence", jurisdictionLabel: 'British Columbia, Canada', displayValue: '***123', status: 'pending' },
      ]}
      capabilities={{ editSubject: true, addIdentifier: true, selfUpload: true, organizationUpload: false, professionalAttestation: false }}
      onEditSubject={onEditSubject}
      onSelectIdentifier={onSelectIdentifier}
    />)

    expect(screen.getByRole('heading', { name: 'Identity and supporting documents' })).not.toBeNull()
    expect(screen.getByText('Mochi')).not.toBeNull()
    expect(screen.getByText('Spanish national identity document')).not.toBeNull()
    expect(screen.getByText("Driver's licence")).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Edit individual details' }))
    expect(onEditSubject).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: /Driver's licence/ }))
    expect(onSelectIdentifier).toHaveBeenCalledWith('bc-dl')
  })

  it('separates self upload, organization upload and professional attestation capabilities', () => {
    const onUploadEvidence = vi.fn()
    render(<IdentityEvidenceWorkspace
      copy={copy}
      subject={{ id: 'person-1', displayName: 'Patricia', kind: 'person' }}
      identifiers={[]}
      capabilities={{ editSubject: false, addIdentifier: false, selfUpload: true, organizationUpload: true, professionalAttestation: true }}
      onUploadEvidence={onUploadEvidence}
    />)

    fireEvent.click(screen.getByRole('button', { name: 'Upload my signed document' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add a document supplied by the person' }))
    fireEvent.click(screen.getByRole('button', { name: 'Record an in-person check' }))
    expect(onUploadEvidence.mock.calls).toEqual([
      ['self'],
      ['organization-worker'],
      ['professional-attestation'],
    ])
    expect(screen.queryByRole('button', { name: 'Edit individual details' })).toBeNull()
  })
})
