// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SubjectCommunicationCenter } from '../src/SubjectCommunicationCenter.js'

const items = [
  { id: 'message-1', kind: 'message' as const, category: 'care' as const, title: 'Clinic message', summary: 'New private message' },
  { id: 'call-1', kind: 'video-call' as const, category: 'emergency' as const, title: 'Emergency video call', summary: 'Local responder' },
]

describe('subject communication center', () => {
  it('keeps one subject-scoped timeline and filters emergency calls without hiding private messages', () => {
    render(<SubjectCommunicationCenter subjectLabel="Pluto" items={items} />)

    expect(screen.getByRole('heading', { name: 'Communications for Pluto' })).toBeTruthy()
    expect(screen.getByText('Clinic message')).toBeTruthy()
    expect(screen.getByText('Emergency video call')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Emergency' }))
    expect(screen.queryByText('Clinic message')).toBeNull()
    expect(screen.getByText('Emergency video call')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Messages' }))
    expect(screen.getByText('Clinic message')).toBeTruthy()
    expect(screen.queryByText('Emergency video call')).toBeNull()
  })
})
