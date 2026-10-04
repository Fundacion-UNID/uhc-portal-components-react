'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type ClinicalSpeechInputPhase =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'initializing'
  | 'ready'
  | 'error'
  | 'unavailable'

export type ClinicalSpeechInputRequest = Readonly<{
  resourceType: string
  claim: string
  locale: string
}>

export type ClinicalSpeechInputCapability = Readonly<{
  phase: ClinicalSpeechInputPhase
  transcribe: (input: ClinicalSpeechInputRequest) => Promise<string>
  labels: Readonly<{
    start: string
    unavailable: string
    busy: string
    failed?: string
  }>
}>

const ClinicalSpeechInputContext = createContext<ClinicalSpeechInputCapability | undefined>(undefined)

/**
 * Supplies one portal-owned speech-recognition capability to nested clinical
 * editors. The portal owns model download, microphone permission and fallback;
 * shared editors receive only an editable transcript.
 */
export function ClinicalSpeechInputProvider({ value, children }: Readonly<{
  value: ClinicalSpeechInputCapability
  children: ReactNode
}>) {
  return <ClinicalSpeechInputContext.Provider value={value}>{children}</ClinicalSpeechInputContext.Provider>
}

export function useClinicalSpeechInput(): ClinicalSpeechInputCapability | undefined {
  return useContext(ClinicalSpeechInputContext)
}

export function ClinicalSpeechInputButton({
  resourceType,
  claim,
  locale,
  fieldLabel,
  onTranscript,
}: Readonly<ClinicalSpeechInputRequest & {
  fieldLabel: string
  onTranscript: (transcript: string) => void
}>) {
  const capability = useClinicalSpeechInput()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  if (!capability) return null

  const ready = capability.phase === 'ready'
  const actionLabel = busy
    ? capability.labels.busy
    : ready
      ? capability.labels.start
      : capability.labels.unavailable

  const transcribe = async () => {
    if (!ready || busy) return
    setBusy(true)
    setFailed(false)
    try {
      const transcript = (await capability.transcribe({ resourceType, claim, locale })).trim()
      if (transcript) onTranscript(transcript)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return <span className="uhcp-clinical-speech-control">
    <button
      type="button"
      className="uhcp-clinical-speech-button"
      aria-label={`${actionLabel}: ${fieldLabel}`}
      title={actionLabel}
      disabled={!ready || busy}
      aria-pressed={busy}
      onClick={() => { void transcribe() }}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm-5-3a1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.08A7 7 0 0 0 19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0Z"/>
      </svg>
    </button>
    {failed ? <small role="alert">{capability.labels.failed ?? capability.labels.unavailable}</small> : null}
  </span>
}
