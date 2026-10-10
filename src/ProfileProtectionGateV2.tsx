'use client'

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type {
  ProfileProtectionCopyV2,
  ProfileProtectionState,
  ProfileProtectionTargetV2,
  ProfileUnlockResult,
} from './contracts.js'

export type ProfileProtectionGateV2Props = Readonly<{
  state: ProfileProtectionState
  target: ProfileProtectionTargetV2
  copy: ProfileProtectionCopyV2
  onUnlock?: (pin: string) => ProfileUnlockResult | Promise<ProfileUnlockResult>
  onPasskeyUnlock?: () => void | Promise<void>
  onRetry?: () => void
  pinFailureActions?: ReactNode
  secondaryActions?: ReactNode
  children: ReactNode
}>

/**
 * Presentation-only profile gate that identifies the host-authorized target.
 *
 * The host resolves translations, authority and the opaque profile id. This
 * component renders only human-readable metadata and never selects a target.
 */
export function ProfileProtectionGateV2({
  state,
  target,
  copy,
  onUnlock,
  onPasskeyUnlock,
  onRetry,
  pinFailureActions,
  secondaryActions,
  children,
}: ProfileProtectionGateV2Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pinRejected, setPinRejected] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPin('')
    setError('')
    setPinRejected(false)
  }, [state, target.title, target.subtitle])

  async function unlock(event: FormEvent) {
    event.preventDefault()
    if (pin.length < 6) {
      setError(copy.pinRequired)
      return
    }
    if (!onUnlock) {
      setError(copy.unlockUnavailable)
      return
    }
    setBusy(true)
    try {
      const result = await onUnlock(pin)
      if (result === 'unlocked') {
        setPin('')
        setError('')
        setPinRejected(false)
        return
      }
      setPinRejected(result === 'invalid-pin')
      setError(result === 'invalid-pin'
        ? copy.invalidPin
        : result === 'temporarily-locked'
          ? copy.temporarilyLocked
          : copy.unlockUnavailable)
    } finally {
      setBusy(false)
    }
  }

  async function unlockWithPasskey() {
    if (!onPasskeyUnlock) return
    setBusy(true)
    setError('')
    try {
      await onPasskeyUnlock()
    } catch {
      setError(copy.unlockUnavailable)
    } finally {
      setBusy(false)
    }
  }

  if (state === 'not-required') return <>{children}</>

  const title = state === 'checking'
    ? copy.checkingTitle
    : state === 'setup-required'
      ? copy.setupTitle
      : state === 'unavailable'
        ? copy.unavailableTitle
        : copy.unlockTitle
  const body = state === 'checking'
    ? copy.checkingBody
    : state === 'setup-required'
      ? copy.setupBody
      : state === 'unavailable'
        ? copy.unavailableBody
        : copy.unlockBody

  return (
    <section className="uhcp-profile-gate uhcp-profile-gate-v2" aria-live="polite">
      <div className="uhcp-profile-gate-copy">
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      <div className="uhcp-profile-target">
        {target.icon && <img src={target.icon.src} alt={target.icon.alt} width={target.icon.width} height={target.icon.height} />}
        <div className="uhcp-profile-target-content">
          <div className="uhcp-profile-target-copy">
            <strong>{target.title}</strong>
            {target.subtitle && <span>{target.subtitle}</span>}
          </div>
          {target.badges?.length ? <ul className="uhcp-profile-target-badges uhcp-profile-target-badges-centered" aria-label={target.title}>
            {target.badges.map(badge => <li key={badge}>{badge}</li>)}
          </ul> : null}
          {target.details?.length ? <dl className="uhcp-profile-target-details">
            {target.details.map(detail => <div key={`${detail.label}:${detail.value}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}
          </dl> : null}
        </div>
      </div>
      {state === 'locked' && onPasskeyUnlock && <button type="button" className="uhcp-action-unlock" data-portal-action="unlock-profile-with-passkey" disabled={busy} onClick={unlockWithPasskey}>
        {copy.unlockWithPasskey}
      </button>}
      {state === 'locked' && <details className="uhcp-profile-pin-fallback" open={!onPasskeyUnlock}>
        <summary>{onPasskeyUnlock ? copy.usePinInstead : copy.pinLabel}</summary>
        <form onSubmit={unlock}>
          <label>{copy.pinLabel}
            <input
              ref={input}
              type="password"
              inputMode="numeric"
              minLength={6}
              autoComplete="current-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
            />
          </label>
          {error && <p role="alert" className="uhcp-error">{error}</p>}
          <button type="submit" className="uhcp-action-unlock" data-portal-action="unlock-profile" disabled={busy}>{copy.unlock}</button>
        </form>
        {pinRejected && pinFailureActions ? <div className="uhcp-profile-pin-recovery">{pinFailureActions}</div> : null}
      </details>}
      {state === 'unavailable' && onRetry && <button type="button" onClick={onRetry}>{copy.retry}</button>}
      {secondaryActions && <div className="uhcp-profile-gate-secondary">{secondaryActions}</div>}
    </section>
  )
}
