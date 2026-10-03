// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HealthcareActorRoles, HealthcareBasicSections, HealthcareConsentPurposes } from 'gdc-common-utils-ts/constants/healthcare'
import { ConsentDecisions, ConsentStatuses } from 'gdc-common-utils-ts/models/consent-rule'
import { SOS_DEMO_IDENTITIES } from 'sos-data-utils-ts/demo-identities'
import {
  ConsentPermissionDirectory,
  type ConsentPermissionDirectoryCopy,
  type ConsentPermissionRecord,
} from '../src/ConsentPermissionDirectory.js'

const contact = SOS_DEMO_IDENTITIES.emergencyContacts[0]
const purpose = HealthcareConsentPurposes.EmergencyTreatment
const role = HealthcareActorRoles.Physician
const target = HealthcareBasicSections.PatientSummaryDocument.claim
const record = Object.freeze({
  id: 'consent-demo-emergency',
  contactReference: contact.identifier,
  contactName: contact.displayName,
  decision: ConsentDecisions.Permit,
  status: ConsentStatuses.Active,
  purposes: Object.freeze([purpose]),
  roles: Object.freeze([role]),
  targets: Object.freeze([target]),
}) satisfies ConsentPermissionRecord
const copy = Object.freeze({
  title: 'Permissions', empty: 'No permissions', add: 'Add permission', edit: 'Edit', remove: 'Delete', suspend: 'Suspend', activate: 'Activate', save: 'Save', cancel: 'Cancel', contact: 'Authorized contact', decision: 'Decision', permit: 'Allow', deny: 'Deny', status: 'Status', active: 'Active', inactive: 'Suspended', purposes: 'Purpose', roles: 'Roles', targets: 'Information', saving: 'Saving…', loadError: 'Permissions unavailable', required: 'Complete the required fields',
}) satisfies ConsentPermissionDirectoryCopy

afterEach(cleanup)

describe('ConsentPermissionDirectory', () => {
  it('creates one schema-backed permission draft and waits for provider readback', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ConsentPermissionDirectory
      records={[]}
      contacts={[{ id: contact.identifier, name: contact.displayName }]}
      purposeOptions={[{ value: purpose, label: 'Emergency treatment' }]}
      roleOptions={[{ value: role, label: 'Doctor' }]}
      targetOptions={[{ value: target, label: 'Emergency health summary' }]}
      copy={copy}
      editable
      onSave={onSave}
    />)

    fireEvent.click(screen.getByRole('button', { name: copy.add }))
    fireEvent.change(screen.getByLabelText(copy.contact), { target: { value: contact.identifier } })
    fireEvent.click(screen.getByLabelText('Emergency treatment'))
    fireEvent.click(screen.getByLabelText('Doctor'))
    fireEvent.click(screen.getByLabelText('Emergency health summary'))
    fireEvent.click(screen.getByRole('button', { name: copy.save }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      contactReference: contact.identifier,
      decision: ConsentDecisions.Permit,
      status: ConsentStatuses.Active,
      purposes: [purpose],
      roles: [role],
      targets: [target],
    }))
    await waitFor(() => expect(screen.queryByRole('button', { name: copy.save })).toBeNull())
  })

  it('edits, suspends, reactivates and deletes only through host callbacks', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onStatusChange = vi.fn().mockResolvedValue(undefined)
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(<ConsentPermissionDirectory
      records={[record]}
      contacts={[{ id: contact.identifier, name: contact.displayName }]}
      purposeOptions={[{ value: purpose, label: 'Emergency treatment' }]}
      roleOptions={[{ value: role, label: 'Doctor' }]}
      targetOptions={[{ value: target, label: 'Emergency health summary' }]}
      copy={copy}
      editable
      onSave={onSave}
      onStatusChange={onStatusChange}
      onDelete={onDelete}
    />)

    fireEvent.click(screen.getByRole('button', { name: `${copy.edit} ${contact.displayName}` }))
    fireEvent.click(screen.getByRole('button', { name: copy.save }))
    expect(onSave).toHaveBeenCalledWith(record)
    await waitFor(() => expect(screen.queryByRole('button', { name: copy.save })).toBeNull())

    fireEvent.click(screen.getByRole('button', { name: `${copy.suspend} ${contact.displayName}` }))
    expect(onStatusChange).toHaveBeenCalledWith(record.id, ConsentStatuses.Inactive)
    fireEvent.click(screen.getByRole('button', { name: `${copy.remove} ${contact.displayName}` }))
    expect(onDelete).toHaveBeenCalledWith(record.id)
  })
})
