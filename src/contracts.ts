import type { CSSProperties } from 'react'

export const portalUiDensities = ['small', 'medium', 'large'] as const
export type PortalUiDensity = (typeof portalUiDensities)[number]

export const portalUiThemes = ['light', 'dark', 'system'] as const
export type PortalUiTheme = (typeof portalUiThemes)[number]

export type PortalBrandAsset = Readonly<{
  src: string
  alt: string
  width: number
  height: number
}>

/**
 * Official artwork selected from the surface where it is rendered.
 *
 * A portal must preserve the asset's intrinsic proportions. The shared shell
 * never reconstructs a brand from text or forces artwork into a generic shape.
 */
export type PortalBrandArtworkSet = Readonly<{
  darkSurface: PortalBrandAsset
  lightSurface: PortalBrandAsset
}>

export type PortalBrand = Readonly<{
  /** Product family is presentation metadata, never an authorization input. */
  family: 'personal' | 'professional'
  productName: string
  organizationName: string
  homeHref: string
  /** Compact official mark for navigation chrome. */
  mark?: PortalBrandArtworkSet
  /** Optional official hero artwork; the compact mark is used when omitted. */
  heroArtwork?: PortalBrandArtworkSet
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

/** Human-readable metadata for a host-authorized profile or subject target. */
export type ProfileProtectionTargetV2 = Readonly<{
  eyebrow: string
  title: string
  subtitle?: string
  icon?: PortalBrandAsset
  badges?: readonly string[]
  details?: readonly Readonly<{ label: string; value: string }>[]
}>

export type ProfileProtectionCopyV2 = ProfileProtectionCopy & Readonly<{
  unlockWithPasskey: string
  usePinInstead: string
}>
