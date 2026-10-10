// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
/**
 * Professional profile protection V2 contract:
 * 1. The host supplies the exact already-authorized profile target.
 * 2. The gate leads with the unlock task, identifies the target without a redundant eyebrow, then offers passkey or PIN unlock.
 * 3. Changing presentation metadata never grants authority or selects another profile.
 *
 * Authorization invariant: only the host callback can unlock the selected profile.
 * Persistence invariant: the shared component stores no profile or credential material.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
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

    expect(html).not.toContain('Profile to unlock')
    expect(html).toContain('Veterinarian')
    expect(html).toContain('Example Veterinary Organization')
    expect(html).toContain('Animal care')
    expect(html).toContain('British Columbia, Canada')
    expect(html).toContain('Legal identifier')
    expect(html).toContain('BN · 704457076')
    expect(html).toContain('Use existing passkey')
    expect(html).toContain('Use PIN instead')
    expect(html.indexOf('Unlock profile')).toBeLessThan(html.indexOf('Veterinarian'))
    expect(html.indexOf('Animal care')).toBeLessThan(html.indexOf('Use existing passkey'))
    expect(html).toContain('class="uhcp-profile-target-content"')
    expect(html).toContain('class="uhcp-profile-target-badges uhcp-profile-target-badges-centered"')
    expect(html).toContain('class="uhcp-action-unlock"')
    expect(html).not.toMatch(/profileId|did:web|wallet/i)
    expect(html).not.toContain('Protected workspace')
  })

  it('keeps PIN recovery inside the PIN fallback and reveals it only after a rejected PIN', async () => {
    const recover = vi.fn()
    render(<ProfileProtectionGateV2
      state="locked"
      target={{ eyebrow: 'Profile to unlock', title: 'Veterinarian', subtitle: 'Clinic-Z (CA-BC 7654321)', badges: ['Animal research'] }}
      copy={{
        checkingTitle: 'Checking profile', checkingBody: 'Please wait.',
        setupTitle: 'Protect profile', setupBody: 'Create protection.',
        unavailableTitle: 'Profile unavailable', unavailableBody: 'Try again.',
        unlockTitle: 'Unlock profile', unlockBody: 'Confirm your identity.',
        pinLabel: 'PIN', pinRequired: 'Enter the PIN.', invalidPin: 'Invalid PIN.',
        temporarilyLocked: 'Temporarily locked.', unlockUnavailable: 'Unlock unavailable.',
        unlock: 'Unlock profile', retry: 'Retry', unlockWithPasskey: 'Use existing passkey', usePinInstead: 'Use PIN instead',
      }}
      onUnlock={() => 'invalid-pin'}
      onPasskeyUnlock={() => undefined}
      pinFailureActions={<button type="button" onClick={recover}>Reset PIN</button>}
    ><p>Protected workspace</p></ProfileProtectionGateV2>)

    expect(screen.getByText('Clinic-Z (CA-BC 7654321)')).toBeTruthy()
    expect(screen.getByText('Animal research')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reset PIN' })).toBeNull()
    fireEvent.click(screen.getByText('Use PIN instead'))
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '111111' } })
    fireEvent.click(screen.getByRole('button', { name: 'Unlock profile' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Invalid PIN.'))
    expect(screen.getByRole('button', { name: 'Reset PIN' })).toBeTruthy()
  })
})
