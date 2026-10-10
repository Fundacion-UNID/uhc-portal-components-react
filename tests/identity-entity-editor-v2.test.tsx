// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { IdentityEntityEditorV2 } from '../src/IdentityEntityEditorV2.js'

const copy = {
  entityType: 'Entity type', personEntity: 'Person', organizationEntity: 'Organization', fullLegalName: 'Legal name', country: 'Country', regionalIdentifier: 'Regional identifier', region: 'Region', identifierType: 'Identifier type', identifierValue: 'Identifier value', email: 'Email', telephone: 'Telephone', relationship: 'Relationship', responsibleParty: 'Responsible party', evidence: 'Identity evidence', verificationMethod: 'Verification method', physicalInPerson: 'Physical', supervisedRemote: 'Supervised', electronicId: 'Electronic', unsupervisedRemote: 'Unsupervised', identityDocument: 'Identity document (optional)', relationshipDocument: 'Relationship evidence (optional)', controllerConfirmation: 'Confirmed controller', countryPlaceholder: 'Select a country',
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

  it('starts without a country and keeps the fixed controller relationship confirmed', () => {
    render(<form><IdentityEntityEditorV2 mode="controller" copy={copy} countryOptions={[{ value: 'AD', label: 'Andorra' }, { value: 'ES', label: 'Espana' }]}/></form>)
    expect((screen.getByRole('combobox', { name: 'Country' }) as HTMLSelectElement).value).toBe('')
    expect(screen.getByRole('option', { name: 'Select a country' })).toBeTruthy()
    const confirmation = screen.getByRole('checkbox', { name: 'Confirmed controller' }) as HTMLInputElement
    expect(confirmation.checked).toBe(true)
    expect(confirmation.disabled).toBe(true)
    fireEvent.click(confirmation)
    expect(confirmation.checked).toBe(true)
  })

  it('keeps optional evidence separate from required web contact without asking for a PIN', () => {
    render(<form><IdentityEntityEditorV2 mode="controller" copy={copy} requireEmail requireTelephone/></form>)
    expect((screen.getByLabelText('Email') as HTMLInputElement).required).toBe(true)
    expect((screen.getByLabelText('Telephone') as HTMLInputElement).required).toBe(true)
    expect(screen.getByLabelText('Email').closest('label')?.classList.contains('uhcp-identity-entity-contact-wide')).toBe(true)
    expect((screen.getByLabelText('Identity document (optional)') as HTMLInputElement).required).toBe(false)
    expect((screen.getByLabelText('Relationship evidence (optional)') as HTMLInputElement).required).toBe(false)
    expect(screen.queryByLabelText('PIN')).toBeNull()
  })
})
