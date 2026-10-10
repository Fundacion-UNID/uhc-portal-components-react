import { useEffect, useState, type FormEvent } from 'react'
import type {
  AnimalControllerRelationship,
  AnimalIdentityOnboardingCopy,
  AnimalIdentityOnboardingInput,
} from './AnimalIdentityOnboarding.js'

export type AnimalIdentityOnboardingV2Copy = AnimalIdentityOnboardingCopy & Readonly<{
  controllerIsLegalRepresentative: string
  animalPreview: string
}>

/**
 * Progressive animal onboarding presentation. It preserves the V1 payload so
 * hosts can adopt it without changing evidence, authorization or persistence.
 */
export function AnimalIdentityOnboardingV2({ copy, onSubmit, submitAction, speciesOptions = [], busy = false }: Readonly<{
  copy: AnimalIdentityOnboardingV2Copy
  onSubmit: (input: AnimalIdentityOnboardingInput) => Promise<void> | void
  submitAction?: string
  speciesOptions?: readonly Readonly<{ taxonomyId: string; label: string }>[]
  busy?: boolean
}>) {
  const [submitting, setSubmitting] = useState(false)
  const [animalName, setAnimalName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => () => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function previewAnimal(file?: File) {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    if (!file?.type.startsWith('image/')) return setPreviewUrl('')
    if (typeof URL.createObjectURL === 'function') return setPreviewUrl(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
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
        ownerDocument: requiredFile(formElement, 'ownerDocument'),
        animalDocument: requiredFile(formElement, 'animalDocument'),
        relationshipDocument: requiredFile(formElement, 'relationshipDocument'),
        controllerPin: requiredText(form, 'controllerPin'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = busy || submitting
  return <section className="uhcp-animal-onboarding uhcp-animal-onboarding-v2" aria-labelledby="animal-identity-onboarding-v2-title">
    <header>
      <h2 id="animal-identity-onboarding-v2-title">{copy.title}</h2>
      <p>{copy.intro}</p>
    </header>
    <form onSubmit={submit}>
      <details open>
        <summary><StepNumber value={1}/> {copy.animalStep}</summary>
        <div className="uhcp-animal-onboarding-primary">
          <div className="uhcp-animal-photo">
            {previewUrl
              ? <img src={previewUrl} alt={copy.animalPreview.replace('{name}', animalName || copy.animalName)}/>
              : <span aria-hidden="true">{animalName.trim().slice(0, 1).toLocaleUpperCase() || '＋'}</span>}
            <label>{copy.animalDocument}<input name="animalDocument" type="file" accept="application/pdf,image/jpeg,image/png" required onChange={event => previewAnimal(event.currentTarget.files?.[0])}/></label>
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
      <details>
        <summary><StepNumber value={2}/> {copy.controllerStep}</summary>
        <div className="uhcp-animal-onboarding-fields">
          <label>{copy.controllerLegalName}<input name="controllerLegalName" required maxLength={160} autoComplete="name"/></label>
          <label>{copy.controllerIdentifierType}<input name="controllerIdentifierType" required defaultValue="national_identity_card" maxLength={80}/></label>
          <label>{copy.controllerIdentifierValue}<input name="controllerIdentifierValue" required maxLength={120} autoComplete="off"/></label>
          <label>{copy.controllerCountry}<input name="controllerCountry" required pattern="[A-Za-z]{2}" maxLength={2} autoComplete="country"/></label>
          <label>{copy.relationship}<select name="relationship" defaultValue="owner"><option value="owner">{copy.owner}</option><option value="caregiver">{copy.caregiver}</option></select></label>
          <label className="uhcp-animal-controller-confirmation"><input type="checkbox" defaultChecked required/> {copy.controllerIsLegalRepresentative}</label>
        </div>
      </details>
      <details>
        <summary><StepNumber value={3}/> {copy.evidenceStep}</summary>
        <div className="uhcp-animal-onboarding-fields">
          <label>{copy.ownerDocument}<input name="ownerDocument" type="file" accept="application/pdf,image/jpeg,image/png" required/></label>
          <label>{copy.relationshipDocument}<input name="relationshipDocument" type="file" accept="application/pdf,image/jpeg,image/png" required/></label>
          <label>{copy.controllerPin}<input name="controllerPin" type="password" inputMode="numeric" pattern="[0-9]{6,12}" required autoComplete="new-password"/></label>
        </div>
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
