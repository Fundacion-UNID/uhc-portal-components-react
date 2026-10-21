// Flow contract: 1) every host uses the same public BFF root, 2) attachment bytes go only to the bounded upload endpoint, 3) the resulting immutable attachment reference is composed into one canonical send command, and 4) neither addressed recipients nor dataset subscribers are caller-supplied.

import { describe, expect, it, vi } from 'vitest'
import { createNotificationBffClient, createPersonalNotificationBffClient, createPublicNotificationBffClient } from '../src/notification-bff-client.js'

describe('notification BFF client', () => {
  it('uploads an attachment then sends the canonical public-dataset draft through shared paths', async () => {
    const authorizedFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        attachment: {
          attachmentId: 'pdf-one', fileName: 'instructions.pdf', mediaType: 'application/pdf', sizeBytes: 3,
          contentReference: 'DocumentReference/pdf-one', sha256: 'a'.repeat(64),
        },
      }), { status: 201, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ notificationId: 'notification-one', status: 'accepted' }), {
        status: 202, headers: { 'content-type': 'application/json' },
      }))
    const client = createNotificationBffClient({ authorizedFetch })
    const attachment = await client.uploadAttachment(new File(['pdf'], 'instructions.pdf', { type: 'application/pdf' }))
    const result = await client.send({
      audience: {
        mode: 'public-dataset',
        datasetName: 'ca-bc_health-care_public_blood-donation_whole-blood_a-rh-negative',
      },
      subject: 'A negative blood is needed',
      bodyMarkdown: 'Please review the **donation instructions**.',
      attachments: [attachment],
    })

    expect(authorizedFetch.mock.calls[0][0]).toBe('/api/notifications/attachments')
    expect(authorizedFetch.mock.calls[0][1].method).toBe('POST')
    expect(authorizedFetch.mock.calls[0][1].body).toBeInstanceOf(FormData)
    expect(authorizedFetch.mock.calls[1][0]).toBe('/api/notifications')
    expect(JSON.parse(String(authorizedFetch.mock.calls[1][1].body))).toEqual({
      operation: 'send',
      draft: {
        audience: {
          mode: 'public-dataset',
          datasetName: 'ca-bc_health-care_public_blood-donation_whole-blood_a-rh-negative',
        },
        subject: 'A negative blood is needed',
        bodyMarkdown: 'Please review the **donation instructions**.',
        attachments: [attachment],
      },
    })
    expect(result).toEqual({ notificationId: 'notification-one', status: 'accepted' })
  })

  it('surfaces the BFF error without inventing a successful send', async () => {
    const client = createNotificationBffClient({
      authorizedFetch: vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'notification_not_authorized' }), {
        status: 403, headers: { 'content-type': 'application/json' },
      })),
    })

    await expect(client.send({
      audience: { mode: 'addressed', subjectReference: 'Patient/subject-one', purpose: 'care-transition' },
      subject: 'Discharge instructions',
      bodyMarkdown: 'Follow the care plan.',
      attachments: [],
    })).rejects.toThrow('notification_not_authorized')
  })

  it('uses one public-notification path contract while keeping profile proof outside the draft', async () => {
    const authorizedFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        attachment: {
          attachmentId: 'image-one', fileName: 'donor.png', mediaType: 'image/png', sizeBytes: 3,
          contentReference: 'DocumentReference/image-one', sha256: 'b'.repeat(64),
        },
      }), { status: 201, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ notificationId: 'notification-two', status: 'accepted' }), {
        status: 202, headers: { 'content-type': 'application/json' },
      }))
    const client = createPublicNotificationBffClient({
      authorizedFetch,
      profileProof: { profileId: 'profile-one', profileSessionToken: 'wallet-session-one' },
    })
    const attachment = await client.uploadAttachment(new File(['png'], 'donor.png', { type: 'image/png' }))
    await client.send({
      audience: { mode: 'public-dataset', datasetName: 'ca-bc_animal-care_public_blood-donation_dog_alert' },
      subject: 'Dog blood donation needed', bodyMarkdown: 'Please contact the clinic.', attachments: [attachment],
    })

    expect(authorizedFetch.mock.calls[0][0]).toBe('/api/notifications/public/attachments')
    const form = authorizedFetch.mock.calls[0][1].body as FormData
    expect(form.get('profileId')).toBe('profile-one')
    expect(form.get('profileSessionToken')).toBe('wallet-session-one')
    expect(form.get('file')).toBeInstanceOf(File)
    expect(authorizedFetch.mock.calls[1][0]).toBe('/api/notifications/public')
    expect(JSON.parse(String(authorizedFetch.mock.calls[1][1].body))).toEqual({
      operation: 'send',
      profileId: 'profile-one',
      profileSessionToken: 'wallet-session-one',
      draft: {
        audience: { mode: 'public-dataset', datasetName: 'ca-bc_animal-care_public_blood-donation_dog_alert' },
        subject: 'Dog blood donation needed', bodyMarkdown: 'Please contact the clinic.', attachments: [attachment],
      },
    })
  })

  it('lists personal public topics through the same canonical route for human or animal subjects', async () => {
    const authorizedFetch = vi.fn().mockResolvedValue(Response.json({ notifications: [] }))
    const client = createPersonalNotificationBffClient({ authorizedFetch })

    await client.listPublic({ subjectReference: 'did:web:card.example:dog', subjectKind: 'animal', species: 'dog' })

    expect(authorizedFetch).toHaveBeenCalledWith(
      '/api/notifications?subject=did%3Aweb%3Acard.example%3Adog&species=dog',
      { method: 'GET' },
    )
  })
})
