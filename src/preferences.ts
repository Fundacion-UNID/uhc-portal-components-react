import {
  portalUiDensities,
  portalUiThemes,
  type PortalUiDensity,
  type PortalUiTheme,
} from './contracts.js'

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
