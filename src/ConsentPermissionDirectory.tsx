import { useMemo, useState } from 'react'
import { ConsentDecisions, ConsentStatuses, type ConsentDecision, type ConsentStatus } from 'gdc-common-utils-ts/models/consent-rule'

export type ConsentPermissionOption = Readonly<{ value: string; label: string }>
export type ConsentPermissionContact = Readonly<{ id: string; name: string }>
export type ConsentPermissionRecord = Readonly<{
  id: string
  contactReference: string
  contactName: string
  decision: ConsentDecision
  status: ConsentStatus
  purposes: readonly string[]
  roles: readonly string[]
  targets: readonly string[]
}>
export type ConsentPermissionDraft = Readonly<Omit<ConsentPermissionRecord, 'id' | 'contactName'> & { id?: string; contactName?: string }>
export type ConsentPermissionDirectoryCopy = Readonly<{
  title: string; empty: string; add: string; edit: string; remove: string; suspend: string; activate: string
  save: string; cancel: string; contact: string; decision: string; permit: string; deny: string
  status: string; active: string; inactive: string; purposes: string; roles: string; targets: string
  saving: string; loadError: string; required: string
}>

export function ConsentPermissionDirectory({ records, contacts, purposeOptions, roleOptions, targetOptions, copy, editable = false, onSave, onStatusChange, onDelete }: Readonly<{
  records: readonly ConsentPermissionRecord[]
  contacts: readonly ConsentPermissionContact[]
  purposeOptions: readonly ConsentPermissionOption[]
  roleOptions: readonly ConsentPermissionOption[]
  targetOptions: readonly ConsentPermissionOption[]
  copy: ConsentPermissionDirectoryCopy
  editable?: boolean
  onSave?: (draft: ConsentPermissionDraft) => Promise<void> | void
  onStatusChange?: (id: string, status: ConsentStatus) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void
}>) {
  const [editing, setEditing] = useState<ConsentPermissionDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const labels = useMemo(() => new Map([...purposeOptions, ...roleOptions, ...targetOptions].map(({ value, label }) => [value, label])), [purposeOptions, roleOptions, targetOptions])

  async function save() {
    if (!editing || !editing.contactReference || !editing.purposes.length || !editing.roles.length || !editing.targets.length) {
      setError(copy.required)
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave?.(editing)
      setEditing(null)
    } catch {
      setError(copy.loadError)
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(record: ConsentPermissionRecord) {
    setError('')
    try {
      await onStatusChange?.(record.id, record.status === ConsentStatuses.Active ? ConsentStatuses.Inactive : ConsentStatuses.Active)
    } catch {
      setError(copy.loadError)
    }
  }

  async function remove(record: ConsentPermissionRecord) {
    setError('')
    try {
      await onDelete?.(record.id)
    } catch {
      setError(copy.loadError)
    }
  }

  return <section className="uhcp-consent-directory" aria-labelledby="uhcp-consent-directory-title">
    <header><div><h2 id="uhcp-consent-directory-title">{copy.title}</h2><p>{records.length ? `${records.length}` : copy.empty}</p></div>{editable ? <button type="button" onClick={() => setEditing(emptyDraft())}>{copy.add}</button> : null}</header>
    {error ? <p role="alert">{error}</p> : null}
    <div className="uhcp-consent-list">
      {records.map((record) => <article key={record.id}>
        <div><strong>{record.contactName}</strong><span>{record.decision === ConsentDecisions.Permit ? copy.permit : copy.deny}</span><span>{record.status === ConsentStatuses.Active ? copy.active : copy.inactive}</span></div>
        <p>{record.purposes.map((value) => labels.get(value) ?? value).join(', ')}</p><p>{record.roles.map((value) => labels.get(value) ?? value).join(', ')}</p><p>{record.targets.map((value) => labels.get(value) ?? value).join(', ')}</p>
        {editable ? <div className="uhcp-consent-actions">
          <button type="button" aria-label={`${copy.edit} ${record.contactName}`} onClick={() => setEditing(record)}>{copy.edit}</button>
          <button type="button" aria-label={`${record.status === ConsentStatuses.Active ? copy.suspend : copy.activate} ${record.contactName}`} onClick={() => void changeStatus(record)}>{record.status === ConsentStatuses.Active ? copy.suspend : copy.activate}</button>
          <button type="button" aria-label={`${copy.remove} ${record.contactName}`} onClick={() => void remove(record)}>{copy.remove}</button>
        </div> : null}
      </article>)}
    </div>
    {editing ? <form className="uhcp-consent-editor" onSubmit={(event) => { event.preventDefault(); void save() }}>
      <label>{copy.contact}<select value={editing.contactReference} onChange={(event) => setEditing({ ...editing, contactReference: event.target.value, contactName: contacts.find(({ id }) => id === event.target.value)?.name })}><option value=""/>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></label>
      <label>{copy.decision}<select value={editing.decision} onChange={(event) => setEditing({ ...editing, decision: event.target.value as ConsentDecision })}><option value={ConsentDecisions.Permit}>{copy.permit}</option><option value={ConsentDecisions.Deny}>{copy.deny}</option></select></label>
      <label>{copy.status}<select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as ConsentStatus })}><option value={ConsentStatuses.Active}>{copy.active}</option><option value={ConsentStatuses.Inactive}>{copy.inactive}</option></select></label>
      <OptionGroup legend={copy.purposes} options={purposeOptions} selected={editing.purposes} onChange={(purposes) => setEditing({ ...editing, purposes })}/>
      <OptionGroup legend={copy.roles} options={roleOptions} selected={editing.roles} onChange={(roles) => setEditing({ ...editing, roles })}/>
      <OptionGroup legend={copy.targets} options={targetOptions} selected={editing.targets} onChange={(targets) => setEditing({ ...editing, targets })}/>
      <div><button type="submit" disabled={saving}>{saving ? copy.saving : copy.save}</button><button type="button" onClick={() => setEditing(null)}>{copy.cancel}</button></div>
    </form> : null}
  </section>
}

function OptionGroup({ legend, options, selected, onChange }: Readonly<{ legend: string; options: readonly ConsentPermissionOption[]; selected: readonly string[]; onChange: (values: readonly string[]) => void }>) {
  return <fieldset><legend>{legend}</legend>{options.map((option) => <label key={option.value}><input type="checkbox" checked={selected.includes(option.value)} onChange={(event) => onChange(event.target.checked ? [...selected, option.value] : selected.filter((value) => value !== option.value))}/>{option.label}</label>)}</fieldset>
}

function emptyDraft(): ConsentPermissionDraft {
  return Object.freeze({ contactReference: '', decision: ConsentDecisions.Permit, status: ConsentStatuses.Active, purposes: Object.freeze([]), roles: Object.freeze([]), targets: Object.freeze([]) })
}
