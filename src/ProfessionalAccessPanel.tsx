'use client'

import type { FormEvent } from 'react'

export type ProfessionalAccessPanelCopy = Readonly<{
  eyebrow: string
  title: string
  description: string
  google: string
  separator: string
  email: string
  sendEmailCode: string
  emailCode: string
  verifyEmailCode: string
  changeEmail: string
  emailCodeSent: string
  passkeyHint: string
  passkey: string
  demoEmail: string
  demoCode: string
  demoSubmit: string
  demoHint: string
  busy: string
}>

export type ProfessionalAccessPanelProps = Readonly<{
  mode: 'trusted' | 'demo'
  copy: ProfessionalAccessPanelCopy
  email: string
  emailCode: string
  emailCodeRequested?: boolean
  busy?: boolean
  elapsedSeconds?: number
  error?: string
  googleEnabled?: boolean
  actionsEnabled?: boolean
  onEmailChange(value: string): void
  onEmailCodeChange(value: string): void
  onGoogle?(): void | Promise<void>
  onRequestEmailCode?(event: FormEvent<HTMLFormElement>): void | Promise<void>
  onVerifyEmailCode?(event: FormEvent<HTMLFormElement>): void | Promise<void>
  onChangeEmail?(): void
  onPasskey?(): void | Promise<void>
  onDemo?(event: FormEvent<HTMLFormElement>): void | Promise<void>
}>

/**
 * Brand-neutral professional sign-in presentation.
 *
 * The host owns Firebase, OTP delivery, WebAuthn, sessions and authorization.
 * Demo is deliberately a separate adapter: this component never sends a
 * browser header that can switch a shared GW or DataConv deployment to memory.
 */
export function ProfessionalAccessPanel({
  mode,
  copy,
  email,
  emailCode,
  emailCodeRequested = false,
  busy = false,
  elapsedSeconds = 0,
  error,
  googleEnabled = true,
  actionsEnabled = true,
  onEmailChange,
  onEmailCodeChange,
  onGoogle,
  onRequestEmailCode,
  onVerifyEmailCode,
  onChangeEmail,
  onPasskey,
  onDemo,
}: ProfessionalAccessPanelProps) {
  const progress = busy ? <p className="uhcp-auth-progress" role="status">
    <span aria-hidden="true" /> {copy.busy} {elapsedSeconds} s
  </p> : null

  return <section className="uhcp-professional-access" aria-busy={busy || undefined}>
    <p className="uhcp-eyebrow">{copy.eyebrow}</p>
    <h1>{copy.title}</h1>
    <p>{copy.description}</p>
    {mode === 'trusted' ? <>
      <button type="button" onClick={onGoogle} disabled={!actionsEnabled || !googleEnabled || busy || !onGoogle}>{copy.google}</button>
      <div className="uhcp-auth-separator"><span>{copy.separator}</span></div>
      {!emailCodeRequested ? <form onSubmit={onRequestEmailCode}>
        <label>{copy.email}<input type="email" autoComplete="username webauthn" value={email} onChange={event => onEmailChange(event.target.value)} required disabled={busy}/></label>
        <button type="submit" disabled={!actionsEnabled || busy || !onRequestEmailCode}>{copy.sendEmailCode}</button>
        {onPasskey ? <><p className="uhcp-muted">{copy.passkeyHint}</p>
        <button type="button" className="uhcp-secondary" disabled={!actionsEnabled || busy} onClick={onPasskey}>{copy.passkey}</button></> : null}
      </form> : <form onSubmit={onVerifyEmailCode}>
        <p className="uhcp-muted">{copy.emailCodeSent.replace('{email}', email)}</p>
        <label>{copy.emailCode}<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={emailCode} onChange={event => onEmailCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))} required disabled={busy}/></label>
        <button type="submit" disabled={!actionsEnabled || busy || emailCode.length !== 6 || !onVerifyEmailCode}>{copy.verifyEmailCode}</button>
        <button type="button" className="uhcp-secondary" disabled={busy || !onChangeEmail} onClick={onChangeEmail}>{copy.changeEmail}</button>
      </form>}
    </> : <form onSubmit={onDemo}>
      <label>{copy.demoEmail}<input type="email" autoComplete="off" value={email} onChange={event => onEmailChange(event.target.value)} required disabled={busy}/></label>
      <label>{copy.demoCode}<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={emailCode} onChange={event => onEmailCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))} required disabled={busy}/></label>
      <p className="uhcp-muted">{copy.demoHint}</p>
      <button type="submit" disabled={!actionsEnabled || busy || emailCode.length !== 6 || !onDemo}>{copy.demoSubmit}</button>
    </form>}
    {progress}
    {error ? <p className="uhcp-error" role="alert">{error}</p> : null}
  </section>
}
