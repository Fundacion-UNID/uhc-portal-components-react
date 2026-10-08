export type AnimalCardArtifactProps = Readonly<{
  brand: string
  title: string
  provider: string
  subject: string
  species: string
  cardNumber: string
  cardDid: string
  qrImageUrl: string
  logoUrl?: string
}>

/**
 * Printable presentation of an animal card. The host owns the canonical card
 * identifiers and QR payload; this component neither issues nor verifies them.
 */
export function AnimalCardArtifact({
  brand,
  title,
  provider,
  subject,
  species,
  cardNumber,
  cardDid,
  qrImageUrl,
  logoUrl,
}: AnimalCardArtifactProps) {
  return <article className="uhcp-animal-card" aria-label={`${title}: ${subject}`}>
    <header className="uhcp-animal-card-header">
      <div className="uhcp-animal-card-brand">
        {logoUrl ? <img src={logoUrl} alt="" /> : <span aria-hidden="true">V</span>}
        <div><strong>{brand}</strong><small>{title}</small></div>
      </div>
      <span className="uhcp-animal-card-chip" aria-hidden="true" />
    </header>
    <div className="uhcp-animal-card-body">
      <section>
        <span>{species}</span>
        <h3>{subject}</h3>
        <dl>
          <div><dt>Card</dt><dd>{cardNumber}</dd></div>
          <div><dt>Provider</dt><dd>{provider}</dd></div>
        </dl>
      </section>
      <img className="uhcp-animal-card-qr" src={qrImageUrl} alt={`${title} QR`} />
    </div>
    <footer><code>{cardDid}</code></footer>
  </article>
}
