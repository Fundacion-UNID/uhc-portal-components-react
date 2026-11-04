// Flow contract: every personal or professional portal shows the verified login below the application name, keeps the current subject separate, and renders an icon-only account trigger.
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { PortalHeader } from '../src/PortalHeader.js'

const brand = {
  family: 'personal',
  productName: 'Configured Personal Portal',
  organizationName: 'Configured Organization',
  homeHref: '/en/home',
  mark: {
    lightSurface: { src: '/mark.svg', alt: '', width: 40, height: 40 },
    darkSurface: { src: '/mark.svg', alt: '', width: 40, height: 40 },
  },
} as const

const copy = {
  home: 'Home',
  accountAndPreferences: 'Account and preferences',
  notSignedIn: 'Not signed in',
  appearance: 'Appearance',
  textSize: 'Text size',
  themes: { light: 'Light', dark: 'Dark', system: 'System' },
  language: 'Language',
  chooseAccess: 'Choose access',
  signOut: 'Sign out',
} as const

afterEach(() => {
  cleanup()
  document.documentElement.classList.remove('light', 'dark')
  delete document.documentElement.dataset.theme
  localStorage.clear()
})

describe('shared authenticated portal header', () => {
  it('places the login identifier with the brand and keeps it out of the icon-only account trigger', () => {
    const markup = renderToStaticMarkup(<PortalHeader
      brand={brand}
      copy={copy}
      accountIdentifier="person@example.org"
      guestActionHref="/en/login"
      currentSubject={{
        subject: { id: 'subject-1', displayName: 'Current subject' },
        labels: { current: 'Current subject', change: 'Change subject' },
        canChange: false,
      }}
    />)

    const brandMarkup = markup.match(/<a class="uhcp-brand"[\s\S]*?<\/a>/)?.[0] || ''
    const triggerMarkup = markup.match(/<button type="button" class="uhcp-trigger"[\s\S]*?<\/button>/)?.[0] || ''

    expect(brandMarkup).toContain('Configured Personal Portal')
    expect(brandMarkup).toContain('person@example.org')
    expect(triggerMarkup).not.toContain('person@example.org')
    expect(triggerMarkup).not.toContain('⌄')
    expect(markup.indexOf('Current subject')).toBeLessThan(markup.indexOf('uhcp-account-menu'))
  })

  it('keeps rendering when the host does not expose the optional matchMedia API', () => {
    const originalMatchMedia = window.matchMedia
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined })

    expect(() => render(<PortalHeader
      brand={brand}
      copy={copy}
      accountIdentifier="person@example.org"
      guestActionHref="/en/login"
    />)).not.toThrow()

    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia })
  })

  it('keeps class-based host themes synchronized with the shared data-theme contract', async () => {
    document.documentElement.classList.add('light')
    render(<PortalHeader
      brand={brand}
      copy={copy}
      accountIdentifier="person@example.org"
      guestActionHref="/en/login"
    />)

    fireEvent.click(screen.getByRole('button', { name: 'Account and preferences' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }))

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })
  })

  it('does not invent brand artwork when a deployment provides no official mark', () => {
    const brandWithoutMark = {
      family: 'personal',
      productName: 'Configured Personal Portal',
      organizationName: 'Configured Organization',
      homeHref: '/en/home',
    } as const

    const { container } = render(<PortalHeader
      brand={brandWithoutMark}
      copy={copy}
      accountIdentifier="person@example.org"
      guestActionHref="/en/login"
    />)

    expect(container.querySelector('.uhcp-brand-mark')).toBeNull()
  })

  it('can send the official mark to the product website while the product name returns to the current portal', () => {
    render(<PortalHeader
      brand={{ ...brand, markHref: 'https://soschain.app' }}
      copy={copy}
      guestActionHref="/en/login"
    />)

    expect(screen.getByRole('link', { name: 'Configured Personal Portal' }).getAttribute('href'))
      .toBe('https://soschain.app')
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href'))
      .toBe('/en/home')
  })

  it('renders the language selector inside account preferences for a signed-out user', () => {
    render(<PortalHeader
      brand={brand}
      copy={copy}
      guestActionHref="/en/login"
      languageOptions={[
        { id: 'en', label: 'English', href: '/en/test-network', current: true },
        { id: 'es', label: 'Español', href: '/es/test-network' },
      ]}
    />)

    expect(screen.queryByRole('combobox', { name: 'Language' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Choose access' }))

    const selector = screen.getByRole('combobox', { name: 'Language' }) as HTMLSelectElement
    expect(selector.value).toBe('/en/test-network')
    expect(screen.getByRole('option', { name: 'Español' }).getAttribute('value')).toBe('/es/test-network')
    expect(screen.queryByRole('group', { name: 'Appearance' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Text size' })).toBeNull()
  })

  it('shows language in signed-in preferences only when the host enables it', () => {
    const props = {
      brand,
      copy,
      accountIdentifier: 'person@example.org',
      guestActionHref: '/en/login',
      languageOptions: [
        { id: 'en', label: 'English', href: '/en/home', current: true },
        { id: 'es', label: 'Español', href: '/es/home' },
      ],
    } as const
    const { rerender } = render(<PortalHeader {...props} />)

    fireEvent.click(screen.getByRole('button', { name: 'Account and preferences' }))
    expect(screen.queryByRole('combobox', { name: 'Language' })).toBeNull()

    rerender(<PortalHeader {...props} languageInPreferences />)
    expect(screen.getByRole('combobox', { name: 'Language' })).not.toBeNull()
  })
})
