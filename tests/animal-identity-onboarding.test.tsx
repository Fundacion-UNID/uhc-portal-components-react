// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AnimalIdentityOnboarding,
  SubjectIdentityCard,
  type AnimalIdentityOnboardingCopy,
} from '../src/AnimalIdentityOnboarding.js'

const copy: AnimalIdentityOnboardingCopy = {
  title: 'Create animal and controller', intro: 'Record the identity checked in person.',
  animalStep: 'Animal', controllerStep: 'Owner or caregiver', evidenceStep: 'Evidence and protection',
  animalName: 'Animal name', taxonomyId: 'Species', birthDate: 'Birth date', sex: 'Sex',
  sexUnknown: 'Not stated', sexFemale: 'Female', sexMale: 'Male', sexOther: 'Other',
  identifierSystem: 'Identifier type', identifierValue: 'Microchip or passport number',
  controllerLegalName: 'Full legal name', controllerIdentifierType: 'Identity document type',
  controllerIdentifierValue: 'Identity document number', controllerCountry: 'Country',
  relationship: 'Relationship', owner: 'Owner', caregiver: 'Caregiver', ownerDocument: 'Owner identity document',
  animalDocument: 'Animal identity document', relationshipDocument: 'Relationship evidence',
  controllerPin: 'Controller PIN', submit: 'Create and attest identities',
}

describe('shared animal identity onboarding', () => {
  afterEach(cleanup)

  it('collects animal, controller and relationship evidence in one progressive journey', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<AnimalIdentityOnboarding copy={copy} onSubmit={onSubmit} submitAction="create-animal-individual" />)

    expect(screen.getByRole('heading', { name: copy.title })).not.toBeNull()
    expect(screen.getByRole('group', { name: copy.animalStep })).not.toBeNull()
    expect(screen.getByRole('group', { name: copy.controllerStep })).not.toBeNull()
    expect(screen.getByRole('group', { name: copy.evidenceStep })).not.toBeNull()
    expect(screen.getByRole('button', { name: copy.submit }).getAttribute('data-portal-action')).toBe('create-animal-individual')

    fireEvent.change(screen.getByLabelText(copy.animalName), { target: { value: 'Pluto' } })
    fireEvent.change(screen.getByLabelText(copy.taxonomyId), { target: { value: '9615' } })
    fireEvent.change(screen.getByLabelText(copy.identifierValue), { target: { value: '981020000123456' } })
    fireEvent.change(screen.getByLabelText(copy.controllerLegalName), { target: { value: 'Alex Example' } })
    fireEvent.change(screen.getByLabelText(copy.controllerIdentifierValue), { target: { value: 'ID-123' } })
    fireEvent.change(screen.getByLabelText(copy.controllerCountry), { target: { value: 'CA' } })
    fireEvent.change(screen.getByLabelText(copy.relationship), { target: { value: 'caregiver' } })
    fireEvent.change(screen.getByLabelText(copy.controllerPin), { target: { value: '246810' } })

    const document = new File(['verified'], 'evidence.pdf', { type: 'application/pdf' })
    for (const label of [copy.ownerDocument, copy.animalDocument, copy.relationshipDocument]) {
      fireEvent.change(screen.getByLabelText(label), { target: { files: [document] } })
    }
    fireEvent.submit(screen.getByRole('button', { name: copy.submit }).closest('form')!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      animalName: 'Pluto', taxonomyId: '9615', identifierValue: '981020000123456',
      controllerLegalName: 'Alex Example', controllerIdentifierValue: 'ID-123',
      controllerCountry: 'CA', relationship: 'caregiver', controllerPin: '246810',
      ownerDocument: document, animalDocument: document, relationshipDocument: document,
    })))
  })

  it('renders authoritative identity readback with relationship and explicit capabilities', () => {
    const onEdit = vi.fn()
    render(<SubjectIdentityCard
      subject={{ displayName: 'Pluto', kind: 'animal', facts: [
        { label: 'Species', value: 'Canis lupus familiaris' },
        { label: 'Microchip', value: '981020000123456' },
      ] }}
      relationship={{ label: 'Owner', displayName: 'Alex Example', status: 'verified' }}
      statusLabels={{ verified: 'Verified', pending: 'Pending', rejected: 'Rejected' }}
      editLabel="Edit identity"
      canEdit
      onEdit={onEdit}
    />)

    expect(screen.getByRole('heading', { name: 'Pluto' })).not.toBeNull()
    expect(screen.getByText('981020000123456')).not.toBeNull()
    expect(screen.getByText('Alex Example')).not.toBeNull()
    expect(screen.getByText('Verified')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Edit identity' }))
    expect(onEdit).toHaveBeenCalledOnce()
  })
})
