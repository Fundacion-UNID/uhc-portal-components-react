// TDD contract: write this test red first; make it green only with the complete real behavior.
// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LegalMarkdownDocument } from '../src/LegalMarkdownDocument.js'

describe('LegalMarkdownDocument', () => {
  it('renders versioned legal Markdown as semantic content', () => {
    render(<LegalMarkdownDocument source={'# Terms\n\n## Scope\n\nContact `contact@unid.es`.\n\n- First guarantee\n- Second guarantee'} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Terms' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 3, name: 'Scope' })).toBeTruthy()
    expect(screen.getByText('contact@unid.es').tagName).toBe('CODE')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
