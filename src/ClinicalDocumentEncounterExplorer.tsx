import { useMemo, useState } from 'react'
import type { ClinicalResourceBundleLike } from 'gdc-common-utils-ts/utils/clinical-resource-view'
import { IpsBundleSummary } from './IpsBundleSummary.js'

export type EncounterJourneyResource = Readonly<{
  resourceType: 'Encounter'
  id?: string
  status?: string
  class?: Readonly<{ display?: string; code?: string }>
  serviceType?: readonly Readonly<{ concept?: Readonly<{ text?: string }> }>[]
  location?: readonly Readonly<{ location?: Readonly<{ display?: string; reference?: string }> }>[]
  actualPeriod?: Readonly<{ start?: string; end?: string }>
  period?: Readonly<{ start?: string; end?: string }>
  partOf?: Readonly<{ reference?: string }>
}>

export type ClinicalDocumentBundle = ClinicalResourceBundleLike & Readonly<{ id?: string }>

export type ClinicalDocumentEncounterExplorerLabels = Readonly<{
  journeyTitle: string
  documentsTitle: string
  previousEncounter: string
  nextEncounter: string
  noDocuments: string
  emptySection: string
  noSections: string
  documentTypeLabel: string
  currentEncounter: string
}>

export type ClinicalDocumentEncounterExplorerProps = Readonly<{
  encounters: readonly EncounterJourneyResource[]
  documents: readonly ClinicalDocumentBundle[]
  labels: ClinicalDocumentEncounterExplorerLabels
  locale?: string
}>

type CompositionHeader = Readonly<{
  title: string
  type: string
  encounterReference?: string
  date?: string
}>

/**
 * Explores one host-authorized Encounter journey and its FHIR document Bundles.
 *
 * A document Bundle is Composition-first. The Encounter is care context, not
 * the clinical subject, and `Encounter.partOf` remains a hierarchy rather than
 * a substitute for chronological navigation. Fetching, authorization and
 * persistence remain responsibilities of the hosting portal.
 */
export function ClinicalDocumentEncounterExplorer({
  encounters,
  documents,
  labels,
  locale,
}: ClinicalDocumentEncounterExplorerProps) {
  const orderedEncounters = useMemo(
    () => [...encounters].sort((left, right) => encounterStart(left).localeCompare(encounterStart(right))),
    [encounters],
  )
  const documentHeaders = useMemo(
    () => documents.map((document) => ({ document, header: compositionHeader(document) })),
    [documents],
  )
  const firstDocumentEncounterIndex = orderedEncounters.findIndex((encounter) =>
    documentHeaders.some(({ header }) => referencesEncounter(header.encounterReference, encounter)),
  )
  const [selectedEncounterId, setSelectedEncounterId] = useState(
    orderedEncounters[Math.max(firstDocumentEncounterIndex, 0)]?.id ?? '',
  )
  const selectedIndex = Math.max(
    orderedEncounters.findIndex((encounter) => encounter.id === selectedEncounterId),
    0,
  )
  const selectedEncounter = orderedEncounters[selectedIndex]
  const encounterDocuments = selectedEncounter
    ? documentHeaders.filter(({ header }) => referencesEncounter(header.encounterReference, selectedEncounter))
    : []
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const selectedDocument = encounterDocuments.find(({ document }) => document.id === selectedDocumentId)
    ?? encounterDocuments[0]

  function selectEncounter(encounter: EncounterJourneyResource) {
    setSelectedEncounterId(encounter.id ?? '')
    setSelectedDocumentId('')
  }

  return (
    <section className="uhcp-document-explorer" data-clinical-document-explorer>
      <header className="uhcp-document-explorer-heading">
        <div>
          <p>{labels.currentEncounter}</p>
          <h2>{selectedEncounter ? encounterName(selectedEncounter) : labels.journeyTitle}</h2>
        </div>
        <nav aria-label={labels.journeyTitle}>
          <button
            type="button"
            aria-label={labels.previousEncounter}
            disabled={selectedIndex <= 0}
            onClick={() => selectEncounter(orderedEncounters[selectedIndex - 1])}
          >←</button>
          <button
            type="button"
            aria-label={labels.nextEncounter}
            disabled={selectedIndex >= orderedEncounters.length - 1}
            onClick={() => selectEncounter(orderedEncounters[selectedIndex + 1])}
          >→</button>
        </nav>
      </header>

      <div className="uhcp-encounter-rail" role="list" aria-label={labels.journeyTitle}>
        {orderedEncounters.map((encounter) => (
          <div key={encounter.id} role="listitem">
            <button
              type="button"
              aria-label={encounterName(encounter)}
              aria-current={encounter.id === selectedEncounter?.id ? 'step' : undefined}
              onClick={() => selectEncounter(encounter)}
            >
              <strong>{encounterName(encounter)}</strong>
              <span>{encounter.location?.[0]?.location?.display ?? encounter.class?.display}</span>
              <time dateTime={encounterStart(encounter)}>{formatPeriod(encounter, locale)}</time>
              <small data-status={encounter.status}>{encounter.status}</small>
            </button>
          </div>
        ))}
      </div>

      <section className="uhcp-document-panel">
        <h2>{labels.documentsTitle}</h2>
        {encounterDocuments.length === 0 ? <p>{labels.noDocuments}</p> : (
          <>
            {encounterDocuments.length > 1 ? (
              <div className="uhcp-document-tabs" role="list">
                {encounterDocuments.map(({ document, header }) => (
                  <span key={document.id ?? header.title} role="listitem">
                    <button
                      type="button"
                      aria-pressed={document === selectedDocument?.document}
                      onClick={() => setSelectedDocumentId(document.id ?? '')}
                    >{header.title}</button>
                  </span>
                ))}
              </div>
            ) : null}
            {selectedDocument ? (
              <article data-clinical-document>
                <header>
                  <div>
                    <p>{labels.documentTypeLabel}: {selectedDocument.header.type}</p>
                    <h3>{selectedDocument.header.title}</h3>
                  </div>
                  {selectedDocument.header.date ? <time dateTime={selectedDocument.header.date}>{formatInstant(selectedDocument.header.date, locale)}</time> : null}
                </header>
                <IpsBundleSummary
                  bundle={selectedDocument.document}
                  locale={locale}
                  emptyLabel={labels.emptySection}
                  noSectionsLabel={labels.noSections}
                />
              </article>
            ) : null}
          </>
        )}
      </section>
    </section>
  )
}

function encounterName(encounter: EncounterJourneyResource): string {
  return encounter.serviceType?.find(({ concept }) => concept?.text)?.concept?.text
    ?? encounter.class?.display
    ?? encounter.id
    ?? 'Encounter'
}

function encounterStart(encounter: EncounterJourneyResource): string {
  return encounter.actualPeriod?.start ?? encounter.period?.start ?? ''
}

function formatPeriod(encounter: EncounterJourneyResource, locale?: string): string {
  const period = encounter.actualPeriod ?? encounter.period
  if (!period?.start) return ''
  const start = formatInstant(period.start, locale)
  return period.end ? `${start} – ${formatInstant(period.end, locale)}` : start
}

function formatInstant(value: string, locale?: string): string {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date)
}

function compositionHeader(document: ClinicalDocumentBundle): CompositionHeader {
  const composition = (document.entry ?? document.data ?? [])
    .map((entry) => entry.resource as Readonly<{
      resourceType?: string
      title?: string
      type?: Readonly<{ text?: string; coding?: readonly Readonly<{ display?: string }>[] }>
      encounter?: Readonly<{ reference?: string }>
      date?: string
    }> | undefined)
    .find((resource) => resource?.resourceType === 'Composition')
  return {
    title: composition?.title ?? document.id ?? 'Clinical document',
    type: composition?.type?.text
      ?? composition?.type?.coding?.find(({ display }) => display)?.display
      ?? 'Clinical document',
    encounterReference: composition?.encounter?.reference,
    date: composition?.date,
  }
}

function referencesEncounter(reference: string | undefined, encounter: EncounterJourneyResource): boolean {
  return Boolean(encounter.id && (reference === `Encounter/${encounter.id}` || reference === encounter.id))
}
