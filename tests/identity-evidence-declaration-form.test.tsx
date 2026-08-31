// TDD: the reusable declaration form sends business fields only through one high-level preparation callback.
// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IdentityEvidenceDeclarationForm } from '../src/IdentityEvidenceDeclarationForm.js'
import {
  identityEvidenceDeclarationCopyFixture,
  identityEvidenceDeclarationInputFixture,
  identityEvidenceDeclarationOptionsFixture,
} from './support/identity-evidence-fixtures.js'

/**
 * Flow contract: the controller enters one civil identity, scopes its
 * jurisdiction and asks the owning provider to prepare a declaration.
 * Authorization and persistence invariants: the component receives no tokens,
 * writes no claims and never marks the identity verified.
 */
describe('IdentityEvidenceDeclarationForm', () => {
  it('delegates the normalized declaration without transport or certificate fields', async () => {
    const onPrepare = vi.fn().mockResolvedValue(undefined)
    render(<IdentityEvidenceDeclarationForm
      copy={identityEvidenceDeclarationCopyFixture}
      {...identityEvidenceDeclarationOptionsFixture}
      onPrepare={onPrepare}
    />)

    fireEvent.change(screen.getByLabelText(identityEvidenceDeclarationCopyFixture.fullLegalName), { target: { value: identityEvidenceDeclarationInputFixture.fullLegalName } })
    fireEvent.change(screen.getByLabelText(identityEvidenceDeclarationCopyFixture.identifierValue), { target: { value: identityEvidenceDeclarationInputFixture.identifierValue } })
    fireEvent.click(screen.getByLabelText(identityEvidenceDeclarationCopyFixture.regional))
    fireEvent.change(screen.getByLabelText(identityEvidenceDeclarationCopyFixture.region), { target: { value: identityEvidenceDeclarationInputFixture.subdivisionCode } })
    fireEvent.click(screen.getByRole('button', { name: identityEvidenceDeclarationCopyFixture.prepare }))

    await waitFor(() => expect(onPrepare).toHaveBeenCalledWith(identityEvidenceDeclarationInputFixture))
  })
})
