// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
/**
 * Journey:
 * 1. A controller opens the shared IPS editor for one provider-authorized subject.
 * 2. They enter human-readable clinical text and explicitly select a terminology candidate.
 * 3. The host persists the typed flat claims and returns a fresh provider readback Bundle.
 * 4. The editor publishes only that readback to the reader.
 * Authorization invariant: the component owns no session, provider URL or write capability.
 * Persistence invariant: local form state never counts as a successful clinical write.
 */
// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ResourceTypesFhirR4 } from 'gdc-common-utils-ts/constants/fhir-resource-types'
import {
  FHIR_IPS_ALL_SECTIONS_DEMO_DATA,
  FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS,
  FhirIpsClinicalArtifactTypes,
} from 'fhir-data-utils-ts'
import { ConditionClaim, ImmunizationClaim } from 'fhir-data-utils-ts/claims'
import {
  MULTICHANNEL_OPERATION_SCHEMAS,
  MultichannelAttestationState,
  MultichannelOperationId,
  MultichannelOperationMode,
  buildMultichannelOperationBundle,
  readMultichannelOperationFromBundle,
} from 'sos-data-utils-ts/multichannel-operation-schemas'
import { REPOSITORY_SAFE_EXAMPLES } from 'sos-data-utils-ts/repository-privacy'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClinicalArtifactEditor } from '../src/ClinicalArtifactEditor.js'
import {
  ClinicalSpeechInputPhases,
  ClinicalSpeechInputChannelProvider,
  ClinicalSpeechInputProvider,
  createClinicalSpeechInputChannel,
} from '../src/ClinicalSpeechInput.js'

const resourceType = ResourceTypesFhirR4.Immunization
const sourceTextClaim = `${resourceType}.vaccine-code-text`
const codeClaim = `${resourceType}.vaccine-code`
const displayClaim = `${resourceType}.vaccine-code-display`
const statusClaim = `${resourceType}.status`
const dateClaim = `${resourceType}.date`
const sourceText = 'Seasonal influenza vaccine'
const fhirDateTime = '2026-04-10T10:00:00Z'
const terminologyCandidate = Object.freeze({
  system: 'http://snomed.info/sct',
  code: '836377006',
  display: 'Influenza vaccine',
  text: sourceText,
})
const providerReadback = Object.freeze({ resourceType: 'Bundle', type: 'document', entry: [] })

afterEach(cleanup)

describe('ClinicalArtifactEditor', () => {
  it('renders required FHIR codes as localized dropdown labels while saving the canonical code', async () => {
    const saveArtifact = vi.fn().mockResolvedValue(providerReadback)
    render(<ClinicalArtifactEditor
      request={{ resourceType: FhirIpsClinicalArtifactTypes.Condition, sectionCode: '11450-4', mode: 'create' }}
      schema={{
        resourceType: FhirIpsClinicalArtifactTypes.Condition,
        requiredClaims: [ConditionClaim.CodeText, ConditionClaim.ClinicalStatus],
        optionalClaims: [ConditionClaim.VerificationStatus],
      }}
      locale="es-ES"
      copy={{ title: 'Problema', description: 'Añadir problema', save: 'Guardar', saving: 'Guardando', cancel: 'Cancelar', close: 'Cerrar', terminologyLoading: 'Buscando', terminologyUnavailable: 'No disponible', readbackMissing: 'Falta la lectura' }}
      fieldLabel={(claim) => claim === ConditionClaim.ClinicalStatus ? 'Estado clínico' : claim === ConditionClaim.VerificationStatus ? 'Verificación' : 'Concepto'}
      saveArtifact={saveArtifact} onCancel={() => undefined} onReadback={() => undefined}
    />)

    expect(screen.getByRole('option', { name: 'Activo' })).toBeDefined()
    expect(screen.getByRole('option', { name: 'Remisión' })).toBeDefined()
    fireEvent.change(screen.getByLabelText('Estado clínico'), { target: { value: 'resolved' } })
    fireEvent.change(screen.getByLabelText('Concepto'), { target: { value: 'Fractura' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(saveArtifact).toHaveBeenCalledWith(expect.objectContaining({
      claims: expect.objectContaining({ [ConditionClaim.ClinicalStatus]: 'resolved' }),
    })))
  })

  it('uses a separate governed terminology default for each exact resource claim', async () => {
    const loadTerminologySources = vi.fn(async ({ claim }: { claim: string }) => claim === ConditionClaim.Code
      ? [{ id: 'ICD10', label: 'ICD-10', default: true }, { id: 'SNOMED_GPS', label: 'SNOMED GPS' }]
      : [{ id: 'ATCVET', label: 'ATCvet', default: true }, { id: 'SNOMEDCT_VET', label: 'SNOMED CT Veterinary' }])
    const conditionSearch = vi.fn().mockResolvedValue([])
    render(<ClinicalArtifactEditor
      request={{ resourceType: FhirIpsClinicalArtifactTypes.Condition, sectionCode: '11450-4', mode: 'create' }}
      schema={{ resourceType: FhirIpsClinicalArtifactTypes.Condition, requiredClaims: [ConditionClaim.CodeText], optionalClaims: [ConditionClaim.Code] }}
      copy={{ title: 'Condition', description: 'Add condition', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', terminologySources: 'Coding systems', readbackMissing: 'Readback missing' }}
      fieldLabel={() => 'Condition concept'} loadTerminologySources={loadTerminologySources} searchTerminology={conditionSearch}
      saveArtifact={vi.fn().mockResolvedValue(providerReadback)} onCancel={() => undefined} onReadback={() => undefined}
    />)
    fireEvent.change(screen.getByLabelText('Condition concept'), { target: { value: 'fracture' } })
    await waitFor(() => expect(conditionSearch).toHaveBeenCalledWith(expect.objectContaining({ claim: ConditionClaim.Code, sources: ['ICD10'] })))

    cleanup()
    const immunizationSearch = vi.fn().mockResolvedValue([])
    render(<ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'create' }}
      schema={{ resourceType, requiredClaims: [sourceTextClaim], optionalClaims: [codeClaim] }}
      copy={{ title: 'Vaccination', description: 'Add vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', terminologySources: 'Coding systems', readbackMissing: 'Readback missing' }}
      fieldLabel={() => 'Vaccine'} loadTerminologySources={loadTerminologySources} searchTerminology={immunizationSearch}
      saveArtifact={vi.fn().mockResolvedValue(providerReadback)} onCancel={() => undefined} onReadback={() => undefined}
    />)
    fireEvent.change(screen.getByLabelText('Vaccine'), { target: { value: sourceText } })
    await waitFor(() => expect(immunizationSearch).toHaveBeenCalledWith(expect.objectContaining({ claim: ImmunizationClaim.VaccineCode, sources: ['ATCVET'] })))
  })

  it('localizes the fixed Observation category and hides legacy split coding fields', () => {
    const observationSchema = FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS.Observation
    render(<ClinicalArtifactEditor
      request={{ resourceType: ResourceTypesFhirR4.Observation, sectionCode: observationSchema.sectionCode, mode: 'create' }}
      schema={observationSchema}
      operationSchema={MULTICHANNEL_OPERATION_SCHEMAS[MultichannelOperationId.Observation]}
      authoringContext={{
        subjectReference: REPOSITORY_SAFE_EXAMPLES.didWeb,
        language: 'es',
        createdAt: fhirDateTime,
        dataAuthorReference: `PractitionerRole/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`,
        attestationState: MultichannelAttestationState.Confirmed,
      }}
      locale="es"
      copy={{ title: 'Añadir dato clínico', description: 'Añadir observación', resourceType: 'Recurso FHIR', save: 'Guardar', saving: 'Guardando', cancel: 'Cancelar', close: 'Cerrar', terminologyLoading: 'Buscando', terminologyUnavailable: 'No disponible', readbackMissing: 'Falta la lectura' }}
      resourceTypeLabel="Signos vitales (Observation)"
      fieldLabel={(claim) => claim === 'Observation.category' ? 'Categoría' : claim === 'Observation.code-text' ? 'Concepto clínico' : claim}
      saveArtifact={vi.fn().mockResolvedValue(providerReadback)} onCancel={() => undefined} onReadback={() => undefined}
    />)

    expect(screen.getByText('Recurso FHIR: Signos vitales (Observation)')).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Signos vitales (HL7|vital-signs)' })).toBeTruthy()
    expect(screen.queryByLabelText('Observation.code-system')).toBeNull()
    expect(screen.queryByLabelText('Observation.code-value')).toBeNull()
  })

  it('shows governed coding systems, selects the default, and searches only selected sources', async () => {
    const searchTerminology = vi.fn().mockResolvedValue([terminologyCandidate])
    render(<ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'create' }}
      schema={{ resourceType, requiredClaims: [sourceTextClaim], optionalClaims: [codeClaim, displayClaim] }}
      copy={{ title: 'Vaccination', description: 'Add a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', terminologySources: 'Coding systems', readbackMissing: 'Readback missing' }}
      fieldLabel={() => 'Vaccine or product'}
      loadTerminologySources={vi.fn().mockResolvedValue([{ id: 'SNOMED_GPS', label: 'SNOMED GPS', default: true }, { id: 'ICD10', label: 'ICD-10' }])}
      searchTerminology={searchTerminology}
      saveArtifact={vi.fn().mockResolvedValue(providerReadback)} onCancel={() => undefined} onReadback={() => undefined}
    />)
    fireEvent.change(screen.getByLabelText('Vaccine or product'), { target: { value: sourceText } })
    const sources = await screen.findByRole('group', { name: 'Coding systems' })
    expect((within(sources).getByRole('checkbox', { name: 'SNOMED GPS' }) as HTMLInputElement).checked).toBe(true)
    expect((within(sources).getByRole('checkbox', { name: 'ICD-10' }) as HTMLInputElement).checked).toBe(false)
    await waitFor(() => expect(searchTerminology).toHaveBeenCalledWith(expect.objectContaining({ sources: ['SNOMED_GPS'] })))
  })
  it('uses the portal speech capability to append an editable transcript and start terminology search', async () => {
    const transcribe = vi.fn().mockResolvedValue(sourceText)
    const searchTerminology = vi.fn().mockResolvedValue([terminologyCandidate])

    render(<ClinicalSpeechInputProvider value={{
      phase: ClinicalSpeechInputPhases.Ready,
      transcribe,
      labels: { start: 'Dictate', unavailable: 'Speech unavailable', busy: 'Listening' },
    }}><ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'create' }}
      schema={{ resourceType, requiredClaims: [sourceTextClaim], optionalClaims: [codeClaim, displayClaim] }}
      copy={{ title: 'Vaccination', description: 'Add a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={(claim) => claim === sourceTextClaim ? 'Vaccine or product' : claim}
      searchTerminology={searchTerminology}
      saveArtifact={vi.fn().mockResolvedValue(providerReadback)}
      onCancel={() => undefined}
      onReadback={() => undefined}
    /></ClinicalSpeechInputProvider>)

    expect(screen.getByLabelText('Vaccine or product', { exact: true }).tagName).toBe('INPUT')
    fireEvent.click(screen.getByRole('button', { name: 'Dictate', exact: true }))
    await waitFor(() => expect((screen.getByLabelText('Vaccine or product') as HTMLInputElement).value).toBe(sourceText))
    expect(transcribe).toHaveBeenCalledWith(expect.objectContaining({ claim: sourceTextClaim, locale: 'en', resourceType }))
    await waitFor(() => expect(searchTerminology).toHaveBeenCalledWith(expect.objectContaining({ claim: codeClaim, text: sourceText })))
  })

  it('renders a disabled accessible microphone while the portal model is downloading', () => {
    render(<ClinicalSpeechInputProvider value={{
      phase: ClinicalSpeechInputPhases.Downloading,
      transcribe: vi.fn(),
      labels: { start: 'Dictate', unavailable: 'Speech model is downloading', busy: 'Listening' },
    }}><ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'create' }}
      schema={{ resourceType, requiredClaims: [sourceTextClaim], optionalClaims: [] }}
      copy={{ title: 'Vaccination', description: 'Add a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={() => 'Vaccine or product'}
      saveArtifact={vi.fn().mockResolvedValue(providerReadback)}
      onCancel={() => undefined}
      onReadback={() => undefined}
    /></ClinicalSpeechInputProvider>)

    const microphone = screen.getByRole('button', { name: 'Speech model is downloading', exact: true })
    expect(microphone.hasAttribute('disabled')).toBe(true)
  })

  it('enables an already-rendered nested microphone when the portal announces that its model is ready', () => {
    const channel = createClinicalSpeechInputChannel()
    const transcribe = vi.fn().mockResolvedValue(sourceText)
    render(<ClinicalSpeechInputChannelProvider
      channel={channel}
      labels={{ start: 'Dictate', unavailable: 'Speech model is not ready', busy: 'Listening' }}
    ><ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'create' }}
      schema={{ resourceType, requiredClaims: [sourceTextClaim], optionalClaims: [] }}
      copy={{ title: 'Vaccination', description: 'Add a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={() => 'Vaccine or product'}
      saveArtifact={vi.fn().mockResolvedValue(providerReadback)}
      onCancel={() => undefined}
      onReadback={() => undefined}
    /></ClinicalSpeechInputChannelProvider>)

    const microphone = screen.getByRole('button', { name: 'Speech model is not ready', exact: true })
    expect(microphone.hasAttribute('disabled')).toBe(true)
    act(() => channel.publish({ phase: ClinicalSpeechInputPhases.Ready, transcribe }))
    expect(screen.getByRole('button', { name: 'Dictate', exact: true }).hasAttribute('disabled')).toBe(false)
  })

  it('hydrates the editor claims directly from a FHIR Bundle resource and its shared schema', () => {
    const immunization = FHIR_IPS_ALL_SECTIONS_DEMO_DATA.bundle.entry
      .find(({ resource }) => resource.resourceType === FhirIpsClinicalArtifactTypes.Immunization)?.resource
    expect(immunization).toBeDefined()

    render(<ClinicalArtifactEditor
      request={{
        resourceType,
        sectionCode: FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS.Immunization.sectionCode,
        mode: 'update',
        artifactId: immunization!.id,
        initialResource: immunization!,
      }}
      schema={FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS.Immunization}
      copy={{ title: 'Vaccination', description: 'Edit a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={(claim) => claim === sourceTextClaim ? 'Vaccine or product' : claim}
      saveArtifact={vi.fn().mockResolvedValue(providerReadback)}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)

    expect((screen.getByLabelText('Vaccine or product') as HTMLInputElement).value).toBe(immunization!.vaccineCode.text)
  })

  it('keeps source text and submits only the explicitly selected terminology code', async () => {
    const searchTerminology = vi.fn().mockResolvedValue([terminologyCandidate])
    const saveArtifact = vi.fn().mockResolvedValue(providerReadback)
    const onReadback = vi.fn()

    render(<ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'create' }}
      schema={{ resourceType, requiredClaims: [sourceTextClaim, statusClaim], optionalClaims: [codeClaim, displayClaim] }}
      copy={{ title: 'Vaccination', description: 'Add a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={(claim) => claim === sourceTextClaim ? 'Vaccine or product' : 'Status'}
      searchTerminology={searchTerminology}
      saveArtifact={saveArtifact}
      onCancel={() => undefined}
      onReadback={onReadback}
    />)

    fireEvent.change(screen.getByLabelText('Vaccine or product'), { target: { value: sourceText } })
    await waitFor(() => expect(searchTerminology).toHaveBeenCalledWith(expect.objectContaining({ claim: codeClaim, text: sourceText })))
    fireEvent.click(await screen.findByRole('button', { name: /Influenza vaccine/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(saveArtifact).toHaveBeenCalledWith(expect.objectContaining({
      resourceType,
      sectionCode: '11369-6',
      claims: expect.objectContaining({
        [sourceTextClaim]: sourceText,
        [codeClaim]: `${terminologyCandidate.system}|${terminologyCandidate.code}`,
        [displayClaim]: terminologyCandidate.display,
      }),
    })))
    expect(onReadback).toHaveBeenCalledWith(providerReadback)
  })

  it('resolves the root code-text field used by allergy, condition and procedure editors', async () => {
    const allergyResourceType = ResourceTypesFhirR4.AllergyIntolerance
    const allergyTextClaim = `${allergyResourceType}.code-text`
    const allergyCodeClaim = `${allergyResourceType}.code`
    const allergyDisplayClaim = `${allergyResourceType}.code-display`
    const searchTerminology = vi.fn().mockResolvedValue([terminologyCandidate])

    render(<ClinicalArtifactEditor
      request={{ resourceType: allergyResourceType, sectionCode: '48765-2', mode: 'create' }}
      schema={{ resourceType: allergyResourceType, requiredClaims: [allergyTextClaim], optionalClaims: [allergyCodeClaim, allergyDisplayClaim] }}
      copy={{ title: 'Allergy', description: 'Add allergy', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={(claim) => claim === allergyTextClaim ? 'Clinical concept' : claim}
      searchTerminology={searchTerminology}
      saveArtifact={vi.fn().mockResolvedValue(providerReadback)}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)

    fireEvent.change(screen.getByLabelText('Clinical concept'), { target: { value: sourceText } })
    await waitFor(() => expect(searchTerminology).toHaveBeenCalledWith(expect.objectContaining({
      claim: allergyCodeClaim,
      text: sourceText,
    })))
  })

  it('uses the shared JSON Schema to create the BundleEditor claims and round-trip them through BundleReader', async () => {
    const saveArtifact = vi.fn().mockResolvedValue(providerReadback)
    const authoringContext = Object.freeze({
      subjectReference: REPOSITORY_SAFE_EXAMPLES.didWeb,
      language: 'en',
      createdAt: fhirDateTime,
      dataAuthorReference: `RelatedPerson/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`,
      attestationState: MultichannelAttestationState.Draft,
    })
    render(<ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'create' }}
      schema={FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS.Immunization}
      operationSchema={MULTICHANNEL_OPERATION_SCHEMAS[MultichannelOperationId.Immunization]}
      authoringContext={authoringContext}
      copy={{ title: 'Vaccination', description: 'Add a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={(claim) => claim === sourceTextClaim ? 'Vaccine or product' : claim === dateClaim ? 'Administration date' : claim}
      saveArtifact={saveArtifact}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)

    expect(screen.getByLabelText('Immunization.lot-number').getAttribute('type')).toBe('text')
    expect(screen.getByLabelText('Immunization.dose-sequence').getAttribute('type')).toBe('number')
    fireEvent.change(screen.getByLabelText('Vaccine or product'), { target: { value: sourceText } })
    fireEvent.change(screen.getByLabelText('Administration date: Date'), { target: { value: '2026-04-10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(saveArtifact).toHaveBeenCalledTimes(1))
    const submitted = saveArtifact.mock.calls[0][0]
    expect(submitted.changesBundle).toBeDefined()
    expect(readMultichannelOperationFromBundle(
      MultichannelOperationId.Immunization,
      submitted.changesBundle,
      { operation: MultichannelOperationMode.Create },
    )).toEqual(submitted.operationValues)
  })

  it('hydrates the shared JSON Schema fields from a claims-first BundleReader entry', () => {
    const authoringContext = Object.freeze({
      subjectReference: REPOSITORY_SAFE_EXAMPLES.didWeb,
      language: 'es',
      createdAt: fhirDateTime,
      dataAuthorReference: `RelatedPerson/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`,
      attestationState: MultichannelAttestationState.Draft,
    })
    const operationValues = Object.freeze({
      operation: MultichannelOperationMode.Create,
      resourceId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
      ...authoringContext,
      claims: Object.freeze({
        [statusClaim]: 'completed',
        [dateClaim]: '2026-04-10',
        [sourceTextClaim]: sourceText,
      }),
    })
    const initialBundle = buildMultichannelOperationBundle(MultichannelOperationId.Immunization, operationValues)

    render(<ClinicalArtifactEditor
      request={{
        resourceType,
        sectionCode: '11369-6',
        mode: 'update',
        artifactId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
        ifMatch: 'W/"1"',
        initialBundle,
      }}
      schema={FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS.Immunization}
      operationSchema={MULTICHANNEL_OPERATION_SCHEMAS[MultichannelOperationId.Immunization]}
      authoringContext={authoringContext}
      copy={{ title: 'Vaccination', description: 'Edit a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={(claim) => claim === sourceTextClaim ? 'Vaccine or product' : claim === dateClaim ? 'Administration date' : claim}
      saveArtifact={vi.fn().mockResolvedValue(providerReadback)}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)

    expect((screen.getByLabelText('Vaccine or product') as HTMLInputElement).value).toBe(sourceText)
    expect((screen.getByLabelText('Administration date: Date') as HTMLInputElement).value).toBe('2026-04-10')
    expect((screen.getByLabelText('Administration date: Time') as HTMLInputElement).value).toBe('')
  })

  it('does not publish local state when the provider omits authoritative readback', async () => {
    const onReadback = vi.fn()
    render(<ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'create' }}
      schema={{ resourceType, requiredClaims: [sourceTextClaim], optionalClaims: [] }}
      copy={{ title: 'Vaccination', description: 'Add a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={() => 'Vaccine or product'}
      saveArtifact={vi.fn().mockResolvedValue(undefined)}
      onCancel={() => undefined}
      onReadback={onReadback}
    />)

    fireEvent.change(screen.getByLabelText('Vaccine or product'), { target: { value: sourceText } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect((await screen.findByRole('alert')).textContent).toContain('Readback missing')
    expect(onReadback).not.toHaveBeenCalled()
  })

  it('keeps a durably queued draft visible and retries until provider readback confirms it', async () => {
    const saveArtifact = vi.fn()
      .mockResolvedValueOnce({ state: 'retryable', message: 'Provider unavailable' })
      .mockResolvedValueOnce({ state: 'confirmed', bundle: providerReadback })
    const onReadback = vi.fn()
    render(<ClinicalArtifactEditor
      request={{ resourceType, sectionCode: FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS.Immunization.sectionCode, mode: 'create' }}
      schema={FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS.Immunization}
      copy={{ title: 'Vaccination', description: 'Add a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing', pending: 'Draft pending synchronization', retry: 'Retry synchronization' }}
      fieldLabel={(claim) => claim === sourceTextClaim ? 'Vaccine or product' : 'Status'}
      saveArtifact={saveArtifact}
      onCancel={() => undefined}
      onReadback={onReadback}
    />)

    fireEvent.change(screen.getByLabelText('Vaccine or product'), { target: { value: sourceText } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect((await screen.findByRole('status')).textContent).toContain('Draft pending synchronization')
    expect(onReadback).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Retry synchronization' }))
    await waitFor(() => expect(onReadback).toHaveBeenCalledWith(providerReadback))
    expect(saveArtifact).toHaveBeenCalledTimes(2)
  })

  it('preserves a complete FHIR dateTime instead of truncating it to a calendar date', async () => {
    const saveArtifact = vi.fn().mockResolvedValue(providerReadback)
    render(<ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'update', artifactId: REPOSITORY_SAFE_EXAMPLES.resourceUuid, ifMatch: 'W/"1"', initialClaims: { [sourceTextClaim]: sourceText, [dateClaim]: fhirDateTime } }}
      schema={{ resourceType, requiredClaims: [sourceTextClaim], optionalClaims: [dateClaim] }}
      copy={{ title: 'Vaccination', description: 'Edit a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={(claim) => claim === dateClaim ? 'Occurrence' : 'Vaccine or product'}
      saveArtifact={saveArtifact}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)

    expect((screen.getByLabelText('Occurrence') as HTMLInputElement).value).toBe(fhirDateTime)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(saveArtifact).toHaveBeenCalledWith(expect.objectContaining({
      claims: expect.objectContaining({ [dateClaim]: fhirDateTime }),
    })))
  })

  it('edits a schema dateTime through separate local date and time controls and preserves the instant', async () => {
    const saveArtifact = vi.fn().mockResolvedValue(providerReadback)
    render(<ClinicalArtifactEditor
      request={{ resourceType, sectionCode: '11369-6', mode: 'update', artifactId: REPOSITORY_SAFE_EXAMPLES.resourceUuid, ifMatch: 'W/"1"', initialClaims: { [sourceTextClaim]: sourceText, [dateClaim]: fhirDateTime } }}
      schema={FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS.Immunization}
      operationSchema={MULTICHANNEL_OPERATION_SCHEMAS[MultichannelOperationId.Immunization]}
      authoringContext={{
        subjectReference: REPOSITORY_SAFE_EXAMPLES.didWeb,
        language: 'en',
        createdAt: fhirDateTime,
        dataAuthorReference: `RelatedPerson/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`,
        attestationState: MultichannelAttestationState.Draft,
      }}
      timeZone="UTC"
      copy={{
        title: 'Vaccination', description: 'Edit a vaccination', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close',
        terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing',
        dateTime: { date: 'Date', time: 'Time', useToday: 'Use today', useCurrentTime: 'Use current time' },
      }}
      fieldLabel={(claim) => claim === dateClaim ? 'Occurrence' : claim}
      saveArtifact={saveArtifact}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)

    expect((screen.getByLabelText('Occurrence: Date') as HTMLInputElement).value).toBe('2026-04-10')
    expect((screen.getByLabelText('Occurrence: Time') as HTMLInputElement).value).toBe('10:00:00')
    expect(screen.queryByDisplayValue(fhirDateTime)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(saveArtifact).toHaveBeenCalledWith(expect.objectContaining({
      claims: expect.objectContaining({ [dateClaim]: fhirDateTime }),
    })))
  })

  it('renders a blank choice for optional status fields without inventing clinical state', () => {
    const conditionSchema = FHIR_IPS_CLINICAL_ARTIFACT_SCHEMAS.Condition
    render(<ClinicalArtifactEditor
      request={{ resourceType: ResourceTypesFhirR4.Condition, sectionCode: conditionSchema.sectionCode, mode: 'create' }}
      schema={conditionSchema}
      operationSchema={MULTICHANNEL_OPERATION_SCHEMAS[MultichannelOperationId.Condition]}
      authoringContext={{
        subjectReference: REPOSITORY_SAFE_EXAMPLES.didWeb,
        language: 'en',
        createdAt: fhirDateTime,
        dataAuthorReference: `RelatedPerson/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`,
        attestationState: MultichannelAttestationState.Draft,
      }}
      copy={{ title: 'Condition', description: 'Add condition', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', terminologyLoading: 'Searching', terminologyUnavailable: 'Unavailable', readbackMissing: 'Readback missing' }}
      fieldLabel={(claim) => claim}
      saveArtifact={vi.fn().mockResolvedValue(providerReadback)}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)

    const verificationStatus = screen.getByLabelText('Condition.verification-status') as HTMLSelectElement
    expect(verificationStatus.value).toBe('')
    expect(verificationStatus.options[0]?.value).toBe('')
  })
})
