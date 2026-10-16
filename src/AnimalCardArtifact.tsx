import type { ReactNode } from 'react'

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

export type SoschainSmartIdentityCardArtifactProps = Readonly<{
  /** Human cards use the fixed public label `Personal`; animal cards use the supplied localized species label. */
  subjectKind?: 'animal' | 'personal'
  subjectLabel?: string
  cardDid: string
  speciesId7?: string
  cardNumber21?: string
  /** Host-rendered QR whose exact payload is `cardDid`. */
  didQr: ReactNode
  /** Host-rendered QR from a provider-issued, signed SHC-like identity credential. */
  identityQr?: ReactNode
  logoUrl: string
  signedIdentityUnavailableLabel?: string
}>

/** Formats the canonical 21 digits for visual and telephone readback only. */
export function formatSoschainCardNumber21(value: string): string {
  const digits = String(value || '').replace(/[ -]/g, '')
  if (!/^\d{21}$/.test(digits)) throw new TypeError('cardNumber21 must contain exactly 21 digits.')
  return `${digits.slice(0, 5)} ${digits.slice(5, 10)} ${digits.slice(10, 15)} ${digits.slice(15, 20)} ${digits.slice(20)}`
}

/**
 * Two-sided physical identity artifact shared by SOSChain, PetChain and
 * VetChain. The host owns both QR payloads. Face A is deliberately DID-only;
 * face B never invents or signs a credential in presentation code.
 */
export function SoschainSmartIdentityCardArtifact({
  subjectKind = 'animal',
  subjectLabel,
  cardDid,
  speciesId7,
  cardNumber21,
  didQr,
  identityQr,
  logoUrl,
  signedIdentityUnavailableLabel = 'Signed identity unavailable',
}: SoschainSmartIdentityCardArtifactProps) {
  const publicLabel = subjectKind === 'personal' ? 'Personal' : String(subjectLabel || 'Animal').trim()
  const formattedCardNumber = cardNumber21 ? formatSoschainCardNumber21(cardNumber21) : undefined

  return <div className="uhcp-smart-id-card-set" aria-label={`SOSCHAIN Smart Identity Card: ${publicLabel}`}>
    <article className="uhcp-smart-id-card uhcp-smart-id-card-front" data-card-face="front">
      <header className="uhcp-smart-id-brand">
        <img src={logoUrl} alt="" />
        <strong>SOSCHAIN</strong>
        <span>{publicLabel}</span>
      </header>
      <div className="uhcp-smart-id-front-qr" aria-label="DID QR code">{didQr}</div>
      <code>{cardDid}</code>
    </article>

    <article className="uhcp-smart-id-card uhcp-smart-id-card-back" data-card-face="back">
      <header>
        <strong>SOSCHAIN SMART IDENTITY CARD</strong>
        <span>{publicLabel}</span>
      </header>
      <div className="uhcp-smart-id-back-body">
        <dl>
          {speciesId7 ? <div><dt>Species</dt><dd>{speciesId7}</dd></div> : null}
          {formattedCardNumber ? <div><dt>Card</dt><dd>{formattedCardNumber}</dd></div> : null}
        </dl>
        {identityQr
          ? <div className="uhcp-smart-id-identity-qr" aria-label="Signed identity QR code">{identityQr}</div>
          : <p className="uhcp-smart-id-unavailable" role="status">{signedIdentityUnavailableLabel}</p>}
      </div>
    </article>
  </div>
}
