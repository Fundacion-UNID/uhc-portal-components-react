// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CardProviderSelector } from '../src/CardProviderSelector.js'
import { REPOSITORY_SAFE_EXAMPLES } from 'sos-data-utils-ts/repository-privacy'

const providers = ['one', 'two'].map(suffix => ({
  providerId: `${REPOSITORY_SAFE_EXAMPLES.didWeb}:${suffix}`,
  displayName: `${REPOSITORY_SAFE_EXAMPLES.organizationLegalName} ${suffix}`,
}))

describe('CardProviderSelector', () => {
  it('requires an explicit provider choice and returns only its opaque id', async () => {
    const onChange = vi.fn()
    render(<CardProviderSelector
      providers={providers}
      value=""
      onChange={onChange}
      copy={{ legend: 'Choose card provider', description: 'The selected provider will issue this card.', unavailable: 'Unavailable' }}
    />)

    await userEvent.click(screen.getByRole('radio', { name: providers[1].displayName }))

    expect(onChange).toHaveBeenCalledWith(providers[1].providerId)
    expect(screen.getByRole('group', { name: 'Choose card provider' })).toBeTruthy()
  })

  it('keeps an unavailable provider visible but disabled', () => {
    render(<CardProviderSelector
      providers={[{ ...providers[0], available: false }]}
      value=""
      onChange={() => undefined}
      copy={{ legend: 'Choose card provider', description: 'Select one.', unavailable: 'Unavailable' }}
    />)

    expect((screen.getByRole('radio', { name: `${providers[0].displayName} Unavailable` }) as HTMLInputElement).disabled).toBe(true)
  })
})
