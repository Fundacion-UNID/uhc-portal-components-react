// Flow contract: UHC retains a deprecated compatibility export for subject conversations while the only implementation and ownership live in SOS portal components.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('subject conversation ownership', () => {
  it('delegates the legacy UHC subpath directly to SOS portal components', () => {
    const source = readFileSync('src/SubjectConversationChat.tsx', 'utf8')
    expect(source).toContain("from 'sos-portal-components-react/subject-conversation-chat'")
    expect(source).not.toContain('projectSubjectConversationChatMessages')
    expect(source).not.toContain('AntifraudConversationSurface')
  })
})
