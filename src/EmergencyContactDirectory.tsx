'use client'

import { useState } from 'react'

export type EmergencyContactRecord = Readonly<{
  id?: string
  name: string
  relationship: string
  phone?: string
  email?: string
}>

export type EmergencyContactDirectoryCopy = Readonly<{
  title: string
  empty: string
  add: string
  edit: string
  remove: string
  save: string
  cancel: string
  name: string
  relationship: string
  phone: string
  email: string
  call: string
  message: string
}>

const EMPTY_CONTACT: EmergencyContactRecord = Object.freeze({ name: '', relationship: '', phone: '', email: '' })

export function EmergencyContactDirectory({ contacts, copy, editable = false, onSave, onDelete }: Readonly<{
  contacts: readonly EmergencyContactRecord[]
  copy: EmergencyContactDirectoryCopy
  editable?: boolean
  onSave?: (contact: EmergencyContactRecord) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}>) {
  const [draft, setDraft] = useState<EmergencyContactRecord>()
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!draft || !onSave) return
    setSaving(true)
    try {
      await onSave(draft)
      setDraft(undefined)
    } finally {
      setSaving(false)
    }
  }

  return <section className="uhcp-emergency-contact-directory">
    <header><h3>{copy.title}</h3>{editable ? <button type="button" onClick={() => setDraft(EMPTY_CONTACT)}>{copy.add}</button> : null}</header>
    {contacts.length ? <ul>{contacts.map((contact) => <li key={contact.id ?? `${contact.name}|${contact.relationship}`}>
      <div><strong>{contact.name}</strong><span>{contact.relationship}</span></div>
      <nav aria-label={contact.name}>
        {contact.phone ? <a href={`tel:${contact.phone}`}>{copy.call}</a> : null}
        {contact.email ? <a href={`mailto:${contact.email}`}>{copy.message}</a> : null}
        {editable ? <button type="button" onClick={() => setDraft(contact)}>{copy.edit} {contact.name}</button> : null}
        {editable && contact.id && onDelete ? <button type="button" onClick={() => void onDelete(contact.id!)}>{copy.remove} {contact.name}</button> : null}
      </nav>
    </li>)}</ul> : <p>{copy.empty}</p>}
    {draft ? <form className="uhcp-emergency-contact-editor" onSubmit={(event) => { event.preventDefault(); void save() }}>
      <label>{copy.name}<input required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current!, name: event.target.value }))}/></label>
      <label>{copy.relationship}<input required value={draft.relationship} onChange={(event) => setDraft((current) => ({ ...current!, relationship: event.target.value }))}/></label>
      <label>{copy.phone}<input type="tel" value={draft.phone ?? ''} onChange={(event) => setDraft((current) => ({ ...current!, phone: event.target.value }))}/></label>
      <label>{copy.email}<input type="email" value={draft.email ?? ''} onChange={(event) => setDraft((current) => ({ ...current!, email: event.target.value }))}/></label>
      <footer><button type="button" onClick={() => setDraft(undefined)}>{copy.cancel}</button><button type="submit" disabled={saving}>{copy.save}</button></footer>
    </form> : null}
  </section>
}
