// Flow contract: the deprecated UHC conversation export remains behaviorally compatible while delegating implementation and SOS projection ownership to sos-portal-components-react.
// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SubjectConversationChat } from '../src/SubjectConversationChat.js'

afterEach(cleanup)

describe('SubjectConversationChat compatibility export', () => {
  it('renders SOS entries, delegates FHIR content and sends through the host callback', () => {
    const sent: string[] = []
    render(<SubjectConversationChat
      entries={[
        { id: 'text-1', createdAt: '2026-11-06T10:00:00.000Z', direction: 'incoming', sender: { id: 'PractitionerRole/one', name: 'Clinic' }, content: { kind: 'text', text: 'Vaccination confirmed.' } },
        { id: 'document-1', createdAt: '2026-11-06T10:01:00.000Z', direction: 'incoming', sender: { id: 'PractitionerRole/one', name: 'Clinic' }, content: { kind: 'fhir-document', label: 'Vaccination Bundle', bundle: { resourceType: 'Bundle', type: 'document' } } },
        { id: 'call-1', createdAt: '2026-11-06T10:02:00.000Z', direction: 'incoming', sender: { id: 'PractitionerRole/one', name: 'Clinic' }, content: { kind: 'call', media: 'video', state: 'missed', label: 'Missed video call' } },
      ]}
      currentUser={{ id: 'Patient/self', name: 'Me' }}
      onSendText={text => { sent.push(text) }}
      renderFhirDocument={({ label }) => <div>FHIR renderer: {label}</div>}
      locale="en"
    />)

    expect(screen.getByRole('region', { name: 'Conversation' })).toBeTruthy()
    expect(screen.getByText('Missed video call')).toBeTruthy()
    expect(screen.getByText('FHIR renderer: Vaccination Bundle')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'Reply from compatibility export' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(sent).toEqual(['Reply from compatibility export'])
  })
})
