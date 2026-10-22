'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import jsQrModule from 'jsqr'

const decodeQrImage = jsQrModule as unknown as (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null

type DetectedBarcode = Readonly<{ rawValue: string }>
type BarcodeDetectorLike = Readonly<{ detect(source: HTMLVideoElement): Promise<readonly DetectedBarcode[]> }>
type BarcodeDetectorConstructor = new (options: Readonly<{ formats: readonly string[] }>) => BarcodeDetectorLike

export type ExistingProfessionalProfileCopy = Readonly<{
  eyebrow?: string
  title: string
  description: string
  credentialMethodLabel: string
  manualMethodLabel: string
  scanProfessionalCredential: string
  uploadProfessionalCredentialQr: string
  professionalCredentialReady: string
  professionalCredentialRequired: string
  closeCamera: string
  cameraActive: string
  credentialQrUnreadable: string
  professionalIdentifierLabel: string
  sectorLabel: string
  pinLabel: string
  pinConfirmationLabel: string
  pinMismatch: string
  submit: string
  submitting: string
}>

export type ExistingProfessionalProfileInput =
  | Readonly<{ method: 'credential'; professionalCredential: string; pin: string }>
  | Readonly<{ method: 'identifier'; professionalIdentifier: string; sector: string; pin: string }>

export type ExistingProfessionalSectorOption = Readonly<{ value: string; label: string }>

export type ExistingProfessionalProfilePanelProps = Readonly<{
  copy: ExistingProfessionalProfileCopy
  sectors: readonly ExistingProfessionalSectorOption[]
  busy: boolean
  error?: string
  onScanProfessionalCredential?: () => Promise<string | undefined>
  onReadProfessionalCredentialImage?: (file: File) => Promise<string | undefined>
  onSubmit: (input: ExistingProfessionalProfileInput) => void | Promise<void>
}>

/**
 * Registers this portal device for an already-active professional profile.
 * Professional evidence, employee invitations and device registration are
 * separate artifacts. This screen accepts no invitation. A signed credential
 * is the preferred path; a single DID-or-URN field plus sector is the explicit
 * manual fallback and never becomes browser-selected authority by itself.
 */
export function ExistingProfessionalProfilePanel({ copy, sectors, busy, error, onScanProfessionalCredential, onReadProfessionalCredentialImage, onSubmit }: ExistingProfessionalProfilePanelProps) {
  const [method, setMethod] = useState<'credential' | 'identifier'>('credential')
  const [professionalCredential, setProfessionalCredential] = useState('')
  const [professionalIdentifier, setProfessionalIdentifier] = useState('')
  const [sector, setSector] = useState(sectors[0]?.value || '')
  const [pin, setPin] = useState('')
  const [pinConfirmation, setPinConfirmation] = useState('')
  const [localError, setLocalError] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const scanResolverRef = useRef<((value: string | undefined) => void) | null>(null)

  function stopCamera(value?: string) {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
    scanResolverRef.current?.(value)
    scanResolverRef.current = null
  }

  useEffect(() => () => stopCamera(), [])

  async function scanWithCamera(): Promise<string | undefined> {
    if (onScanProfessionalCredential) return onScanProfessionalCredential()
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
    streamRef.current = stream
    if (!videoRef.current) {
      stream.getTracks().forEach(track => track.stop())
      return undefined
    }
    videoRef.current.srcObject = stream
    await videoRef.current.play()
    setCameraActive(true)
    return new Promise(resolve => {
      scanResolverRef.current = resolve
      const Detector = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
      timerRef.current = window.setInterval(() => {
        const video = videoRef.current
        if (!video) return
        const accept = (value?: string) => { if (value) stopCamera(value) }
        if (Detector) {
          void new Detector({ formats: ['qr_code'] }).detect(video).then(([barcode]) => accept(barcode?.rawValue)).catch(() => undefined)
          return
        }
        const canvas = canvasRef.current
        if (!canvas || !video.videoWidth || !video.videoHeight) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) return
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        accept(decodeQrImage(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data)
      }, 400)
    })
  }

  async function readCredentialImage(file: File): Promise<string | undefined> {
    if (onReadProfessionalCredentialImage) return onReadProfessionalCredentialImage(file)
    const bitmap = await createImageBitmap(file)
    const canvas = canvasRef.current
    if (!canvas) return undefined
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return undefined
    context.drawImage(bitmap, 0, 0)
    return decodeQrImage(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data
  }

  async function captureCredential(read: () => Promise<string | undefined>) {
    setLocalError('')
    const credential = String(await read() || '').trim()
    if (!credential) {
      setLocalError(copy.professionalCredentialRequired)
      return
    }
    setProfessionalCredential(credential)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pin !== pinConfirmation) {
      setLocalError(copy.pinMismatch)
      return
    }
    setLocalError('')
    if (method === 'credential') {
      if (!professionalCredential) {
        setLocalError(copy.professionalCredentialRequired)
        return
      }
      void onSubmit({ method, professionalCredential: professionalCredential.trim(), pin })
      return
    }
    void onSubmit({ method, professionalIdentifier: professionalIdentifier.trim(), sector, pin })
  }

  return <section className="uhcp-professional-activation" aria-labelledby="uhcp-existing-professional-title">
    <form onSubmit={submit}>
      <header>
        {copy.eyebrow ? <p className="uhcp-eyebrow">{copy.eyebrow}</p> : null}
        <h1 id="uhcp-existing-professional-title">{copy.title}</h1>
        <p>{copy.description}</p>
      </header>
      <fieldset>
        <label><input type="radio" name="professionalEvidenceMethod" value="credential" checked={method === 'credential'} onChange={() => setMethod('credential')} />{copy.credentialMethodLabel}</label>
        <label><input type="radio" name="professionalEvidenceMethod" value="identifier" checked={method === 'identifier'} onChange={() => setMethod('identifier')} />{copy.manualMethodLabel}</label>
      </fieldset>
      {method === 'credential'
        ? <div className="uhcp-professional-credential-capture">
          <button type="button" disabled={busy} onClick={() => void captureCredential(scanWithCamera).catch(() => setLocalError(copy.professionalCredentialRequired))}>{copy.scanProfessionalCredential}</button>
          <label><span>{copy.uploadProfessionalCredentialQr}</span><input name="professionalCredentialQrImage" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => {
            const file = event.currentTarget.files?.[0]
            if (file) void captureCredential(() => readCredentialImage(file)).catch(() => setLocalError(copy.credentialQrUnreadable))
          }} /></label>
          {cameraActive ? <><video ref={videoRef} playsInline muted aria-label={copy.cameraActive} /><p role="status">{copy.cameraActive}</p><button type="button" onClick={() => stopCamera()}>{copy.closeCamera}</button></> : <video ref={videoRef} hidden playsInline muted />}
          <canvas ref={canvasRef} hidden aria-hidden="true" />
          {professionalCredential ? <p role="status">{copy.professionalCredentialReady}</p> : null}
        </div>
        : <>
          <label><span>{copy.professionalIdentifierLabel}</span><input name="professionalIdentifier" value={professionalIdentifier} onChange={event => setProfessionalIdentifier(event.currentTarget.value)} autoComplete="off" required /></label>
          <label><span>{copy.sectorLabel}</span><select name="professionalSector" value={sector} onChange={event => setSector(event.currentTarget.value)} required>{sectors.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        </>}
      <label><span>{copy.pinLabel}</span><input name="newPin" type="password" inputMode="numeric" minLength={6} maxLength={12} autoComplete="new-password" value={pin} onChange={event => setPin(event.currentTarget.value)} required /></label>
      <label><span>{copy.pinConfirmationLabel}</span><input name="confirmPin" type="password" inputMode="numeric" minLength={6} maxLength={12} autoComplete="new-password" value={pinConfirmation} onChange={event => setPinConfirmation(event.currentTarget.value)} required /></label>
      {(localError || error) ? <p role="alert">{localError || error}</p> : null}
      <button type="submit" disabled={busy}>{busy ? copy.submitting : copy.submit}</button>
    </form>
  </section>
}
