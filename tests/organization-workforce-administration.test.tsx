// TDD contract: write this test red first; make it green only with the complete real behavior.
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OrganizationWorkforceAdministration, type OrganizationWorkforceAdministrationProps } from '../src/OrganizationWorkforceAdministration.js'

const copy: OrganizationWorkforceAdministrationProps['copy'] = {
  title: 'Licenses and employees', description: 'Manage capacity and invitations.', totalLicenses: 'Total', usedLicenses: 'Used', freeLicenses: 'Free', employeesTitle: 'Employees using licenses', invitationsTitle: 'Invitations', inviteTitle: 'Invite a professional', emailLabel: 'Email', roleLabel: 'Role', unlockSecretLabel: 'Controller PIN', invite: 'Send invitation', inviting: 'Sending…', noFreeLicenses: 'No free licenses.', noEmployees: 'No employees.', noInvitations: 'No invitations.', licenseColumn: 'License', employeeColumn: 'Employee', roleColumn: 'Role', statusColumn: 'Status', devicesColumn: 'Devices', actionsColumn: 'Actions', active: 'Active', inactive: 'Inactive', pending: 'Pending', accepted: 'Accepted', cancelled: 'Cancelled', disable: 'Suspend', reactivate: 'Reactivate', purge: 'Delete permanently', confirmDisable: 'Suspend this employee?', confirmReactivate: 'Reactivate this employee?', confirmPurge: 'Permanently delete this employee and free the license?', devicesLater: 'Coming later',
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
    onEmailChange: vi.fn(), onRoleChange: vi.fn(), onUnlockSecretChange: vi.fn(), onInvite: vi.fn(), onDisable: vi.fn(), onReactivate: vi.fn(), onPurge: vi.fn(),
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

  it('uses semantic lifecycle actions and requires confirmation before every mutation', async () => {
    const onDisable = vi.fn()
    const onReactivate = vi.fn()
    const onPurge = vi.fn()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<OrganizationWorkforceAdministration {...props({ onDisable, onReactivate, onPurge })} />)
    const disable = screen.getByRole('button', { name: 'Suspend' })
    const reactivate = screen.getByRole('button', { name: 'Reactivate' })
    const purge = screen.getByRole('button', { name: 'Delete permanently' })
    expect(disable.classList.contains('uhcp-warning-action')).toBe(true)
    expect(reactivate.classList.contains('uhcp-primary-action')).toBe(true)
    expect(purge.classList.contains('uhcp-danger')).toBe(true)

    await userEvent.click(disable)
    await userEvent.click(reactivate)
    await userEvent.click(purge)
    expect(onDisable).not.toHaveBeenCalled()
    expect(onReactivate).not.toHaveBeenCalled()
    expect(onPurge).not.toHaveBeenCalled()

    confirm.mockReturnValue(true)
    await userEvent.click(disable)
    await userEvent.click(reactivate)
    await userEvent.click(purge)
    expect(onDisable).toHaveBeenCalledWith('active-1')
    expect(onReactivate).toHaveBeenCalledWith('inactive-2')
    expect(onPurge).toHaveBeenCalledWith('inactive-2')
    expect(confirm).toHaveBeenCalledWith('Suspend this employee?')
    expect(confirm).toHaveBeenCalledWith('Reactivate this employee?')
    expect(confirm).toHaveBeenCalledWith('Permanently delete this employee and free the license?')
  })
})
