/**
 * Flow contract: while a portal is resolving authenticated data, the shared
 * shell renders a neutral animated placeholder and never an empty or stale
 * business state; assistive technology receives one localized loading status.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PortalLoadingSkeleton } from '../src/PortalLoadingSkeleton.js'

describe('PortalLoadingSkeleton', () => {
  it('renders an accessible loading surface without business-state copy', () => {
    const html = renderToStaticMarkup(<PortalLoadingSkeleton label="Loading your cards" rows={3} />)

    expect(html).toContain('role="status"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('Loading your cards')
    expect(html.match(/uhcp-loading-row/g)).toHaveLength(3)
    expect(html).not.toMatch(/No cards|No data|Empty/)
  })
})
