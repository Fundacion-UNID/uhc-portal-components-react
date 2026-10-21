import {
  normalizePublicNotificationRecord,
  normalizeNotificationComposerDraft,
  type NotificationAttachment,
  type NotificationComposerDraft,
  type PublicNotificationRecord,
} from 'sos-data-utils-ts/public-notifications'

type AuthorizedFetch = (url: string, init: RequestInit) => Promise<Response>

export type NotificationSendResult = Readonly<{
  notificationId: string
  status: 'accepted'
}>

export type NotificationProfileProof = Readonly<{
  profileId: string
  profileSessionToken: string
}>

export type PersonalNotificationContext =
  | Readonly<{ subjectReference: string; subjectKind: 'human' }>
  | Readonly<{ subjectReference: string; subjectKind: 'animal'; species: 'dog' | 'cat' }>

/** Personal public-topic reader; the BFF derives subscriptions, exclusions and delivery decisions. */
export function createPersonalNotificationBffClient(input: Readonly<{
  authorizedFetch: AuthorizedFetch
  routeRoot?: '/api/notifications'
}>) {
  const routeRoot = input.routeRoot ?? '/api/notifications'
  return Object.freeze({
    async listPublic(context: PersonalNotificationContext): Promise<readonly PublicNotificationRecord[]> {
      const subjectReference = context.subjectReference.trim()
      if (!subjectReference) throw new Error('notification_subject_reference_required')
      const query = new URLSearchParams({ subject: subjectReference })
      if (context.subjectKind === 'animal') query.set('species', context.species)
      const response = await input.authorizedFetch(`${routeRoot}?${query.toString()}`, { method: 'GET' })
      const payload = await response.json() as { notifications?: PublicNotificationRecord[]; error?: string }
      if (!response.ok || !Array.isArray(payload.notifications)) {
        throw new Error(payload.error || 'notification_list_failed')
      }
      return Object.freeze(payload.notifications.map(normalizePublicNotificationRecord))
    },
  })
}

/** Shared transport adapter for browser, mobile-web and assistant hosts. */
export function createNotificationBffClient(input: Readonly<{
  authorizedFetch: AuthorizedFetch
  routeRoot?: '/api/notifications'
}>) {
  const routeRoot = input.routeRoot ?? '/api/notifications'

  return Object.freeze({
    async uploadAttachment(file: File): Promise<NotificationAttachment> {
      const form = new FormData()
      form.set('attachment', file)
      const response = await input.authorizedFetch(`${routeRoot}/attachments`, {
        method: 'POST',
        body: form,
      })
      const payload = await response.json() as { attachment?: NotificationAttachment; error?: string }
      if (!response.ok || !payload.attachment) throw new Error(payload.error || 'notification_attachment_upload_failed')
      return Object.freeze(payload.attachment)
    },

    async send(draft: NotificationComposerDraft): Promise<NotificationSendResult> {
      const normalizedDraft = normalizeNotificationComposerDraft(draft)
      const response = await input.authorizedFetch(routeRoot, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operation: 'send', draft: normalizedDraft }),
      })
      const payload = await response.json() as { notificationId?: string; status?: string; error?: string }
      if (!response.ok || !payload.notificationId || payload.status !== 'accepted') {
        throw new Error(payload.error || 'notification_send_failed')
      }
      return Object.freeze({ notificationId: payload.notificationId, status: 'accepted' as const })
    },
  })
}

/** Public-dataset transport shared by professional portals; the BFF validates the trusted profile proof. */
export function createPublicNotificationBffClient(input: Readonly<{
  authorizedFetch: AuthorizedFetch
  profileProof: NotificationProfileProof
  routeRoot?: '/api/notifications/public'
}>) {
  const routeRoot = input.routeRoot ?? '/api/notifications/public'
  const profileId = input.profileProof.profileId.trim()
  const profileSessionToken = input.profileProof.profileSessionToken.trim()
  if (!profileId) throw new Error('profile_id_required')
  if (!profileSessionToken) throw new Error('wallet_session_required')

  return Object.freeze({
    async uploadAttachment(file: File): Promise<NotificationAttachment> {
      const form = new FormData()
      form.set('profileId', profileId)
      form.set('profileSessionToken', profileSessionToken)
      form.set('file', file)
      const response = await input.authorizedFetch(`${routeRoot}/attachments`, { method: 'POST', body: form })
      const payload = await response.json() as { attachment?: NotificationAttachment; error?: string }
      if (!response.ok || !payload.attachment) throw new Error(payload.error || 'notification_attachment_upload_failed')
      return Object.freeze(payload.attachment)
    },

    async send(draft: NotificationComposerDraft): Promise<NotificationSendResult> {
      const normalizedDraft = normalizeNotificationComposerDraft(draft)
      const response = await input.authorizedFetch(routeRoot, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operation: 'send', profileId, profileSessionToken, draft: normalizedDraft }),
      })
      const payload = await response.json() as { notificationId?: string; status?: string; error?: string }
      if (!response.ok || !payload.notificationId || payload.status !== 'accepted') {
        throw new Error(payload.error || 'public_notification_send_failed')
      }
      return Object.freeze({ notificationId: payload.notificationId, status: 'accepted' as const })
    },
  })
}
