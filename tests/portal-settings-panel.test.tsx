// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PortalSettingsPanel } from '../src/PortalSettingsPanel.js'

afterEach(() => localStorage.clear())

describe('PortalSettingsPanel', () => {
  it('persists only presentation preferences and leaves product policy to children', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    render(<PortalSettingsPanel
      copy={{ title: 'Settings', description: 'Account', security: 'Security', appearance: 'Appearance', theme: 'Theme', textSize: 'Text', language: 'Language', legal: 'Legal', themes: { light: 'Light', dark: 'Dark', system: 'System' }, densities: { small: 'Small', medium: 'Medium', large: 'Large' } }}
      storageNamespace="test-portal"
      languageOptions={[{ id: 'en', label: 'English', href: '/en', current: true }]}
      legalLinks={[{ id: 'terms', label: 'Terms', href: '/en/legal/terms' }]}
    ><p>Secondary-use policy</p></PortalSettingsPanel>)
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }))
    expect(localStorage.getItem('test-portal.theme')).toBe('dark')
    expect(screen.getByText('Secondary-use policy')).toBeTruthy()
  })
})
