import type { ReactNode } from 'react'

export type ClinicalSummaryCard = Readonly<{
  key: string
  title: string
  resourceType: string
  date?: string
}>

export type ClinicalSectionSummaryProps = Readonly<{
  code: string
  title: string
  resources: readonly ClinicalSummaryCard[]
  emptyLabel: string
  resourceTypeLabel?: (resourceType: string) => string
  actions?: ReactNode
}>

/**
 * Brand-neutral renderer for one already-resolved IPS section.
 *
 * Hosts must resolve clinical labels with the shared SDK reader before passing
 * cards here. In particular, `title` is human text; `system|code` is a
 * terminology identity/translation key and must never be supplied as a
 * replacement for manually authored text.
 */
export function ClinicalSectionSummary({
  code,
  title,
  resources,
  emptyLabel,
  resourceTypeLabel = (resourceType) => resourceType,
  actions,
}: ClinicalSectionSummaryProps) {
  return (
    <section className="uhcp-clinical-section" data-ips-section={code} aria-labelledby={`uhcp-section-${code}`}>
      <header>
        <h3 id={`uhcp-section-${code}`}>{title} <span>({resources.length})</span></h3>
        {actions}
      </header>
      {resources.length === 0
        ? <p className="uhcp-clinical-empty">{emptyLabel}</p>
        : (
          <div className="uhcp-clinical-grid">
            {resources.map((resource) => (
              <article key={resource.key} className="uhcp-clinical-card" data-resource-type={resource.resourceType}>
                <p className="uhcp-clinical-title" dir="auto"><bdi>{resource.title}</bdi></p>
                <p className="uhcp-clinical-type">{resourceTypeLabel(resource.resourceType)}</p>
                {resource.date && <p className="uhcp-clinical-date">{resource.date}</p>}
              </article>
            ))}
          </div>
        )}
    </section>
  )
}
