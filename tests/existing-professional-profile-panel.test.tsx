// Flow contract: an already-active professional chooses credential, organization discovery or DID/URN evidence, sees the server-resolved role first, and only then chooses a local device PIN; no path accepts an employee invitation.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExistingProfessionalProfilePanel, toExistingProfessionalProfileRequest } from '../src/ExistingProfessionalProfilePanel.js'

const copy = {
  eyebrow: 'Professional access',
  title: 'Use an existing professional profile',
  description: 'Use the professional evidence supplied by your existing professional portal.',
  credentialMethodLabel: 'Scan or upload professional credential',
  organizationMethodLabel: 'Join an organization',
  manualMethodLabel: 'Enter DID or URN manually',
  scanProfessionalCredential: 'Scan professional credential',
  uploadProfessionalCredentialQr: 'Upload credential QR image',
  professionalCredentialReady: 'Professional credential ready',
  professionalCredentialRequired: 'Scan or upload a professional credential.',
  closeCamera: 'Close camera',
  cameraActive: 'Camera active. Point it at the credential QR.',
  credentialQrUnreadable: 'No credential QR was found in that image.',
  professionalIdentifierLabel: 'Professional DID or URN',
  countryLabel: 'Country',
  countryPlaceholder: 'Select a country',
  regionalIdentifierLabel: 'The legal identifier is regional',
  regionLabel: 'Region',
  regionPlaceholder: 'Select a region',
  organizationIdentifierLabel: 'Organization legal identifier',
  sectorLabel: 'Organization sector',
  pinLabel: 'PIN for this device',
  pinConfirmationLabel: 'Repeat PIN',
  pinMismatch: 'The PIN values do not match.',
  verify: 'Verify professional profile',
  verifying: 'Verifying…',
  verifiedProfile: 'Verified professional profile',
  changeEvidence: 'Use different evidence',
  submit: 'Register this device and continue',
  submitting: 'Registering…',
}

afterEach(cleanup)

describe('ExistingProfessionalProfilePanel', () => {
  const sectors = [{ value: 'animal-care', label: 'Animal care' }, { value: 'health-care', label: 'Health care' }]

  it('serializes credential and identifier evidence without renaming either as an invitation', () => {
    expect(toExistingProfessionalProfileRequest({ method: 'credential', professionalCredential: 'shc:/credential', pin: '123456' })).toEqual({
      professionalCredential: 'shc:/credential', pin: '123456',
    })
    expect(toExistingProfessionalProfileRequest({ method: 'identifier', professionalIdentifier: 'did:web:professional', sector: 'health-care', pin: '123456' })).toEqual({
      professionalIdentifier: 'did:web:professional', sectorHint: 'health-care', pin: '123456',
    })
  })

  it('resolves and shows the professional role before offering device PIN creation', async () => {
    const onResolve = vi.fn().mockResolvedValue({
      title: 'Veterinarian',
      subtitle: 'Example animal clinic',
      badges: ['Animal research'],
    })
    const onSubmit = vi.fn()
    render(<ExistingProfessionalProfilePanel copy={copy} sectors={sectors} busy={false} onResolve={onResolve} onSubmit={onSubmit} />)

    expect(screen.queryByLabelText(copy.pinLabel)).toBeNull()
    fireEvent.click(screen.getByLabelText(copy.manualMethodLabel))
    fireEvent.change(screen.getByLabelText(copy.professionalIdentifierLabel), { target: { value: 'did:web:professional.example.test:role' } })
    fireEvent.change(screen.getByLabelText(copy.sectorLabel), { target: { value: 'animal-care' } })
    fireEvent.click(screen.getByRole('button', { name: copy.verify }))

    await waitFor(() => expect(onResolve).toHaveBeenCalledWith({
      method: 'identifier',
      professionalIdentifier: 'did:web:professional.example.test:role',
      sector: 'animal-care',
    }))
    expect(screen.getByText('Veterinarian')).toBeTruthy()
    expect(screen.getByText('Example animal clinic')).toBeTruthy()
    expect(screen.getByText('Animal research')).toBeTruthy()
    expect(screen.getByTestId('professional-identity-icon')).toBeTruthy()

    fireEvent.change(screen.getByLabelText(copy.pinLabel), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText(copy.pinConfirmationLabel), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: copy.submit }))
    expect(onSubmit).toHaveBeenCalledWith({
      method: 'identifier',
      professionalIdentifier: 'did:web:professional.example.test:role',
      sector: 'animal-care',
      pin: '123456',
    })
  })

  it('reconstructs professional discovery from country, optional region, legal identifier and sector before PIN', async () => {
    const onResolve = vi.fn().mockResolvedValue([{
      selectionValue: 'ISCO-08|2250',
      title: 'Veterinarian',
      subtitle: 'Example animal clinic',
      badges: ['Animal care', 'CA-BC'],
    }])
    const onSubmit = vi.fn()
    render(<ExistingProfessionalProfilePanel
      copy={copy}
      sectors={sectors}
      countries={[{ value: 'CA', label: 'Canada' }, { value: 'ES', label: 'Spain' }]}
      regionsByCountry={{ CA: [{ value: 'CA-BC', label: 'British Columbia' }] }}
      busy={false}
      onResolve={onResolve}
      onSubmit={onSubmit}
    />)

    expect(screen.getByLabelText(copy.credentialMethodLabel)).toBeTruthy()
    expect(screen.getByLabelText(copy.organizationMethodLabel)).toBeTruthy()
    expect(screen.getByLabelText(copy.manualMethodLabel)).toBeTruthy()
    fireEvent.click(screen.getByLabelText(copy.organizationMethodLabel))
    expect(screen.queryByLabelText(copy.professionalIdentifierLabel)).toBeNull()
    expect(screen.queryByLabelText(copy.pinLabel)).toBeNull()
    fireEvent.change(screen.getByLabelText(copy.countryLabel), { target: { value: 'CA' } })
    fireEvent.click(screen.getByLabelText(copy.regionalIdentifierLabel))
    fireEvent.change(screen.getByLabelText(copy.regionLabel), { target: { value: 'CA-BC' } })
    fireEvent.change(screen.getByLabelText(copy.organizationIdentifierLabel), { target: { value: '704457076' } })
    fireEvent.change(screen.getByLabelText(copy.sectorLabel), { target: { value: 'animal-care' } })
    fireEvent.click(screen.getByRole('button', { name: copy.verify }))

    await waitFor(() => expect(onResolve).toHaveBeenCalledWith({
      method: 'organization', country: 'CA', region: 'CA-BC',
      organizationIdentifier: '704457076', sector: 'animal-care',
    }))
    expect(screen.getByText('Veterinarian')).toBeTruthy()
    fireEvent.change(screen.getByLabelText(copy.pinLabel), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText(copy.pinConfirmationLabel), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: copy.submit }))
    expect(onSubmit).toHaveBeenCalledWith({
      method: 'organization', country: 'CA', region: 'CA-BC',
      organizationIdentifier: '704457076', sector: 'animal-care',
      selectedProfile: 'ISCO-08|2250', pin: '123456',
    })
  })

  it('requires choosing one authoritative role before showing the PIN fields', async () => {
    const onResolve = vi.fn().mockResolvedValue([
      { selectionValue: 'ISCO-08|2250', title: 'Veterinarian', subtitle: 'Example clinic' },
      { selectionValue: 'ISCO-08|2211', title: 'Physician', subtitle: 'Example clinic' },
    ])
    render(<ExistingProfessionalProfilePanel
      copy={copy}
      sectors={sectors}
      countries={[{ value: 'CA', label: 'Canada' }]}
      regionsByCountry={{}}
      busy={false}
      onResolve={onResolve}
      onSubmit={vi.fn()}
    />)

    fireEvent.click(screen.getByLabelText(copy.organizationMethodLabel))
    fireEvent.change(screen.getByLabelText(copy.countryLabel), { target: { value: 'CA' } })
    fireEvent.change(screen.getByLabelText(copy.organizationIdentifierLabel), { target: { value: 'Example-123' } })
    fireEvent.click(screen.getByRole('button', { name: copy.verify }))

    expect(await screen.findByText('Veterinarian')).toBeTruthy()
    expect(screen.getByText('Physician')).toBeTruthy()
    expect(screen.queryByLabelText(copy.pinLabel)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Veterinarian/ }))
    expect(screen.getByLabelText(copy.pinLabel)).toBeTruthy()
  })

  it('scans and submits a professional credential separately from local device protection', async () => {
    const onSubmit = vi.fn()
    const onScanProfessionalCredential = vi.fn().mockResolvedValue('shc:/professional-credential')
    render(<ExistingProfessionalProfilePanel copy={copy} sectors={sectors} busy={false} onSubmit={onSubmit} onScanProfessionalCredential={onScanProfessionalCredential} />)

    expect(screen.queryByLabelText(/invitation/i)).toBeNull()
    expect(screen.queryByLabelText(/sector/i)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: copy.scanProfessionalCredential }))
    expect(await screen.findByText(copy.professionalCredentialReady)).toBeTruthy()
    fireEvent.change(screen.getByLabelText(copy.pinLabel), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText(copy.pinConfirmationLabel), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: copy.submit }))

    expect(onSubmit).toHaveBeenCalledWith({
      method: 'credential',
      professionalCredential: 'shc:/professional-credential',
      pin: '123456',
    })
  })

  it('accepts an uploaded image of the professional credential QR', async () => {
    const onSubmit = vi.fn()
    const onReadProfessionalCredentialImage = vi.fn().mockResolvedValue('shc:/uploaded-professional-credential')
    render(<ExistingProfessionalProfilePanel copy={copy} sectors={sectors} busy={false} onSubmit={onSubmit} onReadProfessionalCredentialImage={onReadProfessionalCredentialImage} />)

    const image = new File(['qr'], 'professional-credential.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(copy.uploadProfessionalCredentialQr), { target: { files: [image] } })
    expect(await screen.findByText(copy.professionalCredentialReady)).toBeTruthy()
    expect(onReadProfessionalCredentialImage).toHaveBeenCalledWith(image)
  })

  it('offers one DID-or-URN field plus sector as the manual alternative', () => {
    const onSubmit = vi.fn()
    render(<ExistingProfessionalProfilePanel
      copy={copy}
      sectors={sectors}
      countries={[{ value: 'CA', label: 'Canada' }]}
      busy={false}
      onSubmit={onSubmit}
    />)

    fireEvent.click(screen.getByLabelText(copy.manualMethodLabel))
    fireEvent.change(screen.getByLabelText(copy.professionalIdentifierLabel), { target: { value: ' urn:cds-ca-bc:v1:organization:bn:Example:member:zMember:2250 ' } })
    fireEvent.change(screen.getByLabelText(copy.sectorLabel), { target: { value: 'animal-care' } })
    fireEvent.change(screen.getByLabelText(copy.pinLabel), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText(copy.pinConfirmationLabel), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: copy.submit }))

    expect(onSubmit).toHaveBeenCalledWith({
      method: 'identifier',
      professionalIdentifier: 'urn:cds-ca-bc:v1:organization:bn:Example:member:zMember:2250',
      sector: 'animal-care',
      pin: '123456',
    })
  })

  it('rejects mismatching PIN values without submitting the professional evidence', () => {
    const onSubmit = vi.fn()
    render(<ExistingProfessionalProfilePanel copy={copy} sectors={sectors} busy={false} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByLabelText(copy.manualMethodLabel))
    fireEvent.change(screen.getByLabelText(copy.professionalIdentifierLabel), { target: { value: 'did:web:example.test:professional' } })
    fireEvent.change(screen.getByLabelText(copy.sectorLabel), { target: { value: 'health-care' } })
    fireEvent.change(screen.getByLabelText(copy.pinLabel), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText(copy.pinConfirmationLabel), { target: { value: '654321' } })
    fireEvent.click(screen.getByRole('button', { name: copy.submit }))

    expect(screen.getByRole('alert').textContent).toBe(copy.pinMismatch)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
