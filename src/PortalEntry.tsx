import type { PortalAccessOption, PortalBrand } from './contracts.js'
import { PortalBrandArtwork } from './PortalBrandArtwork.js'

export type PortalEntryHeroProps = Readonly<{
  brand: PortalBrand
  eyebrow: string
  title: string
  description: string
}>

/**
 * Shared product-entry hero. Brand adapters supply only identity and copy.
 */
export function PortalEntryHero({
  brand,
  eyebrow,
  title,
  description,
}: PortalEntryHeroProps) {
  return (
    <section className="uhcp-entry-hero" style={brand.variables}>
      <div className="uhcp-hero-orbit" aria-hidden="true">
        <PortalBrandArtwork
          artwork={brand.heroArtwork || brand.mark}
          className="uhcp-hero-logo"
        />
      </div>
      <div className="uhcp-entry-copy">
        <div className="uhcp-badge">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  )
}

export type PortalAccessChooserProps = Readonly<{
  label: string
  options: readonly PortalAccessOption[]
}>

/**
 * Reusable navigation for product-owned access paths.
 *
 * Every option is a real link so the destination becomes a distinct page and
 * keyboard/screen-reader users receive navigation rather than hidden content.
 */
export function PortalAccessChooser({ label, options }: PortalAccessChooserProps) {
  return (
    <nav className="uhcp-access-grid" aria-label={label}>
      {options.map((option, index) => (
        <a className="uhcp-access-card" href={option.href} key={option.id}>
          <span className="uhcp-access-number">{String(index + 1).padStart(2, '0')}</span>
          <strong>{option.title}</strong>
          <span>{option.description}</span>
          <small>{option.requirement}</small>
        </a>
      ))}
    </nav>
  )
}
