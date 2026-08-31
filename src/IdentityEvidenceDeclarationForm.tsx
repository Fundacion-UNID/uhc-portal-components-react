import { useState } from 'react'

export type IdentityEvidenceOption = Readonly<{ value: string; label: string }>

export type IdentityEvidenceDeclarationInput = Readonly<{
  fullLegalName: string
  countryCode: string
  regional: boolean
  subdivisionCode?: string
  identifierKind: string
  identifierValue: string
  controllerCapacity: string
}>

export type IdentityEvidenceDeclarationFormCopy = Readonly<{
  title: string
  body: string
  fullLegalName: string
  country: string
  identifierKind: string
  identifierValue: string
  regional: string
  region: string
  capacity: string
  prepare: string
  preparing: string
  required: string
}>

/**
 * Brand-neutral declaration form shared by UHC, PetChain and SOSChain.
 *
 * The host supplies governed options and one high-level preparation callback.
 * This component neither authors resource claims nor handles certificates,
 * sessions, gateway messages or verification decisions.
 */
export function IdentityEvidenceDeclarationForm({
  copy,
  countries,
  regions,
  identifierKinds,
  capacities,
  onPrepare,
}: Readonly<{
  copy: IdentityEvidenceDeclarationFormCopy
  countries: readonly IdentityEvidenceOption[]
  regions: readonly IdentityEvidenceOption[]
  identifierKinds: readonly IdentityEvidenceOption[]
  capacities: readonly IdentityEvidenceOption[]
  onPrepare: (input: IdentityEvidenceDeclarationInput) => Promise<void>
}>) {
  const [fullLegalName, setFullLegalName] = useState('')
  const [identifierValue, setIdentifierValue] = useState('')
  const [countryCode, setCountryCode] = useState(countries[0]?.value || '')
  const [identifierKind, setIdentifierKind] = useState(identifierKinds[0]?.value || '')
  const [controllerCapacity, setControllerCapacity] = useState(capacities[0]?.value || '')
  const [regional, setRegional] = useState(false)
  const [subdivisionCode, setSubdivisionCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function prepare() {
    if (!fullLegalName.trim() || !identifierValue.trim() || !countryCode || !identifierKind || !controllerCapacity || (regional && !subdivisionCode)) {
      setError(copy.required)
      return
    }
    setBusy(true)
    setError('')
    try {
      await onPrepare({
        fullLegalName: fullLegalName.trim(),
        countryCode,
        regional,
        ...(regional ? { subdivisionCode } : {}),
        identifierKind,
        identifierValue: identifierValue.trim(),
        controllerCapacity,
      })
    } finally {
      setBusy(false)
    }
  }

  return <section className="uhcp-identity-declaration" aria-labelledby="identity-declaration-form-title">
    <header><h3 id="identity-declaration-form-title">{copy.title}</h3><p>{copy.body}</p></header>
    <div className="uhcp-identity-declaration-fields">
      <label>{copy.fullLegalName}<input value={fullLegalName} onChange={(event) => setFullLegalName(event.target.value)} /></label>
      <label>{copy.country}<select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>{options(countries)}</select></label>
      <label>{copy.identifierKind}<select value={identifierKind} onChange={(event) => setIdentifierKind(event.target.value)}>{options(identifierKinds)}</select></label>
      <label>{copy.identifierValue}<input value={identifierValue} onChange={(event) => setIdentifierValue(event.target.value)} /></label>
      <label><input type="checkbox" checked={regional} onChange={(event) => { setRegional(event.target.checked); if (!event.target.checked) setSubdivisionCode('') }} />{copy.regional}</label>
      <label>{copy.region}<select value={subdivisionCode} disabled={!regional} onChange={(event) => setSubdivisionCode(event.target.value)}><option value="" />{options(regions)}</select></label>
      <label>{copy.capacity}<select value={controllerCapacity} onChange={(event) => setControllerCapacity(event.target.value)}>{options(capacities)}</select></label>
    </div>
    {error ? <p role="alert">{error}</p> : null}
    <button type="button" onClick={() => void prepare()} disabled={busy}>{busy ? copy.preparing : copy.prepare}</button>
  </section>
}

function options(values: readonly IdentityEvidenceOption[]) {
  return values.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)
}
