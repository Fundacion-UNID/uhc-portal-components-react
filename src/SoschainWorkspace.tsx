export type SoschainWorkspaceArea = 'overview' | 'places' | 'products' | 'communications'

export type SoschainCardSummary = Readonly<{
  identifier: string
  displayName: string
  kindLabel: string
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
  canManageAssociations: boolean
  addPlaceHref?: string
  addProductHref?: string
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
  canManageAssociations,
  addPlaceHref,
  addProductHref,
}: SoschainWorkspaceProps) {
  if (!selectedCard) {
    return (
      <section className="uhcp-sos-wrap" aria-labelledby="sos-card-picker-title">
        <header className="uhcp-sos-heading">
          <span>{copy.workspaceEyebrow}</span>
          <h1 id="sos-card-picker-title">{copy.cardsTitle}</h1>
          <p>{copy.cardsDescription}</p>
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
                <a href={card.openHref}>
                  <span>{card.kindLabel}</span>
                  <strong>{card.displayName}</strong>
                  <small>{card.identifier}</small>
                  <b>{copy.openCard} →</b>
                </a>
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
        : copy.overviewTitle
  const body = activeArea === 'places'
    ? copy.placesBody
    : activeArea === 'products'
      ? copy.productsBody
      : activeArea === 'communications'
        ? copy.communicationsBody
        : copy.overviewBody

  return (
    <section className="uhcp-sos-wrap">
      <header className="uhcp-sos-heading">
        <span>{copy.selectedCard}</span>
        <h1>{selectedCard.displayName}</h1>
        <p>{selectedCard.kindLabel} · {selectedCard.identifier}</p>
      </header>
      <nav className="uhcp-sos-tabs" aria-label={copy.workspaceEyebrow}>
        {(Object.keys(areaHrefs) as SoschainWorkspaceArea[]).map((area) => (
          <a key={area} href={areaHrefs[area]} aria-current={activeArea === area ? 'page' : undefined}>
            {copy.areas[area]}
          </a>
        ))}
      </nav>
      <div className="uhcp-sos-panel">
        <header>
          <div>
            <h2>{title}</h2>
            <p>{body}</p>
          </div>
          {!canManageAssociations && activeArea !== 'communications' && (
            <span className="uhcp-sos-readonly">{copy.readOnly}</span>
          )}
          {canManageAssociations && activeArea === 'places' && addPlaceHref && <a href={addPlaceHref}>{copy.addPlace}</a>}
          {canManageAssociations && activeArea === 'products' && addProductHref && <a href={addProductHref}>{copy.addProduct}</a>}
        </header>
        {activeArea === 'overview' && (
          <div className="uhcp-sos-overview-grid">
            <article><strong>{places.length}</strong><span>{copy.areas.places}</span></article>
            <article><strong>{products.length}</strong><span>{copy.areas.products}</span></article>
            <article><strong>{communications.length}</strong><span>{copy.areas.communications}</span></article>
          </div>
        )}
        {activeArea === 'places' && <AssociationList items={places} empty={copy.emptyPlaces} />}
        {activeArea === 'products' && <AssociationList items={products} empty={copy.emptyProducts} />}
        {activeArea === 'communications' && (
          communications.length === 0 ? <p className="uhcp-sos-empty">{copy.emptyCommunications}</p> : (
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
          )
        )}
      </div>
    </section>
  )
}
