'use client'

import { useId, useState } from 'react'
import {
  normalizeNotificationComposerDraft,
  NotificationAttachmentMediaTypes,
  PublicAlertPriorities,
  type NotificationAttachment,
  type NotificationComposerAudience,
  type NotificationComposerDraft,
  type PublicAlertPriority,
} from 'sos-data-utils-ts/public-notifications'
import { LegalMarkdownDocument } from './LegalMarkdownDocument.js'

export type NotificationComposerAudienceOption = Readonly<{
  id: string
  label: string
  description?: string
  audience: NotificationComposerAudience
}>

export type NotificationComposerCopy = Readonly<{
  title: string
  audience: string
  subject: string
  bodyMarkdown: string
  preview: string
  attachments: string
  addAttachments: string
  removeAttachment: string
  send: string
  sending: string
  sent: string
  unsupportedAttachment: string
  attachmentUploadFailed: string
  sendFailed: string
  priority?: string
  validUntil?: string
}>

export type NotificationComposerFormSchema = Readonly<{
  $id: string
  required: readonly string[]
  properties: Readonly<Record<string, Readonly<{
    type: string
    enum?: readonly string[]
    maxLength?: number
    maxItems?: number
  }>>>
}>

/**
 * Channel-neutral notification editor. The host supplies BFF-authorized
 * audiences plus upload/send adapters; this component never accepts direct
 * recipient addresses, subscriber lists or publishing authority.
 */
export function NotificationComposer(input: Readonly<{
  audiences: readonly NotificationComposerAudienceOption[]
  copy: NotificationComposerCopy
  uploadAttachment(file: File): Promise<NotificationAttachment>
  onSubmit(draft: NotificationComposerDraft): Promise<void>
  formSchema?: NotificationComposerFormSchema
  disabled?: boolean
}>) {
  const id = useId()
  const [audienceId, setAudienceId] = useState(input.audiences[0]?.id ?? '')
  const [subject, setSubject] = useState('')
  const [bodyMarkdown, setBodyMarkdown] = useState('')
  const [priority, setPriority] = useState<PublicAlertPriority>('routine')
  const [validUntil, setValidUntil] = useState('')
  const [attachments, setAttachments] = useState<readonly NotificationAttachment[]>([])
  const [working, setWorking] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const audience = input.audiences.find((candidate) => candidate.id === audienceId)
  const disabled = Boolean(input.disabled || working)
  const publicAlertForm = Boolean(input.formSchema)
  const priorityOptions = input.formSchema?.properties.priority?.enum ?? PublicAlertPriorities
  const subjectMaxLength = input.formSchema?.properties.subject?.maxLength
  const bodyMaxLength = input.formSchema?.properties.bodyMarkdown?.maxLength
  const attachmentLimit = input.formSchema?.properties.attachments?.maxItems

  async function addAttachments(files: FileList | null) {
    if (!files?.length) return
    setError('')
    const selectedFiles = Array.from(files)
    if (attachmentLimit !== undefined && attachments.length + selectedFiles.length > attachmentLimit) {
      setError(input.copy.unsupportedAttachment)
      return
    }
    if (selectedFiles.some((file) => !NotificationAttachmentMediaTypes.includes(file.type as never))) {
      setError(input.copy.unsupportedAttachment)
      return
    }
    setWorking(true)
    try {
      const uploaded = await Promise.all(selectedFiles.map((file) => input.uploadAttachment(file)))
      setAttachments((current) => Object.freeze([...current, ...uploaded]))
    } catch {
      setError(input.copy.attachmentUploadFailed)
    } finally {
      setWorking(false)
    }
  }

  async function submit() {
    if (!audience || !subject.trim() || !bodyMarkdown.trim()) return
    setWorking(true)
    setStatus('')
    setError('')
    try {
      const draft = normalizeNotificationComposerDraft({
        audience: audience.audience,
        subject,
        bodyMarkdown,
        attachments,
        ...(publicAlertForm ? {
          priority,
          validUntil: new Date(validUntil).toISOString(),
        } : {}),
      })
      await input.onSubmit(draft)
      setStatus(input.copy.sent)
    } catch {
      setError(input.copy.sendFailed)
    } finally {
      setWorking(false)
    }
  }

  return <section
    className="uhcp-notification-composer"
    aria-labelledby={`${id}-title`}
    data-form-schema={input.formSchema?.$id}
  >
    <header>
      <h2 id={`${id}-title`}>{input.copy.title}</h2>
    </header>

    <label htmlFor={`${id}-audience`}>{input.copy.audience}</label>
    <select
      id={`${id}-audience`}
      value={audienceId}
      disabled={disabled}
      onChange={(event) => setAudienceId(event.currentTarget.value)}
    >
      {input.audiences.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select>
    {audience?.description ? <p className="uhcp-muted">{audience.description}</p> : null}

    <label htmlFor={`${id}-subject`}>{input.copy.subject}</label>
    <input
      id={`${id}-subject`}
      value={subject}
      maxLength={subjectMaxLength}
      disabled={disabled}
      onChange={(event) => setSubject(event.currentTarget.value)}
    />

    {publicAlertForm ? <>
      <label htmlFor={`${id}-priority`}>{input.copy.priority || 'Priority'}</label>
      <select
        id={`${id}-priority`}
        value={priority}
        disabled={disabled}
        onChange={(event) => setPriority(event.currentTarget.value as PublicAlertPriority)}
      >
        {priorityOptions.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <label htmlFor={`${id}-valid-until`}>{input.copy.validUntil || 'Valid until'}</label>
      <input
        id={`${id}-valid-until`}
        type="datetime-local"
        value={validUntil}
        required
        disabled={disabled}
        onChange={(event) => setValidUntil(event.currentTarget.value)}
      />
    </> : null}

    <div className="uhcp-notification-composer-body">
      <div>
        <label htmlFor={`${id}-body`}>{input.copy.bodyMarkdown}</label>
        <textarea
          id={`${id}-body`}
          value={bodyMarkdown}
          maxLength={bodyMaxLength}
          disabled={disabled}
          onChange={(event) => setBodyMarkdown(event.currentTarget.value)}
        />
      </div>
      <section aria-labelledby={`${id}-preview`}>
        <h3 id={`${id}-preview`}>{input.copy.preview}</h3>
        <LegalMarkdownDocument source={bodyMarkdown} />
      </section>
    </div>

    <fieldset disabled={disabled}>
      <legend>{input.copy.attachments}</legend>
      <label htmlFor={`${id}-attachments`}>{input.copy.addAttachments}</label>
      <input
        id={`${id}-attachments`}
        type="file"
        multiple
        accept={NotificationAttachmentMediaTypes.join(',')}
        onChange={(event) => void addAttachments(event.currentTarget.files)}
      />
      {attachments.length > 0 ? <ul>
        {attachments.map((attachment) => <li key={attachment.attachmentId}>
          <span>{attachment.fileName}</span>
          <button
            type="button"
            onClick={() => setAttachments((current) => current.filter((item) => item.attachmentId !== attachment.attachmentId))}
          >{input.copy.removeAttachment}</button>
        </li>)}
      </ul> : null}
    </fieldset>

    <button
      type="button"
      disabled={disabled || !audience || !subject.trim() || !bodyMarkdown.trim() || (publicAlertForm && !validUntil)}
      onClick={() => void submit()}
    >{working ? input.copy.sending : input.copy.send}</button>
    {status ? <p role="status">{status}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
  </section>
}
