// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EmergencyContactDirectory, type EmergencyContactRecord } from '../src/EmergencyContactDirectory.js'

const CONTACT_TEST_DATA = Object.freeze({
  subjectReference: 'Patient/demo-person',
  contact: Object.freeze({
    id: 'related-person-demo',
    name: 'Morgan Doe',
    relationship: 'Sibling',
    phone: '+1 555 010 1000',
    email: 'morgan.doe@example.test',
  }) satisfies EmergencyContactRecord,
})

const COPY = Object.freeze({
  title: 'Emergency contacts', empty: 'No emergency contacts', add: 'Add contact', edit: 'Edit', remove: 'Delete', save: 'Save', cancel: 'Cancel', name: 'Name', relationship: 'Relationship', phone: 'Phone', email: 'Email', call: 'Call', message: 'Email',
})

afterEach(cleanup)

describe('EmergencyContactDirectory', () => {
  it('renders relationship and private contact channels as actionable links', () => {
    render(<EmergencyContactDirectory contacts={[CONTACT_TEST_DATA.contact]} copy={COPY}/>)

    expect(screen.getByRole('heading', { name: COPY.title })).toBeTruthy()
    expect(screen.getByText(CONTACT_TEST_DATA.contact.relationship)).toBeTruthy()
    expect(screen.getByRole('link', { name: COPY.call }).getAttribute('href')).toBe(`tel:${CONTACT_TEST_DATA.contact.phone}`)
    expect(screen.getByRole('link', { name: COPY.message }).getAttribute('href')).toBe(`mailto:${CONTACT_TEST_DATA.contact.email}`)
  })

  it('submits provider-owned create, update and delete actions without optimistic mutation', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(<EmergencyContactDirectory contacts={[CONTACT_TEST_DATA.contact]} copy={COPY} editable onSave={onSave} onDelete={onDelete}/>)

    fireEvent.click(screen.getByRole('button', { name: COPY.add }))
    fireEvent.change(screen.getByLabelText(COPY.name), { target: { value: CONTACT_TEST_DATA.contact.name } })
    fireEvent.change(screen.getByLabelText(COPY.relationship), { target: { value: CONTACT_TEST_DATA.contact.relationship } })
    fireEvent.change(screen.getByLabelText(COPY.phone), { target: { value: CONTACT_TEST_DATA.contact.phone } })
    fireEvent.click(screen.getByRole('button', { name: COPY.save }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: CONTACT_TEST_DATA.contact.name }))
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('id')
    await waitFor(() => expect(screen.queryByRole('button', { name: COPY.save })).toBeNull())

    fireEvent.click(screen.getByRole('button', { name: `${COPY.edit} ${CONTACT_TEST_DATA.contact.name}` }))
    fireEvent.click(screen.getByRole('button', { name: COPY.save }))
    expect(onSave).toHaveBeenLastCalledWith(CONTACT_TEST_DATA.contact)

    fireEvent.click(screen.getByRole('button', { name: `${COPY.remove} ${CONTACT_TEST_DATA.contact.name}` }))
    expect(onDelete).toHaveBeenCalledWith(CONTACT_TEST_DATA.contact.id)
  })
})
