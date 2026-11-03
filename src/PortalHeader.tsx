'use client'

import { useEffect, useRef, useState } from 'react'
import {
  portalUiDensities,
  portalUiThemes,
  type PortalBrand,
  type PortalAccountOption,
  type PortalLanguageOption,
  type PortalMenuAction,
  type PortalShellCopy,
  type PortalUiDensity,
  type PortalUiTheme,
} from './contracts.js'
import {
  resolvePortalUiDensity,
  resolvePortalUiTheme,
  resolveRenderedPortalTheme,
} from './preferences.js'
import { PortalBrandArtwork } from './PortalBrandArtwork.js'
import { ProfileIdentityIcon } from './ProfileIdentityTarget.js'
import {
  PortalCurrentSubjectControl,
  PortalCurrentSubjectSlot,
  type PortalCurrentSubjectRegistration,
} from './PortalCurrentSubject.js'

export type PortalHeaderProps = Readonly<{
  brand: PortalBrand
  copy: PortalShellCopy
  accountIdentifier?: string | null
  languageHref?: string
  languageOptions?: readonly PortalLanguageOption[]
  guestActionHref: string
  accountOptions?: readonly PortalAccountOption[]
  onSelectAccount?: (id: string) => void
  menuActions?: readonly PortalMenuAction[]
  onSignOut?: () => void | Promise<void>
  onThemeChange?: (theme: PortalUiTheme) => void
  storageNamespace?: string
  currentSubject?: PortalCurrentSubjectRegistration
}>

/**
 * Shared account/preferences header.
 *
 * Authentication is deliberately supplied as data and callbacks. The
 * component never imports Firebase and never treats browser state as a role.
 */
export function PortalHeader({
  brand,
  copy,
  accountIdentifier,
  languageHref,
  languageOptions = [],
  guestActionHref,
  accountOptions = [],
  onSelectAccount,
  menuActions = [],
  onSignOut,
  onThemeChange,
  storageNamespace = 'uhc-portal',
  currentSubject,
}: PortalHeaderProps) {
  const [open, setOpen] = useState(false)
  const [density, setDensity] = useState<PortalUiDensity>('medium')
  const [theme, setTheme] = useState<PortalUiTheme>('system')
  const ref = useRef<HTMLDivElement>(null)
  const densityKey = `${storageNamespace}.density`
  const themeKey = `${storageNamespace}.theme`

  useEffect(() => {
    const savedDensity = resolvePortalUiDensity(localStorage.getItem(densityKey))
    const savedTheme = resolvePortalUiTheme(localStorage.getItem(themeKey))
    setDensity(savedDensity)
    setTheme(savedTheme)
    document.documentElement.dataset.density = savedDensity
  }, [densityKey, themeKey])

  useEffect(() => {
    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : undefined
    const apply = () => {
      const rendered = resolveRenderedPortalTheme(theme, media?.matches === true)
      document.documentElement.dataset.theme = rendered
      document.documentElement.classList.toggle('dark', rendered === 'dark')
      document.documentElement.classList.toggle('light', rendered === 'light')
      document.documentElement.style.colorScheme = rendered
    }
    apply()
    media?.addEventListener('change', apply)
    return () => media?.removeEventListener('change', apply)
  }, [theme])

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    window.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      window.removeEventListener('keydown', closeEscape)
    }
  }, [])

  function changeDensity(value: PortalUiDensity) {
    setDensity(value)
    localStorage.setItem(densityKey, value)
    document.documentElement.dataset.density = value
  }

  function changeTheme(value: PortalUiTheme) {
    setTheme(value)
    localStorage.setItem(themeKey, value)
    onThemeChange?.(value)
  }

  return (
    <header className="uhcp-header" style={brand.variables}>
      {brand.mark && brand.markHref ? (
        <div className="uhcp-brand">
          <a className="uhcp-brand-mark-link" href={brand.markHref} aria-label={brand.productName}>
            <PortalBrandArtwork artwork={brand.mark} className="uhcp-brand-mark" />
          </a>
          <a className="uhcp-brand-copy" href={brand.homeHref} aria-label={copy.home}>
            <span>
              <strong>{brand.productName}</strong>
              <small className={accountIdentifier ? 'uhcp-brand-account' : undefined}>
                {accountIdentifier || brand.organizationName}
              </small>
            </span>
          </a>
        </div>
      ) : (
        <a className="uhcp-brand" href={brand.homeHref} aria-label={copy.home}>
          {brand.mark ? (
            <PortalBrandArtwork artwork={brand.mark} className="uhcp-brand-mark" />
          ) : null}
          <span>
            <strong>{brand.productName}</strong>
            <small className={accountIdentifier ? 'uhcp-brand-account' : undefined}>
              {accountIdentifier || brand.organizationName}
            </small>
          </span>
        </a>
      )}
      {currentSubject
        ? <PortalCurrentSubjectControl {...currentSubject} />
        : <PortalCurrentSubjectSlot />}
      <div className="uhcp-account-menu" ref={ref}>
        <button
          type="button"
          className="uhcp-trigger"
          onClick={() => setOpen((value) => !value)}
          aria-label={copy.accountAndPreferences}
          aria-expanded={open}
        >
          <ProfileIdentityIcon />
        </button>
        {open && (
          <section className="uhcp-menu" aria-label={copy.accountAndPreferences}>
            <div className="uhcp-account-state">
              <strong>{copy.accountAndPreferences}</strong>
              <small>{accountIdentifier || copy.notSignedIn}</small>
            </div>
            {accountOptions.length > 0 && (
              <div className="uhcp-account-options">
                {accountOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    disabled={option.disabled}
                    aria-pressed={Boolean(option.selected)}
                    onClick={() => {
                      onSelectAccount?.(option.id)
                      setOpen(false)
                    }}
                  >
                    <span>{option.label}</span>
                    {option.description && <small>{option.description}</small>}
                  </button>
                ))}
              </div>
            )}
            <PreferenceGroup label={copy.appearance}>
              {portalUiThemes.map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={theme === value}
                  onClick={() => changeTheme(value)}
                >
                  <span aria-hidden="true">{value === 'light' ? '☀' : value === 'dark' ? '☾' : '◫'}</span>
                  {copy.themes[value]}
                </button>
              ))}
            </PreferenceGroup>
            <PreferenceGroup label={copy.textSize}>
              {portalUiDensities.map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={density === value}
                  onClick={() => changeDensity(value)}
                >
                  {value === 'small' ? 'S' : value === 'medium' ? 'M' : 'L'}
                </button>
              ))}
            </PreferenceGroup>
            <div className="uhcp-menu-actions">
              {languageOptions.length > 0
                ? languageOptions.map((option) => (
                    <a
                      href={option.href}
                      key={option.id}
                      hrefLang={option.id}
                      aria-current={option.current ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                    >
                      ◎ {option.label}
                    </a>
                  ))
                : languageHref && <a href={languageHref} onClick={() => setOpen(false)}>◎ {copy.language}</a>}
              {menuActions.map((action) => action.href
                ? (
                    <a href={action.href} key={action.id} onClick={() => setOpen(false)}>
                      {action.label}
                    </a>
                  )
                : (
                    <button
                      type="button"
                      key={action.id}
                      onClick={() => {
                        setOpen(false)
                        void action.onSelect?.()
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
              {accountIdentifier && onSignOut
                ? <button type="button" onClick={() => { setOpen(false); void onSignOut() }}>↪ {copy.signOut}</button>
                : <a href={guestActionHref} onClick={() => setOpen(false)}><ProfileIdentityIcon /> {copy.chooseAccess}</a>}
            </div>
          </section>
        )}
      </div>
    </header>
  )
}

function PreferenceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <fieldset className="uhcp-preferences"><legend>{label}</legend><div>{children}</div></fieldset>
}
