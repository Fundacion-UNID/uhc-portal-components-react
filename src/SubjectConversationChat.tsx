import { useMemo, type ReactNode } from 'react'
import {
  AntifraudConversationSurface,
  type AntifraudConversationMessage,
} from 'antifraud-portal-components-react/conversation-surface'
import {
  SubjectConversationContentKind,
  projectSubjectConversationChatMessages,
  type SubjectConversationChatMessage,
  type SubjectConversationEntry,
} from 'sos-data-utils-ts/subject-conversation-chat'

export type SubjectConversationChatUser = Readonly<{ id: string; name: string; avatar?: string }>
export type SubjectConversationIMessage = AntifraudConversationMessage & SubjectConversationChatMessage

/**
 * Shared React Native/Web and Expo conversation surface.
 * Hosts own authorization, materialization, attachment opening and delivery.
 */
export function SubjectConversationChat({
  entries,
  currentUser,
  locale,
  onSendText,
  onAttach,
  renderFhirDocument,
  renderEntryContent,
  footer,
  copy,
  composerEnabled,
}: Readonly<{
  entries: readonly SubjectConversationEntry[]
  currentUser: SubjectConversationChatUser
  locale?: string
  onSendText(text: string): void | Promise<void>
  onAttach?(): void | Promise<void>
  renderFhirDocument?(input: Readonly<{
    label: string
    bundle: Readonly<Record<string, unknown>>
    message: SubjectConversationIMessage
  }>): ReactNode
  renderEntryContent?(message: SubjectConversationIMessage): ReactNode
  footer?: ReactNode
  copy?: Readonly<{ placeholder: string; send: string }>
  composerEnabled?: boolean
}>) {
  const messages = useMemo(
    () => [...projectSubjectConversationChatMessages(entries)] as SubjectConversationIMessage[],
    [entries],
  )
  const user = useMemo(() => ({
    _id: currentUser.id,
    name: currentUser.name,
    ...(currentUser.avatar ? { avatar: currentUser.avatar } : {}),
  }), [currentUser.avatar, currentUser.id, currentUser.name])

  return <AntifraudConversationSurface<SubjectConversationIMessage>
    messages={messages}
    currentUser={user}
    locale={locale}
    onSendText={onSendText}
    onAttach={onAttach}
    renderMessageContent={renderFhirDocument || renderEntryContent ? (message) => {
      const content = message.subjectConversation.content
      return content.kind === SubjectConversationContentKind.FhirDocument && renderFhirDocument
        ? renderFhirDocument({ label: content.label, bundle: content.bundle, message })
        : renderEntryContent?.(message) ?? null
    } : undefined}
    footer={footer}
    copy={copy}
    composerEnabled={composerEnabled}
  />
}
