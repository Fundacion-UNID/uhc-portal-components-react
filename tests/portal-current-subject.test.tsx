// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PortalCurrentSubjectControl,
  PortalCurrentSubjectProvider,
  PortalCurrentSubjectSlot,
  usePortalCurrentSubjectRegistration,
} from '../src/PortalCurrentSubject.js'

afterEach(cleanup)

describe('PortalCurrentSubjectControl', () => {
  it('keeps the current subject separate from account settings and exposes only subject switching', () => {
    const onChange = vi.fn()
    const { container } = render(<PortalCurrentSubjectControl
      subject={{ id: 'animal-one', displayName: 'Pluto', photoUrl: '/pluto.jpg', secondaryLabel: 'Dog' }}
      labels={{ current: 'Current subject', change: 'Change subject' }}
      canChange
      onChange={onChange}
    />)

    const trigger = screen.getByRole('button', { name: 'Current subject: Pluto' })
    expect(trigger.textContent).toContain('Pluto')
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/pluto.jpg')

    fireEvent.click(trigger)
    expect(screen.getByText('Current subject')).toBeTruthy()
    expect(screen.queryByText(/create/i)).toBeNull()
    expect(screen.queryByText(/invitation/i)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Change subject' }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(screen.queryByText('Current subject')).toBeNull()
  })

  it('shows the active subject without inventing a change action when there is only one', () => {
    render(<PortalCurrentSubjectControl
      subject={{ id: 'animal-one', displayName: 'Pluto' }}
      labels={{ current: 'Current subject', change: 'Change subject' }}
      canChange={false}
    />)

    fireEvent.click(screen.getByRole('button', { name: 'Current subject: Pluto' }))
    expect(screen.queryByRole('button', { name: 'Change subject' })).toBeNull()
  })

  it('lets a nested subject workspace populate the persistent shared header', () => {
    function Workspace() {
      usePortalCurrentSubjectRegistration({
        subject: { id: 'animal-one', displayName: 'Pluto' },
        labels: { current: 'Current subject', change: 'Change subject' },
        canChange: false,
      })
      return null
    }
    render(<PortalCurrentSubjectProvider><PortalCurrentSubjectSlot/><Workspace/></PortalCurrentSubjectProvider>)
    expect(screen.getByRole('button', { name: 'Current subject: Pluto' })).toBeTruthy()
  })
})
