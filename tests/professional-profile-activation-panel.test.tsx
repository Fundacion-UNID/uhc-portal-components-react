// Flow contract: every Professional portal accepts one controller-issued credential and a local PIN; the browser never asks the employee to reconstruct organization, sector, DID or URN authority.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfessionalProfileActivationPanel } from '../src/ProfessionalProfileActivationPanel.js'

const copy = {
  eyebrow: 'Professional access',
  title: 'Activate professional profile',
  description: 'Use the invitation or professional credential supplied by your organization.',
  credentialLabel: 'Invitation or professional credential',
  pinLabel: 'New profile PIN',
  pinConfirmationLabel: 'Repeat PIN',
  pinMismatch: 'The PIN values do not match.',
  submit: 'Register this device and continue',
  submitting: 'Registering…',
}

afterEach(cleanup)

describe('ProfessionalProfileActivationPanel', () => {
  it('submits one credential and never asks for separate DID, URN or sector fields', () => {
    const onSubmit = vi.fn()
    render(<ProfessionalProfileActivationPanel copy={copy} busy={false} onSubmit={onSubmit} />)

    expect(screen.queryByLabelText(/DID/i)).toBeNull()
    expect(screen.queryByLabelText(/URN/i)).toBeNull()
    expect(screen.queryByLabelText(/sector/i)).toBeNull()

    fireEvent.change(screen.getByLabelText(copy.credentialLabel), { target: { value: 'controller-issued-credential' } })
    fireEvent.change(screen.getByLabelText(copy.pinLabel), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText(copy.pinConfirmationLabel), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: copy.submit }))

    expect(onSubmit).toHaveBeenCalledWith({
      credential: 'controller-issued-credential',
      pin: '123456',
    })
  })

  it('rejects mismatching PIN values before invoking the BFF adapter', () => {
    const onSubmit = vi.fn()
    render(<ProfessionalProfileActivationPanel copy={copy} busy={false} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(copy.credentialLabel), { target: { value: 'controller-issued-credential' } })
    fireEvent.change(screen.getByLabelText(copy.pinLabel), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText(copy.pinConfirmationLabel), { target: { value: '654321' } })
    fireEvent.click(screen.getByRole('button', { name: copy.submit }))

    expect(screen.getByRole('alert').textContent).toBe(copy.pinMismatch)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
