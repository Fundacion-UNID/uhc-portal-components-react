// TDD contract: write this test red first; make it green only with the complete real behavior.
/**
 * Flow contract: all portal brands share safe device preference resolution.
 */
import { describe, expect, it } from 'vitest'
import {
  resolvePortalUiDensity,
  resolvePortalUiTheme,
  resolveRenderedPortalTheme,
} from '../src/preferences.js'

describe('shared portal preferences', () => {
  it('uses safe defaults for unknown persisted values', () => {
    expect(resolvePortalUiDensity('x')).toBe('medium')
    expect(resolvePortalUiTheme('blue')).toBe('system')
  })

  it('resolves system theme without changing the preference contract', () => {
    expect(resolveRenderedPortalTheme('system', true)).toBe('dark')
    expect(resolveRenderedPortalTheme('system', false)).toBe('light')
  })
})
