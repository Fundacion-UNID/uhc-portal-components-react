// Flow contract: every IPS resource uses the same progressive V2 shell; schemas decide required fields, coded dropdowns and optional flat claims without falling back to the legacy form.
/**
 * Journey:
 * 1. A professional opens a non-Immunization IPS resource from the shared Bundle editor.
 * 2. Required coded fields are shown with governed controls while optional claims remain hidden.
 * 3. The professional searches terminology, selects a canonical code and adds only one optional field.
 * 4. Saving returns a claims-first draft to the enclosing document and performs no persistence.
 * Authorization invariant: subject, creator and attester remain host-owned.
 * Persistence invariant: this editor only stages a local draft.
 */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS } from 'fhir-data-utils-ts'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SchemaClinicalArtifactEditorV2 } from '../src/SchemaClinicalArtifactEditorV2.js'

afterEach(cleanup)

const copy = {
  title: 'Add clinical data', description: 'Only essential fields are shown.', resourceType: 'FHIR resource',
  save: 'Add to draft', saving: 'Adding', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', terminologySources: 'Coding systems', readbackMissing: 'Draft unavailable',
  addField: 'Add another field', chooseField: 'Choose a field', addSelectedField: 'Add field', removeField: 'Remove field', searchTerminology: 'Search codes', clearCoding: 'Clear selected code', selectCandidate: 'Select a code', canonicalCode: 'Coding system and code', canonicalDisplay: 'English display', documents: 'Documents', addDocuments: 'Add PDF or image', removeDocument: 'Remove document',
  codingRequired: 'Select a terminology code.',
  date: 'Date', time: 'Time', useToday: 'Today', useCurrentTime: 'Now',
}

const context = {
  subjectReference: 'Patient/subject01', language: 'en', createdAt: '2026-10-08T12:00:00Z',
  dataAuthorReference: 'PractitionerRole/veterinarian', attestationState: 'confirmed' as const,
  attesterReference: 'PractitionerRole/veterinarian', attesterMode: 'professional', attestedAt: '2026-10-08T12:00:00Z',
}

describe('SchemaClinicalArtifactEditorV2', () => {
  it.each([
    ['AllergyIntolerance', 'AllergyIntolerance.code-text', 'AllergyIntolerance.clinical-status'],
    ['MedicationStatement', 'MedicationStatement.code-text', 'MedicationStatement.status'],
    ['Procedure', 'Procedure.code-text', 'Procedure.status'],
  ] as const)('uses the same V2 shell for %s', (resourceType, conceptClaim, statusClaim) => {
    const schema = FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS[resourceType]
    render(<SchemaClinicalArtifactEditorV2
      request={{ resourceType, sectionCode: schema.sectionCode ?? '', mode: 'create' }}
      schema={schema}
      authoringContext={context}
      copy={copy}
      fieldLabel={claim => claim}
      saveArtifact={vi.fn()}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)
    expect(screen.getByText(`FHIR resource: ${resourceType}`)).toBeTruthy()
    expect(screen.getByLabelText(conceptClaim)).toBeTruthy()
    expect(screen.getByLabelText(statusClaim).tagName).toBe('SELECT')
    cleanup()
  })

  it('uses the progressive V2 form for Condition with a coded status and terminology-backed concept', async () => {
    const saveArtifact = vi.fn(async () => ({ resourceType: 'Bundle', type: 'batch', data: [] }))
    render(<SchemaClinicalArtifactEditorV2
      request={{ resourceType: 'Condition', sectionCode: '11450-4', mode: 'create' }}
      schema={FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS.Condition}
      authoringContext={context}
      copy={copy}
      fieldLabel={claim => ({
        'Condition.code-text': 'Clinical concept', 'Condition.clinical-status': 'Clinical status',
        'Condition.recorded-date': 'Recorded date',
      } as Record<string, string>)[claim] ?? claim}
      loadTerminologySources={vi.fn().mockResolvedValue([{ id: 'ICD10', label: 'ICD-10', default: true }])}
      searchTerminology={vi.fn().mockResolvedValue([{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'H16.0', display: 'Corneal ulcer', text: 'Úlcera corneal' }])}
      saveArtifact={saveArtifact}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)

    expect(screen.getByLabelText('Clinical status').tagName).toBe('SELECT')
    expect(screen.getByLabelText('Clinical concept')).toBeTruthy()
    expect(screen.queryByLabelText('Recorded date')).toBeNull()
    fireEvent.change(screen.getByLabelText('Clinical concept'), { target: { value: 'Úlcera corneal' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search codes' }))
    fireEvent.change(await screen.findByLabelText('Select a code'), { target: { value: 'http://hl7.org/fhir/sid/icd-10|H16.0' } })
    fireEvent.change(screen.getByLabelText('Choose a field'), { target: { value: 'Condition.recorded-date' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add field' }))
    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to draft' }))

    await waitFor(() => expect(saveArtifact).toHaveBeenCalledWith(expect.objectContaining({
      resourceType: 'Condition',
      claims: expect.objectContaining({
        'Condition.code': 'http://hl7.org/fhir/sid/icd-10|H16.0',
        'Condition.code-display': 'Corneal ulcer',
        'Condition.code-text': 'Úlcera corneal',
        'Condition.clinical-status': 'active',
      }),
    })))
  })

  it('renders the schema-owned Observation category as a translated dropdown', () => {
    render(<SchemaClinicalArtifactEditorV2
      request={{ resourceType: 'Observation', sectionCode: '8716-3', mode: 'create' }}
      schema={FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS.Observation}
      authoringContext={context}
      copy={copy}
      locale="es"
      fieldLabel={claim => claim === 'Observation.category' ? 'Categoría' : claim}
      saveArtifact={vi.fn()}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)
    expect(screen.getByRole('option', { name: 'Signos vitales (HL7|vital-signs)' })).toBeTruthy()
  })
})
