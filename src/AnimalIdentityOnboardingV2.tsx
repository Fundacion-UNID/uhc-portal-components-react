import { useEffect, useState, type FormEvent } from 'react'
import type {
  AnimalControllerRelationship,
  AnimalIdentityOnboardingCopy,
  AnimalIdentityOnboardingInput,
} from './AnimalIdentityOnboarding.js'
import { IdentityEntityEditorV2 } from './IdentityEntityEditorV2.js'

export type AnimalIdentityOnboardingV2Copy = AnimalIdentityOnboardingCopy & Readonly<{
  controllerIsLegalRepresentative: string
  animalPreview: string
  addAnimalPhoto: string
  removeAnimalPhoto: string
  photoHelp: string
  photoTooLarge: string
  photoDimensionsInvalid: string
  ownerKind: string
  responsibleParty?: string
  personOwner: string
  organizationOwner: string
  regionalIdentifier: string
  controllerRegion: string
  controllerEmail: string
  controllerTelephone: string
  contactRequired: string
  verificationMethod: string
  physicalInPerson: string
  supervisedRemote: string
  electronicId: string
  unsupervisedRemote: string
}>

type SelectOption = Readonly<{ value: string; label: string }>
const MAX_ANIMAL_PHOTO_BYTES = 2 * 1024 * 1024

/**
 * Progressive animal onboarding presentation. It preserves the V1 payload so
 * hosts can adopt it without changing evidence, authorization or persistence.
 */
export function AnimalIdentityOnboardingV2({ copy, onSubmit, submitAction, speciesOptions = [], countryOptions = [], regionOptionsByCountry = {}, identifierTypeOptions, showHeader = true, busy = false }: Readonly<{
  copy: AnimalIdentityOnboardingV2Copy
  onSubmit: (input: AnimalIdentityOnboardingInput) => Promise<void> | void
  submitAction?: string
  speciesOptions?: readonly Readonly<{ taxonomyId: string; label: string }>[]
  countryOptions?: readonly SelectOption[]
  regionOptionsByCountry?: Readonly<Record<string, readonly SelectOption[]>>
  identifierTypeOptions?: Readonly<{ person: readonly SelectOption[]; organization: readonly SelectOption[] }>
  showHeader?: boolean
  busy?: boolean
}>) {
  const [submitting, setSubmitting] = useState(false)
  const [animalName, setAnimalName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [animalDocument, setAnimalDocument] = useState<File>()
  const [photoError, setPhotoError] = useState('')
  const [contactError, setContactError] = useState('')

  useEffect(() => () => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  async function previewAnimal(file?: File) {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setPhotoError('')
    if (!file?.type.startsWith('image/')) { setAnimalDocument(undefined); return setPreviewUrl('') }
    if (file.size > MAX_ANIMAL_PHOTO_BYTES) { setAnimalDocument(undefined); setPreviewUrl(''); return setPhotoError(copy.photoTooLarge) }
    try {
      const dimensions = await readImageDimensions(file)
      if (!hasAcceptedPhotoDimensions(dimensions.width, dimensions.height)) {
        setAnimalDocument(undefined)
        setPreviewUrl('')
        return setPhotoError(copy.photoDimensionsInvalid)
      }
    } catch {
      setAnimalDocument(undefined)
      setPreviewUrl('')
      return setPhotoError(copy.photoDimensionsInvalid)
    }
    setAnimalDocument(file)
    if (typeof URL.createObjectURL === 'function') return setPreviewUrl(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  function removeAnimalPhoto() {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setAnimalDocument(undefined)
    setPreviewUrl('')
    setPhotoError('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const controllerEmail = optionalText(form, 'controllerEmail')
    const controllerTelephone = optionalText(form, 'controllerTelephone')
    if (!controllerEmail && !controllerTelephone) { setContactError(copy.contactRequired); return }
    setContactError('')
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
        controllerKind: requiredText(form, 'controllerKind') as 'person' | 'organization',
        controllerRegion: optionalText(form, 'controllerRegion'),
        controllerEmail,
        controllerTelephone,
        verificationMethod: requiredText(form, 'verificationMethod') as NonNullable<AnimalIdentityOnboardingInput['verificationMethod']>,
        relationship: requiredText(form, 'relationship') as AnimalControllerRelationship,
        ownerDocument: requiredFile(formElement, 'ownerDocument'),
        animalDocument: animalDocument || requiredFile(formElement, 'animalDocument'),
        relationshipDocument: requiredFile(formElement, 'relationshipDocument'),
        controllerPin: requiredText(form, 'controllerPin'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = busy || submitting
  return <section className="uhcp-animal-onboarding uhcp-animal-onboarding-v2" aria-labelledby={showHeader ? 'animal-identity-onboarding-v2-title' : undefined} aria-label={showHeader ? undefined : copy.title}>
    {showHeader ? <header>
      <h2 id="animal-identity-onboarding-v2-title">{copy.title}</h2>
      <p>{copy.intro}</p>
    </header> : null}
    <form onSubmit={submit}>
      <details open aria-labelledby="animal-onboarding-v2-animal-step">
        <summary id="animal-onboarding-v2-animal-step"><StepNumber value={1}/> {copy.animalStep}</summary>
        <div className="uhcp-animal-onboarding-primary">
          <div className="uhcp-animal-photo">
            <label className="uhcp-animal-photo-dropzone" role="button" aria-label={copy.addAnimalPhoto}
              onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void previewAnimal(event.dataTransfer.files?.[0]) }}>
              {previewUrl
                ? <img src={previewUrl} alt={copy.animalPreview.replace('{name}', animalName || copy.animalName)}/>
                : <span aria-hidden="true">＋</span>}
              <input name="animalDocument" type="file" accept="image/jpeg,image/png" required={!animalDocument} aria-label={copy.addAnimalPhoto} onChange={event => void previewAnimal(event.currentTarget.files?.[0])}/>
            </label>
            {previewUrl ? <button type="button" className="uhcp-animal-photo-remove" aria-label={copy.removeAnimalPhoto} title={copy.removeAnimalPhoto} onClick={removeAnimalPhoto}>×</button> : null}
            <small>{copy.photoHelp}</small>
            {photoError ? <p role="alert">{photoError}</p> : null}
          </div>
          <div className="uhcp-animal-onboarding-fields">
            <label>{copy.animalName}<input name="animalName" required maxLength={80} value={animalName} onChange={event => setAnimalName(event.currentTarget.value)}/></label>
            <label>{copy.taxonomyId}{speciesOptions.length > 0
              ? <select name="taxonomyId" required defaultValue={speciesOptions[0]?.taxonomyId}>{speciesOptions.map(option => <option key={option.taxonomyId} value={option.taxonomyId}>{option.label}</option>)}</select>
              : <input name="taxonomyId" required inputMode="numeric" pattern="[1-9][0-9]{0,6}" defaultValue="9615"/>}</label>
            <label>{copy.birthDate}<input name="birthDate" type="date"/></label>
            <label>{copy.sex}<select name="sex" defaultValue="unknown"><option value="unknown">{copy.sexUnknown}</option><option value="female">{copy.sexFemale}</option><option value="male">{copy.sexMale}</option><option value="other">{copy.sexOther}</option></select></label>
            <label>{copy.identifierSystem}<select name="identifierSystem" defaultValue="urn:iso:std:iso:11784:11785"><option value="urn:iso:std:iso:11784:11785">ISO 11784/11785</option><option value="https://europa.eu/pet-passport">EU pet passport</option><option value="https://vetchain.app/identifier/tattoo">Tattoo</option></select></label>
            <label>{copy.identifierValue}<input name="identifierValue" required maxLength={80} autoComplete="off"/></label>
          </div>
        </div>
      </details>
      <details aria-labelledby="animal-onboarding-v2-controller-step">
        <summary id="animal-onboarding-v2-controller-step"><StepNumber value={2}/> {copy.controllerStep}</summary>
        <IdentityEntityEditorV2 mode="controller" countryOptions={countryOptions} regionOptionsByCountry={regionOptionsByCountry} identifierTypeOptions={identifierTypeOptions} contactError={contactError} copy={{
          entityType: copy.ownerKind, personEntity: copy.personOwner, organizationEntity: copy.organizationOwner,
          fullLegalName: copy.controllerLegalName, country: copy.controllerCountry, regionalIdentifier: copy.regionalIdentifier,
          region: copy.controllerRegion, identifierType: copy.controllerIdentifierType, identifierValue: copy.controllerIdentifierValue,
          email: copy.controllerEmail, telephone: copy.controllerTelephone, relationship: copy.relationship,
          responsibleParty: copy.responsibleParty ?? copy.owner, evidence: copy.evidenceStep,
          verificationMethod: copy.verificationMethod, physicalInPerson: copy.physicalInPerson,
          supervisedRemote: copy.supervisedRemote, electronicId: copy.electronicId, unsupervisedRemote: copy.unsupervisedRemote,
          identityDocument: copy.ownerDocument, relationshipDocument: copy.relationshipDocument, pin: copy.controllerPin,
          controllerConfirmation: copy.controllerIsLegalRepresentative,
        }}/>
      </details>
      <button type="submit" className="uhcp-animal-onboarding-submit" data-portal-action={submitAction} disabled={disabled}>{copy.submit}</button>
    </form>
  </section>
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

async function readImageDimensions(file: File): Promise<Readonly<{ width: number; height: number }>> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dimensions
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('animal_photo_unreadable'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('animal_photo_unreadable'))
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
      image.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  })
}

function hasAcceptedPhotoDimensions(width: number, height: number): boolean {
  const ratio = width / height
  return width >= 300 && height >= 400 && Math.abs(ratio - 3 / 4) <= 0.06
}
