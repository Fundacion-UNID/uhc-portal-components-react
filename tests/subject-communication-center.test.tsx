// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SubjectCommunicationCenter, SubjectCommunicationComposerPanel } from '../src/SubjectCommunicationCenter.js'

const items = [
  { id: 'message-1', kind: 'message' as const, category: 'care' as const, title: 'Clinic message', summary: 'New private message', direction: 'incoming' as const, senderLabel: 'Emergency team', avatarUrl: '/team.png' },
  { id: 'call-1', kind: 'video-call' as const, category: 'emergency' as const, title: 'Emergency video call', summary: 'Local responder' },
]

afterEach(cleanup)

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

  it('renders a channel bubble and submits a composed FHIR Communication message', () => {
    const sent: string[] = []
    const attached: string[] = []
    render(<SubjectCommunicationCenter
      subjectLabel="Pluto"
      items={items}
      composer={{
        placeholder: 'Write a message',
        sendLabel: 'Send',
        attachLabel: 'Attach Bundle',
        onSend: text => sent.push(text),
        onAttach: () => attached.push('bundle'),
      }}
    />)

    const message = screen.getByText('Clinic message').closest('li')
    expect(message?.getAttribute('data-direction')).toBe('incoming')
    expect(screen.getByText('Emergency team')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Emergency team' }).getAttribute('src')).toBe('/team.png')

    fireEvent.change(screen.getByRole('textbox', { name: 'Write a message' }), { target: { value: 'Pluto is home.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    fireEvent.click(screen.getByRole('button', { name: 'Attach Bundle' }))
    expect(sent).toEqual(['Pluto is home.'])
    expect(attached).toEqual(['bundle'])
  })

  it('reuses the standalone composer inside emergency and ordinary communication screens', () => {
    const sent: string[] = []
    render(<SubjectCommunicationComposerPanel composer={{
      placeholder: 'Emergency message', sendLabel: 'Send emergency message', onSend: text => sent.push(text),
    }} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Emergency message' }), { target: { value: 'We are on the way.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send emergency message' }))
    expect(sent).toEqual(['We are on the way.'])
    expect((screen.getByRole('textbox', { name: 'Emergency message' }) as HTMLTextAreaElement).value).toBe('')
  })

  it('binds each reusable composer label to a unique textarea', () => {
    render(<>
      <SubjectCommunicationComposerPanel composer={{ placeholder: 'First contact', sendLabel: 'Send', onSend: () => undefined }} />
      <SubjectCommunicationComposerPanel composer={{ placeholder: 'Second contact', sendLabel: 'Send', onSend: () => undefined }} />
    </>)

    const first = screen.getByRole('textbox', { name: 'First contact' })
    const second = screen.getByRole('textbox', { name: 'Second contact' })
    expect(first.id).toBeTruthy()
    expect(second.id).toBeTruthy()
    expect(first.id).not.toBe(second.id)
  })
})
