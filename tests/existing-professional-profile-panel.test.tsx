// Flow contract: an already-active professional either presents a W3C/SHC credential or manually enters one DID-or-URN reference plus sector, then chooses a local device PIN; neither path accepts an employee invitation.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExistingProfessionalProfilePanel } from '../src/ExistingProfessionalProfilePanel.js'

const copy = {
  eyebrow: 'Professional access',
  title: 'Use an existing professional profile',
  description: 'Use the professional evidence supplied by your existing professional portal.',
  credentialMethodLabel: 'Scan or upload professional credential',
  manualMethodLabel: 'Enter DID or URN manually',
  scanProfessionalCredential: 'Scan professional credential',
  uploadProfessionalCredentialQr: 'Upload credential QR image',
  professionalCredentialReady: 'Professional credential ready',
  professionalCredentialRequired: 'Scan or upload a professional credential.',
  closeCamera: 'Close camera',
  cameraActive: 'Camera active. Point it at the credential QR.',
  credentialQrUnreadable: 'No credential QR was found in that image.',
  professionalIdentifierLabel: 'Professional DID or URN',
  sectorLabel: 'Organization sector',
  pinLabel: 'PIN for this device',
  pinConfirmationLabel: 'Repeat PIN',
  pinMismatch: 'The PIN values do not match.',
  submit: 'Register this device and continue',
  submitting: 'Registering…',
}

afterEach(cleanup)

describe('ExistingProfessionalProfilePanel', () => {
  const sectors = [{ value: 'animal-care', label: 'Animal care' }, { value: 'health-care', label: 'Health care' }]

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
    render(<ExistingProfessionalProfilePanel copy={copy} sectors={sectors} busy={false} onSubmit={onSubmit} />)

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
