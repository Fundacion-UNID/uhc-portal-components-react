// Flow contract: the same entity editor serves a fixed controller and selectable related parties while keeping evidence inside each entity.
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { IdentityEntityEditorV2 } from '../src/IdentityEntityEditorV2.js'

const copy = {
  entityType: 'Entity type', personEntity: 'Person', organizationEntity: 'Organization', fullLegalName: 'Legal name', country: 'Country', regionalIdentifier: 'Regional identifier', region: 'Region', identifierType: 'Identifier type', identifierValue: 'Identifier value', email: 'Email', telephone: 'Telephone', relationship: 'Relationship', responsibleParty: 'Responsible party', evidence: 'Identity evidence', verificationMethod: 'Verification method', physicalInPerson: 'Physical', supervisedRemote: 'Supervised', electronicId: 'Electronic', unsupervisedRemote: 'Unsupervised', identityDocument: 'Identity document', relationshipDocument: 'Relationship evidence', pin: 'PIN', controllerConfirmation: 'Confirmed controller',
} as const

describe('IdentityEntityEditorV2', () => {
  afterEach(cleanup)

  it('lets a related entity choose a governed relationship and namespaces its fields', () => {
    const { container } = render(<form><IdentityEntityEditorV2 mode="related" fieldPrefix="related.0" copy={copy} relationshipOptions={[{ value: 'caregiver', label: 'Caregiver' }]}/></form>)
    expect((screen.getByRole('combobox', { name: 'Relationship' }) as HTMLSelectElement).value).toBe('caregiver')
    expect(container.querySelector('[name="related.0.controllerLegalName"]')).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Identity evidence' })).toBeTruthy()
    expect(screen.queryByLabelText('PIN')).toBeNull()
  })
})
