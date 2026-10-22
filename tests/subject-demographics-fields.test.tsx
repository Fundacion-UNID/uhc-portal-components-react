// Flow contract: one shared demographics slot renders only the deployment profile's governed concepts; visual reuse never aliases human race/ethnicity to animal species/breed.
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SubjectDemographicsFields } from '../src/SubjectDemographicsFields.js'

const options = [{ value: 'one', label: 'Option one' }]

afterEach(() => document.body.replaceChildren())

describe('subject demographics fields', () => {
  it('renders human US Core concepts in the shared editing layout', () => {
    const { container } = render(<SubjectDemographicsFields
      mode="edit"
      profile={{ subjectKind: 'human', raceOptions: options, ethnicityOptions: options }}
      copy={{ race: 'Race', ethnicity: 'Ethnicity' }}
    />)

    expect(container.querySelector('.uhcp-subject-demographics-fields')).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Race' }).getAttribute('name')).toBe('human.race')
    expect(screen.getByRole('combobox', { name: 'Ethnicity' }).getAttribute('name')).toBe('human.ethnicity')
    expect(screen.queryByRole('combobox', { name: 'Species' })).toBeNull()
  })

  it('renders animal concepts in the same layout with distinct field contracts', () => {
    render(<SubjectDemographicsFields
      mode="edit"
      profile={{ subjectKind: 'animal', speciesOptions: options, breedOptions: options }}
      copy={{ species: 'Species', breed: 'Breed' }}
    />)

    expect(screen.getByRole('combobox', { name: 'Species' }).getAttribute('name')).toBe('animal.species')
    expect(screen.getByRole('combobox', { name: 'Breed' }).getAttribute('name')).toBe('animal.breed')
    expect(screen.queryByRole('combobox', { name: 'Race' })).toBeNull()
  })

  it('uses the same slot for read-only values without rendering editing controls', () => {
    render(<SubjectDemographicsFields
      mode="read"
      profile={{ subjectKind: 'human', raceOptions: options, ethnicityOptions: options }}
      copy={{ race: 'Race', ethnicity: 'Ethnicity' }}
      values={{ primary: 'Recorded race', secondary: 'Recorded ethnicity' }}
    />)

    expect(screen.getByText('Recorded race')).toBeTruthy()
    expect(screen.getByText('Recorded ethnicity')).toBeTruthy()
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})
