// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.
// Flow contract: never use duplicated literals; reuse canonical test data and standard coding systems and values exported by their owning fhir-data-utils, gdc-common-utils, sos-data-utils, or vet-data-utils package.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnimalIdentityDetailsV2 } from '../src/AnimalIdentityDetailsV2.js'
describe('AnimalIdentityDetailsV2',()=>{
  afterEach(cleanup)

  it('reuses onboarding sections in read-only mode',()=>{ const onEdit=vi.fn(); const {container}=render(<AnimalIdentityDetailsV2 copy={{animalStep:'Animal identity',controllerStep:'Responsible party',animalName:'Name',species:'Species',identifierType:'Identifier type',identifierValue:'Identifier',controllerName:'Legal name',relationship:'Relationship',edit:'Edit identity'}} value={{animalName:'Luna',species:'Dog',identifierType:'ISO 11784/11785',identifierValue:'985141000000001',controllerName:'Alex Example',relationship:'Responsible party'}} onEdit={onEdit}/>); expect(container.querySelectorAll('details')).toHaveLength(2); expect(container.querySelector('input')).toBeNull(); fireEvent.click(screen.getByRole('button',{name:'Edit identity'})); expect(onEdit).toHaveBeenCalledOnce() })

  it('shows the animal portrait and the public legal-organization owner profile', () => {
    render(<AnimalIdentityDetailsV2
      copy={{
        animalStep: 'Animal identity', controllerStep: 'Responsible party', animalName: 'Name', species: 'Species', identifierType: 'Identifier type', identifierValue: 'Identifier', controllerName: 'Legal name', relationship: 'Relationship',
        jurisdiction: 'Jurisdiction', legalIdentifier: 'Legal identifier', officialAddress: 'Official address', telephone: 'Public telephone', email: 'Public email', source: 'Public profile source',
      }}
      value={{
        animalName: 'Luna', species: 'Dog', identifierType: 'ISO 11784/11785', identifierValue: '985141000000001', animalPhotoUrl: '/fixtures/luna.jpg', animalPhotoAlt: 'Luna portrait',
        controllerName: 'Animal Refuge Example', relationship: 'Responsible party', controllerKind: 'organization', controllerJurisdiction: 'ES', controllerIdentifier: 'B12345678', controllerOfficialAddress: 'Example Street 1, Madrid', controllerTelephone: '+34 910 000 000', controllerEmail: 'contact@example.invalid', controllerSource: 'Organization public profile',
      }}
    />)
    expect(screen.getByRole('img', { name: 'Luna portrait' }).getAttribute('src')).toBe('/fixtures/luna.jpg')
    expect(screen.getByText('+34 910 000 000')).toBeTruthy()
    expect(screen.getByText('contact@example.invalid')).toBeTruthy()
    expect(screen.getByText('Example Street 1, Madrid')).toBeTruthy()
    expect(screen.getByText('Organization public profile')).toBeTruthy()
  })
})
