import type { ChangeEvent } from 'react'

export type SubjectDemographicsOption = Readonly<{
  value: string
  label: string
}>

export type SubjectDemographicsProfile =
  | Readonly<{
      subjectKind: 'human'
      raceOptions: readonly SubjectDemographicsOption[]
      ethnicityOptions: readonly SubjectDemographicsOption[]
    }>
  | Readonly<{
      subjectKind: 'animal'
      speciesOptions: readonly SubjectDemographicsOption[]
      breedOptions: readonly SubjectDemographicsOption[]
    }>

export type SubjectDemographicsCopy = Readonly<{
  race?: string
  ethnicity?: string
  species?: string
  breed?: string
}>

/**
 * Shared presentation slot for human or animal demographics.
 *
 * Profiles preserve different field names and option catalogues so visual
 * reuse can never turn race into species or ethnicity into breed. Hosts map
 * the submitted fields to their own canonical persistence adapters.
 */
export function SubjectDemographicsFields({
  mode,
  profile,
  copy,
  values,
  onValuesChange,
}: Readonly<{
  mode: 'edit' | 'read'
  profile: SubjectDemographicsProfile
  copy: SubjectDemographicsCopy
  values?: Readonly<{ primary?: string; secondary?: string }>
  onValuesChange?: (values: Readonly<{ primary?: string; secondary?: string }>) => void
}>) {
  const fields = profile.subjectKind === 'human'
    ? [
        { name: 'human.race', label: requiredCopy(copy.race, 'race'), options: profile.raceOptions, value: values?.primary },
        { name: 'human.ethnicity', label: requiredCopy(copy.ethnicity, 'ethnicity'), options: profile.ethnicityOptions, value: values?.secondary },
      ]
    : [
        { name: 'animal.species', label: requiredCopy(copy.species, 'species'), options: profile.speciesOptions, value: values?.primary },
        { name: 'animal.breed', label: requiredCopy(copy.breed, 'breed'), options: profile.breedOptions, value: values?.secondary },
      ]

  return <div className="uhcp-subject-demographics-fields" data-subject-kind={profile.subjectKind}>
    {mode === 'edit'
      ? fields.map((field) => <label key={field.name}>
          <span>{field.label}</span>
          <select name={field.name} aria-label={field.label} required {...(onValuesChange
            ? {
                value: field.value ?? '',
                onChange: (event: ChangeEvent<HTMLSelectElement>) => onValuesChange({
                  primary: field === fields[0] ? event.currentTarget.value : values?.primary,
                  secondary: field === fields[1] ? event.currentTarget.value : values?.secondary,
                }),
              }
            : { defaultValue: field.value ?? '' })}>
            <option value="" disabled>{field.label}</option>
            {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>)
      : <dl>{fields.map((field) => <div key={field.name}>
          <dt>{field.label}</dt>
          <dd>{field.value || '—'}</dd>
        </div>)}</dl>}
  </div>
}

function requiredCopy(value: string | undefined, field: string): string {
  const normalized = String(value || '').trim()
  if (!normalized) throw new Error(`subject_demographics_${field}_copy_required`)
  return normalized
}
