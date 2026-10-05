// Flow contract:
// 1. A capable animal-care professional edits a synthetic controller proposal and explicitly attests the evidence checked.
// 2. Submitting creates a pending invitation; it never silently replaces the animal controller or grants clinical access.
// 3. A verifier can read the resulting proof state without receiving the controller contact channel or clinical capabilities.
// 4. The host owns persistence, notification delivery, acceptance and proof verification; this shared component owns presentation only.
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnimalControllerAttestationPanel, type AnimalControllerAttestationCopy } from '../src/AnimalControllerAttestationPanel.js'

const copy: AnimalControllerAttestationCopy = {
  title: 'Animal controller', intro: 'Record who was checked and invite that person to accept.',
  controllerName: 'Controller name', controllerEmail: 'Demo notification email', relationship: 'Relationship',
  owner: 'Owner', caregiver: 'Caregiver', attestation: 'I checked the evidence presented by this person.',
  submit: 'Attest and notify', pending: 'Waiting for controller acceptance', accepted: 'Accepted by controller',
  verified: 'Proof verified', rejected: 'Proof not verified', proofLabel: 'Relationship proof',
}

describe('shared animal controller attestation panel', () => {
  afterEach(cleanup)

  it('submits an explicitly attested pending controller invitation', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<AnimalControllerAttestationPanel copy={copy} state={{ status: 'draft' }} canEdit onSubmit={onSubmit}/>)

    fireEvent.change(screen.getByLabelText(copy.controllerName), { target: { value: 'Taylor Doe' } })
    fireEvent.change(screen.getByLabelText(copy.controllerEmail), { target: { value: 'controller.demo@example.org' } })
    fireEvent.change(screen.getByLabelText(copy.relationship), { target: { value: 'owner' } })
    expect(screen.getByRole('button', { name: copy.submit }).hasAttribute('disabled')).toBe(true)
    fireEvent.click(screen.getByLabelText(copy.attestation))
    fireEvent.click(screen.getByRole('button', { name: copy.submit }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      controllerName: 'Taylor Doe', controllerEmail: 'controller.demo@example.org', relationship: 'owner',
      professionalAttestation: true,
    }))
  })

  it('shows accepted proof without revealing its notification email', () => {
    render(<AnimalControllerAttestationPanel copy={copy} state={{
      status: 'accepted', controllerName: 'Taylor Doe', relationship: 'owner',
      proofIdentifier: 'urn:uuid:relationship-proof-demo', proofVerified: true,
    }} canEdit={false}/>)

    expect(screen.getByText(copy.accepted)).not.toBeNull()
    expect(screen.getByText(copy.verified)).not.toBeNull()
    expect(screen.getByText('urn:uuid:relationship-proof-demo')).not.toBeNull()
    expect(screen.queryByLabelText(copy.controllerEmail)).toBeNull()
  })
})
