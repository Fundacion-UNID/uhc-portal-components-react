// Flow contract: every personal or professional portal shows the verified login below the application name, keeps the current subject separate, and renders an icon-only account trigger.

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
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
})
