// Flow contract: a shared professional subject workspace renders only server-authorized areas; search counts never imply read access and browser-selected tabs never grant authority.
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SelectedSubjectWorkspace } from '../src/SelectedSubjectWorkspace.js'

const copy = { card: 'Card', summary: 'Summary', identity: 'Identity', health: 'Health', insurance: 'Insurance', appointmentsTasks: 'Appointments and tasks', communications: 'Communications', contactsPermissions: 'Contacts and permissions', records: 'records' }

describe('SelectedSubjectWorkspace', () => {
  afterEach(cleanup)

  it('renders read content only for an explicitly authorized area', () => {
    render(<SelectedSubjectWorkspace subject={{ id: 'subject-1', display: 'Luna' }} capabilities={[{ area: 'health', actions: ['read'] }]} copy={copy} content={{ health: <p>Authorized health</p> }} />)
    expect(screen.queryByRole('tab', { name: 'Communications' })).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Health' }))
    expect(screen.getByText('Authorized health')).toBeTruthy()
  })

  it('shows a search count without exposing unread communication content', () => {
    render(<SelectedSubjectWorkspace subject={{ id: 'subject-1', display: 'Luna' }} capabilities={[{ area: 'communications', actions: ['search'], recordCount: 4 }]} copy={copy} content={{ communications: <p>Private content</p> }} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Communications, 4 records' }))
    expect(screen.queryByText('Private content')).toBeNull()
  })
})
