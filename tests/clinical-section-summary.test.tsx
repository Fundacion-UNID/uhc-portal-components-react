import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ClinicalSectionSummary } from '../src/ClinicalSectionSummary.js'

describe('ClinicalSectionSummary', () => {
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
})
