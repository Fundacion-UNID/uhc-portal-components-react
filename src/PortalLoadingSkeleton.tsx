export type PortalLoadingSkeletonProps = Readonly<{
  label: string
  rows?: number
  compact?: boolean
}>

/**
 * Shared neutral loading surface for authenticated portal data.
 *
 * Hosts render this instead of business empty states while a BFF/provider
 * read is pending. It contains no inferred card, identity or authorization
 * data and therefore cannot flash stale or misleading content.
 */
export function PortalLoadingSkeleton({
  label,
  rows = 3,
  compact = false,
}: PortalLoadingSkeletonProps) {
  return (
    <section
      className={`uhcp-loading-skeleton${compact ? ' uhcp-loading-skeleton-compact' : ''}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="uhcp-loading-label">{label}</span>
      <div className="uhcp-loading-heading" aria-hidden="true" />
      <div className="uhcp-loading-copy" aria-hidden="true" />
      <div className="uhcp-loading-grid" aria-hidden="true">
        {Array.from({ length: Math.max(1, rows) }, (_, index) => (
          <div className="uhcp-loading-row" key={index}>
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
    </section>
  )
}
