import type { ReactNode } from 'react'
import {
  toClinicalSectionViews,
  type ClinicalResourceBundleLike,
  type ClinicalSectionView,
  type ClinicalTerminologyTranslationInput,
} from 'gdc-common-utils-ts/utils/clinical-resource-view'
import { ClinicalSectionSummary } from './ClinicalSectionSummary.js'

export type IpsBundleSummaryProps = Readonly<{
  bundle: ClinicalResourceBundleLike
  locale?: string
  translateCode?: (input: ClinicalTerminologyTranslationInput) => string | undefined
  emptyLabel: string
  noSectionsLabel?: string
  sectionTitle?: (section: ClinicalSectionView) => string
  resourceTypeLabel?: (resourceType: string) => string
  sectionActions?: (section: ClinicalSectionView) => ReactNode
}>

/**
 * Renders every section declared by an IPS Composition and the cards referenced
 * by each section.
 *
 * The shared clinical reader owns Bundle traversal, section placement and card
 * projection. `Composition.section.entry` is authoritative for placement;
 * native FHIR fields or canonical `resource.meta.claims` provide card content.
 * This component performs no ingestion, persistence or GW call.
 */
export function IpsBundleSummary({
  bundle,
  locale,
  translateCode,
  emptyLabel,
  noSectionsLabel = emptyLabel,
  sectionTitle = (section) => section.title,
  resourceTypeLabel,
  sectionActions,
}: IpsBundleSummaryProps) {
  const sections = toClinicalSectionViews(bundle, { locale, translateCode })

  if (sections.length === 0) {
    return <p className="uhcp-clinical-empty" data-ips-summary-empty>{noSectionsLabel}</p>
  }

  return (
    <div className="uhcp-clinical-summary" data-ips-summary>
      {sections.map((section, sectionIndex) => (
        <ClinicalSectionSummary
          key={section.code ?? `${section.title}:${sectionIndex}`}
          code={section.code ?? ''}
          title={sectionTitle(section)}
          resources={section.resources.map((resource, resourceIndex) => ({
            key: resource.fullUrl ?? `${resource.resourceType}:${resourceIndex}:${resource.title}`,
            title: resource.title,
            resourceType: resource.resourceType,
            date: resource.date,
          }))}
          emptyLabel={emptyLabel}
          resourceTypeLabel={resourceTypeLabel}
          actions={sectionActions?.(section)}
        />
      ))}
    </div>
  )
}
