import type { ReactNode } from 'react'
import {
  PortalHeader,
  type PortalHeaderProps,
} from './PortalHeader.js'
import {
  ProfileProtectionGate,
  type ProfileProtectionGateProps,
} from './ProfileProtectionGate.js'
import { PortalCurrentSubjectProvider } from './PortalCurrentSubject.js'

export type PortalShellProps = Readonly<{
  header: PortalHeaderProps
  profileProtection?: Omit<ProfileProtectionGateProps, 'children'>
  children: ReactNode
  backAction?: Readonly<{ label: string; href: string }>
  assistantAction?: Readonly<{ label: string; onSelect: () => void }>
}>

/**
 * Brand-neutral portal chrome shared by personal and professional products.
 *
 * Ordered flow:
 * 1. Keep account and device preferences available in the persistent header.
 * 2. Fail closed behind the host-supplied protected-profile state.
 * 3. Render product-owned content only after the host reports an unlocked
 *    profile, or immediately when that route explicitly needs no profile.
 *
 * Authentication, authorization, PIN verification and actor selection remain
 * host responsibilities. Product brands may change tokens and copy only.
 */
export function PortalShell({
  header,
  profileProtection,
  children,
  backAction,
  assistantAction,
}: PortalShellProps) {
  const content = profileProtection
    ? <ProfileProtectionGate {...profileProtection}>{children}</ProfileProtectionGate>
    : children

  return (
    <PortalCurrentSubjectProvider><div className="uhcp-shell" data-portal-family={header.brand.family} style={header.brand.variables}>
      <PortalHeader {...header} />
      <main className="uhcp-main">{content}</main>
      {backAction && (
        <a className="uhcp-floating-action uhcp-floating-back" href={backAction.href} aria-label={backAction.label}>
          <span aria-hidden="true">←</span>
        </a>
      )}
      {assistantAction && (
        <button
          className="uhcp-floating-action uhcp-floating-assistant"
          type="button"
          onClick={assistantAction.onSelect}
          aria-label={assistantAction.label}
        >
          <span aria-hidden="true">✦</span>
          <span>{assistantAction.label}</span>
        </button>
      )}
    </div></PortalCurrentSubjectProvider>
  )
}
