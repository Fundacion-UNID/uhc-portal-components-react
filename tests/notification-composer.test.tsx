// Flow contract: 1) the host supplies only BFF-authorized audience options, 2) one shared editor composes a subject, sanitized Markdown and bounded image/PDF attachments, 3) the host upload adapter returns immutable references, and 4) submit emits either a subject-addressed or public-dataset draft without browser-selected recipients or subscribers.
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotificationComposer } from '../src/NotificationComposer.js'
import { PUBLIC_ALERT_FORM_SCHEMA } from 'sos-data-utils-ts/public-notifications'

const copy = {
  title: 'Compose notification',
  audience: 'Audience',
  subject: 'Subject',
  bodyMarkdown: 'Message',
  preview: 'Preview',
  attachments: 'Attachments',
  addAttachments: 'Add images or PDF',
  removeAttachment: 'Remove',
  send: 'Send notification',
  sending: 'Sending notification',
  sent: 'Notification sent',
  unsupportedAttachment: 'Only images and PDF are supported',
  attachmentUploadFailed: 'The attachment could not be uploaded',
  sendFailed: 'The notification could not be sent',
}

describe('NotificationComposer', () => {
  afterEach(cleanup)

  it('composes and submits one public-dataset Markdown notification with uploaded image and PDF references', async () => {
    const uploadAttachment = vi.fn()
      .mockResolvedValueOnce({
        attachmentId: 'image-one', fileName: 'area.png', mediaType: 'image/png', sizeBytes: 5,
        contentReference: 'Binary/image-one', sha256: 'a'.repeat(64),
      })
      .mockResolvedValueOnce({
        attachmentId: 'pdf-one', fileName: 'instructions.pdf', mediaType: 'application/pdf', sizeBytes: 6,
        contentReference: 'DocumentReference/pdf-one', sha256: 'b'.repeat(64),
      })
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<NotificationComposer
      audiences={[{
        id: 'dog-blood',
        label: 'Dog blood donation',
        audience: {
          mode: 'public-dataset',
          datasetName: 'ca-bc_animal-care_public_blood-donation_dog_alert',
        },
      }]}
      copy={copy}
      formSchema={PUBLIC_ALERT_FORM_SCHEMA}
      uploadAttachment={uploadAttachment}
      onSubmit={onSubmit}
    />)

    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'A negative blood is needed' } })
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Please read the **donation instructions**.' } })
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'urgent' } })
    fireEvent.change(screen.getByLabelText('Valid until'), { target: { value: '2026-10-22T18:00' } })
    fireEvent.change(screen.getByLabelText('Add images or PDF'), { target: { files: [
      new File(['image'], 'area.png', { type: 'image/png' }),
      new File(['pdf'], 'instructions.pdf', { type: 'application/pdf' }),
    ] } })

    await screen.findByText('area.png')
    await screen.findByText('instructions.pdf')
    expect(screen.getByText('donation instructions').tagName).toBe('STRONG')
    fireEvent.click(screen.getByRole('button', { name: 'Send notification' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const draft = onSubmit.mock.calls[0][0]
    expect(draft.audience).toEqual({
      mode: 'public-dataset',
      datasetName: 'ca-bc_animal-care_public_blood-donation_dog_alert',
    })
    expect(draft.attachments.map((item: { mediaType: string }) => item.mediaType)).toEqual(['image/png', 'application/pdf'])
    expect(draft.priority).toBe('urgent')
    expect(draft.validUntil).toBe(new Date('2026-10-22T18:00').toISOString())
    expect(document.querySelector('[data-form-schema]')?.getAttribute('data-form-schema')).toBe(PUBLIC_ALERT_FORM_SCHEMA.$id)
    expect('subscriberReferences' in draft.audience).toBe(false)
    expect(screen.getByRole('status').textContent).toContain('Notification sent')
  })

  it('uses the same screen for a subject-addressed care transition without accepting recipient addresses', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<NotificationComposer
      audiences={[{
        id: 'care-transition',
        label: 'Authorized caregivers',
        audience: { mode: 'addressed', subjectReference: 'Patient/subject-one', purpose: 'care-instructions' },
      }]}
      copy={copy}
      uploadAttachment={vi.fn()}
      onSubmit={onSubmit}
    />)

    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Discharge instructions' } })
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Follow the care plan.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send notification' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0].audience).toEqual({
      mode: 'addressed', subjectReference: 'Patient/subject-one', purpose: 'care-instructions',
    })
    expect('recipientReferences' in onSubmit.mock.calls[0][0].audience).toBe(false)
  })

  it('rejects unsupported attachments before calling the host upload adapter', async () => {
    const uploadAttachment = vi.fn()
    render(<NotificationComposer
      audiences={[{
        id: 'animal-alert', label: 'Public dog alert',
        audience: { mode: 'public-dataset', datasetName: 'ca-bc_animal-care_public_veterinary_dog_alert' },
      }]}
      copy={copy}
      uploadAttachment={uploadAttachment}
      onSubmit={vi.fn()}
    />)

    fireEvent.change(screen.getByLabelText('Add images or PDF'), {
      target: { files: [new File(['archive'], 'archive.zip', { type: 'application/zip' })] },
    })

    expect((await screen.findByRole('alert')).textContent).toContain('Only images and PDF are supported')
    expect(uploadAttachment).not.toHaveBeenCalled()
  })
})
