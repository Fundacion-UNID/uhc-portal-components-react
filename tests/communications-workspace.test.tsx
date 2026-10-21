// Flow contract: one reusable personal workspace keeps service conversations in Channels and public information in topic-scoped Info and alerts without activating future device or medication flows.
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CommunicationsWorkspace } from '../src/CommunicationsWorkspace.js'

describe('CommunicationsWorkspace', () => {
  afterEach(cleanup)

  it('separates channels from alert topics and preserves disabled future topics', () => {
    render(<CommunicationsWorkspace
      copy={{ channels: 'Channels', infoAndAlerts: 'Info & alerts', communicationsLabel: 'Communications' }}
      channels={<p>Clinic conversation</p>}
      alertTopics={[
        { id: 'blood', label: 'Blood donation', content: <p>Blood alert</p> },
        { id: 'devices', label: 'Implanted devices · Coming soon', disabled: true },
        { id: 'medication', label: 'Medication safety · Coming soon', disabled: true },
      ]}
    />)

    expect(screen.getByRole('tab', { name: 'Channels' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Clinic conversation')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Info & alerts' }))
    expect(screen.getByRole('tab', { name: 'Blood donation' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Blood alert')).toBeTruthy()
    expect((screen.getByRole('tab', { name: 'Implanted devices · Coming soon' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('tab', { name: 'Medication safety · Coming soon' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
