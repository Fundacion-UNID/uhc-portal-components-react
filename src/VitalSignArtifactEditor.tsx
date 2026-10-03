'use client'

import { useId, useState } from 'react'
import {
  VitalSignUnit,
  type VitalSignKind,
  type VitalSignMeasurement,
} from 'fhir-data-utils-ts'
import type { ClinicalResourceBundleLike } from 'gdc-common-utils-ts/utils/clinical-resource-view'

export type VitalSignArtifactEditorCopy = Readonly<{
  title: string
  description: string
  kind: string
  measuredAt: string
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
  copy,
  kindLabels,
  saveMeasurement,
  onCancel,
  onReadback,
}: VitalSignArtifactEditorProps) {
  const titleId = useId()
  const descriptionId = useId()
  const [kind, setKind] = useState<VitalSignKind>('oxygen-saturation')
  const [measuredAt, setMeasuredAt] = useState('')
  const [value, setValue] = useState('')
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const common = { entryId, subjectReference, kind, measuredAt, status: 'final' as const }
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

  return <section className="uhcp-clinical-editor" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
    <header>
      <div><h2 id={titleId}>{copy.title}</h2><p id={descriptionId}>{copy.description}</p></div>
      <button type="button" onClick={onCancel} aria-label={copy.close}>×</button>
    </header>
    <form onSubmit={(event) => { event.preventDefault(); void submit() }}>
      <label><span>{copy.kind} *</span><select aria-label={copy.kind} value={kind} onChange={(event) => setKind(event.target.value as VitalSignKind)}>
        {VITAL_SIGN_KINDS.map((option) => <option key={option} value={option}>{kindLabels[option]}</option>)}
      </select></label>
      <label><span>{copy.measuredAt} *</span><input aria-label={copy.measuredAt} required value={measuredAt} onChange={(event) => setMeasuredAt(event.target.value)}/></label>
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
