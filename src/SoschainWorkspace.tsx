import { ProtectedIndexEmergencyData, type ProtectedIndexEmergencyCopy, type ProtectedIndexEmergencyItem } from './ProtectedIndexEmergencyData.js'
import type { ReactNode } from 'react'

export const SOSCHAIN_SUBJECT_WORKSPACE_AREAS = [
  'overview',
  'health-summary',
  'care-journey',
  'emergency-data',
  'communications',
  'places',
  'products',
] as const

export type SoschainWorkspaceArea = typeof SOSCHAIN_SUBJECT_WORKSPACE_AREAS[number]

export type SoschainCardSummary = Readonly<{
  identifier: string
  displayName: string
  kindLabel: string
  subjectKind?: 'person' | 'animal'
  selected?: boolean
  openHref: string
}>

export type SoschainAssociationSummary = Readonly<{
  identifier: string
  name: string
  kindLabel: string
  detail: string
  statusLabel: string
}>

export type SoschainCommunicationSummary = Readonly<{
  identifier: string
  sender: string
  categoryLabel: string
  subject: string
  body: string
  occurredAt: string
  placeLabel?: string
}>

/**
 * Minimum Encounter projection suitable for a controller/member timeline.
 * The host must already have removed room, bed, diagnosis and other details
 * that the current actor is not authorized to read.
 */
export type SoschainCareJourneyEntry = Readonly<{
  identifier: string
  statusLabel: string
  serviceLabel: string
  periodStart: string
  periodEnd?: string
  locationLabel?: string
  detail?: string
}>

export type SoschainWorkspaceCopy = Readonly<{
  cardsTitle: string
  cardsDescription: string
  openCard: string
  selectedCard: string
  workspaceEyebrow: string
  noCardTitle: string
  noCardBody: string
  areas: Record<SoschainWorkspaceArea, string>
  overviewTitle: string
  overviewBody: string
  healthSummaryTitle: string
  healthSummaryBody: string
  emptyHealthSummary: string
  careJourneyTitle: string
  careJourneyBody: string
  emptyCareJourney: string
  emergencyDataTitle: string
  emergencyDataBody: string
  emergencyData: ProtectedIndexEmergencyCopy
  placesTitle: string
  placesBody: string
  productsTitle: string
  productsBody: string
  communicationsTitle: string
  communicationsBody: string
  addPlace: string
  addProduct: string
  emptyPlaces: string
  emptyProducts: string
  emptyCommunications: string
  readOnly: string
  importCard?: string
}>

export type SoschainWorkspaceProps = Readonly<{
  copy: SoschainWorkspaceCopy
  cards: readonly SoschainCardSummary[]
  selectedCard?: SoschainCardSummary
  activeArea: SoschainWorkspaceArea
  areaHrefs: Record<SoschainWorkspaceArea, string>
  places: readonly SoschainAssociationSummary[]
  products: readonly SoschainAssociationSummary[]
  communications: readonly SoschainCommunicationSummary[]
  /** Shared channels/topics screen composed with host-owned BFF adapters. */
  communicationsContent?: ReactNode
  /** Host-authorized IPS/clinical projection, normally `IpsBundleSummary`. */
  healthSummary?: ReactNode
  /** False only when the host has already resolved a current write capability. */
  clinicalReadOnly?: boolean
  careJourney?: readonly SoschainCareJourneyEntry[]
  emergencyData?: readonly ProtectedIndexEmergencyItem[]
  canManageAssociations: boolean
  addPlaceHref?: string
  addProductHref?: string
  importCardHref?: string
  /** Host-composed primary workflows for the selected subject overview. */
  overviewContent?: ReactNode
  /** Areas kept visible; remaining areas move into the accessible More menu. */
  primaryAreas?: readonly SoschainWorkspaceArea[]
  moreLabel?: string
  /** Raw provider identifiers are hidden by SOSChain portals by default. */
  showCardIdentifier?: boolean
  /** Selects a card in host-owned state without exposing its identifier in a URL. */
  onSelectCard?: (identifier: string) => void
}>

function AssociationList({ items, empty }: Readonly<{
  items: readonly SoschainAssociationSummary[]
  empty: string
}>) {
  if (items.length === 0) return <p className="uhcp-sos-empty">{empty}</p>
  return (
    <ul className="uhcp-sos-entity-list">
      {items.map((item) => (
        <li key={item.identifier}>
          <span className="uhcp-sos-kind">{item.kindLabel}</span>
          <strong>{item.name}</strong>
          <span>{item.detail}</span>
          <small>{item.statusLabel}</small>
        </li>
      ))}
    </ul>
  )
}

/**
 * Shared subject-first SOSChain workspace for personal and professional apps.
 *
 * The host supplies already-authorized cards, associations, capabilities and
 * communications. This presentational component never derives authority from
 * a selected role, card, tab or browser-controlled value.
 */
export function SoschainWorkspace({
  copy,
  cards,
  selectedCard,
  activeArea,
  areaHrefs,
  places,
  products,
  communications,
  communicationsContent,
  healthSummary,
  clinicalReadOnly = true,
  careJourney = [],
  emergencyData = [],
  canManageAssociations,
  addPlaceHref,
  addProductHref,
  importCardHref,
  overviewContent,
  primaryAreas,
  moreLabel = 'More',
  showCardIdentifier = true,
  onSelectCard,
}: SoschainWorkspaceProps) {
  if (!selectedCard) {
    return (
      <section className="uhcp-sos-wrap" aria-labelledby="sos-card-picker-title">
        <header className="uhcp-sos-heading">
          <span>{copy.workspaceEyebrow}</span>
          <h1 id="sos-card-picker-title">{copy.cardsTitle}</h1>
          <p>{copy.cardsDescription}</p>
          {importCardHref && copy.importCard ? <a href={importCardHref}>{copy.importCard} →</a> : null}
        </header>
        {cards.length === 0 ? (
          <div className="uhcp-sos-empty-panel">
            <h2>{copy.noCardTitle}</h2>
            <p>{copy.noCardBody}</p>
          </div>
        ) : (
          <ul className="uhcp-sos-card-grid">
            {cards.map((card) => (
              <li key={card.identifier}>
                {onSelectCard ? <button type="button" onClick={() => onSelectCard(card.identifier)}>
                  <span>{card.kindLabel}</span>
                  <strong>{card.displayName}</strong>
                  {showCardIdentifier ? <small>{card.identifier}</small> : null}
                  <b>{copy.openCard} →</b>
                </button> : <a href={card.openHref}>
                  <span>{card.kindLabel}</span>
                  <strong>{card.displayName}</strong>
                  {showCardIdentifier ? <small>{card.identifier}</small> : null}
                  <b>{copy.openCard} →</b>
                </a>}
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  const title = activeArea === 'places'
    ? copy.placesTitle
    : activeArea === 'products'
      ? copy.productsTitle
      : activeArea === 'communications'
        ? copy.communicationsTitle
        : activeArea === 'health-summary'
          ? copy.healthSummaryTitle
          : activeArea === 'care-journey'
            ? copy.careJourneyTitle
        : activeArea === 'emergency-data'
          ? copy.emergencyDataTitle
        : copy.overviewTitle
  const body = activeArea === 'places'
    ? copy.placesBody
    : activeArea === 'products'
      ? copy.productsBody
      : activeArea === 'communications'
        ? copy.communicationsBody
        : activeArea === 'health-summary'
          ? copy.healthSummaryBody
          : activeArea === 'care-journey'
            ? copy.careJourneyBody
        : activeArea === 'emergency-data'
          ? copy.emergencyDataBody
        : copy.overviewBody
  const clinicalAreaIsReadOnly = activeArea === 'care-journey' || (activeArea === 'health-summary' && clinicalReadOnly)
  const associationAreaIsReadOnly = !canManageAssociations && (
    activeArea === 'overview' || activeArea === 'places' || activeArea === 'products'
  )

  return (
    <section className="uhcp-sos-wrap">
      <header className="uhcp-sos-heading">
        <span>{copy.selectedCard}</span>
        <h1>{selectedCard.displayName}</h1>
        <p>{selectedCard.kindLabel}{showCardIdentifier ? ` · ${selectedCard.identifier}` : ''}</p>
      </header>
      <nav className="uhcp-sos-tabs" aria-label={copy.workspaceEyebrow}>
        {(primaryAreas ?? SOSCHAIN_SUBJECT_WORKSPACE_AREAS).map((area) => (
          <a key={area} href={areaHrefs[area]} aria-current={activeArea === area ? 'page' : undefined}>
            {copy.areas[area]}
          </a>
        ))}
        {primaryAreas ? <details className="uhcp-sos-more">
          <summary>{moreLabel}</summary>
          <div>{SOSCHAIN_SUBJECT_WORKSPACE_AREAS.filter((area) => !primaryAreas.includes(area)).map((area) => (
            <a key={area} href={areaHrefs[area]} aria-current={activeArea === area ? 'page' : undefined}>{copy.areas[area]}</a>
          ))}</div>
        </details> : null}
      </nav>
      <div className="uhcp-sos-panel">
        <header>
          <div>
            <h2>{title}</h2>
            <p>{body}</p>
          </div>
          {(clinicalAreaIsReadOnly || associationAreaIsReadOnly) && (
            <span className="uhcp-sos-readonly">{copy.readOnly}</span>
          )}
          {canManageAssociations && activeArea === 'places' && addPlaceHref && <a href={addPlaceHref}>{copy.addPlace}</a>}
          {canManageAssociations && activeArea === 'products' && addProductHref && <a href={addProductHref}>{copy.addProduct}</a>}
        </header>
        {activeArea === 'overview' && (overviewContent ?? (
          <div className="uhcp-sos-overview-grid">
            <article><strong>{places.length}</strong><span>{copy.areas.places}</span></article>
            <article><strong>{products.length}</strong><span>{copy.areas.products}</span></article>
            <article><strong>{communications.length}</strong><span>{copy.areas.communications}</span></article>
            <article><strong>{careJourney.length}</strong><span>{copy.areas['care-journey']}</span></article>
          </div>
        ))}
        {activeArea === 'health-summary' && (healthSummary ?? <p className="uhcp-sos-empty">{copy.emptyHealthSummary}</p>)}
        {activeArea === 'care-journey' && (
          careJourney.length === 0 ? <p className="uhcp-sos-empty">{copy.emptyCareJourney}</p> : (
            <ol className="uhcp-sos-timeline uhcp-sos-care-journey">
              {careJourney.map((encounter) => (
                <li key={encounter.identifier}>
                  <div><span>{encounter.statusLabel}</span><time dateTime={encounter.periodStart}>{encounter.periodStart}</time></div>
                  <strong>{encounter.serviceLabel}</strong>
                  {encounter.detail ? <p>{encounter.detail}</p> : null}
                  {encounter.locationLabel || encounter.periodEnd ? <small>
                    {[encounter.locationLabel, encounter.periodEnd].filter(Boolean).join(' · ')}
                  </small> : null}
                </li>
              ))}
            </ol>
          )
        )}
        {activeArea === 'emergency-data' && <ProtectedIndexEmergencyData copy={copy.emergencyData} items={emergencyData} />}
        {activeArea === 'places' && <AssociationList items={places} empty={copy.emptyPlaces} />}
        {activeArea === 'products' && <AssociationList items={products} empty={copy.emptyProducts} />}
        {activeArea === 'communications' && (
          communicationsContent ?? (communications.length === 0 ? <p className="uhcp-sos-empty">{copy.emptyCommunications}</p> : (
            <ol className="uhcp-sos-timeline">
              {communications.map((message) => (
                <li key={message.identifier}>
                  <div><span>{message.categoryLabel}</span><time>{message.occurredAt}</time></div>
                  <strong>{message.subject}</strong>
                  <p>{message.body}</p>
                  <small>{message.sender}{message.placeLabel ? ` · ${message.placeLabel}` : ''}</small>
                </li>
              ))}
            </ol>
          ))
        )}
      </div>
    </section>
  )
}
