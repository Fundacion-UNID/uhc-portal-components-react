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

const uhcMark = {
  lightSurface: { src: '/logos/uhc.svg', alt: 'UHC', width: 100, height: 100 },
  darkSurface: { src: '/logos/uhc.svg', alt: 'UHC', width: 100, height: 100 },
} as const

const vetMark = {
  lightSurface: { src: '/logos/vetchain-paw-light.png', alt: '', width: 68, height: 65 },
  darkSurface: { src: '/logos/vetchain-paw-dark.png', alt: '', width: 68, height: 65 },
} as const

describe('brand-only portal composition', () => {
  it('keeps identical professional structure for UHC and VetChain', () => {
    const uhc = renderEntry({
      family: 'professional',
      productName: 'UNID Professional',
      organizationName: 'Fundación UNID',
      homeHref: '/es',
      mark: uhcMark,
    })
    const vet = renderEntry({
      family: 'professional',
      productName: 'VetChain Professional',
      organizationName: 'VetChain',
      homeHref: '/es',
      mark: vetMark,
    })

    expect(uhc).toContain('src="/logos/uhc.svg"')
    expect(vet).toContain('src="/logos/vetchain-paw-light.png"')
    expect(uhc).not.toContain('>UHC<')
    expect(vet).not.toContain('>VET<')
  })

  it('uses real links for every access path', () => {
    const markup = renderEntry({
      family: 'professional',
      productName: 'UNID Professional',
      organizationName: 'Fundación UNID',
      homeHref: '/es',
      mark: uhcMark,
    })

    expect(markup).toContain('href="/es/partner"')
    expect(markup).toContain('href="/es/test-network"')
  })

  it('renders light and dark official variants at intrinsic proportions', () => {
    const markup = renderEntry({
      family: 'professional',
      productName: 'VetChain Professional',
      organizationName: 'VetChain',
      homeHref: '/es',
      mark: vetMark,
    })

    expect(markup).toContain('width="68"')
    expect(markup).toContain('height="65"')
    expect(markup).toContain('uhcp-brand-artwork-light')
    expect(markup).toContain('uhcp-brand-artwork-dark')
  })
})
