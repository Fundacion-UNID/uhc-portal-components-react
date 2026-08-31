import type {
  IdentityEvidenceDocument,
  IdentityEvidenceDocumentPanelCopy,
  IdentityEvidenceIdentifier,
  IdentityEvidenceDeclarationFormCopy,
  IdentityEvidenceSubject,
} from '../../src/index.js'

export const identityEvidenceSubjectFixture: IdentityEvidenceSubject = Object.freeze({
  id: 'subject-fixture',
  displayName: 'Mochi',
  kind: 'animal',
})

export const identityEvidenceDeclarationCopyFixture: IdentityEvidenceDeclarationFormCopy = Object.freeze({
  title: 'Add a personal identity',
  body: 'Prepare a declaration for trusted verification.',
  fullLegalName: 'Full legal name',
  country: 'Country',
  identifierKind: 'Identifier type',
  identifierValue: 'Personal identifier',
  regional: 'This identifier is regional',
  region: 'Region',
  capacity: 'Relationship',
  prepare: 'Prepare PDF',
  preparing: 'Preparing PDF',
  required: 'Complete the required fields.',
})

export const identityEvidenceDeclarationOptionsFixture = Object.freeze({
  countries: Object.freeze([{ value: 'ES', label: 'Spain' }]),
  regions: Object.freeze([{ value: 'ES-CT', label: 'Catalonia' }]),
  identifierKinds: Object.freeze([{ value: 'national-person-identifier', label: 'National number' }]),
  capacities: Object.freeze([{ value: 'responsible-person', label: 'Responsible person' }]),
})

export const identityEvidenceDeclarationInputFixture = Object.freeze({
  fullLegalName: 'Legal Name Fixture',
  countryCode: identityEvidenceDeclarationOptionsFixture.countries[0].value,
  regional: true,
  subdivisionCode: identityEvidenceDeclarationOptionsFixture.regions[0].value,
  identifierKind: identityEvidenceDeclarationOptionsFixture.identifierKinds[0].value,
  identifierValue: 'IDENTIFIER-FIXTURE',
  controllerCapacity: identityEvidenceDeclarationOptionsFixture.capacities[0].value,
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
