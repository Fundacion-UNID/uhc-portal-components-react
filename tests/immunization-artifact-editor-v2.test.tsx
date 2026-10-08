// Flow contract: Demo stages a minimal claims-first Immunization with explicit terminology selection, progressive optional fields and no persistence before the enclosing document is submitted.
/**
 * Journey:
 * 1. A veterinarian opens the Demo-only vaccination editor.
 * 2. Only essential vaccination fields are initially visible; optional flat claims are added explicitly.
 * 3. The veterinarian searches ATCvet, selects a candidate and the canonical code/display/local text lock together.
 * 4. Dose ordering is validated and a next-dose date stages an ImmunizationRecommendation.
 * Authorization invariant: creator and attester are host-owned and never editable in this form.
 * Persistence invariant: saving only returns an in-memory draft to the enclosing Bundle editor.
 */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ImmunizationClaim } from 'fhir-data-utils-ts/claims'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImmunizationArtifactEditorV2 } from '../src/ImmunizationArtifactEditorV2.js'

afterEach(cleanup)

const copy = {
  title: 'Add vaccination', description: 'Complete the essential vaccination data.', resourceType: 'FHIR resource',
  save: 'Add to draft', saving: 'Adding', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'No terminology results', terminologySources: 'Coding systems', readbackMissing: 'Draft unavailable',
  addField: 'Add another field', chooseField: 'Choose a field', addSelectedField: 'Add field', removeField: 'Remove field', searchTerminology: 'Search coding candidates', clearCoding: 'Clear selected code', selectCandidate: 'Select a code', canonicalCode: 'Coding system and code', canonicalDisplay: 'English display', documents: 'Certificate documents', addDocuments: 'Add PDF or image', removeDocument: 'Remove document',
  doseSequenceInvalid: 'Dose number must be greater than zero.', seriesDosesInvalid: 'Total series doses cannot be lower than dose number.',
  date: 'Date', time: 'Time', useToday: 'Today', useCurrentTime: 'Now',
}

describe('ImmunizationArtifactEditorV2', () => {
  it('keeps optional claims hidden, selects one terminology candidate and builds a recommendation', async () => {
    const saveArtifact = vi.fn(async (draft) => ({ resourceType: 'Bundle', type: 'batch', data: [], draft }))
    const searchTerminology = vi.fn().mockResolvedValue([{
      system: 'http://www.whocc.no/atcvet', code: 'QI07AA02', display: 'Rabies vaccine', text: 'Vacuna de la rabia',
    }])
    render(<ImmunizationArtifactEditorV2
      request={{ resourceType: 'Immunization', sectionCode: '11369-6', mode: 'create' }}
      authoringContext={{ subjectReference: 'Patient/subject01', language: 'es', createdAt: '2026-10-08T12:00:00Z', dataAuthorReference: 'PractitionerRole/demo-veterinarian', attestationState: 'confirmed', attesterReference: 'PractitionerRole/demo-veterinarian', attesterMode: 'professional', attestedAt: '2026-10-08T12:00:00Z' }}
      copy={copy}
      locale="es"
      fieldLabel={(claim) => ({
        [ImmunizationClaim.Status]: 'Estado', [ImmunizationClaim.VaccineCodeText]: 'Vacuna', [ImmunizationClaim.Date]: 'Fecha de administración',
        [ImmunizationClaim.LotNumber]: 'Lote', [ImmunizationClaim.DoseSequence]: 'Número de dosis', [ImmunizationClaim.SeriesDoses]: 'Dosis totales de la serie',
      }[claim] ?? claim)}
      loadTerminologySources={vi.fn().mockResolvedValue([{ id: 'ATCVET', label: 'ATCvet', default: true }])}
      searchTerminology={searchTerminology}
      saveArtifact={saveArtifact}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)

    expect(screen.getByLabelText('Estado')).toBeTruthy()
    expect(screen.getByLabelText('Vacuna')).toBeTruthy()
    expect(screen.queryByLabelText('Lote')).toBeNull()

    fireEvent.change(screen.getByLabelText('Vacuna'), { target: { value: 'Vacuna de la rabia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search coding candidates' }))
    await waitFor(() => expect(searchTerminology).toHaveBeenCalledWith(expect.objectContaining({ claim: ImmunizationClaim.VaccineCode, sources: ['ATCVET'] })))
    fireEvent.change(screen.getByLabelText('Select a code'), { target: { value: 'http://www.whocc.no/atcvet|QI07AA02' } })
    expect(screen.getByLabelText('Vacuna')).toHaveProperty('readOnly', true)
    expect(screen.getByLabelText<HTMLInputElement>('Coding system and code').value).toBe('http://www.whocc.no/atcvet|QI07AA02')
    expect(screen.getByLabelText<HTMLInputElement>('English display').value).toBe('Rabies vaccine')

    for (const claim of [ImmunizationClaim.DoseSequence, ImmunizationClaim.SeriesDoses, 'Immunization.next-dose-date']) {
      fireEvent.change(screen.getByLabelText('Choose a field'), { target: { value: claim } })
      fireEvent.click(screen.getByRole('button', { name: 'Add field' }))
    }
    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    fireEvent.change(screen.getByLabelText('Número de dosis'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Dosis totales de la serie'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add to draft' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Total series doses')
    expect(saveArtifact).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Dosis totales de la serie'), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText('Immunization.next-dose-date'), { target: { value: '2027-10-08' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add to draft' }))
    await waitFor(() => expect(saveArtifact).toHaveBeenCalledWith(expect.objectContaining({
      claims: expect.objectContaining({
        [ImmunizationClaim.VaccineCode]: 'http://www.whocc.no/atcvet|QI07AA02',
        [ImmunizationClaim.DoseSequence]: '2', [ImmunizationClaim.SeriesDoses]: '3',
      }),
      relatedEntries: [expect.objectContaining({ resourceType: 'ImmunizationRecommendation' })],
    })))
  })
})
