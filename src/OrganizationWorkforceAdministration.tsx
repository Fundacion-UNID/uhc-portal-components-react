import type { FormEvent } from 'react'

export type WorkforceLicenseSummary = Readonly<{
  total: number
  used: number
  free: number
}>

export type WorkforceEmployee = Readonly<{
  id: string
  licenseId: string
  email: string
  role: string
  status: 'active' | 'inactive'
  deviceCount?: number
}>

export type WorkforceInvitation = Readonly<{
  id: string
  email: string
  role: string
  status: 'pending' | 'accepted' | 'cancelled'
  sentAt?: string
}>

export type WorkforceRoleOption = Readonly<{ value: string; label: string }>

export type OrganizationWorkforceCopy = Readonly<{
  title: string
  description: string
  totalLicenses: string
  usedLicenses: string
  freeLicenses: string
  employeesTitle: string
  invitationsTitle: string
  inviteTitle: string
  emailLabel: string
  roleLabel: string
  unlockSecretLabel: string
  invite: string
  inviting: string
  noFreeLicenses: string
  noEmployees: string
  noInvitations: string
  licenseColumn: string
  employeeColumn: string
  roleColumn: string
  statusColumn: string
  devicesColumn: string
  actionsColumn: string
  active: string
  inactive: string
  pending: string
  accepted: string
  cancelled: string
  disable: string
  purge: string
  devicesLater: string
}>

export type OrganizationWorkforceAdministrationProps = Readonly<{
  copy: OrganizationWorkforceCopy
  summary: WorkforceLicenseSummary
  employees: readonly WorkforceEmployee[]
  invitations: readonly WorkforceInvitation[]
  roles: readonly WorkforceRoleOption[]
  email: string
  role: string
  unlockSecret: string
  busyAction?: string
  error?: string
  onEmailChange: (value: string) => void
  onRoleChange: (value: string) => void
  onUnlockSecretChange: (value: string) => void
  onInvite: () => void | Promise<void>
  onDisable: (employeeId: string) => void | Promise<void>
  onPurge: (employeeId: string) => void | Promise<void>
}>

/**
 * Controlled organization workforce surface shared by professional portals.
 *
 * The component never infers authorization or changes GW state. The host owns
 * invitation persistence, license reads and employee lifecycle commands.
 */
export function OrganizationWorkforceAdministration({
  copy,
  summary,
  employees,
  invitations,
  roles,
  email,
  role,
  unlockSecret,
  busyAction,
  error,
  onEmailChange,
  onRoleChange,
  onUnlockSecretChange,
  onInvite,
  onDisable,
  onPurge,
}: OrganizationWorkforceAdministrationProps) {
  const noCapacity = summary.free < 1
  const inviting = busyAction === 'invite'
  const canInvite = !noCapacity && !inviting && Boolean(email.trim() && role && unlockSecret)

  function submitInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canInvite) void onInvite()
  }

  return (
    <section className="uhcp-workforce" aria-labelledby="uhcp-workforce-title">
      <header>
        <div>
          <h1 id="uhcp-workforce-title">{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <dl className="uhcp-license-summary">
          <div><dt>{copy.totalLicenses}</dt><dd>{summary.total}</dd></div>
          <div><dt>{copy.usedLicenses}</dt><dd>{summary.used}</dd></div>
          <div><dt>{copy.freeLicenses}</dt><dd>{summary.free}</dd></div>
        </dl>
      </header>

      <section className="uhcp-workforce-panel" aria-labelledby="uhcp-invite-title">
        <h2 id="uhcp-invite-title">{copy.inviteTitle}</h2>
        {noCapacity && <p role="status" className="uhcp-workforce-warning">{copy.noFreeLicenses}</p>}
        <form onSubmit={submitInvitation}>
          <label><span>{copy.emailLabel}</span><input type="email" required value={email} onChange={(event) => onEmailChange(event.currentTarget.value)} /></label>
          <label><span>{copy.roleLabel}</span><select required value={role} onChange={(event) => onRoleChange(event.currentTarget.value)}><option value="" />{roles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label><span>{copy.unlockSecretLabel}</span><input type="password" required value={unlockSecret} onChange={(event) => onUnlockSecretChange(event.currentTarget.value)} /></label>
          <button type="submit" disabled={!canInvite}>{inviting ? copy.inviting : copy.invite}</button>
        </form>
      </section>

      <section className="uhcp-workforce-panel" aria-labelledby="uhcp-employees-title">
        <h2 id="uhcp-employees-title">{copy.employeesTitle}</h2>
        {employees.length === 0 ? <p>{copy.noEmployees}</p> : (
          <div className="uhcp-table-scroll"><table><thead><tr><th>{copy.licenseColumn}</th><th>{copy.employeeColumn}</th><th>{copy.roleColumn}</th><th>{copy.statusColumn}</th><th>{copy.devicesColumn}</th><th>{copy.actionsColumn}</th></tr></thead><tbody>
            {employees.map((employee) => {
              const rowBusy = busyAction === employee.id
              return <tr key={employee.id}>
                <td><code>{employee.licenseId}</code></td><td>{employee.email}</td><td>{employee.role}</td>
                <td><span className={`uhcp-status uhcp-status-${employee.status}`}>{employee.status === 'active' ? copy.active : copy.inactive}</span></td>
                <td>{employee.deviceCount === undefined ? copy.devicesLater : employee.deviceCount}</td>
                <td className="uhcp-row-actions"><button type="button" disabled={rowBusy || employee.status !== 'active'} onClick={() => void onDisable(employee.id)}>{copy.disable}</button><button type="button" className="uhcp-danger" disabled={rowBusy || employee.status !== 'inactive'} onClick={() => void onPurge(employee.id)}>{copy.purge}</button></td>
              </tr>
            })}
          </tbody></table></div>
        )}
      </section>

      <section className="uhcp-workforce-panel" aria-labelledby="uhcp-invitations-title">
        <h2 id="uhcp-invitations-title">{copy.invitationsTitle}</h2>
        {invitations.length === 0 ? <p>{copy.noInvitations}</p> : <ul className="uhcp-invitation-list">{invitations.map((invitation) => <li key={invitation.id}><span><strong>{invitation.email}</strong><small>{invitation.role}</small></span><span className={`uhcp-status uhcp-status-${invitation.status}`}>{copy[invitation.status]}</span></li>)}</ul>}
      </section>

      {error && <p role="alert" className="uhcp-error">{error}</p>}
    </section>
  )
}
