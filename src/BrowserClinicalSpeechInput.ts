type SpeechResultEvent = Readonly<{ results: ArrayLike<ArrayLike<Readonly<{ transcript: string }>>> }>
type SpeechErrorEvent = Readonly<{ error?: string }>
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

/** Product-neutral browser microphone adapter; the transcript stays editable. */
export function transcribeBrowserClinicalSpeech(locale: string, suppliedConstructor?: SpeechRecognitionConstructor): Promise<string> {
  const browser = typeof window === 'undefined'
    ? undefined
    : window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
  const Constructor = suppliedConstructor ?? browser?.SpeechRecognition ?? browser?.webkitSpeechRecognition
  if (!Constructor) return Promise.reject(new Error('clinical_speech_input_unavailable'))
  return new Promise((resolve, reject) => {
    const recognition = new Constructor()
    let settled = false
    recognition.lang = locale
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      settled = true
      resolve(Array.from(event.results).map((result) => result[0]?.transcript || '').join(' ').trim())
    }
    recognition.onerror = (event) => { settled = true; reject(new Error(event.error || 'clinical_speech_input_failed')) }
    recognition.onend = () => { if (!settled) reject(new Error('clinical_speech_input_empty')) }
    recognition.start()
  })
}

export function supportsBrowserClinicalSpeech(): boolean {
  if (typeof window === 'undefined') return false
  const browser = window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }
  return Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition)
}
