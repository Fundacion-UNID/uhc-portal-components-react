import type { PortalBrandArtworkSet } from './contracts.js'

export type PortalBrandArtworkProps = Readonly<{
  artwork: PortalBrandArtworkSet
  className?: string
}>

/**
 * Render official artwork without reconstructing or distorting the brand.
 *
 * Both surface variants remain in the DOM so CSS can follow the effective
 * light/dark theme without coupling this brand module to a framework.
 */
export function PortalBrandArtwork({
  artwork,
  className = '',
}: PortalBrandArtworkProps) {
  return (
    <span className={`uhcp-brand-artwork ${className}`.trim()}>
      <img
        className="uhcp-brand-artwork-light"
        src={artwork.lightSurface.src}
        alt={artwork.lightSurface.alt}
        width={artwork.lightSurface.width}
        height={artwork.lightSurface.height}
      />
      <img
        className="uhcp-brand-artwork-dark"
        src={artwork.darkSurface.src}
        alt={artwork.darkSurface.alt}
        width={artwork.darkSurface.width}
        height={artwork.darkSurface.height}
      />
    </span>
  )
}
