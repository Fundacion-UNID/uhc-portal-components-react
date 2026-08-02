/**
 * Flow contract: personal and professional hosts share the exact SOSChain
 * workspace; only server-resolved capabilities enable association actions.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SoschainWorkspace, type SoschainWorkspaceCopy } from '../src/SoschainWorkspace.js'

const copy: SoschainWorkspaceCopy = {
  cardsTitle: 'Choose a card', cardsDescription: 'Open an authorized card.', openCard: 'Open', selectedCard: 'Selected card', workspaceEyebrow: 'SOSChain',
  noCardTitle: 'No cards', noCardBody: 'No authorized cards.',
  areas: { overview: 'Overview', places: 'Places', products: 'Devices', communications: 'Communications' },
  overviewTitle: 'Overview', overviewBody: 'Summary', placesTitle: 'Places', placesBody: 'Locations', productsTitle: 'Devices', productsBody: 'Products',
  communicationsTitle: 'Communications', communicationsBody: 'Emergency messages', addPlace: 'Add Place', addProduct: 'Add device',
  emptyPlaces: 'No Places', emptyProducts: 'No devices', emptyCommunications: 'No messages', readOnly: 'Read only',
}
const card = { identifier: 'urn:uuid:card', displayName: 'Luna', kindLabel: 'VetChain card', openHref: '/card' }
const base = { copy, cards: [card], selectedCard: card, activeArea: 'places' as const, areaHrefs: { overview: '#o', places: '#p', products: '#d', communications: '#c' }, places: [], products: [], communications: [] }

describe('SoschainWorkspace', () => {
  it('renders the subject-card picker before opening a card', () => {
    const html = renderToStaticMarkup(<SoschainWorkspace {...base} selectedCard={undefined} />)
    expect(html).toContain('Choose a card')
    expect(html).toContain('Luna')
  })

  it('does not render management links without a trusted capability', () => {
    const html = renderToStaticMarkup(<SoschainWorkspace {...base} canManageAssociations={false} addPlaceHref="/places/new" />)
    expect(html).toContain('Read only')
    expect(html).not.toContain('href="/places/new"')
  })

  it('renders management links only when authorized by the host', () => {
    const html = renderToStaticMarkup(<SoschainWorkspace {...base} canManageAssociations addPlaceHref="/places/new" />)
    expect(html).toContain('href="/places/new"')
  })
})
