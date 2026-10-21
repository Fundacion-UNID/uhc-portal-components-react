// Flow contract: neutral portal primitives are tested once in the shared package; consumers test only their adapters and product-specific behavior.
// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CardPreview } from '../src/CardPreview.js'
import { CollapsiblePortalSection } from '../src/CollapsiblePortalSection.js'
import { ElapsedOperationStatus } from '../src/ElapsedOperationStatus.js'
import { ProfileRecoveryPanel } from '../src/ProfileRecoveryPanel.js'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('shared portal primitives', () => {
  it('owns the canonical card preview shell', () => {
    render(<CardPreview><span>Card</span></CardPreview>)
    expect(screen.getByTestId('card-preview').textContent).toBe('Card')
  })

  it('preserves disclosure state while rendering neutral section content', () => {
    render(<CollapsiblePortalSection title="Import" description="Prepare data"><p>Content</p></CollapsiblePortalSection>)
    const details = screen.getByText('Import').closest('details')
    expect(details?.hasAttribute('open')).toBe(true)
    details!.open = false
    fireEvent(details!, new Event('toggle'))
    expect(details?.hasAttribute('open')).toBe(false)
  })

  it('increments elapsed status while a long operation is busy', () => {
    vi.useFakeTimers()
    const view = render(<ElapsedOperationStatus busy status="Unlocking" fallback="Working" />)
    expect(screen.getByRole('status').textContent).toBe('Unlocking (0s)')
    act(() => vi.advanceTimersByTime(2100))
    expect(screen.getByRole('status').textContent).toBe('Unlocking (2s)')
    view.rerender(<ElapsedOperationStatus busy={false} status="" fallback="Working" />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('validates and submits profile recovery without receiving wallet keys', async () => {
    const onRecover = vi.fn().mockResolvedValue('replacement-code')
    render(<ProfileRecoveryPanel
      profileId="profile-1"
      messages={{
        open: 'Recover', title: 'Recover profile', explanation: 'Use the recovery code', recoveryCode: 'Recovery code',
        recoveryCodeHelp: 'Stored offline', newPin: 'New PIN', confirmPin: 'Confirm PIN', submit: 'Recover', cancel: 'Cancel',
        mismatch: 'PIN mismatch', completed: 'Recovered', replacementCode: 'Replacement code', replacementCodeHelp: 'Store offline',
        notificationQueued: 'Notification queued',
      }}
      onRecover={onRecover}
      onClose={vi.fn()}
    />)
    fireEvent.change(screen.getByLabelText('Recovery code'), { target: { value: 'original-code' } })
    fireEvent.change(screen.getByLabelText('New PIN'), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText('Confirm PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Recover' }))
    await waitFor(() => expect(onRecover).toHaveBeenCalledWith({ profileId: 'profile-1', recoveryCode: 'original-code', newPin: '123456' }))
    expect(await screen.findByDisplayValue('replacement-code')).toBeTruthy()
  })
})
