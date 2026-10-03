import type { ReactNode } from 'react'
import { formatFhirTemporalForLocale } from 'fhir-data-utils-ts/fhir-temporal-presentation'

export type ClinicalSummaryCard = Readonly<{
  key: string
  title: string
  resourceType: string
  date?: string
  details?: readonly Readonly<{ label: string; value: string; unit?: string }>[]
}>

export type ClinicalSectionSummaryProps = Readonly<{
  code: string
  title: string
  resources: readonly ClinicalSummaryCard[]
  emptyLabel: string
  resourceTypeLabel?: (resourceType: string) => string
  actions?: ReactNode
  locale?: string
  timeZone?: string
  /** Hide only the heading when a host already owns the expandable section header. */
  showHeader?: boolean
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
  locale = 'en',
  timeZone,
  showHeader = true,
}: ClinicalSectionSummaryProps) {
  return (
    <section
      className="uhcp-clinical-section"
      data-ips-section={code}
      {...(showHeader ? { 'aria-labelledby': `uhcp-section-${code}` } : { 'aria-label': title })}
    >
      {showHeader && (
        <header>
          <h3 id={`uhcp-section-${code}`}>{title} <span>({resources.length})</span></h3>
          {actions}
        </header>
      )}
      {resources.length === 0
        ? <p className="uhcp-clinical-empty">{emptyLabel}</p>
        : (
          <div className="uhcp-clinical-grid">
            {resources.map((resource) => (
              <article key={resource.key} className="uhcp-clinical-card" data-resource-type={resource.resourceType}>
                <p className="uhcp-clinical-title" dir="auto"><bdi>{resource.title}</bdi></p>
                <p className="uhcp-clinical-type">{resourceTypeLabel(resource.resourceType)}</p>
                {resource.date && <p className="uhcp-clinical-date"><time dateTime={resource.date}>{localizedTemporal(resource.date, locale, timeZone)}</time></p>}
                {resource.details?.length ? <dl className="uhcp-clinical-details">
                  {resource.details.map((detail) => <div key={`${detail.label}:${detail.value}:${detail.unit ?? ''}`}>
                    <dt>{detail.label}</dt><dd>{detail.value}{detail.unit ? ` ${detail.unit}` : ''}</dd>
                  </div>)}
                </dl> : null}
              </article>
            ))}
          </div>
        )}
    </section>
  )
}

function localizedTemporal(value: string, locale: string, timeZone?: string): string {
  try {
    return formatFhirTemporalForLocale(value, locale, { timeZone, includeTime: value.includes('T') })
  } catch {
    return value
  }
}
