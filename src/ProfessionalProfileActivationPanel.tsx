'use client'

import { useState, type FormEvent } from 'react'

export type ProfessionalProfileActivationCopy = Readonly<{
  eyebrow?: string
  title: string
  description: string
  credentialLabel: string
  pinLabel: string
  pinConfirmationLabel: string
  pinMismatch: string
  submit: string
  submitting: string
}>

export type ProfessionalProfileActivationInput = Readonly<{
  credential: string
  pin: string
}>

export type ProfessionalProfileActivationPanelProps = Readonly<{
  copy: ProfessionalProfileActivationCopy
  busy: boolean
  error?: string
  onSubmit: (input: ProfessionalProfileActivationInput) => void | Promise<void>
}>

/**
 * Brand-neutral first-device activation for an authorized employee.
 * The BFF resolves trusted routing and authority from one organization-issued
 * value; the browser never reconstructs a sector, organization, DID and URN.
 */
export function ProfessionalProfileActivationPanel({ copy, busy, error, onSubmit }: ProfessionalProfileActivationPanelProps) {
  const [credential, setCredential] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirmation, setPinConfirmation] = useState('')
  const [localError, setLocalError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pin !== pinConfirmation) {
      setLocalError(copy.pinMismatch)
      return
    }
    setLocalError('')
    void onSubmit({ credential: credential.trim(), pin })
  }

  return <section className="uhcp-professional-activation" aria-labelledby="uhcp-professional-activation-title">
    <form onSubmit={submit}>
      <header>
        {copy.eyebrow ? <p className="uhcp-eyebrow">{copy.eyebrow}</p> : null}
        <h1 id="uhcp-professional-activation-title">{copy.title}</h1>
        <p>{copy.description}</p>
      </header>
      <label><span>{copy.credentialLabel}</span><input name="professionalCredential" value={credential} onChange={event => setCredential(event.currentTarget.value)} autoComplete="one-time-code" required /></label>
      <label><span>{copy.pinLabel}</span><input name="newPin" type="password" inputMode="numeric" minLength={6} maxLength={12} autoComplete="new-password" value={pin} onChange={event => setPin(event.currentTarget.value)} required /></label>
      <label><span>{copy.pinConfirmationLabel}</span><input name="confirmPin" type="password" inputMode="numeric" minLength={6} maxLength={12} autoComplete="new-password" value={pinConfirmation} onChange={event => setPinConfirmation(event.currentTarget.value)} required /></label>
      {(localError || error) ? <p role="alert">{localError || error}</p> : null}
      <button type="submit" disabled={busy}>{busy ? copy.submitting : copy.submit}</button>
    </form>
  </section>
}
