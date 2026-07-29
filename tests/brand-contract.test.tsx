/**
 * Flow contract: UHC and VetChain render the same portal modules; a brand
 * adapter may alter only visual identity, product copy and destinations.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  PortalAccessChooser,
  PortalEntryHero,
  type PortalAccessOption,
  type PortalBrand,
} from '../src/index.js'

const options: readonly PortalAccessOption[] = [
  {
    id: 'partner',
    href: '/es/partner',
    title: 'Partners',
    description: 'Presenta un proyecto.',
    requirement: 'Revisión requerida',
  },
  {
    id: 'test-network',
    href: '/es/test-network',
    title: 'Test Network',
    description: 'Prueba una integración.',
    requirement: 'Sin revisión del proyecto',
  },
]

function renderEntry(brand: PortalBrand) {
  return renderToStaticMarkup(
    <>
      <PortalEntryHero
        brand={brand}
        eyebrow="Acceso profesional"
        title="Conecta tu proyecto"
        description="Descripción de producto"
      />
      <PortalAccessChooser label="Tipo de acceso" options={options} />
    </>,
  )
}

describe('brand-only portal composition', () => {
  it('keeps identical professional structure for UHC and VetChain', () => {
    const uhc = renderEntry({
      family: 'professional',
      productName: 'UNID Professional',
      organizationName: 'Fundación UNID',
      homeHref: '/es',
      logoText: 'UHC',
    })
    const vet = renderEntry({
      family: 'professional',
      productName: 'VetChain Professional',
      organizationName: 'VetChain',
      homeHref: '/es',
      logoText: 'VET',
    })

    expect(uhc.replaceAll('UNID Professional', 'PRODUCT').replaceAll('Fundación UNID', 'ORG').replaceAll('UHC', 'LOGO'))
      .toBe(vet.replaceAll('VetChain Professional', 'PRODUCT').replaceAll('VetChain', 'ORG').replaceAll('VET', 'LOGO'))
  })

  it('uses real links for every access path', () => {
    const markup = renderEntry({
      family: 'professional',
      productName: 'UNID Professional',
      organizationName: 'Fundación UNID',
      homeHref: '/es',
      logoText: 'UHC',
    })

    expect(markup).toContain('href="/es/partner"')
    expect(markup).toContain('href="/es/test-network"')
  })
})
