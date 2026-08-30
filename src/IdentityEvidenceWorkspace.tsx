export type IdentityEvidenceStatus = 'verified' | 'pending' | 'rejected'

export type IdentityEvidenceUploadMode =
  | 'self'
  | 'organization-worker'
  | 'professional-attestation'

export type IdentityEvidenceSubject = Readonly<{
  id: string
  displayName: string
  kind: 'person' | 'animal'
}>

export type IdentityEvidenceIdentifier = Readonly<{
  id: string
  typeLabel: string
  jurisdictionLabel: string
  displayValue: string
  status: IdentityEvidenceStatus
}>

export type IdentityEvidenceCapabilities = Readonly<{
  editSubject: boolean
  addIdentifier: boolean
  selfUpload: boolean
  organizationUpload: boolean
  professionalAttestation: boolean
}>

export type IdentityEvidenceWorkspaceCopy = Readonly<{
  title: string
  intro: string
  selectedSubject: string
  subjectStepTitle: string
  subjectStepBody: string
  editSubject: string
  controllerStepTitle: string
  controllerStepBody: string
  noIdentifiers: string
  addIdentifier: string
  evidenceStepTitle: string
  evidenceStepBody: string
  selfUpload: string
  selfUploadHelp: string
  organizationUpload: string
  organizationUploadHelp: string
  professionalAttestation: string
  statusLabels: Readonly<Record<IdentityEvidenceStatus, string>>
}>

/**
 * Brand-neutral identity-evidence journey for one backend-authorized subject.
 *
 * The host owns subject resolution, persistence and capabilities. This view
 * keeps the managed subject separate from the controller's identifiers and
 * keeps uploader, signer and verifier roles independent. Selecting an upload
 * route never changes evidence status in browser state.
 */
export function IdentityEvidenceWorkspace({
  copy,
  subject,
  identifiers,
  capabilities,
  onEditSubject,
  onAddIdentifier,
  onSelectIdentifier,
  onUploadEvidence,
}: Readonly<{
  copy: IdentityEvidenceWorkspaceCopy
  subject: IdentityEvidenceSubject
  identifiers: readonly IdentityEvidenceIdentifier[]
  capabilities: IdentityEvidenceCapabilities
  onEditSubject?: () => void
  onAddIdentifier?: () => void
  onSelectIdentifier?: (identifierId: string) => void
  onUploadEvidence?: (mode: IdentityEvidenceUploadMode) => void
}>) {
  return (
    <section className="uhcp-identity-workspace" aria-labelledby="identity-evidence-workspace-title">
      <header className="uhcp-identity-workspace-heading">
        <h2 id="identity-evidence-workspace-title">{copy.title}</h2>
        <p>{copy.intro}</p>
      </header>

      <ol className="uhcp-identity-steps">
        <li className="uhcp-identity-step">
          <StepNumber value={1} />
          <div className="uhcp-identity-step-content">
            <h3>{copy.subjectStepTitle}</h3>
            <p>{copy.subjectStepBody}</p>
            <div className="uhcp-identity-subject">
              <span>{copy.selectedSubject}</span>
              <strong>{subject.displayName}</strong>
            </div>
            {capabilities.editSubject && onEditSubject ? (
              <button type="button" className="uhcp-identity-secondary-action" onClick={onEditSubject}>
                {copy.editSubject}
              </button>
            ) : null}
          </div>
        </li>

        <li className="uhcp-identity-step">
          <StepNumber value={2} />
          <div className="uhcp-identity-step-content">
            <h3>{copy.controllerStepTitle}</h3>
            <p>{copy.controllerStepBody}</p>
            {identifiers.length === 0 ? (
              <p className="uhcp-identity-empty">{copy.noIdentifiers}</p>
            ) : (
              <ul className="uhcp-identity-identifiers">
                {identifiers.map((identifier) => (
                  <li key={identifier.id}>
                    <button
                      type="button"
                      onClick={() => onSelectIdentifier?.(identifier.id)}
                      disabled={!onSelectIdentifier}
                      aria-label={`${identifier.typeLabel}, ${identifier.jurisdictionLabel}, ${identifier.displayValue}`}
                    >
                      <span>
                        <strong>{identifier.typeLabel}</strong>
                        <small>{identifier.jurisdictionLabel} · {identifier.displayValue}</small>
                      </span>
                      <span className={`uhcp-identity-status uhcp-identity-status-${identifier.status}`}>
                        {copy.statusLabels[identifier.status]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {capabilities.addIdentifier && onAddIdentifier ? (
              <button type="button" className="uhcp-identity-secondary-action" onClick={onAddIdentifier}>
                {copy.addIdentifier}
              </button>
            ) : null}
          </div>
        </li>

        <li className="uhcp-identity-step">
          <StepNumber value={3} />
          <div className="uhcp-identity-step-content">
            <h3>{copy.evidenceStepTitle}</h3>
            <p>{copy.evidenceStepBody}</p>
            <div className="uhcp-identity-upload-actions">
              {capabilities.selfUpload ? (
                <UploadAction
                  title={copy.selfUpload}
                  help={copy.selfUploadHelp}
                  onClick={() => onUploadEvidence?.('self')}
                  disabled={!onUploadEvidence}
                />
              ) : null}
              {capabilities.organizationUpload ? (
                <UploadAction
                  title={copy.organizationUpload}
                  help={copy.organizationUploadHelp}
                  onClick={() => onUploadEvidence?.('organization-worker')}
                  disabled={!onUploadEvidence}
                />
              ) : null}
              {capabilities.professionalAttestation ? (
                <UploadAction
                  title={copy.professionalAttestation}
                  onClick={() => onUploadEvidence?.('professional-attestation')}
                  disabled={!onUploadEvidence}
                />
              ) : null}
            </div>
          </div>
        </li>
      </ol>
    </section>
  )
}

function StepNumber({ value }: Readonly<{ value: number }>) {
  return <span className="uhcp-identity-step-number" aria-hidden="true">{value}</span>
}

function UploadAction({
  title,
  help,
  onClick,
  disabled,
}: Readonly<{
  title: string
  help?: string
  onClick: () => void
  disabled: boolean
}>) {
  return (
    <button type="button" className="uhcp-identity-upload-action" aria-label={title} onClick={onClick} disabled={disabled}>
      <strong>{title}</strong>
      {help ? <small>{help}</small> : null}
    </button>
  )
}
