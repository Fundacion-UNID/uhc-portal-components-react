// Flow contract: clinical actions use compact familiar icons while preserving complete accessible names and disabled authorization states.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ClinicalActionButton } from '../src/ClinicalActionButton'

describe('ClinicalActionButton', () => {
  it('renders an icon-only action with an accessible label', () => {
    const html = renderToStaticMarkup(<ClinicalActionButton kind="edit" label="Edit allergy" onClick={() => undefined}/>)
    expect(html).toContain('aria-label="Edit allergy"')
    expect(html).toContain('<svg')
    expect(html).not.toContain('>Edit allergy<')
  })

  it('preserves disabled state supplied by the authorized host', () => {
    const html = renderToStaticMarkup(<ClinicalActionButton kind="delete" label="Delete allergy" disabled onClick={() => undefined}/>)
    expect(html).toContain('disabled=""')
  })
})
