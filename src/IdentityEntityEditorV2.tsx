import { useState } from 'react'

export type IdentityEntitySelectOption = Readonly<{ value: string; label: string }>

export type IdentityEntityEditorV2Copy = Readonly<{
  entityType: string
  personEntity: string
  organizationEntity: string
  fullLegalName: string
  country: string
  regionalIdentifier: string
  region: string
  identifierType: string
  identifierValue: string
  email: string
  telephone: string
  relationship: string
  responsibleParty: string
  evidence: string
  verificationMethod: string
  physicalInPerson: string
  supervisedRemote: string
  electronicId: string
  unsupervisedRemote: string
  identityDocument: string
  relationshipDocument: string
  pin?: string
  controllerConfirmation: string
  countryPlaceholder?: string
}>

/**
 * Reusable identity-and-evidence editor for one controller or related entity.
 * A controller has a fixed responsible-party relationship; related entities
 * receive their host-governed relationship choices.
 */
export function IdentityEntityEditorV2({
  copy,
  mode,
  countryOptions = [],
  regionOptionsByCountry = {},
  identifierTypeOptions,
  relationshipOptions = [],
  fieldPrefix = '',
  contactError,
  requireEmail = false,
  requireTelephone = false,
  showEvidence = true,
}: Readonly<{
  copy: IdentityEntityEditorV2Copy
  mode: 'controller' | 'related'
  countryOptions?: readonly IdentityEntitySelectOption[]
  regionOptionsByCountry?: Readonly<Record<string, readonly IdentityEntitySelectOption[]>>
  identifierTypeOptions?: Readonly<{ person: readonly IdentityEntitySelectOption[]; organization: readonly IdentityEntitySelectOption[] }>
  relationshipOptions?: readonly IdentityEntitySelectOption[]
  fieldPrefix?: string
  contactError?: string
  requireEmail?: boolean
  requireTelephone?: boolean
  showEvidence?: boolean
}>) {
  const [entityType, setEntityType] = useState<'person' | 'organization'>('person')
  const [country, setCountry] = useState('')
  const [regional, setRegional] = useState(false)
  const regions = regionOptionsByCountry[country] ?? []
  const name = (value: string) => fieldPrefix ? `${fieldPrefix}.${value}` : value

  return <div className="uhcp-identity-entity-editor">
    <div className="uhcp-identity-entity-heading-row">
      <fieldset className="uhcp-animal-owner-kind"><legend>{copy.entityType}</legend>
        <label><input type="radio" name={name('controllerKind')} value="person" checked={entityType === 'person'} onChange={() => setEntityType('person')}/> {copy.personEntity}</label>
        <label><input type="radio" name={name('controllerKind')} value="organization" checked={entityType === 'organization'} onChange={() => setEntityType('organization')}/> {copy.organizationEntity}</label>
      </fieldset>
      <div className="uhcp-identity-entity-relationship">
        <span>{copy.relationship}</span>
        {mode === 'controller'
          ? <><strong>{copy.responsibleParty}</strong><input type="hidden" name={name('relationship')} value="owner"/></>
          : <select name={name('relationship')} aria-label={copy.relationship} required defaultValue={relationshipOptions[0]?.value}>{relationshipOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
      </div>
    </div>
    <div className="uhcp-animal-onboarding-fields">
      <label className="uhcp-animal-owner-name">{copy.fullLegalName}<input name={name('controllerLegalName')} required maxLength={160} autoComplete={entityType === 'person' ? 'name' : 'organization'}/></label>
      <label>{copy.country}{countryOptions.length ? <select name={name('controllerCountry')} required value={country} onChange={event => setCountry(event.currentTarget.value)}><option value="" disabled>{copy.countryPlaceholder ?? copy.country}</option>{countryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input name={name('controllerCountry')} required pattern="[A-Za-z]{2}" maxLength={2} autoComplete="country" onChange={event => setCountry(event.currentTarget.value.toUpperCase())}/>}</label>
      <label className="uhcp-animal-regional-identifier"><input type="checkbox" checked={regional} disabled={!regions.length} onChange={event => setRegional(event.currentTarget.checked)}/> {copy.regionalIdentifier}</label>
      <label>{copy.region}<select name={name('controllerRegion')} required={regional} disabled={!regional}><option value=""/>{regions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label>{copy.identifierType}{identifierTypeOptions ? <select name={name('controllerIdentifierType')} required key={entityType}>{identifierTypeOptions[entityType].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input name={name('controllerIdentifierType')} required defaultValue="national_identity_card" maxLength={80}/>}</label>
      <label>{copy.identifierValue}<input name={name('controllerIdentifierValue')} required maxLength={120} autoComplete="off"/></label>
      <label className="uhcp-identity-entity-contact-wide">{copy.email}<input name={name('controllerEmail')} type="email" autoComplete="email" required={requireEmail}/></label>
      <label>{copy.telephone}<input name={name('controllerTelephone')} type="tel" autoComplete="tel" required={requireTelephone}/></label>
      {mode === 'controller' ? <label className="uhcp-animal-controller-confirmation"><input type="checkbox" checked disabled readOnly aria-disabled="true"/> {copy.controllerConfirmation}</label> : null}
      {contactError ? <p role="alert">{contactError}</p> : null}
    </div>
    {showEvidence ? <fieldset className="uhcp-identity-entity-evidence">
      <legend>{copy.evidence}</legend>
      <div className="uhcp-animal-onboarding-fields">
        <label>{copy.verificationMethod}<select name={name('verificationMethod')} defaultValue="pipp"><option value="pipp">{copy.physicalInPerson}</option><option value="sripp">{copy.supervisedRemote}</option><option value="eid">{copy.electronicId}</option><option value="uripp">{copy.unsupervisedRemote}</option></select></label>
        <label>{copy.identityDocument}<input name={name('ownerDocument')} type="file" accept="application/pdf,image/jpeg,image/png"/></label>
        <label>{copy.relationshipDocument}<input name={name('relationshipDocument')} type="file" accept="application/pdf,image/jpeg,image/png"/></label>
      </div>
    </fieldset> : null}
  </div>
}
