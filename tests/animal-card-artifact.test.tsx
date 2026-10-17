// Flow contract: SOSChain prints the same two-sided smart identity card in PetChain/VetChain and SOSChain; face A resolves only the DID, while face B renders only a provider-supplied signed SHC-like identity QR and canonical telephone identifiers.
import { renderToStaticMarkup } from 'react-dom/server'
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  AnimalCardArtifact,
  formatSoschainCardNumber21,
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
  it('uses two responsive vertical faces with a compact DID QR and fixed 50 by 80 millimetre print pages', async () => {
    const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')

    expect(css).toMatch(/\.uhcp-smart-id-card-set\s*\{[^}]*grid-template-columns:\s*repeat\(2,/u)
    expect(css).toMatch(/\.uhcp-smart-id-card\s*\{[^}]*aspect-ratio:\s*5\s*\/\s*8/u)
    expect(css).toMatch(/\.uhcp-smart-id-card-front\s*\{[^}]*background:\s*#fff/u)
    expect(css).toMatch(/\.uhcp-smart-id-front-qr\s*\{[^}]*width:\s*68%/u)
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)[^{]*\{[^}]*\.uhcp-smart-id-card-set\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*19rem\)/u)
    expect(css).toMatch(/\.uhcp-smart-id-card\s*\{[^}]*height:\s*80mm[^}]*width:\s*50mm/u)
    expect(css).not.toContain('height: 53.98mm; width: 85.6mm')
  })

  it('formats telephone readback as four groups of four digits and one final group of five', () => {
    expect(formatSoschainCardNumber21('724090961510852611262'))
      .toBe('7240 9096 1510 8526 11262')
  })

  it('keeps the DID QR on face A and the signed identity QR on face B', () => {
    const html = renderToStaticMarkup(<SoschainSmartIdentityCardArtifact
      logoUrl="/soschain-mark.svg"
      subjectLabel="Perro (Dog)"
      cardDid="did:web:cards.example:card:vetchain:0009615:724090961510852611262"
      providerCode="724090042"
      speciesId7="0009615"
      cardNumber21="724090961510852611262"
      didQr={<svg data-qr-payload="did:web" />}
      identityQr={<svg data-qr-payload="shc:/" />}
    />)

    expect(html).toContain('data-card-face="front"')
    expect(html).toContain('data-card-face="back"')
    expect(html).toContain('<img src="/soschain-mark.svg" alt="SOSCHAIN"')
    expect(html).not.toContain('<strong>SOSCHAIN</strong>')
    expect(html).toContain('class="uhcp-smart-id-subject-label">Perro (Dog)</p>')
    expect(html).toContain('class="uhcp-smart-id-provider-code">724090042</p>')
    expect(html).not.toContain('<span>Perro (Dog)</span>')
    expect(html).toContain('0009615')
    expect(html).toContain('7240 9096 1510 8526 11262')
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
