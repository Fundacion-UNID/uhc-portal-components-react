// Flow contract: SOSChain prints the same two-sided smart identity card in PetChain/VetChain and SOSChain; face A resolves only the DID, while face B renders only a provider-supplied signed SHC-like identity QR and canonical telephone identifiers.
import { renderToStaticMarkup } from 'react-dom/server'
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  AnimalCardArtifact,
  SoschainSmartIdentityCardArtifact,
} from '../src/AnimalCardArtifact.js'

describe('AnimalCardArtifact', () => {
  it('renders one branded card with canonical identity details and a scannable host-provided QR', () => {
    const html = renderToStaticMarkup(<AnimalCardArtifact
      brand="VetChain"
      title="Animal Health Card"
      provider="Demo veterinary provider"
      subject="Luna"
      species="Dog"
      cardNumber="724020000000000000001"
      cardDid="did:web:demo.vetchain.app:card:vetchain:0009615:724020000000000000007"
      qrImageUrl="data:image/png;base64,qr"
    />)
    expect(html).toContain('VetChain')
    expect(html).toContain('Animal Health Card')
    expect(html).toContain('Luna')
    expect(html).toContain('724020000000000000001')
    expect(html).toContain('data:image/png;base64,qr')
  })
})

describe('SoschainSmartIdentityCardArtifact', () => {
  it('uses a vertical 50 by 80 millimetre face with near-full-width QR codes', async () => {
    const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')

    expect(css).toMatch(/\.uhcp-smart-id-card\s*\{[^}]*aspect-ratio:\s*5\s*\/\s*8/u)
    expect(css).toMatch(/\.uhcp-smart-id-front-qr\s*\{[^}]*width:\s*calc\(100%\s*-\s*\.5rem\)/u)
    expect(css).toMatch(/\.uhcp-smart-id-identity-qr\s*\{[^}]*width:\s*calc\(100%\s*-\s*\.5rem\)/u)
    expect(css).toMatch(/\.uhcp-smart-id-card\s*\{[^}]*height:\s*80mm[^}]*width:\s*50mm/u)
    expect(css).not.toContain('height: 53.98mm; width: 85.6mm')
  })

  it('keeps the DID QR on face A and the signed identity QR on face B', () => {
    const html = renderToStaticMarkup(<SoschainSmartIdentityCardArtifact
      logoUrl="/soschain-mark.svg"
      subjectLabel="Perro (Dog)"
      cardDid="did:web:cards.example:card:vetchain:0009615:724090961510852611262"
      speciesId7="0009615"
      cardNumber21="724090961510852611262"
      didQr={<svg data-qr-payload="did:web" />}
      identityQr={<svg data-qr-payload="shc:/" />}
    />)

    expect(html).toContain('data-card-face="front"')
    expect(html).toContain('data-card-face="back"')
    expect(html).toContain('SOSCHAIN')
    expect(html).toContain('Perro (Dog)')
    expect(html).toContain('0009615')
    expect(html).toContain('72409 09615 10852 61126 2')
    expect(html).toContain('data-qr-payload="did:web"')
    expect(html).toContain('data-qr-payload="shc:/"')
    expect(html).not.toContain('<code>did:web:')
  })

  it('labels human cards Personal and fails closed without a signed identity QR', () => {
    const html = renderToStaticMarkup(<SoschainSmartIdentityCardArtifact
      subjectKind="personal"
      logoUrl="/soschain-mark.svg"
      cardDid="did:web:index.example:card:uhc:personal:holder-1"
      didQr={<svg data-qr-payload="did:web" />}
    />)

    expect(html).toContain('Personal')
    expect(html).toContain('Signed identity unavailable')
    expect(html).not.toContain('data-qr-payload="shc:/"')
  })
})
