import { useState, type FormEvent } from 'react'
import type { IdentityEvidenceStatus } from './IdentityEvidenceWorkspace.js'

export type AnimalControllerRelationship = 'owner' | 'caregiver'

export type AnimalIdentityOnboardingInput = Readonly<{
  animalName: string
  taxonomyId: string
  birthDate?: string
  sex: 'female' | 'male' | 'other' | 'unknown'
  identifierSystem: string
  identifierValue: string
  controllerLegalName: string
  controllerIdentifierType: string
  controllerIdentifierValue: string
  controllerCountry: string
  controllerKind?: 'person' | 'organization'
  controllerRegion?: string
  controllerEmail?: string
  controllerTelephone?: string
  verificationMethod?: 'pipp' | 'sripp' | 'eid' | 'uripp'
  relationship: AnimalControllerRelationship
  ownerDocument?: File
  animalDocument: File
  relationshipDocument?: File
  controllerPin?: string
}>

export type AnimalIdentityOnboardingCopy = Readonly<{
  title: string
  intro: string
  animalStep: string
  controllerStep: string
  evidenceStep: string
  animalName: string
  taxonomyId: string
  birthDate: string
  sex: string
  sexUnknown: string
  sexFemale: string
  sexMale: string
  sexOther: string
  identifierSystem: string
  identifierValue: string
  controllerLegalName: string
  controllerIdentifierType: string
  controllerIdentifierValue: string
  controllerCountry: string
  relationship: string
  owner: string
  caregiver: string
  ownerDocument: string
  animalDocument: string
  relationshipDocument: string
  controllerPin?: string
  submit: string
}>

/**
 * Brand-neutral animal identity and controller-evidence editor recovered from
 * the progressive VetChain Expo journey. The host persists and verifies the
 * result; this component never grants authority or marks evidence verified.
 */
export function AnimalIdentityOnboarding({ copy, onSubmit, submitAction, speciesOptions = [], busy = false }: Readonly<{
  copy: AnimalIdentityOnboardingCopy
  onSubmit: (input: AnimalIdentityOnboardingInput) => Promise<void> | void
  submitAction?: string
  speciesOptions?: readonly Readonly<{ taxonomyId: string; label: string }>[]
  busy?: boolean
}>) {
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const ownerDocument = requiredFile(formElement, 'ownerDocument')
    const animalDocument = requiredFile(formElement, 'animalDocument')
    const relationshipDocument = requiredFile(formElement, 'relationshipDocument')
    setSubmitting(true)
    try {
      await onSubmit({
        animalName: requiredText(form, 'animalName'),
        taxonomyId: requiredText(form, 'taxonomyId'),
        birthDate: optionalText(form, 'birthDate'),
        sex: requiredText(form, 'sex') as AnimalIdentityOnboardingInput['sex'],
        identifierSystem: requiredText(form, 'identifierSystem'),
        identifierValue: requiredText(form, 'identifierValue'),
        controllerLegalName: requiredText(form, 'controllerLegalName'),
        controllerIdentifierType: requiredText(form, 'controllerIdentifierType'),
        controllerIdentifierValue: requiredText(form, 'controllerIdentifierValue'),
        controllerCountry: requiredText(form, 'controllerCountry').toUpperCase(),
        relationship: requiredText(form, 'relationship') as AnimalControllerRelationship,
        ownerDocument,
        animalDocument,
        relationshipDocument,
        controllerPin: requiredText(form, 'controllerPin'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = busy || submitting
  return <section className="uhcp-animal-onboarding" aria-labelledby="animal-identity-onboarding-title">
    <header>
      <h2 id="animal-identity-onboarding-title">{copy.title}</h2>
      <p>{copy.intro}</p>
    </header>
    <form onSubmit={submit}>
      <fieldset>
        <legend><StepNumber value={1} /> {copy.animalStep}</legend>
        <div className="uhcp-animal-onboarding-fields">
          <label>{copy.animalName}<input name="animalName" required maxLength={80} /></label>
          <label>{copy.taxonomyId}{speciesOptions.length > 0
            ? <select name="taxonomyId" required defaultValue={speciesOptions[0]?.taxonomyId}>
              {speciesOptions.map(option => <option key={option.taxonomyId} value={option.taxonomyId}>{option.label}</option>)}
            </select>
            : <input name="taxonomyId" required inputMode="numeric" pattern="[1-9][0-9]{0,6}" defaultValue="9615" />}</label>
          <label>{copy.birthDate}<input name="birthDate" type="date" /></label>
          <label>{copy.sex}<select name="sex" defaultValue="unknown">
            <option value="unknown">{copy.sexUnknown}</option>
            <option value="female">{copy.sexFemale}</option>
            <option value="male">{copy.sexMale}</option>
            <option value="other">{copy.sexOther}</option>
          </select></label>
          <label>{copy.identifierSystem}<select name="identifierSystem" defaultValue="urn:iso:std:iso:11784:11785">
            <option value="urn:iso:std:iso:11784:11785">Microchip (ISO 11784/11785)</option>
            <option value="https://europa.eu/pet-passport">EU pet passport</option>
            <option value="https://vetchain.app/identifier/tattoo">Tattoo</option>
          </select></label>
          <label>{copy.identifierValue}<input name="identifierValue" required maxLength={80} autoComplete="off" /></label>
        </div>
      </fieldset>
      <fieldset>
        <legend><StepNumber value={2} /> {copy.controllerStep}</legend>
        <div className="uhcp-animal-onboarding-fields">
          <label>{copy.controllerLegalName}<input name="controllerLegalName" required maxLength={160} autoComplete="name" /></label>
          <label>{copy.controllerIdentifierType}<input name="controllerIdentifierType" required defaultValue="national_identity_card" maxLength={80} /></label>
          <label>{copy.controllerIdentifierValue}<input name="controllerIdentifierValue" required maxLength={120} autoComplete="off" /></label>
          <label>{copy.controllerCountry}<input name="controllerCountry" required pattern="[A-Za-z]{2}" maxLength={2} autoComplete="country" /></label>
          <label>{copy.relationship}<select name="relationship" defaultValue="owner">
            <option value="owner">{copy.owner}</option>
            <option value="caregiver">{copy.caregiver}</option>
          </select></label>
        </div>
      </fieldset>
      <fieldset>
        <legend><StepNumber value={3} /> {copy.evidenceStep}</legend>
        <div className="uhcp-animal-onboarding-fields">
          <label>{copy.ownerDocument}<input name="ownerDocument" type="file" accept="application/pdf,image/jpeg,image/png" required /></label>
          <label>{copy.animalDocument}<input name="animalDocument" type="file" accept="application/pdf,image/jpeg,image/png" required /></label>
          <label>{copy.relationshipDocument}<input name="relationshipDocument" type="file" accept="application/pdf,image/jpeg,image/png" required /></label>
          <label>{copy.controllerPin}<input name="controllerPin" type="password" inputMode="numeric" pattern="[0-9]{6,12}" required autoComplete="new-password" /></label>
        </div>
      </fieldset>
      <button type="submit" className="uhcp-animal-onboarding-submit" data-portal-action={submitAction} disabled={disabled}>{copy.submit}</button>
    </form>
  </section>
}

export type SubjectIdentityCardSubject = Readonly<{
  displayName: string
  kind: 'person' | 'animal'
  imageUrl?: string
  facts: readonly Readonly<{ label: string; value: string }>[]
}>

/** Capability-aware readback. Values and status must come from the provider. */
export function SubjectIdentityCard({ subject, relationship, statusLabels, editLabel, canEdit = false, onEdit }: Readonly<{
  subject: SubjectIdentityCardSubject
  relationship?: Readonly<{ label: string; displayName: string; status: IdentityEvidenceStatus }>
  statusLabels: Readonly<Record<IdentityEvidenceStatus, string>>
  editLabel?: string
  canEdit?: boolean
  onEdit?: () => void
}>) {
  const initial = subject.displayName.trim().slice(0, 1).toUpperCase() || '•'
  return <article className="uhcp-subject-identity-card">
    <header>
      {subject.imageUrl
        ? <img src={subject.imageUrl} alt="" />
        : <span className="uhcp-subject-identity-avatar" aria-hidden="true">{initial}</span>}
      <div><small>{subject.kind}</small><h3>{subject.displayName}</h3></div>
      {canEdit && onEdit && editLabel ? <button className="uhcp-subject-identity-edit" type="button" aria-label={editLabel} title={editLabel} onClick={onEdit}><span aria-hidden="true">✎</span></button> : null}
    </header>
    <dl>{subject.facts.map(fact => <div key={`${fact.label}:${fact.value}`}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
    {relationship ? <section className="uhcp-subject-identity-relationship">
      <span>{relationship.label}</span><strong>{relationship.displayName}</strong>
      <small className={`uhcp-identity-status uhcp-identity-status-${relationship.status}`}>{statusLabels[relationship.status]}</small>
    </section> : null}
  </article>
}

function StepNumber({ value }: Readonly<{ value: number }>) {
  return <span className="uhcp-identity-step-number" aria-hidden="true">{value}</span>
}

function requiredText(form: FormData, name: string): string {
  const value = form.get(name)
  if (typeof value !== 'string' || !value.trim()) throw new Error(`animal_identity_${name}_required`)
  return value.trim()
}

function optionalText(form: FormData, name: string): string | undefined {
  const value = form.get(name)
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function requiredFile(form: HTMLFormElement, name: string): File {
  const input = form.elements.namedItem(name)
  const value = input instanceof HTMLInputElement ? input.files?.[0] : undefined
  if (!value || value.size < 1) throw new Error(`animal_identity_${name}_required`)
  return value
}
