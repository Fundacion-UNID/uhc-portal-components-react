'use client'

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type {
  ProfileProtectionCopy,
  ProfileProtectionState,
  ProfileUnlockResult,
} from './contracts.js'

export type ProfileProtectionGateProps = Readonly<{
  state: ProfileProtectionState
  copy: ProfileProtectionCopy
  onUnlock?: (pin: string) => ProfileUnlockResult | Promise<ProfileUnlockResult>
  onRetry?: () => void
  children: ReactNode
}>

/**
 * Fail-closed protected-profile gate shared by portal products.
 *
 * The host owns ProfileRuntime and supplies authoritative state/callbacks.
 * Children are never rendered while protection is unresolved or locked.
 */
export function ProfileProtectionGate({
  state,
  copy,
  onUnlock,
  onRetry,
  children,
}: ProfileProtectionGateProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPin('')
    setError('')
    if (state === 'locked') input.current?.focus()
  }, [state])

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
        return
      }
      setError(result === 'invalid-pin'
        ? copy.invalidPin
        : result === 'temporarily-locked'
          ? copy.temporarilyLocked
          : copy.unlockUnavailable)
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
    <section className="uhcp-profile-gate" aria-live="polite">
      <span className="uhcp-lock" aria-hidden="true">⌾</span>
      <h1>{title}</h1>
      <p>{body}</p>
      {state === 'locked' && (
        <form onSubmit={unlock}>
          <label>{copy.pinLabel}
            <input
              ref={input}
              type="password"
              minLength={6}
              autoComplete="current-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
            />
          </label>
          {error && <p role="alert" className="uhcp-error">{error}</p>}
          <button type="submit" disabled={busy}>{copy.unlock}</button>
        </form>
      )}
      {state === 'unavailable' && onRetry && <button type="button" onClick={onRetry}>{copy.retry}</button>}
    </section>
  )
}
