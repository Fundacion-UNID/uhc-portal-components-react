'use client'

import { useId, useState } from 'react'
import {
  composeFhirDateTimeFromLocalParts,
  splitFhirDateTimeForInput,
  VitalSignUnit,
  type VitalSignKind,
  type VitalSignMeasurement,
} from 'fhir-data-utils-ts'
import type { ClinicalResourceBundleLike } from 'gdc-common-utils-ts/utils/clinical-resource-view'
import { ClinicalDateTimeFields, type ClinicalDateTimeFieldLabels } from './ClinicalTimeline.js'

export type VitalSignArtifactEditorCopy = Readonly<{
  title: string
  description: string
  kind: string
  measuredAt: string
  dateTime: ClinicalDateTimeFieldLabels
  value: string
  systolic: string
  diastolic: string
  save: string
  saving: string
  cancel: string
  close: string
  readbackMissing: string
}>

export type VitalSignKindLabels = Readonly<Record<VitalSignKind, string>>

export type VitalSignArtifactEditorProps = Readonly<{
  entryId: string
  subjectReference: string
  initialMeasurement?: VitalSignMeasurement
  locale: string
  timeZone: string
  copy: VitalSignArtifactEditorCopy
  kindLabels: VitalSignKindLabels
  saveMeasurement: (measurement: VitalSignMeasurement) => Promise<ClinicalResourceBundleLike | undefined>
  onCancel: () => void
  onReadback: (bundle: ClinicalResourceBundleLike) => void
}>

const VITAL_SIGN_KINDS: readonly VitalSignKind[] = Object.freeze([
  'blood-pressure',
  'temperature',
  'heart-rate',
  'oxygen-saturation',
  'respiratory-rate',
  'body-weight',
])

/** Shared vital-sign capture. Composite values remain one typed measurement. */
export function VitalSignArtifactEditor({
  entryId,
  subjectReference,
  initialMeasurement,
  locale,
  timeZone,
  copy,
  kindLabels,
  saveMeasurement,
  onCancel,
  onReadback,
}: VitalSignArtifactEditorProps) {
  const titleId = useId()
  const descriptionId = useId()
  const [kind, setKind] = useState<VitalSignKind>(initialMeasurement?.kind ?? 'oxygen-saturation')
  const [measuredAt, setMeasuredAt] = useState(() => initialMeasurement?.measuredAt
    ? splitFhirDateTimeForInput(initialMeasurement.measuredAt, timeZone)
    : { date: '', time: '' })
  const [value, setValue] = useState(initialMeasurement && initialMeasurement.kind !== 'blood-pressure' ? String(initialMeasurement.value) : '')
  const [systolic, setSystolic] = useState(initialMeasurement?.kind === 'blood-pressure' ? String(initialMeasurement.systolic) : '')
  const [diastolic, setDiastolic] = useState(initialMeasurement?.kind === 'blood-pressure' ? String(initialMeasurement.diastolic) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const measuredAtInstant = composeFhirDateTimeFromLocalParts({ ...measuredAt, timeZone })
      const common = { entryId, subjectReference, kind, measuredAt: measuredAtInstant, status: 'final' as const }
      const measurement: VitalSignMeasurement = kind === 'blood-pressure'
        ? { ...common, kind, systolic: Number(systolic), diastolic: Number(diastolic) }
        : { ...common, kind, value: Number(value), unit: unitFor(kind) }
      const readback = await saveMeasurement(measurement)
      if (!readback) throw new Error(copy.readbackMissing)
      onReadback(readback)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setSaving(false)
    }
  }

  return <section className="uhcp-clinical-editor" lang={locale} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
    <header>
      <div><h2 id={titleId}>{copy.title}</h2><p id={descriptionId}>{copy.description}</p></div>
      <button type="button" onClick={onCancel} aria-label={copy.close}>×</button>
    </header>
    <form onSubmit={(event) => { event.preventDefault(); void submit() }}>
      <label><span>{copy.kind} *</span><select aria-label={copy.kind} value={kind} onChange={(event) => setKind(event.target.value as VitalSignKind)}>
        {VITAL_SIGN_KINDS.map((option) => <option key={option} value={option}>{kindLabels[option]}</option>)}
      </select></label>
      <fieldset className="uhcp-clinical-editor-date-time"><legend>{copy.measuredAt} *</legend>
        <ClinicalDateTimeFields value={measuredAt} onChange={setMeasuredAt} labels={copy.dateTime} timeZone={timeZone}/>
      </fieldset>
      {kind === 'blood-pressure' ? <>
        <label><span>{copy.systolic} *</span><input aria-label={copy.systolic} required type="number" value={systolic} onChange={(event) => setSystolic(event.target.value)}/></label>
        <label><span>{copy.diastolic} *</span><input aria-label={copy.diastolic} required type="number" value={diastolic} onChange={(event) => setDiastolic(event.target.value)}/></label>
      </> : <label><span>{copy.value} *</span><input aria-label={copy.value} required type="number" value={value} onChange={(event) => setValue(event.target.value)}/></label>}
      {error ? <p className="uhcp-clinical-editor-error" role="alert">{error}</p> : null}
      <footer><button type="button" onClick={onCancel}>{copy.cancel}</button><button type="submit" disabled={saving}>{saving ? copy.saving : copy.save}</button></footer>
    </form>
  </section>
}

function unitFor(kind: Exclude<VitalSignKind, 'blood-pressure'>) {
  switch (kind) {
    case 'temperature': return VitalSignUnit.temperature
    case 'heart-rate': return VitalSignUnit.heartRate
    case 'oxygen-saturation': return VitalSignUnit.oxygenSaturation
    case 'respiratory-rate': return VitalSignUnit.respiratoryRate
    case 'body-weight': return VitalSignUnit.bodyWeight
  }
}
