// TDD contract: write this test red first; make it green only with the complete real behavior.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ClinicalSectionSummary } from '../src/ClinicalSectionSummary.js'

describe('ClinicalSectionSummary', () => {
  it('keeps section creation outside resources and resource actions inside their card', () => {
    const html = renderToStaticMarkup(
      <ClinicalSectionSummary
        code="8716-3"
        title="Vital signs"
        emptyLabel="No entries"
        actions={<button type="button" aria-label="Add vital sign">+</button>}
        resources={[{
          key: 'Observation/oxygen-saturation',
          title: 'Oxygen saturation',
          resourceType: 'Observation',
          actions: <button type="button" aria-label="Edit oxygen saturation">Edit</button>,
        }]}
      />,
    )

    const header = html.match(/<header>(.*?)<\/header>/)?.[1] ?? ''
    const card = html.match(/<article[^>]*>(.*?)<\/article>/)?.[1] ?? ''
    expect(header).toContain('Add vital sign')
    expect(header).not.toContain('Edit oxygen saturation')
    expect(card).toContain('Edit oxygen saturation')
    expect(card).not.toContain('Add vital sign')
  })

  it('renders resolved human labels without deriving titles from terminology ids', () => {
    const html = renderToStaticMarkup(
      <ClinicalSectionSummary
        code="http://loinc.org|48765-2"
        title="Alergias e intolerancias"
        emptyLabel="Sin registros"
        resources={[{
          key: 'AllergyIntolerance/penicillin',
          title: 'Penicilina',
          resourceType: 'AllergyIntolerance',
          date: '2009-06-14',
        }]}
      />,
    )

    expect(html).toContain('Penicilina')
    expect(html).not.toContain('http://snomed.info/sct|373270004')
    expect(html).toContain('data-resource-type="AllergyIntolerance"')
  })

  it('can reuse only the shared card body below a host-owned section header', () => {
    const html = renderToStaticMarkup(
      <ClinicalSectionSummary
        code="48765-2"
        title="Allergies"
        resources={[{
          key: 'AllergyIntolerance/allergy-1',
          title: 'Penicillin',
          resourceType: 'AllergyIntolerance',
        }]}
        emptyLabel="No entries"
        showHeader={false}
      />,
    )

    expect(html).toContain('aria-label="Allergies"')
    expect(html).not.toContain('<header>')
    expect(html).toContain('<bdi>Penicillin</bdi>')
  })
})
