// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import { describe, expect, it, vi } from 'vitest'
import { transcribeBrowserClinicalSpeech } from '../src/BrowserClinicalSpeechInput.js'

describe('browser clinical speech input', () => {
  it('returns one editable final transcript in the requested language', async () => {
    const start = vi.fn()
    class Recognition {
      lang = ''; continuous = true; interimResults = true; maxAlternatives = 2
      onresult?: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
      onerror?: (event: { error?: string }) => void
      onend?: () => void
      start() { start(this.lang); this.onresult?.({ results: [[{ transcript: 'rabies vaccine' }]] }) }
      stop() {}
    }
    await expect(transcribeBrowserClinicalSpeech('en-CA', Recognition as never)).resolves.toBe('rabies vaccine')
    expect(start).toHaveBeenCalledWith('en-CA')
  })
})
