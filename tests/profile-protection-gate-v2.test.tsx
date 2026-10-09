// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
/**
 * Professional profile protection V2 contract:
 * 1. The host supplies the exact already-authorized profile target.
 * 2. The gate identifies that target before offering passkey or PIN unlock.
 * 3. Changing presentation metadata never grants authority or selects another profile.
 *
 * Authorization invariant: only the host callback can unlock the selected profile.
 * Persistence invariant: the shared component stores no profile or credential material.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProfileProtectionGateV2 } from '../src/ProfileProtectionGateV2.js'

describe('ProfileProtectionGateV2', () => {
  it('identifies the exact professional target before unlock without exposing technical ids', () => {
    const html = renderToStaticMarkup(<ProfileProtectionGateV2
      state="locked"
      target={{
        eyebrow: 'Profile to unlock',
        title: 'Veterinarian',
        subtitle: 'Example Veterinary Organization',
        badges: ['Animal care', 'British Columbia, Canada'],
        details: [{ label: 'Legal identifier', value: 'BN · 704457076' }],
      }}
      copy={{
        checkingTitle: 'Checking profile', checkingBody: 'Please wait.',
        setupTitle: 'Protect profile', setupBody: 'Create protection.',
        unavailableTitle: 'Profile unavailable', unavailableBody: 'Try again.',
        unlockTitle: 'Unlock profile', unlockBody: 'Confirm your identity.',
        pinLabel: 'PIN', pinRequired: 'Enter the PIN.', invalidPin: 'Invalid PIN.',
        temporarilyLocked: 'Temporarily locked.', unlockUnavailable: 'Unlock unavailable.',
        unlock: 'Unlock Veterinarian profile', retry: 'Retry',
        unlockWithPasskey: 'Use existing passkey', usePinInstead: 'Use PIN instead',
      }}
      onUnlock={() => 'unlocked'}
      onPasskeyUnlock={() => undefined}
    ><p>Protected workspace</p></ProfileProtectionGateV2>)

    expect(html).toContain('Profile to unlock')
    expect(html).toContain('Veterinarian')
    expect(html).toContain('Example Veterinary Organization')
    expect(html).toContain('Animal care')
    expect(html).toContain('British Columbia, Canada')
    expect(html).toContain('Legal identifier')
    expect(html).toContain('BN · 704457076')
    expect(html).toContain('Use existing passkey')
    expect(html).toContain('Use PIN instead')
    expect(html).not.toMatch(/profileId|did:web|wallet/i)
    expect(html).not.toContain('Protected workspace')
  })
})
