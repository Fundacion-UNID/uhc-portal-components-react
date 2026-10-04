import type { ReactNode } from 'react'
import {
  toClinicalSectionViews,
  type ClinicalResourceBundleLike,
  type ClinicalSectionView,
  type ClinicalTerminologyTranslationInput,
} from 'gdc-common-utils-ts/utils/clinical-resource-view'
import { ClinicalSectionSummary } from './ClinicalSectionSummary.js'
import { ClinicalTimeline, type ClinicalTimelineFacet, type ClinicalTimelineLabels } from './ClinicalTimeline.js'

export type IpsBundleSummaryProps = Readonly<{
  bundle: ClinicalResourceBundleLike
  locale?: string
  timeZone?: string
  translateCode?: (input: ClinicalTerminologyTranslationInput) => string | undefined
  emptyLabel: string
  noSectionsLabel?: string
  sectionTitle?: (section: ClinicalSectionView) => string
  resourceTypeLabel?: (resourceType: string) => string
  sectionActions?: (section: ClinicalSectionView) => ReactNode
  /** Resource-owned actions such as edit or delete, rendered inside that resource card. */
  resourceActions?: (section: ClinicalSectionView, resource: ClinicalSectionView['resources'][number]) => ReactNode
  timeline?: Readonly<{
    labels: ClinicalTimelineLabels
    sectionFacetLabel: string
    resourceTypeFacetLabel: string
  }>
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
  timeZone,
  translateCode,
  emptyLabel,
  noSectionsLabel = emptyLabel,
  sectionTitle = (section) => section.title,
  resourceTypeLabel,
  sectionActions,
  resourceActions,
  timeline,
}: IpsBundleSummaryProps) {
  const sections = toClinicalSectionViews(bundle, { locale, translateCode })
  const nativeResources = new Map((bundle.entry ?? bundle.data ?? []).flatMap((entry) =>
    entry.fullUrl && entry.resource ? [[entry.fullUrl, entry.resource] as const] : [],
  ))

  if (sections.length === 0) {
    return <p className="uhcp-clinical-empty" data-ips-summary-empty>{noSectionsLabel}</p>
  }

  const timelineEntries = sections.flatMap((section, sectionIndex) => section.resources.flatMap((resource, resourceIndex) =>
    resource.date ? [{
      id: resource.fullUrl ?? `${sectionIndex}:${resourceIndex}:${resource.resourceType}`,
      title: resource.title,
      dateTime: resource.date,
      facets: {
        section: [section.code ?? section.title],
        resourceType: [resource.resourceType],
      },
      content: <small>{resourceTypeLabel?.(resource.resourceType) ?? resource.resourceType}</small>,
    }] : [],
  ))
  const timelineFacets: readonly ClinicalTimelineFacet[] = timeline ? [
    {
      id: 'section',
      label: timeline.sectionFacetLabel,
      options: uniqueOptions(sections.map((section) => ({ id: section.code ?? section.title, label: sectionTitle(section) }))),
    },
    {
      id: 'resourceType',
      label: timeline.resourceTypeFacetLabel,
      options: uniqueOptions(sections.flatMap((section) => section.resources.map((resource) => ({
        id: resource.resourceType,
        label: resourceTypeLabel?.(resource.resourceType) ?? resource.resourceType,
      })))),
    },
  ] : []

  return (
    <div className="uhcp-clinical-summary" data-ips-summary>
      {timeline && timeZone && timelineEntries.length ? <ClinicalTimeline
        entries={timelineEntries}
        facets={timelineFacets}
        locale={locale ?? 'en'}
        timeZone={timeZone}
        labels={timeline.labels}
      /> : null}
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
            details: observationComponentDetails(nativeResources.get(resource.fullUrl ?? '')),
            actions: resourceActions?.(section, resource),
          }))}
          emptyLabel={emptyLabel}
          resourceTypeLabel={resourceTypeLabel}
          actions={sectionActions?.(section)}
          locale={locale}
          timeZone={timeZone}
        />
      ))}
    </div>
  )
}

function uniqueOptions(options: readonly Readonly<{ id: string; label: string }>[]): readonly Readonly<{ id: string; label: string }>[] {
  return [...new Map(options.map((option) => [option.id, option])).values()]
}

function observationComponentDetails(resource: unknown): readonly Readonly<{ label: string; value: string; unit?: string }>[] | undefined {
  const candidate = resource as Readonly<{ resourceType?: string; component?: readonly unknown[] }> | undefined
  if (candidate?.resourceType !== 'Observation' || !Array.isArray(candidate.component)) return undefined
  const details = candidate.component.flatMap((value) => {
    const component = value as Readonly<{
      code?: Readonly<{ text?: string; coding?: readonly Readonly<{ display?: string }>[] }>
      valueQuantity?: Readonly<{ value?: number; unit?: string }>
    }>
    const label = component.code?.text ?? component.code?.coding?.find((coding) => coding.display)?.display
    const quantity = component.valueQuantity
    if (!label || !Number.isFinite(quantity?.value)) return []
    return [{ label, value: String(quantity!.value), ...(quantity?.unit ? { unit: quantity.unit } : {}) }]
  })
  return details.length ? details : undefined
}
