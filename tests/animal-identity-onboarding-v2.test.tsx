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
  addAnimalPhoto: 'Add animal photo', removeAnimalPhoto: 'Remove animal photo', photoHelp: 'PNG or JPG, maximum 2 MiB, portrait 3:4, minimum 300 × 400 px.', photoTooLarge: 'The image must not exceed 2 MiB.', photoDimensionsInvalid: 'Use a portrait 3:4 image of at least 300 × 400 px.',
  ownerKind: 'Owner type', personOwner: 'Person', organizationOwner: 'Organization', regionalIdentifier: 'Regional identifier',
  controllerRegion: 'Region', controllerEmail: 'Email', controllerTelephone: 'Telephone', contactRequired: 'Enter an email or telephone.',
  verificationMethod: 'Verification method', physicalInPerson: 'Physical in-person', supervisedRemote: 'Supervised remote', electronicId: 'Electronic ID', unsupervisedRemote: 'Unsupervised remote',
}

describe('AnimalIdentityOnboardingV2', () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('uses collapsible blocks, previews the animal image and confirms the single controller role', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 600, height: 800, close: vi.fn() }))
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { container } = render(<AnimalIdentityOnboardingV2 copy={copy} onSubmit={onSubmit}
      countryOptions={[{ value: 'CA', label: 'Canada' }, { value: 'ES', label: 'Spain' }]}
      regionOptionsByCountry={{ CA: [{ value: 'CA-BC', label: 'British Columbia' }] }}
      identifierTypeOptions={{ person: [{ value: 'national_identity_card', label: 'National identity card' }], organization: [{ value: 'business_number', label: 'Business number' }] }}
    />)

    const blocks = container.querySelectorAll('details')
    expect(blocks).toHaveLength(3)
    expect(blocks[0]?.hasAttribute('open')).toBe(true)
    expect(screen.getByRole('group', { name: 'Animal identity' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Owner or caregiver' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Identity evidence' })).toBeTruthy()
    expect((screen.getByRole('checkbox', { name: 'This person is the animal legal representative or controller' }) as HTMLInputElement).checked).toBe(true)
    expect(screen.getByRole('button', { name: 'Add animal photo' })).toBeTruthy()
    expect((screen.getByRole('radio', { name: 'Person' }) as HTMLInputElement).checked).toBe(true)

    fireEvent.change(screen.getByLabelText('Animal name'), { target: { value: 'Pluto' } })
    const photo = new File(['photo'], 'pluto.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByRole('button', { name: 'Add animal photo' }).querySelector('input')!, { target: { files: [photo] } })
    expect(await screen.findByRole('img', { name: 'Pluto preview' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Remove animal photo' }))
    expect(screen.queryByRole('img', { name: 'Pluto preview' })).toBeNull()
    fireEvent.change(screen.getByRole('button', { name: 'Add animal photo' }).querySelector('input')!, { target: { files: [photo] } })

    fireEvent.change(screen.getByLabelText('Identifier'), { target: { value: '981020000123456' } })
    fireEvent.change(screen.getByLabelText('Legal name'), { target: { value: 'Alex Example' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alex@example.test' } })
    fireEvent.change(screen.getByLabelText('Identity number'), { target: { value: 'ID-123' } })
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'CA' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '246810' } })
    const evidence = new File(['evidence'], 'evidence.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText('Controller document'), { target: { files: [evidence] } })
    fireEvent.change(screen.getByLabelText('Relationship document'), { target: { files: [evidence] } })
    fireEvent.submit(screen.getByRole('button', { name: 'Create animal' }).closest('form')!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      animalName: 'Pluto', animalDocument: photo, ownerDocument: evidence,
      relationshipDocument: evidence, relationship: 'owner', controllerCountry: 'CA',
      controllerKind: 'person', controllerEmail: 'alex@example.test', verificationMethod: 'pipp',
    })))
  })

  it('rejects an animal photo larger than the ICAO 2 MiB maximum', async () => {
    render(<AnimalIdentityOnboardingV2 copy={copy} onSubmit={vi.fn()} />)
    const oversized = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByRole('button', { name: 'Add animal photo' }).querySelector('input')!, { target: { files: [oversized] } })
    expect((await screen.findByRole('alert')).textContent).toContain('The image must not exceed 2 MiB.')
  })

  it('rejects an animal photo below the documented ICAO pixel dimensions', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 200, height: 200, close: vi.fn() }))
    render(<AnimalIdentityOnboardingV2 copy={copy} onSubmit={vi.fn()} />)
    fireEvent.change(screen.getByRole('button', { name: 'Add animal photo' }).querySelector('input')!, { target: { files: [new File(['small'], 'small.jpg', { type: 'image/jpeg' })] } })
    expect((await screen.findByRole('alert')).textContent).toContain('at least 300 × 400 px')
  })

  it('rejects a horizontal 4:3 image even when it exceeds the minimum dimensions', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 800, height: 600, close: vi.fn() }))
    render(<AnimalIdentityOnboardingV2 copy={copy} onSubmit={vi.fn()} />)
    fireEvent.change(screen.getByRole('button', { name: 'Add animal photo' }).querySelector('input')!, { target: { files: [new File(['wide'], 'wide.jpg', { type: 'image/jpeg' })] } })
    expect((await screen.findByRole('alert')).textContent).toContain('portrait 3:4')
  })

  it('switches the legal identifier fields from a person to an organization owner', () => {
    render(<AnimalIdentityOnboardingV2 copy={copy} onSubmit={vi.fn()}
      identifierTypeOptions={{ person: [{ value: 'national_identity_card', label: 'National identity card' }], organization: [{ value: 'business_number', label: 'Business number' }] }}
    />)
    fireEvent.click(screen.getByRole('radio', { name: 'Organization' }))
    expect((screen.getByRole('combobox', { name: 'Identity type' }) as HTMLSelectElement).value).toBe('business_number')
  })

  it('can be embedded in a host collapsible without repeating its heading', () => {
    render(<AnimalIdentityOnboardingV2 copy={copy} onSubmit={vi.fn()} showHeader={false} />)
    expect(screen.queryByRole('heading', { name: 'Create animal' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Create animal' })).toBeTruthy()
  })
})
