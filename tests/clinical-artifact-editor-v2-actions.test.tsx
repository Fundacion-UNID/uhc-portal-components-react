// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.
// Flow contract: never use duplicated literals; reuse canonical test data and standard coding systems and values exported by their owning fhir-data-utils, gdc-common-utils, sos-data-utils, or vet-data-utils package.
// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { ResourceTypesFhirR4 } from 'gdc-common-utils-ts/constants/fhir-resource-types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClinicalArtifactEditorV2 } from '../src/ClinicalArtifactEditorV2.js'

describe('ClinicalArtifactEditorV2 action hierarchy', () => {
  afterEach(cleanup)

  it('places the green constructive action before the non-green cancel action', () => {
    render(<ClinicalArtifactEditorV2
      request={{ resourceType: ResourceTypesFhirR4.Immunization, mode: 'create' }}
      authoringContext={{ creator: 'Practitioner/example', attester: 'Practitioner/example' }}
      copy={{ title:'Add',description:'Add',save:'Add to draft',saving:'Adding',cancel:'Cancel',close:'Close',terminologyLoading:'Searching',terminologyUnavailable:'Unavailable',terminologySources:'Systems',readbackMissing:'Missing',addField:'Add field',chooseField:'Choose field',addSelectedField:'Add',removeField:'Remove',searchTerminology:'Search',clearCoding:'Clear',selectCandidate:'Select',canonicalCode:'Code',canonicalDisplay:'Display',codingRequired:'Required',documents:'Documents',addDocuments:'Add documents',removeDocument:'Remove',date:'Date',time:'Time',useToday:'Today',useCurrentTime:'Now' }}
      fields={[]}
      initialVisibleClaims={[]}
      fieldLabel={claim => claim}
      saveArtifact={vi.fn()}
      onCancel={vi.fn()}
      onReadback={vi.fn()}
    />)
    const footer = screen.getByRole('button', { name: 'Add to draft' }).closest('footer')!
    const buttons = within(footer).getAllByRole('button')
    expect(buttons.map(button => button.textContent)).toEqual(['Add to draft', 'Cancel'])
    expect(buttons[0].classList.contains('uhcp-clinical-editor-submit')).toBe(true)
    expect(buttons[1].classList.contains('uhcp-clinical-editor-cancel')).toBe(true)
  })
})
