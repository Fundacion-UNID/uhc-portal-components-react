'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  portalUiDensities,
  portalUiThemes,
  type PortalLanguageOption,
  type PortalMenuAction,
  type PortalUiDensity,
  type PortalUiTheme,
} from './contracts.js'
import { resolvePortalUiDensity, resolvePortalUiTheme, resolveRenderedPortalTheme } from './preferences.js'

export type PortalSettingsCopy = Readonly<{
  title: string
  description: string
  security: string
  appearance: string
  theme: string
  textSize: string
  language: string
  legal: string
  themes: Record<PortalUiTheme, string>
  densities: Record<PortalUiDensity, string>
}>

export type PortalSettingsLink = Readonly<{ id: string; label: string; href: string }>

export type PortalSettingsPanelProps = Readonly<{
  copy: PortalSettingsCopy
  storageNamespace: string
  languageOptions: readonly PortalLanguageOption[]
  securityActions?: readonly PortalMenuAction[]
  legalLinks: readonly PortalSettingsLink[]
  children?: ReactNode
}>

/** Shared settings surface. Product-specific privacy controls enter as children. */
export function PortalSettingsPanel({
  copy,
  storageNamespace,
  languageOptions,
  securityActions = [],
  legalLinks,
  children,
}: PortalSettingsPanelProps) {
  const [theme, setTheme] = useState<PortalUiTheme>('system')
  const [density, setDensity] = useState<PortalUiDensity>('medium')
  const themeKey = `${storageNamespace}.theme`
  const densityKey = `${storageNamespace}.density`

  useEffect(() => {
    setTheme(resolvePortalUiTheme(localStorage.getItem(themeKey)))
    setDensity(resolvePortalUiDensity(localStorage.getItem(densityKey)))
  }, [densityKey, themeKey])

  function changeTheme(value: PortalUiTheme) {
    setTheme(value)
    localStorage.setItem(themeKey, value)
    const rendered = resolveRenderedPortalTheme(value, matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = rendered
    document.documentElement.style.colorScheme = rendered
  }

  function changeDensity(value: PortalUiDensity) {
    setDensity(value)
    localStorage.setItem(densityKey, value)
    document.documentElement.dataset.density = value
  }

  return (
    <main className="uhcp-settings">
      <header><h1>{copy.title}</h1><p>{copy.description}</p></header>
      <section><h2>{copy.security}</h2><div className="uhcp-settings-links">{securityActions.map((action) => action.href
        ? <a href={action.href} key={action.id}>{action.label}</a>
        : <button type="button" key={action.id} onClick={() => void action.onSelect?.()}>{action.label}</button>)}</div></section>
      {children}
      <section><h2>{copy.appearance}</h2>
        <fieldset><legend>{copy.theme}</legend>{portalUiThemes.map((value) => <button type="button" key={value} aria-pressed={theme === value} onClick={() => changeTheme(value)}>{copy.themes[value]}</button>)}</fieldset>
        <fieldset><legend>{copy.textSize}</legend>{portalUiDensities.map((value) => <button type="button" key={value} aria-pressed={density === value} onClick={() => changeDensity(value)}>{copy.densities[value]}</button>)}</fieldset>
      </section>
      <section><h2>{copy.language}</h2><div className="uhcp-settings-links">{languageOptions.map((option) => <a key={option.id} href={option.href} hrefLang={option.id} aria-current={option.current ? 'page' : undefined}>{option.label}</a>)}</div></section>
      <section><h2>{copy.legal}</h2><div className="uhcp-settings-links">{legalLinks.map((link) => <a key={link.id} href={link.href}>{link.label}</a>)}</div></section>
    </main>
  )
}
