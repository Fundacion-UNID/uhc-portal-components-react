import type { FormEvent } from 'react'

export type InvitationAcceptanceStatus =
  | 'idle'
  | 'submitting'
  | 'accepted'
  | 'error'

export type InvitationAcceptancePanelCopy = Readonly<{
  title: string
  description: string
  codeLabel: string
  submit: string
  submitting: string
  accepted: string
}>

export type InvitationAcceptancePanelProps = Readonly<{
  copy: InvitationAcceptancePanelCopy
  code: string
  status: InvitationAcceptanceStatus
  error?: string
  onCodeChange: (code: string) => void
  onAccept: () => void | Promise<void>
}>

/**
 * Controlled invitation-acceptance form reusable by any personal portal.
 *
 * The component owns no authorization semantics. The host BFF verifies the
 * authenticated actor, accepts the invitation and refreshes related subjects.
 */
export function InvitationAcceptancePanel({
  copy,
  code,
  status,
  error,
  onCodeChange,
  onAccept,
}: InvitationAcceptancePanelProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onAccept()
  }

  return (
    <section className="uhcp-access-panel" aria-labelledby="uhcp-invitation-title">
      <h2 id="uhcp-invitation-title">{copy.title}</h2>
      <p>{copy.description}</p>
      {status === 'accepted'
        ? <p role="status">{copy.accepted}</p>
        : (
          <form onSubmit={submit}>
            <label>
              <span>{copy.codeLabel}</span>
              <input
                value={code}
                onChange={(event) => onCodeChange(event.currentTarget.value)}
                required
                disabled={status === 'submitting'}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <button type="submit" disabled={status === 'submitting' || !code.trim()}>
              {status === 'submitting' ? copy.submitting : copy.submit}
            </button>
          </form>
        )}
    </section>
  )
}
