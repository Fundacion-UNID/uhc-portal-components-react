// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
/**
 * Journey and invariants:
 * 1. The host supplies only already-authorized Encounter resources and document Bundles.
 * 2. The explorer orders Encounters by their clinical period and never invents authorization or persistence.
 * 3. Selecting an Encounter exposes only documents whose leading Composition references it.
 * 4. Selecting a document renders its Composition title, type and sections through the shared clinical viewer.
 * 5. Previous and next navigation remains inside the supplied Encounter set, including parent admission context.
 */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { FHIR_CLINICAL_DOCUMENT_ENCOUNTER_JOURNEY_TEST_DATA } from 'fhir-data-utils-ts/data'
import { ClinicalDocumentEncounterExplorer } from '../src/ClinicalDocumentEncounterExplorer.js'

const labels = Object.freeze({
  journeyTitle: 'Care journey',
  documentsTitle: 'Clinical documents',
  previousEncounter: 'Previous encounter',
  nextEncounter: 'Next encounter',
  noDocuments: 'No documents for this encounter',
  emptySection: 'No records',
  noSections: 'This document has no sections',
  documentTypeLabel: 'Document type',
  currentEncounter: 'Current encounter',
})

afterEach(cleanup)

describe('ClinicalDocumentEncounterExplorer', () => {
  it('moves through related Encounters and renders each Composition-driven document', async () => {
    const user = userEvent.setup()
    const fixture = FHIR_CLINICAL_DOCUMENT_ENCOUNTER_JOURNEY_TEST_DATA

    render(
      <ClinicalDocumentEncounterExplorer
        encounters={fixture.encounters}
        documents={fixture.documents}
        labels={labels}
        locale="en"
      />,
    )

    expect(screen.getByRole('heading', { name: 'Emergency assessment' })).toBeTruthy()
    expect(screen.getByText(/Emergency department note/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Diagnostic imaging' }))
    expect(screen.getByRole('heading', { name: 'Diagnostic imaging report' })).toBeTruthy()
    expect(screen.getByText('Imaging result')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: labels.nextEncounter }))
    expect(screen.getByRole('heading', { name: 'Intensive care progress note' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: labels.previousEncounter }))
    expect(screen.getByRole('heading', { name: 'Diagnostic imaging report' })).toBeTruthy()
  })

  it('shows parent admission context without treating the Encounter as a clinical subject', async () => {
    const user = userEvent.setup()
    const fixture = FHIR_CLINICAL_DOCUMENT_ENCOUNTER_JOURNEY_TEST_DATA

    render(
      <ClinicalDocumentEncounterExplorer
        encounters={fixture.encounters}
        documents={fixture.documents}
        labels={labels}
        locale="en"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Inpatient encounter' }))
    expect(screen.getByText(labels.noDocuments)).toBeTruthy()
    expect(document.querySelector('[data-clinical-document]')).toBeNull()
  })
})
