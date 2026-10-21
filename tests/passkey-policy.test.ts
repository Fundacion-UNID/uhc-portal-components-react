// Flow contract: every portal shares one positive-capability check and must finish required passkey enrollment before opening a wallet session.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isUserVerifyingPlatformPasskeyAvailable, openWalletAfterRequiredPasskey } from '../src/passkey-policy.js'

afterEach(() => vi.unstubAllGlobals())

describe('shared platform passkey policy', () => {
  it('requires a positive user-verifying platform-authenticator result', async () => {
    vi.stubGlobal('PublicKeyCredential', { isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true) })
    await expect(isUserVerifyingPlatformPasskeyAvailable()).resolves.toBe(true)
    vi.stubGlobal('PublicKeyCredential', { isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockRejectedValue(new Error('blocked')) })
    await expect(isUserVerifyingPlatformPasskeyAvailable()).resolves.toBe(false)
  })

  it('enrolls before opening and never opens when required enrollment fails', async () => {
    const order: string[] = []
    await expect(openWalletAfterRequiredPasskey({
      passkeyRequired: true,
      enroll: vi.fn(async () => { order.push('enroll') }),
      open: vi.fn(async () => { order.push('open'); return 'session' }),
    })).resolves.toBe('session')
    expect(order).toEqual(['enroll', 'open'])
    const open = vi.fn()
    await expect(openWalletAfterRequiredPasskey({
      passkeyRequired: true,
      enroll: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
      open,
    })).rejects.toThrow('NotAllowedError')
    expect(open).not.toHaveBeenCalled()
  })
})
