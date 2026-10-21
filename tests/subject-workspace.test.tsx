// Flow contract: Personal portals share one five-screen subject workspace; product profiles may add screens but browser navigation never grants authority.
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PERSONAL_SUBJECT_WORKSPACE_AREAS,
  SubjectWorkspace,
  type SubjectWorkspaceArea,
} from '../src/SubjectWorkspace.js'

afterEach(cleanup)

const labels = Object.freeze({
  profile: 'Profile',
  health: 'Health',
  care: 'Care',
  communications: 'Communications',
  access: 'Contacts and permissions',
})

describe('SubjectWorkspace', () => {
  it('renders the same five primary Personal screens in their canonical order', () => {
    render(<SubjectWorkspace
      ariaLabel="Subject workspace"
      areas={PERSONAL_SUBJECT_WORKSPACE_AREAS.map((id) => ({ id, label: labels[id], content: <p>{`${labels[id]} content`}</p> }))}
    />)

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Profile', 'Health', 'Care', 'Communications', 'Contacts and permissions',
    ])
    expect(screen.getByText('Profile content')).toBeTruthy()
  })

  it('supports controlled navigation without deriving access from a selected tab', () => {
    const onAreaChange = vi.fn()
    const areas: readonly SubjectWorkspaceArea[] = [
      { id: 'profile', label: 'Profile', content: <p>Profile content</p> },
      { id: 'health', label: 'Health', content: <p>Authorized health content</p> },
    ]
    const { rerender } = render(<SubjectWorkspace ariaLabel="Subject workspace" areas={areas} activeArea="profile" onAreaChange={onAreaChange}/>)

    fireEvent.click(screen.getByRole('tab', { name: 'Health' }))
    expect(onAreaChange).toHaveBeenCalledWith('health')
    expect(screen.queryByText('Authorized health content')).toBeNull()

    rerender(<SubjectWorkspace ariaLabel="Subject workspace" areas={areas} activeArea="health" onAreaChange={onAreaChange}/>)
    expect(screen.getByText('Authorized health content')).toBeTruthy()
  })

  it('allows a governed product profile to append a capability-specific screen', () => {
    render(<SubjectWorkspace ariaLabel="Animal workspace" areas={[
      ...PERSONAL_SUBJECT_WORKSPACE_AREAS.map((id) => ({ id, label: labels[id], content: null })),
      { id: 'mobility', label: 'Devices and mobility', content: <p>Mobility content</p> },
    ]}/>)

    expect(screen.getByRole('tab', { name: 'Devices and mobility' })).toBeTruthy()
  })

  it('moves through the shared screens with accessible tab keys', () => {
    render(<SubjectWorkspace ariaLabel="Subject workspace" areas={PERSONAL_SUBJECT_WORKSPACE_AREAS.map((id) => ({ id, label: labels[id], content: <p>{`${labels[id]} content`}</p> }))}/>)
    const profile = screen.getByRole('tab', { name: 'Profile' })
    profile.focus()
    fireEvent.keyDown(profile, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Health' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Health content')).toBeTruthy()
  })
})
