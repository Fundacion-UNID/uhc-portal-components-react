// Flow contract: every portal receives the same S/M/L typography scale from
// the shared stylesheet; brand themes may override semantic tokens explicitly.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const styles = readFileSync(resolve(import.meta.dirname, '..', 'src', 'styles.css'), 'utf8')

describe('shared portal typography contract', () => {
  it('publishes one semantic display and section scale for each density', () => {
    expect(styles).toContain('--uhcp-display-title-size: clamp(3rem, 4vw, 4rem);')
    expect(styles).toContain('--uhcp-section-title-size: clamp(2.25rem, 3vw, 3rem);')
    expect(styles).toContain('--uhcp-display-title-size: clamp(2.5rem, 3.3vw, 3.25rem);')
    expect(styles).toContain('--uhcp-section-title-size: clamp(2rem, 2.5vw, 2.5rem);')
    expect(styles).toContain('--uhcp-display-title-size: clamp(3rem, 4.6vw, 4rem);')
    expect(styles).toContain('--uhcp-section-title-size: clamp(2.25rem, 3.6vw, 3rem);')
  })

  it('documents explicit custom themes as the only brand override point', () => {
    expect(styles).toContain('.custom-theme-<brand>')
  })
})
