// Flow contract: personal and professional portals render the same printable animal-card artifact while the host supplies the canonical DID and QR image.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AnimalCardArtifact } from '../src/AnimalCardArtifact.js'

describe('AnimalCardArtifact', () => {
  it('renders one branded card with canonical identity details and a scannable host-provided QR', () => {
    const html = renderToStaticMarkup(<AnimalCardArtifact
      brand="VetChain"
      title="Animal Health Card"
      provider="Demo veterinary provider"
      subject="Luna"
      species="Dog"
      cardNumber="724020000000000000001"
      cardDid="did:web:demo.vetchain.app:card:vetchain:72402:0000000000000001"
      qrImageUrl="data:image/png;base64,qr"
    />)
    expect(html).toContain('VetChain')
    expect(html).toContain('Animal Health Card')
    expect(html).toContain('Luna')
    expect(html).toContain('724020000000000000001')
    expect(html).toContain('data:image/png;base64,qr')
  })
})
