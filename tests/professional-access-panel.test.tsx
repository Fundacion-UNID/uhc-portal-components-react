// Flow contract: Partner and Test Network reuse Google, real email OTP and enrolled-passkey entry, while Demo exposes only synthetic email plus the fixed six-digit local code and never implies real identity authority.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProfessionalAccessPanel, type ProfessionalAccessPanelCopy } from '../src/ProfessionalAccessPanel.js'

const copy: ProfessionalAccessPanelCopy = {
  eyebrow: 'Organization access',
  title: 'Sign in to continue',
  description: 'Sign in or create your account with a one-time code.',
  google: 'Sign in with Google',
  separator: 'or',
  email: 'Email',
  sendEmailCode: 'Send email code',
  emailCode: 'Email code',
  verifyEmailCode: 'Verify email code',
  changeEmail: 'Change email',
  emailCodeSent: 'Enter the six-digit code sent to {email}.',
  passkeyHint: 'A passkey works only after enabling it from an unlocked profile. Use the email code for first access.',
  passkey: 'Use an existing passkey',
  demoEmail: 'Demo email',
  demoCode: 'Demo code',
  demoSubmit: 'Enter Demo',
  demoHint: 'Use always 000000 for Demo.',
  busy: 'Connecting…',
}

describe('shared professional access panel', () => {
  it('renders the same trusted access surface for Partner and Test Network', () => {
    const html = renderToStaticMarkup(<ProfessionalAccessPanel
      mode="trusted"
      copy={copy}
      email=""
      emailCode=""
      onEmailChange={() => undefined}
      onEmailCodeChange={() => undefined}
      onGoogle={() => undefined}
      onRequestEmailCode={() => undefined}
      onVerifyEmailCode={() => undefined}
      onPasskey={() => undefined}
    />)

    expect(html).toContain('Sign in with Google')
    expect(html).toContain('Send email code')
    expect(html).toContain('Use an existing passkey')
    expect(html).not.toContain('000000')
  })

  it('renders Demo without Google, email delivery or passkey', () => {
    const html = renderToStaticMarkup(<ProfessionalAccessPanel
      mode="demo"
      copy={copy}
      email="demo@example.org"
      emailCode="000000"
      onEmailChange={() => undefined}
      onEmailCodeChange={() => undefined}
      onDemo={() => undefined}
    />)

    expect(html).toContain('Use always 000000 for Demo.')
    expect(html).toContain('pattern="[0-9]{6}"')
    expect(html).not.toContain('Sign in with Google')
    expect(html).not.toContain('Send email code')
    expect(html).not.toContain('Use an existing passkey')
  })

  it('does not advertise passkey entry when the host has no WebAuthn adapter', () => {
    const html = renderToStaticMarkup(<ProfessionalAccessPanel
      mode="trusted" copy={copy} email="" emailCode=""
      onEmailChange={() => undefined} onEmailCodeChange={() => undefined}
      onGoogle={() => undefined} onRequestEmailCode={() => undefined} onVerifyEmailCode={() => undefined}
    />)
    expect(html).not.toContain(copy.passkey)
    expect(html).not.toContain(copy.passkeyHint)
  })
})
