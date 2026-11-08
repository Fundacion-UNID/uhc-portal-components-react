import {
  portalUiDensities,
  portalUiThemes,
  type PortalUiDensity,
  type PortalUiTheme,
} from './contracts.js'

const preferenceEvent = 'portal-ui-preferences-changed'
type PreferenceKind = 'theme' | 'density'

/** Device UI notification only; values are always reread through the resolvers. */
export function notifyPortalUiPreferencesChanged(namespace: string, kind: PreferenceKind): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(preferenceEvent,{detail:{namespace,kind}}))
}

export function subscribePortalUiPreferences(namespace: string, changed: (kind: PreferenceKind) => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  const local = (event: Event) => {
    const detail = (event as CustomEvent<{namespace?:string;kind?:string}>).detail
    if (detail?.namespace === namespace && (detail.kind === 'theme' || detail.kind === 'density')) changed(detail.kind)
  }
  const external = (event: StorageEvent) => {
    if (event.storageArea !== localStorage) return
    if (event.key === null || event.key === `${namespace}.theme`) changed('theme')
    if (event.key === null || event.key === `${namespace}.density`) changed('density')
  }
  window.addEventListener(preferenceEvent,local)
  window.addEventListener('storage',external)
  return () => {window.removeEventListener(preferenceEvent,local);window.removeEventListener('storage',external)}
}

/** One DOM/theme bridge for both the person menu and the full Preferences page. */
export function observePortalUiTheme(theme: PortalUiTheme): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => undefined
  const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : undefined
  const apply = () => {
    const rendered = resolveRenderedPortalTheme(theme,media?.matches === true)
    document.documentElement.dataset.theme = rendered
    document.documentElement.classList.toggle('dark',rendered === 'dark')
    document.documentElement.classList.toggle('light',rendered === 'light')
    document.documentElement.style.colorScheme = rendered
  }
  apply()
  media?.addEventListener?.('change',apply)
  return () => media?.removeEventListener?.('change',apply)
}

export function resolvePortalUiDensity(value: string | null): PortalUiDensity {
  return portalUiDensities.includes(value as PortalUiDensity)
    ? value as PortalUiDensity
    : 'medium'
}

export function resolvePortalUiTheme(value: string | null): PortalUiTheme {
  return portalUiThemes.includes(value as PortalUiTheme)
    ? value as PortalUiTheme
    : 'system'
}

export function resolveRenderedPortalTheme(
  theme: PortalUiTheme,
  prefersDark: boolean,
): 'light' | 'dark' {
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
}
