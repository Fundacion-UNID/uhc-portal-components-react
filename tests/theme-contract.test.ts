// TDD contract: write this test red first; make it green only with the complete real behavior.
/**
 * Flow contract: dark mode changes surfaces and readable text, while primary
 * buttons and selected controls keep the exact UHC Personal action gradient.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

describe('shared light and dark color contract', () => {
  it('keeps action gradient tokens outside the dark override', () => {
    const darkBlock = css.match(/html\[data-theme='dark'\]\s*\{([^}]+)\}/)?.[1]

    expect(darkBlock).toBeTruthy()
    expect(css).toContain('--uhcp-action-start: hsl(184 74% 34% / .96)')
    expect(css).toContain('--uhcp-action-end: hsl(214 70% 42% / .9)')
    expect(darkBlock).not.toContain('--uhcp-action-start')
    expect(darkBlock).not.toContain('--uhcp-action-end')
  })

  it('uses the corrected UHC Personal dark text and surface tokens', () => {
    expect(css).toContain('--uhcp-text: hsl(196 28% 94%)')
    expect(css).toContain('--uhcp-muted: hsl(204 15% 70%)')
    expect(css).toContain('--uhcp-panel: hsl(218 38% 13%)')
  })
})
