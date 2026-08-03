// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OrganizationWorkforceAdministration, type OrganizationWorkforceAdministrationProps } from '../src/OrganizationWorkforceAdministration.js'

const copy: OrganizationWorkforceAdministrationProps['copy'] = {
  title: 'Licenses and employees', description: 'Manage capacity and invitations.', totalLicenses: 'Total', usedLicenses: 'Used', freeLicenses: 'Free', employeesTitle: 'Employees using licenses', invitationsTitle: 'Invitations', inviteTitle: 'Invite a professional', emailLabel: 'Email', roleLabel: 'Role', unlockSecretLabel: 'Controller PIN', invite: 'Send invitation', inviting: 'Sending…', noFreeLicenses: 'No free licenses.', noEmployees: 'No employees.', noInvitations: 'No invitations.', licenseColumn: 'License', employeeColumn: 'Employee', roleColumn: 'Role', statusColumn: 'Status', devicesColumn: 'Devices', actionsColumn: 'Actions', active: 'Active', inactive: 'Inactive', pending: 'Pending', accepted: 'Accepted', cancelled: 'Cancelled', disable: 'Disable', purge: 'Delete and free', devicesLater: 'Coming later',
}

afterEach(cleanup)

function props(overrides: Partial<OrganizationWorkforceAdministrationProps> = {}): OrganizationWorkforceAdministrationProps {
  return {
    copy,
    summary: { total: 3, used: 2, free: 1 },
    employees: [
      { id: 'active-1', licenseId: 'license-1', email: 'one@example.org', role: 'Doctor', status: 'active' },
      { id: 'inactive-2', licenseId: 'license-2', email: 'two@example.org', role: 'Nurse', status: 'inactive', deviceCount: 2 },
    ],
    invitations: [
      { id: 'invite-1', email: 'pending@example.org', role: 'Doctor', status: 'pending' },
      { id: 'invite-2', email: 'accepted@example.org', role: 'Nurse', status: 'accepted' },
    ],
    roles: [{ value: 'doctor', label: 'Doctor' }], email: '', role: '', unlockSecret: '',
    onEmailChange: vi.fn(), onRoleChange: vi.fn(), onUnlockSecretChange: vi.fn(), onInvite: vi.fn(), onDisable: vi.fn(), onPurge: vi.fn(),
    ...overrides,
  }
}

describe('OrganizationWorkforceAdministration', () => {
  it('renders capacity, employee lifecycle and invitation states from input', () => {
    render(<OrganizationWorkforceAdministration {...props()} />)
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('pending@example.org')).toBeTruthy()
    expect(screen.getByText('Accepted')).toBeTruthy()
    expect(screen.getByText('Coming later')).toBeTruthy()
  })

  it('enables invitation only with free capacity and complete controlled input', async () => {
    const onInvite = vi.fn()
    const { rerender } = render(<OrganizationWorkforceAdministration {...props({ onInvite })} />)
    expect(screen.getByRole('button', { name: 'Send invitation' }).hasAttribute('disabled')).toBe(true)
    rerender(<OrganizationWorkforceAdministration {...props({ email: 'new@example.org', role: 'doctor', unlockSecret: '1234', onInvite })} />)
    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
    expect(onInvite).toHaveBeenCalledOnce()
    rerender(<OrganizationWorkforceAdministration {...props({ summary: { total: 2, used: 2, free: 0 }, email: 'new@example.org', role: 'doctor', unlockSecret: '1234', onInvite })} />)
    expect(screen.getByRole('button', { name: 'Send invitation' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByText('No free licenses.')).toBeTruthy()
  })

  it('only disables active employees and only purges inactive employees', async () => {
    const onDisable = vi.fn()
    const onPurge = vi.fn()
    render(<OrganizationWorkforceAdministration {...props({ onDisable, onPurge })} />)
    const disable = screen.getAllByRole('button', { name: 'Disable' })
    const purge = screen.getAllByRole('button', { name: 'Delete and free' })
    expect(disable[0].hasAttribute('disabled')).toBe(false)
    expect(disable[1].hasAttribute('disabled')).toBe(true)
    expect(purge[0].hasAttribute('disabled')).toBe(true)
    expect(purge[1].hasAttribute('disabled')).toBe(false)
    await userEvent.click(disable[0])
    await userEvent.click(purge[1])
    expect(onDisable).toHaveBeenCalledWith('active-1')
    expect(onPurge).toHaveBeenCalledWith('inactive-2')
  })
})
