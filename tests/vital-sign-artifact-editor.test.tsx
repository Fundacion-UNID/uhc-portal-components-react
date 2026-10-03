// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
/**
 * Journey:
 * 1. A permitted author opens the shared vital-sign capture dialog.
 * 2. They choose blood pressure instead of an unrelated Observation category.
 * 3. They enter the systolic and diastolic components and save once.
 * 4. The host receives one typed measurement and returns provider readback.
 * Authorization invariant: the component owns no write permission or provider endpoint.
 * Persistence invariant: two component values belong to one measurement and success requires provider readback.
 */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VitalSignArtifactEditor } from '../src/VitalSignArtifactEditor.js'

const providerReadback = Object.freeze({ resourceType: 'Bundle', type: 'document', entry: [] })
const measuredAt = '2026-10-03T09:30:00Z'
const systolic = 120
const diastolic = 80

afterEach(cleanup)

describe('VitalSignArtifactEditor', () => {
  it('submits blood pressure as one typed measurement with two components', async () => {
    const saveMeasurement = vi.fn().mockResolvedValue(providerReadback)
    const onReadback = vi.fn()

    render(<VitalSignArtifactEditor
      entryId="measurement-id"
      subjectReference="Patient/demo"
      copy={{ title: 'Add vital sign', description: 'Choose the measurement type.', kind: 'Measurement type', measuredAt: 'Measured at', value: 'Value', systolic: 'Systolic', diastolic: 'Diastolic', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', readbackMissing: 'Readback missing' }}
      kindLabels={{ 'blood-pressure': 'Blood pressure', temperature: 'Temperature', 'heart-rate': 'Heart rate', 'oxygen-saturation': 'Oxygen saturation', 'respiratory-rate': 'Respiratory rate', 'body-weight': 'Body weight' }}
      saveMeasurement={saveMeasurement}
      onCancel={() => undefined}
      onReadback={onReadback}
    />)

    fireEvent.change(screen.getByLabelText('Measurement type'), { target: { value: 'blood-pressure' } })
    fireEvent.change(screen.getByLabelText('Measured at'), { target: { value: measuredAt } })
    fireEvent.change(screen.getByLabelText('Systolic'), { target: { value: String(systolic) } })
    fireEvent.change(screen.getByLabelText('Diastolic'), { target: { value: String(diastolic) } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(saveMeasurement).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'blood-pressure',
      systolic,
      diastolic,
      measuredAt,
    })))
    expect(saveMeasurement.mock.calls[0][0]).not.toHaveProperty('value')
    expect(onReadback).toHaveBeenCalledWith(providerReadback)
  })

  it('reopens both blood-pressure components without reducing them to one scalar value', () => {
    render(<VitalSignArtifactEditor
      entryId="measurement-id"
      subjectReference="Patient/demo"
      initialMeasurement={{ entryId: 'measurement-id', subjectReference: 'Patient/demo', kind: 'blood-pressure', measuredAt, status: 'final', systolic, diastolic }}
      copy={{ title: 'Edit vital sign', description: 'Review both components.', kind: 'Measurement type', measuredAt: 'Measured at', value: 'Value', systolic: 'Systolic', diastolic: 'Diastolic', save: 'Save', saving: 'Saving', cancel: 'Cancel', close: 'Close', readbackMissing: 'Readback missing' }}
      kindLabels={{ 'blood-pressure': 'Blood pressure', temperature: 'Temperature', 'heart-rate': 'Heart rate', 'oxygen-saturation': 'Oxygen saturation', 'respiratory-rate': 'Respiratory rate', 'body-weight': 'Body weight' }}
      saveMeasurement={vi.fn().mockResolvedValue(providerReadback)}
      onCancel={() => undefined}
      onReadback={() => undefined}
    />)

    expect((screen.getByLabelText('Measurement type') as HTMLSelectElement).value).toBe('blood-pressure')
    expect((screen.getByLabelText('Systolic') as HTMLInputElement).value).toBe(String(systolic))
    expect((screen.getByLabelText('Diastolic') as HTMLInputElement).value).toBe(String(diastolic))
  })
})
