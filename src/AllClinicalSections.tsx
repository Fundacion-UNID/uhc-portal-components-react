import { useState, type ReactNode } from 'react'

export const ClinicalSectionNavigationIds = Object.freeze({
  IpsSummary: 'ips-summary',
  Encounters: 'encounters',
  HealthStatusAssessments: 'health-status-assessments',
  HealthInsuranceInformation: 'health-insurance-information',
  GoalsAndPreferences: 'goals-and-preferences',
  FamilyHealthHistory: 'family-health-history',
  ClinicalTests: 'clinical-tests',
  ClinicalNotes: 'clinical-notes',
  CareTeamMembers: 'care-team-members',
  EmergencyContacts: 'emergency-contacts',
  AdvanceDirectives: 'advance-directives',
} as const)

export type ClinicalSectionNavigationId = typeof ClinicalSectionNavigationIds[keyof typeof ClinicalSectionNavigationIds]
export type ClinicalSubjectKind = 'person' | 'animal'

export const ClinicalSummaryProfiles = Object.freeze({
  Human: Object.freeze({ id: 'human', excludedSectionIds: Object.freeze([]) }),
  Animal: Object.freeze({ id: 'animal', excludedSectionIds: Object.freeze([ClinicalSectionNavigationIds.AdvanceDirectives]) }),
} as const)

export type ClinicalSummaryProfile = typeof ClinicalSummaryProfiles[keyof typeof ClinicalSummaryProfiles]

export type AllClinicalSectionDefinition<SubjectKind extends ClinicalSubjectKind> = Readonly<{
  id: ClinicalSectionNavigationId | (string & {})
  title: string
  description?: string
  content?: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  children?: readonly AllClinicalSectionDefinition<SubjectKind>[]
}>

export type AllClinicalSectionsProps<SubjectKind extends ClinicalSubjectKind> = Readonly<{
  subjectKind: SubjectKind
  title: string
  sections: readonly AllClinicalSectionDefinition<SubjectKind>[]
  excludedSectionIds?: readonly string[]
  profile?: ClinicalSummaryProfile
  presentation?: 'sections' | 'tabs'
}>

/**
 * Organizes host-provided clinical views without redefining their FHIR model.
 *
 * The host decides which sections apply to a person or animal, supplies only
 * authorized content and may exclude sections. Family history, emergency
 * contacts and care-team members remain independent domains; this component
 * never follows another subject's card or document links automatically.
 */
export function AllClinicalSections<SubjectKind extends ClinicalSubjectKind>({
  subjectKind,
  title,
  sections,
  excludedSectionIds = [],
  profile,
  presentation = 'sections',
}: AllClinicalSectionsProps<SubjectKind>) {
  const effectiveExcludedSectionIds = [...new Set([...(profile?.excludedSectionIds ?? []), ...excludedSectionIds])]
  const visibleSections = organizeClinicalSections(sections.filter(({ id }) => !effectiveExcludedSectionIds.includes(id)))
  const [selectedId, setSelectedId] = useState(visibleSections[0]?.id ?? '')
  const selectedSection = visibleSections.find(({ id }) => id === selectedId) ?? visibleSections[0]

  return (
    <section className="uhcp-all-clinical-sections" data-subject-kind={subjectKind}>
      <h2>{title}</h2>
      {presentation === 'tabs' ? (
        <>
          <div className="uhcp-all-clinical-tabs" role="tablist" aria-label={title}>
            {visibleSections.map((section) => (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={section.id === selectedSection?.id}
                aria-controls={`uhcp-all-section-${section.id}`}
                onClick={() => setSelectedId(section.id)}
              >{section.title}</button>
            ))}
          </div>
          {selectedSection ? (
            <div id={`uhcp-all-section-${selectedSection.id}`} role="tabpanel">
              <ClinicalSection definition={selectedSection} excludedSectionIds={effectiveExcludedSectionIds} />
            </div>
          ) : null}
        </>
      ) : (
        <div className="uhcp-all-clinical-stack">
          {visibleSections.map((section) => (
            <ClinicalSection key={section.id} definition={section} excludedSectionIds={effectiveExcludedSectionIds} />
          ))}
        </div>
      )}
    </section>
  )
}

function organizeClinicalSections<SubjectKind extends ClinicalSubjectKind>(
  sections: readonly AllClinicalSectionDefinition<SubjectKind>[],
): readonly AllClinicalSectionDefinition<SubjectKind>[] {
  const ipsChildrenIds = new Set<string>([
    ClinicalSectionNavigationIds.GoalsAndPreferences,
    ClinicalSectionNavigationIds.ClinicalTests,
  ])
  const ipsChildren = sections.filter(({ id }) => ipsChildrenIds.has(id))
  if (ipsChildren.length === 0) return sections
  return sections
    .filter(({ id }) => !ipsChildrenIds.has(id))
    .map((section) => section.id === ClinicalSectionNavigationIds.IpsSummary
      ? { ...section, children: [...(section.children ?? []), ...ipsChildren] }
      : section)
}

function ClinicalSection<SubjectKind extends ClinicalSubjectKind>({
  definition,
  excludedSectionIds,
}: Readonly<{
  definition: AllClinicalSectionDefinition<SubjectKind>
  excludedSectionIds: readonly string[]
}>) {
  const body = (
    <div className="uhcp-all-clinical-content">
      {definition.description ? <p>{definition.description}</p> : null}
      {definition.content}
      {definition.children?.filter(({ id }) => !excludedSectionIds.includes(id)).map((child) => (
        <ClinicalSection key={child.id} definition={child} excludedSectionIds={excludedSectionIds} />
      ))}
    </div>
  )
  if (definition.collapsible !== false) {
    return (
      <details className="uhcp-all-clinical-section" open={definition.defaultOpen}>
        <summary>{definition.title}</summary>
        {body}
      </details>
    )
  }
  return (
    <section className="uhcp-all-clinical-section" aria-labelledby={`uhcp-all-section-title-${definition.id}`}>
      <h3 id={`uhcp-all-section-title-${definition.id}`}>{definition.title}</h3>
      {body}
    </section>
  )
}
