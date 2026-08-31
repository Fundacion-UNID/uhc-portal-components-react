import type {
  IdentityEvidenceDocument,
  IdentityEvidenceDocumentPanelCopy,
  IdentityEvidenceIdentifier,
  IdentityEvidenceSubject,
} from '../../src/index.js'

export const identityEvidenceSubjectFixture: IdentityEvidenceSubject = Object.freeze({
  id: 'subject-fixture',
  displayName: 'Mochi',
  kind: 'animal',
})

export const identityEvidenceIdentifierFixture: IdentityEvidenceIdentifier = Object.freeze({
  id: 'identifier-fixture',
  typeLabel: 'National identity document',
  jurisdictionLabel: 'Spain',
  displayValue: '***678Z',
  status: 'pending',
})

export const identityEvidenceDocumentFixture: IdentityEvidenceDocument = Object.freeze({
  id: 'evidence-fixture',
  fileName: 'signed-declaration.pdf',
  status: 'pending',
})

export const identityEvidenceDocumentCopyFixture: IdentityEvidenceDocumentPanelCopy = Object.freeze({
  title: 'Supporting documents',
  body: 'Upload the signed PDF and let the trusted service verify it.',
  choosePdf: 'Choose signed PDF',
  upload: 'Upload document',
  uploading: 'Uploading document',
  verify: 'Verify digital signature',
  verifying: 'Verifying digital signature',
  noDocument: 'No supporting document has been uploaded.',
  invalidPdf: 'Choose a PDF document.',
  statusLabels: Object.freeze({
    verified: 'Verified',
    pending: 'Waiting for verification',
    rejected: 'Could not be verified',
  }),
})
