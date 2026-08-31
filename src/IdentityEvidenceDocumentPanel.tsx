import { useState } from 'react'
import type { IdentityEvidenceIdentifier, IdentityEvidenceStatus } from './IdentityEvidenceWorkspace.js'

export type IdentityEvidenceDocument = Readonly<{
  id: string
  fileName: string
  status: IdentityEvidenceStatus
}>

export type IdentityEvidenceDocumentPanelCopy = Readonly<{
  title: string
  body: string
  choosePdf: string
  upload: string
  uploading: string
  verify: string
  verifying: string
  noDocument: string
  invalidPdf: string
  statusLabels: Readonly<Record<IdentityEvidenceStatus, string>>
}>

/**
 * Reusable signed-document panel for UHC, PetChain and SOSChain.
 *
 * The component only chooses a PDF and calls the host's high-level methods.
 * It never parses certificates, builds gateway claims or promotes a local
 * digest to verified evidence. The rendered status always comes from provider
 * readback through `documents`.
 */
export function IdentityEvidenceDocumentPanel({
  copy,
  selectedIdentifier,
  documents,
  onUpload,
  onVerifySignaturePdf,
}: Readonly<{
  copy: IdentityEvidenceDocumentPanelCopy
  selectedIdentifier?: IdentityEvidenceIdentifier
  documents: readonly IdentityEvidenceDocument[]
  onUpload: (controllerIdentifierId: string, pdf: File) => Promise<void>
  onVerifySignaturePdf: (evidenceId: string) => Promise<void>
}>) {
  const [file, setFile] = useState<File>()
  const [busy, setBusy] = useState<'upload' | 'verify'>()
  const [error, setError] = useState('')

  async function upload() {
    if (!selectedIdentifier || !file || file.type !== 'application/pdf') {
      setError(copy.invalidPdf)
      return
    }
    setBusy('upload')
    setError('')
    try {
      await onUpload(selectedIdentifier.id, file)
    } finally {
      setBusy(undefined)
    }
  }

  async function verify(evidenceId: string) {
    setBusy('verify')
    setError('')
    try {
      await onVerifySignaturePdf(evidenceId)
    } finally {
      setBusy(undefined)
    }
  }

  return (
    <section className="uhcp-identity-documents" aria-labelledby="identity-evidence-documents-title">
      <header>
        <h3 id="identity-evidence-documents-title">{copy.title}</h3>
        <p>{copy.body}</p>
      </header>
      <label>
        <span>{copy.choosePdf}</span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          aria-label={copy.choosePdf}
          onChange={(event) => setFile(event.target.files?.[0])}
        />
      </label>
      <button type="button" onClick={() => void upload()} disabled={busy !== undefined || !selectedIdentifier}>
        {busy === 'upload' ? copy.uploading : copy.upload}
      </button>
      {error ? <p role="alert">{error}</p> : null}
      {documents.length ? (
        <ul>
          {documents.map((document) => (
            <li key={document.id}>
              <span><strong>{document.fileName}</strong><small>{copy.statusLabels[document.status]}</small></span>
              {document.status === 'pending' ? (
                <button type="button" onClick={() => void verify(document.id)} disabled={busy !== undefined}>
                  {busy === 'verify' ? copy.verifying : copy.verify}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : <p>{copy.noDocument}</p>}
    </section>
  )
}
