// Flow contract: personal and professional hosts share one subject workspace; only server-resolved capabilities expose clinical, journey or association data.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SoschainWorkspace, type SoschainWorkspaceCopy } from '../src/SoschainWorkspace.js'

const copy: SoschainWorkspaceCopy = {
  cardsTitle: 'Choose a card', cardsDescription: 'Open an authorized card.', openCard: 'Open', selectedCard: 'Selected card', workspaceEyebrow: 'SOSChain',
  noCardTitle: 'No cards', noCardBody: 'No authorized cards.',
  areas: { overview: 'Overview', 'health-summary': 'Health summary', 'care-journey': 'Care journey', 'emergency-data': 'Emergency data', places: 'Places', products: 'Devices', communications: 'Communications' },
  overviewTitle: 'Overview', overviewBody: 'Summary', placesTitle: 'Places', placesBody: 'Locations', productsTitle: 'Devices', productsBody: 'Products',
  healthSummaryTitle: 'Health summary', healthSummaryBody: 'Authorized clinical summary', emptyHealthSummary: 'No authorized summary',
  careJourneyTitle: 'Care journey', careJourneyBody: 'Authorized encounters', emptyCareJourney: 'No encounters',
  emergencyDataTitle: 'Emergency data', emergencyDataBody: 'Confirmed copies', emergencyData: {
    title: 'Emergency copies', body: 'Minimum authorized data.', securePinTitle: 'Stored', securePinBody: 'Encrypted.', emergencyPinTitle: 'Emergency', emergencyPinBody: 'Policy checked.', emergencyOnly: 'Emergency enabled', protectedOnly: 'Stored only', empty: 'No copies', sourcePrefix: 'Source', creatorPrefix: 'Added by',
  },
  communicationsTitle: 'Communications', communicationsBody: 'Emergency messages', addPlace: 'Add Place', addProduct: 'Add device',
  emptyPlaces: 'No Places', emptyProducts: 'No devices', emptyCommunications: 'No messages', readOnly: 'Read only',
}
const card = { identifier: 'urn:uuid:card', displayName: 'Luna', kindLabel: 'VetChain card', openHref: '/card' }
const base = { copy, cards: [card], selectedCard: card, activeArea: 'places' as const, areaHrefs: { overview: '#o', 'health-summary': '#h', 'care-journey': '#j', 'emergency-data': '#e', places: '#p', products: '#d', communications: '#c' }, places: [], products: [], communications: [] }

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

  it('renders only host-confirmed emergency data in the professional area', () => {
    const html = renderToStaticMarkup(<SoschainWorkspace {...base} activeArea="emergency-data" emergencyData={[{
      identifier: 'copy-1', title: 'Allergy', categoryLabel: 'Health', emergencyAvailable: true,
    }]} />)
    expect(html).toContain('Allergy')
    expect(html).toContain('Emergency enabled')
  })

  it('renders the host-authorized health summary without adding browser edit controls', () => {
    const html = renderToStaticMarkup(<SoschainWorkspace
      {...base}
      activeArea="health-summary"
      healthSummary={<article>Authorized IPS sections</article>}
    />)
    expect(html).toContain('Authorized IPS sections')
    expect(html).toContain('Read only')
    expect(html).not.toContain('Add clinical data')
  })

  it('renders the bounded Encounter journey supplied by the host', () => {
    const html = renderToStaticMarkup(<SoschainWorkspace
      {...base}
      activeArea="care-journey"
      careJourney={[{
        identifier: 'encounter-emergency',
        statusLabel: 'In progress',
        serviceLabel: 'Emergency department',
        periodStart: '2026-10-31T09:00:00Z',
        locationLabel: 'Emergency',
      }]}
    />)
    expect(html).toContain('Emergency department')
    expect(html).toContain('In progress')
    expect(html).toContain('Emergency')
    expect(html).not.toContain('encounter-emergency')
  })
})
