// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SOSCHAIN_SUBJECT_WORKSPACE_AREAS, SoschainWorkspace, type SoschainWorkspaceCopy } from '../src/SoschainWorkspace.js'

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
  it('exports one canonical subject-area order for every host portal', () => {
    expect(SOSCHAIN_SUBJECT_WORKSPACE_AREAS).toEqual([
      'overview', 'health-summary', 'care-journey', 'emergency-data', 'communications', 'places', 'products',
    ])
  })

  it('renders the subject-card picker before opening a card', () => {
    const html = renderToStaticMarkup(<SoschainWorkspace {...base} selectedCard={undefined} />)
    expect(html).toContain('Choose a card')
    expect(html).toContain('Luna')
  })

  it('lets a client host select a card without putting its identifier in a URL', () => {
    const html = renderToStaticMarkup(<SoschainWorkspace
      {...base}
      selectedCard={undefined}
      showCardIdentifier={false}
      onSelectCard={() => undefined}
    />)
    expect(html).toContain('<button')
    expect(html).not.toContain('href="/card"')
    expect(html).not.toContain(card.identifier)
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
      canManageAssociations
      healthSummary={<article>Authorized IPS sections</article>}
    />)
    expect(html).toContain('Authorized IPS sections')
    expect(html).toContain('Read only')
    expect(html).not.toContain('Add clinical data')
  })

  it('lets an authorized host declare that its supplied clinical workspace is editable', () => {
    const html = renderToStaticMarkup(<SoschainWorkspace
      {...base}
      activeArea="health-summary"
      canManageAssociations
      clinicalReadOnly={false}
      healthSummary={<article><button type="button">Add clinical data</button></article>}
    />)
    expect(html).toContain('Add clinical data')
    expect(html).not.toContain('Read only')
  })

  it('keeps clinical and association write capabilities independent', () => {
    const html = renderToStaticMarkup(<SoschainWorkspace
      {...base}
      activeArea="health-summary"
      canManageAssociations={false}
      clinicalReadOnly={false}
      healthSummary={<article><button type="button">Add clinical data</button></article>}
    />)
    expect(html).toContain('Add clinical data')
    expect(html).not.toContain('Read only')
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

  it('supports one task-first overview and moves secondary areas behind More', () => {
    const compactAreas = ['overview', 'health-summary', 'care-journey'] as const
    const html = renderToStaticMarkup(<SoschainWorkspace
      {...base}
      activeArea="overview"
      overviewContent={<article>Primary emergency workflows</article>}
      primaryAreas={compactAreas}
      moreLabel="More"
      showCardIdentifier={false}
    />)
    expect(html).toContain('Primary emergency workflows')
    expect(html).toContain('<summary>More</summary>')
    expect(html).not.toContain(card.identifier)
    expect(html).not.toContain('>3<')
  })
})
