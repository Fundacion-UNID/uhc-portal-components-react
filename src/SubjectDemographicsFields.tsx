import { useState, type ChangeEvent } from 'react'

export type SubjectDemographicsOption = Readonly<{
  value: string
  label: string
}>

export type SubjectDemographicsProfile =
  | Readonly<{
      subjectKind: 'human'
      raceOptions?: readonly SubjectDemographicsOption[]
      ethnicityOptions?: readonly SubjectDemographicsOption[]
    }>
  | Readonly<{
      subjectKind: 'animal'
      speciesOptions: readonly SubjectDemographicsOption[]
      breedOptions: readonly SubjectDemographicsOption[]
    }>

export type SubjectDemographicsCopy = Readonly<{
  race?: string
  ethnicity?: string
  addRace?: string
  addEthnicity?: string
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
  const [visibleHumanFields, setVisibleHumanFields] = useState<ReadonlySet<'race' | 'ethnicity'>>(
    () => new Set([
      ...(values?.primary ? ['race' as const] : []),
      ...(values?.secondary ? ['ethnicity' as const] : []),
    ]),
  )
  const fields = profile.subjectKind === 'human'
    ? [
        ...(profile.raceOptions === undefined ? [] : [{
          concept: 'race' as const,
          valueKey: 'primary' as const,
          name: 'human.race',
          label: requiredCopy(copy.race, 'race'),
          addLabel: mode === 'edit' ? requiredCopy(copy.addRace, 'add_race') : '',
          options: profile.raceOptions,
          value: values?.primary,
          required: false,
        }]),
        ...(profile.ethnicityOptions === undefined ? [] : [{
          concept: 'ethnicity' as const,
          valueKey: 'secondary' as const,
          name: 'human.ethnicity',
          label: requiredCopy(copy.ethnicity, 'ethnicity'),
          addLabel: mode === 'edit' ? requiredCopy(copy.addEthnicity, 'add_ethnicity') : '',
          options: profile.ethnicityOptions,
          value: values?.secondary,
          required: false,
        }]),
      ]
    : [
        { concept: 'species' as const, valueKey: 'primary' as const, name: 'animal.species', label: requiredCopy(copy.species, 'species'), addLabel: '', options: profile.speciesOptions, value: values?.primary, required: true },
        { concept: 'breed' as const, valueKey: 'secondary' as const, name: 'animal.breed', label: requiredCopy(copy.breed, 'breed'), addLabel: '', options: profile.breedOptions, value: values?.secondary, required: true },
      ]

  return <div className="uhcp-subject-demographics-fields" data-subject-kind={profile.subjectKind}>
    {mode === 'edit' && profile.subjectKind === 'human'
      ? fields.map((field) => visibleHumanFields.has(field.concept as 'race' | 'ethnicity')
        ? <label key={field.name}>
          <span>{field.label}</span>
          <select name={field.name} aria-label={field.label} {...(onValuesChange
            ? {
                value: field.value ?? '',
                onChange: (event: ChangeEvent<HTMLSelectElement>) => onValuesChange({
                  primary: field.valueKey === 'primary' ? event.currentTarget.value : values?.primary,
                  secondary: field.valueKey === 'secondary' ? event.currentTarget.value : values?.secondary,
                }),
              }
            : { defaultValue: field.value ?? '' })}>
            <option value="" disabled>{field.label}</option>
            {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        : <button
            className="uhcp-subject-demographics-add"
            key={field.name}
            type="button"
            onClick={() => setVisibleHumanFields((current) => new Set([...current, field.concept as 'race' | 'ethnicity']))}
          >{field.addLabel}</button>)
      : mode === 'edit'
        ? fields.map((field) => <label key={field.name}>
            <span>{field.label}</span>
            <select name={field.name} aria-label={field.label} required={field.required} {...(onValuesChange
              ? {
                  value: field.value ?? '',
                  onChange: (event: ChangeEvent<HTMLSelectElement>) => onValuesChange({
                    primary: field.valueKey === 'primary' ? event.currentTarget.value : values?.primary,
                    secondary: field.valueKey === 'secondary' ? event.currentTarget.value : values?.secondary,
                  }),
                }
              : { defaultValue: field.value ?? '' })}>
              <option value="" disabled>{field.label}</option>
              {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>)
        : <dl>{fields.filter((field) => profile.subjectKind === 'animal' || field.value).map((field) => <div key={field.name}>
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
