// Flow contract: Personal portals expose one section index; selecting a section changes presentation only and never grants access.
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SubjectSectionIndex } from '../src/SubjectSectionIndex.js'

afterEach(cleanup)

describe('SubjectSectionIndex', () => {
  it('renders one concise Sections navigation and keeps its selected destination marked', () => {
    const onSectionChange = vi.fn()
    render(<SubjectSectionIndex
      ariaLabel="Subject sections"
      title="Sections"
      activeSection="health"
      onSectionChange={onSectionChange}
      sections={[
        { id: 'card', label: 'Card' },
        { id: 'identity', label: 'Identity' },
        { id: 'health', label: 'Health' },
        { id: 'care', label: 'Appointments & tasks' },
        { id: 'emergency', label: 'Emergencies' },
      ]}
    />)

    expect(screen.getByRole('heading', { name: 'Sections' })).toBeTruthy()
    expect(screen.queryByText('Open the subject index')).toBeNull()
    expect(screen.queryByText(/Turquoise means/)).toBeNull()
    expect(screen.getByRole('tab', { name: 'Health' }).getAttribute('aria-selected')).toBe('true')

    fireEvent.click(screen.getByRole('tab', { name: 'Appointments & tasks' }))
    expect(onSectionChange).toHaveBeenCalledWith('care')
  })

  it('omits disabled profile-specific destinations', () => {
    render(<SubjectSectionIndex
      ariaLabel="Subject sections"
      title="Sections"
      activeSection="card"
      onSectionChange={() => undefined}
      sections={[
        { id: 'card', label: 'Card' },
        { id: 'insurance', label: 'Insurance', disabled: true },
      ]}
    />)

    expect(screen.getByRole('tab', { name: 'Card' })).toBeTruthy()
    expect(screen.queryByRole('tab', { name: 'Insurance' })).toBeNull()
  })

  it('moves through the single index with accessible tab keys', () => {
    const onSectionChange = vi.fn()
    render(<SubjectSectionIndex
      ariaLabel="Subject sections"
      title="Sections"
      activeSection="card"
      onSectionChange={onSectionChange}
      sections={[
        { id: 'card', label: 'Card' },
        { id: 'health', label: 'Health' },
      ]}
    />)

    const card = screen.getByRole('tab', { name: 'Card' })
    card.focus()
    fireEvent.keyDown(card, { key: 'ArrowRight' })
    expect(onSectionChange).toHaveBeenCalledWith('health')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Health' }))
  })
})
