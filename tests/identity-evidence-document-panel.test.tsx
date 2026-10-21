// TDD: a portal uploads a signed PDF and requests trusted verification without changing evidence status in browser state.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IdentityEvidenceDocumentPanel } from '../src/IdentityEvidenceDocumentPanel.js'
import {
  identityEvidenceDocumentCopyFixture,
  identityEvidenceDocumentFixture,
  identityEvidenceIdentifierFixture,
} from './support/identity-evidence-fixtures.js'

describe('IdentityEvidenceDocumentPanel', () => {
  afterEach(cleanup)

  it('passes the selected PDF to upload and delegates verification to the trusted facade', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined)
    const onVerifySignaturePdf = vi.fn().mockResolvedValue(undefined)
    const pdf = new File([identityEvidenceDocumentFixture.id], identityEvidenceDocumentFixture.fileName, {
      type: 'application/pdf',
    })
    render(<IdentityEvidenceDocumentPanel
      copy={identityEvidenceDocumentCopyFixture}
      selectedIdentifier={identityEvidenceIdentifierFixture}
      documents={[identityEvidenceDocumentFixture]}
      onUpload={onUpload}
      onVerifySignaturePdf={onVerifySignaturePdf}
    />)

    fireEvent.change(screen.getByLabelText(identityEvidenceDocumentCopyFixture.choosePdf), {
      target: { files: [pdf] },
    })
    fireEvent.click(screen.getByRole('button', { name: identityEvidenceDocumentCopyFixture.upload }))
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(identityEvidenceIdentifierFixture.id, pdf))

    const verifyButton = screen.getByRole('button', { name: identityEvidenceDocumentCopyFixture.verify }) as HTMLButtonElement
    await waitFor(() => expect(verifyButton.disabled).toBe(false))
    fireEvent.click(verifyButton)
    await waitFor(() => expect(onVerifySignaturePdf).toHaveBeenCalledWith(identityEvidenceDocumentFixture.id))
    expect(screen.getByText(identityEvidenceDocumentCopyFixture.statusLabels.pending)).not.toBeNull()
  })
})
