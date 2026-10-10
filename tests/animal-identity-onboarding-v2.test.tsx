// Flow contract: create one animal through progressive, collapsible identity blocks while preserving the typed evidence payload owned by the host portal.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnimalIdentityOnboardingV2 } from '../src/AnimalIdentityOnboardingV2.js'
import type { AnimalIdentityOnboardingV2Copy } from '../src/AnimalIdentityOnboardingV2.js'

const copy: AnimalIdentityOnboardingV2Copy = {
  title: 'Create animal', intro: 'Record the animal and its controller.',
  animalStep: 'Animal identity', controllerStep: 'Owner or caregiver', evidenceStep: 'Identity evidence',
  animalName: 'Animal name', taxonomyId: 'Species', birthDate: 'Birth date', sex: 'Sex',
  sexUnknown: 'Unknown', sexFemale: 'Female', sexMale: 'Male', sexOther: 'Other',
  identifierSystem: 'Identifier type', identifierValue: 'Identifier', controllerLegalName: 'Legal name',
  controllerIdentifierType: 'Identity type', controllerIdentifierValue: 'Identity number',
  controllerCountry: 'Country', relationship: 'Relationship', owner: 'Owner', caregiver: 'Caregiver',
  ownerDocument: 'Controller document', animalDocument: 'Animal photo or document',
  relationshipDocument: 'Relationship document', controllerPin: 'PIN', submit: 'Create animal',
  controllerIsLegalRepresentative: 'This person is the animal legal representative or controller',
  animalPreview: '{name} preview',
}

describe('AnimalIdentityOnboardingV2', () => {
  afterEach(cleanup)

  it('uses collapsible blocks, previews the animal image and confirms the single controller role', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { container } = render(<AnimalIdentityOnboardingV2 copy={copy} onSubmit={onSubmit} />)

    const blocks = container.querySelectorAll('details')
    expect(blocks).toHaveLength(3)
    expect(blocks[0]?.hasAttribute('open')).toBe(true)
    expect(screen.getByRole('group', { name: 'Animal identity' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Owner or caregiver' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Identity evidence' })).toBeTruthy()
    expect((screen.getByRole('checkbox', { name: 'This person is the animal legal representative or controller' }) as HTMLInputElement).checked).toBe(true)

    fireEvent.change(screen.getByLabelText('Animal name'), { target: { value: 'Pluto' } })
    const photo = new File(['photo'], 'pluto.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Animal photo or document'), { target: { files: [photo] } })
    expect(await screen.findByRole('img', { name: 'Pluto preview' })).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Identifier'), { target: { value: '981020000123456' } })
    fireEvent.change(screen.getByLabelText('Legal name'), { target: { value: 'Alex Example' } })
    fireEvent.change(screen.getByLabelText('Identity number'), { target: { value: 'ID-123' } })
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'ca' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '246810' } })
    const evidence = new File(['evidence'], 'evidence.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText('Controller document'), { target: { files: [evidence] } })
    fireEvent.change(screen.getByLabelText('Relationship document'), { target: { files: [evidence] } })
    fireEvent.submit(screen.getByRole('button', { name: 'Create animal' }).closest('form')!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      animalName: 'Pluto', animalDocument: photo, ownerDocument: evidence,
      relationshipDocument: evidence, relationship: 'owner', controllerCountry: 'CA',
    })))
  })
})
