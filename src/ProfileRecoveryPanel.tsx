'use client'

import { useState, type FormEvent } from 'react'

export type ProfileRecoveryMessages = Readonly<{
  open: string
  title: string
  explanation: string
  recoveryCode: string
  recoveryCodeHelp: string
  newPin: string
  confirmPin: string
  submit: string
  cancel: string
  mismatch: string
  completed: string
  replacementCode: string
  replacementCodeHelp: string
  notificationQueued: string
}>

/** Collects recovery proof and a replacement PIN without receiving wallet keys. */
export function ProfileRecoveryPanel({ profileId, messages, disabled = false, onRecover, onClose }: Readonly<{
  profileId: string
  messages: ProfileRecoveryMessages
  disabled?: boolean
  onRecover: (input: { profileId: string; recoveryCode: string; newPin: string }) => Promise<string>
  onClose: () => void
}>) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [replacementCode, setReplacementCode] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const newPin = String(form.get('newPin') || '')
    if (newPin !== String(form.get('confirmPin') || '')) {
      setError(messages.mismatch)
      return
    }
    setBusy(true)
    try {
      setReplacementCode(await onRecover({ profileId, recoveryCode: String(form.get('recoveryCode') || ''), newPin }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'profile_recovery_failed')
    } finally {
      setBusy(false)
    }
  }
  if (replacementCode) return <section className="panel profile-recovery-result" role="status">
    <strong>{messages.completed}</strong>
    <label>{messages.replacementCode}<textarea readOnly rows={3} value={replacementCode} aria-label={messages.replacementCode}/></label>
    <p>{messages.replacementCodeHelp}</p><p>{messages.notificationQueued}</p>
    <button type="button" data-portal-action="close-profile-recovery" onClick={onClose}>{messages.cancel}</button>
  </section>
  return <form className="panel form profile-recovery-form" onSubmit={submit}>
    <div><h3>{messages.title}</h3><p className="muted">{messages.explanation}</p></div>
    <label>{messages.recoveryCode}<textarea name="recoveryCode" rows={3} required autoComplete="off" aria-describedby="profile-recovery-help"/></label>
    <p id="profile-recovery-help" className="technical-note">{messages.recoveryCodeHelp}</p>
    <label>{messages.newPin}<input name="newPin" type="password" minLength={6} required autoComplete="new-password"/></label>
    <label>{messages.confirmPin}<input name="confirmPin" type="password" minLength={6} required autoComplete="new-password"/></label>
    {error ? <p role="alert">{error}</p> : null}
    <div className="inline-actions">
      <button data-portal-action="submit-profile-recovery" disabled={busy}>{messages.submit}</button>
      <button type="button" data-portal-action="cancel-profile-recovery" className="secondary" disabled={busy || disabled} onClick={onClose}>{messages.cancel}</button>
    </div>
  </form>
}
