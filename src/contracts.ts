import type { CSSProperties, ReactNode } from 'react'

export const portalUiDensities = ['small', 'medium', 'large'] as const
export type PortalUiDensity = (typeof portalUiDensities)[number]

export const portalUiThemes = ['light', 'dark', 'system'] as const
export type PortalUiTheme = (typeof portalUiThemes)[number]

export type PortalBrand = Readonly<{
  /** Product family is presentation metadata, never an authorization input. */
  family: 'personal' | 'professional'
  productName: string
  organizationName: string
  homeHref: string
  logoText?: string
  logo?: ReactNode
  variables?: CSSProperties
}>

export type PortalLanguageOption = Readonly<{
  id: string
  label: string
  href: string
  current?: boolean
}>

export type PortalAccountOption = Readonly<{
  id: string
  label: string
  description?: string
  selected?: boolean
  disabled?: boolean
}>

export type PortalMenuAction = Readonly<{
  id: string
  label: string
  href?: string
  onSelect?: () => void | Promise<void>
}>

export type PortalAccessOption = Readonly<{
  id: string
  href: string
  title: string
  description: string
  requirement: string
}>

export type PortalShellCopy = Readonly<{
  home: string
  accountAndPreferences: string
  notSignedIn: string
  appearance: string
  textSize: string
  themes: Record<PortalUiTheme, string>
  language: string
  chooseAccess: string
  signOut: string
}>

export type ProfileProtectionState =
  | 'not-required'
  | 'checking'
  | 'setup-required'
  | 'locked'
  | 'unavailable'

export type ProfileUnlockResult =
  | 'unlocked'
  | 'invalid-pin'
  | 'temporarily-locked'
  | 'unavailable'

export type ProfileProtectionCopy = Readonly<{
  checkingTitle: string
  checkingBody: string
  setupTitle: string
  setupBody: string
  unavailableTitle: string
  unavailableBody: string
  unlockTitle: string
  unlockBody: string
  pinLabel: string
  pinRequired: string
  invalidPin: string
  temporarilyLocked: string
  unlockUnavailable: string
  unlock: string
  retry: string
}>
