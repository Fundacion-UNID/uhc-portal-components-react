// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  AllClinicalSections,
  ClinicalSummaryProfiles,
  ClinicalSectionNavigationIds,
  type AllClinicalSectionDefinition,
} from '../src/AllClinicalSections.js'

const SECTION_CONTENT = Object.freeze({
  healthStatus: 'Functional and cognitive assessment content',
  familyHistory: 'Family history content',
  careTeam: 'Authorized care team content',
  emergencyContacts: 'Authorized emergency contacts content',
})

const SECTIONS: readonly AllClinicalSectionDefinition<'person'>[] = Object.freeze([
  { id: ClinicalSectionNavigationIds.HealthStatusAssessments, title: 'Health status assessments', content: SECTION_CONTENT.healthStatus, collapsible: true },
  { id: ClinicalSectionNavigationIds.FamilyHealthHistory, title: 'Family health history', content: SECTION_CONTENT.familyHistory, collapsible: true },
  { id: ClinicalSectionNavigationIds.CareTeamMembers, title: 'Care team members', content: SECTION_CONTENT.careTeam, collapsible: true },
  { id: ClinicalSectionNavigationIds.EmergencyContacts, title: 'Emergency contacts', content: SECTION_CONTENT.emergencyContacts, collapsible: true },
])

const IPS_SECTIONS: readonly AllClinicalSectionDefinition<'person'>[] = Object.freeze([
  { id: ClinicalSectionNavigationIds.IpsSummary, title: 'International Patient Summary', content: 'IPS core' },
  { id: ClinicalSectionNavigationIds.GoalsAndPreferences, title: 'Goals and preferences', content: 'Goals content' },
  { id: ClinicalSectionNavigationIds.ClinicalTests, title: 'Clinical tests', content: 'Radiology result' },
])

afterEach(cleanup)

describe('AllClinicalSections', () => {
  it('keeps care-team members, emergency contacts and family history as independent sections', () => {
    render(<AllClinicalSections subjectKind="person" sections={SECTIONS} title="All health information" />)

    expect(screen.getByText('Care team members')).toBeTruthy()
    expect(screen.getByText('Emergency contacts')).toBeTruthy()
    expect(screen.getByText('Family health history')).toBeTruthy()
    expect(document.querySelectorAll('details')).toHaveLength(SECTIONS.length)
  })

  it('lets a host exclude sections without changing the shared ordering contract', () => {
    render(
      <AllClinicalSections
        subjectKind="person"
        sections={SECTIONS}
        title="Selected health information"
        excludedSectionIds={[ClinicalSectionNavigationIds.FamilyHealthHistory]}
      />,
    )

    expect(screen.queryByText('Family health history')).toBeNull()
    expect(screen.getByText('Emergency contacts')).toBeTruthy()
  })

  it('nests goals and clinical tests in the IPS instead of rendering duplicate top-level sections', () => {
    render(<AllClinicalSections subjectKind="person" sections={IPS_SECTIONS} title="All health information" />)

    const ips = screen.getByText('International Patient Summary').closest('details')
    expect(ips).toBeTruthy()
    expect(ips?.querySelectorAll(':scope > .uhcp-all-clinical-content > details')).toHaveLength(2)
    expect(document.querySelectorAll('.uhcp-all-clinical-stack > details')).toHaveLength(1)
  })

  it('keeps Advance Directives in the human profile and excludes it from the current animal summary profile', () => {
    const sections = [
      ...SECTIONS,
      { id: ClinicalSectionNavigationIds.AdvanceDirectives, title: 'Advance directives', content: 'Directive content' },
    ] as const
    const { rerender } = render(<AllClinicalSections subjectKind="person" sections={sections} title="Human summary" profile={ClinicalSummaryProfiles.Human}/>)
    expect(screen.getByText('Advance directives')).toBeTruthy()

    rerender(<AllClinicalSections subjectKind="animal" sections={sections} title="Animal summary" profile={ClinicalSummaryProfiles.Animal}/>)
    expect(screen.queryByText('Advance directives')).toBeNull()
  })
})
