import { useId, useMemo, useRef, useState } from 'react'

export type EncounterTransferStatus = 'planned' | 'in-progress' | 'on-hold' | 'completed'
export type EncounterSourceOutcome = 'on-hold' | 'completed'

export type EncounterTransferStage = Readonly<{
  identifier: string
  /** Human-readable provider business identifier; never replaces the FHIR resource id. */
  displayIdentifier?: string
  serviceLabel: string
  locationLabel?: string
  arrivedAt: string
  status: EncounterTransferStatus
}>

export type EmergencyContactAction = Readonly<{
  identifier: string
  name: string
  relationship: string
  phone?: string
}>

export type EncounterTransferConsoleCopy = Readonly<{
  patientSearchTitle: string; scanQr: string; patientId: string; search: string
  journeyTitle: string; sourceTitle: string; destinationTitle: string
  returning: string; returningHint: string; notReturning: string; notReturningHint: string
  transferTo: string; reviewChanges: string; applyTransfer: string
  emergencyActions: string; call: string; videoCall: string; sendMessage: string
  text: string; audio: string; messageLabel: string; attach: string; pdf: string; fhirBundle: string; calendar: string; send: string
  resourceSummary: string; sourceUpdate: string; sourceHistory: string; destinationUpdate: string; destinationHistory: string; indexProjection: string
  demoWarning: string; helpTitle: string; helpBody: string; transferReady: string; messageReady: string
  callReady: string; videoReady: string; patientReady: string; reviewReady: string; attachmentReady: string; technicalDetails: string
  encounterIdentifier: string
}>

export type EncounterTransferConsoleProps = Readonly<{
  copy: EncounterTransferConsoleCopy
  patientDisplay: string
  encounters: readonly EncounterTransferStage[]
  sourceEncounterId: string
  destinationEncounterId: string
  contacts: readonly EmergencyContactAction[]
  demo?: boolean
  onApplyTransfer?: (sourceOutcome: EncounterSourceOutcome) => void
}>

const icons = {
  scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M8 8h3v3H8zM14 8h2v2M8 14h2v2M13 13h3v3h-3z"/></>,
  phone: <path d="M7.2 3.8 9.4 7 8 9.1a14 14 0 0 0 6.9 6.9l2.1-1.4 3.2 2.2-.8 3a2 2 0 0 1-2.1 1.4C9.8 20.2 3.8 14.2 2.8 6.7A2 2 0 0 1 4.2 4.6z"/>,
  video: <><rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 6-3v10l-6-3z"/></>,
  message: <path d="M4 4h16v12H9l-5 4z"/>,
  chevron: <path d="m9 5 7 7-7 7"/>,
}

function Icon({ name }: Readonly<{ name: keyof typeof icons }>) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{icons[name]}</svg>
}

/**
 * Shared visual editor for one already-authorized subject transfer.
 *
 * Selection and demo state never grant access. The host must resolve the
 * subject, contacts, department sender, HealthcareService and write
 * capability in its BFF. `onApplyTransfer` reports only the requested source
 * outcome; the provider commits authoritative Encounter changes before any
 * completed Communication projects the result to the subject index.
 */
export function EncounterTransferConsole({ copy, patientDisplay, encounters, sourceEncounterId, destinationEncounterId, contacts, demo = false, onApplyTransfer }: EncounterTransferConsoleProps) {
  const [sourceOutcome, setSourceOutcome] = useState<EncounterSourceOutcome>('on-hold')
  const [selectedContact, setSelectedContact] = useState(contacts[0]?.identifier)
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageMode, setMessageMode] = useState<'text' | 'audio'>('text')
  const [attachments, setAttachments] = useState<readonly string[]>([])
  const [showTechnical, setShowTechnical] = useState(false)
  const [status, setStatus] = useState('')
  const railRef = useRef<HTMLDivElement>(null)
  const source = useMemo(() => encounters.find((item) => item.identifier === sourceEncounterId), [encounters, sourceEncounterId])
  const destination = useMemo(() => encounters.find((item) => item.identifier === destinationEncounterId), [encounters, destinationEncounterId])
  const history = useMemo(() => encounters.filter((item) => item.identifier !== sourceEncounterId && item.identifier !== destinationEncounterId), [encounters, sourceEncounterId, destinationEncounterId])
  const contact = contacts.find((item) => item.identifier === selectedContact) ?? contacts[0]
  const helpId = useId()

  function toggleAttachment(kind: string) {
    setAttachments(current => current.includes(kind) ? current.filter(item => item !== kind) : [...current, kind])
    setStatus(copy.attachmentReady)
  }

  function applyTransfer() {
    onApplyTransfer?.(sourceOutcome)
    setStatus(copy.transferReady)
  }

  return <section className="uhcp-transfer-console">
    <aside className="uhcp-transfer-contacts">
      <details open>
        <summary>{copy.emergencyActions}</summary>
        <div className="uhcp-transfer-contact-list" role="list">
          {contacts.map((item) => <button key={item.identifier} type="button" role="listitem" aria-pressed={item.identifier === contact?.identifier} onClick={() => setSelectedContact(item.identifier)}>
            <span aria-hidden="true">{item.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('')}</span>
            <strong>{item.name}</strong><small>{item.relationship}{item.phone ? ` · ${item.phone}` : ''}</small>
          </button>)}
        </div>
        <div className="uhcp-transfer-contact-actions">
          <button type="button" onClick={() => setStatus(copy.callReady)}><Icon name="phone"/>{copy.call}</button>
          <button type="button" onClick={() => setStatus(copy.videoReady)}><Icon name="video"/>{copy.videoCall}</button>
          <button type="button" aria-pressed={messageOpen} onClick={() => setMessageOpen(value => !value)}><Icon name="message"/>{copy.sendMessage}</button>
        </div>
        {messageOpen && contact ? <form className="uhcp-transfer-composer" onSubmit={(event) => { event.preventDefault(); setStatus(copy.messageReady) }}>
          <h3>{copy.sendMessage}: {contact.name}</h3>
          <div className="uhcp-transfer-mode" role="group" aria-label={copy.sendMessage}>
            <button type="button" aria-pressed={messageMode === 'text'} onClick={() => setMessageMode('text')}>{copy.text}</button>
            <button type="button" aria-pressed={messageMode === 'audio'} onClick={() => setMessageMode('audio')}>{copy.audio}</button>
          </div>
          {messageMode === 'text' ? <label>{copy.messageLabel}<textarea rows={5}/></label> : <button className="uhcp-transfer-record" type="button">● {copy.audio}</button>}
          <fieldset><legend>{copy.attach}</legend><div>
            <button type="button" aria-pressed={attachments.includes('pdf')} onClick={() => toggleAttachment('pdf')}>{copy.pdf}</button>
            <button type="button" aria-pressed={attachments.includes('fhir')} onClick={() => toggleAttachment('fhir')}>{copy.fhirBundle}</button>
            <button type="button" aria-pressed={attachments.includes('calendar')} onClick={() => toggleAttachment('calendar')}>{copy.calendar}</button>
          </div></fieldset>
          <button className="uhcp-transfer-primary" type="submit">{copy.send}</button>
        </form> : null}
      </details>
    </aside>

    <div className="uhcp-transfer-main">
      <header className="uhcp-transfer-patient">
        <h2>{copy.patientSearchTitle}</h2>
        <div><button type="button" onClick={() => setStatus(copy.patientReady)}><Icon name="scan"/>{copy.scanQr}</button><span aria-hidden="true"/><label>{copy.patientId}<input defaultValue={patientDisplay}/></label><button type="button" onClick={() => setStatus(copy.patientReady)}>{copy.search}</button></div>
      </header>

      <section className="uhcp-transfer-journey" role="region" aria-label={copy.journeyTitle} aria-describedby={helpId}>
        <header><h2>{copy.journeyTitle}</h2><div><button type="button" aria-label="Anterior" onClick={() => railRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}><Icon name="chevron"/></button><button type="button" aria-label="Siguiente" onClick={() => railRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}><Icon name="chevron"/></button></div></header>
        <div className="uhcp-transfer-rail" ref={railRef}>
          {history.map((item) => <EncounterCard key={item.identifier} encounter={item}/>) }
          {source ? <article className="uhcp-transfer-card uhcp-transfer-source">
            <h3>{copy.sourceTitle}</h3><EncounterCardBody encounter={source} identifierLabel={copy.encounterIdentifier}/>
            <fieldset><legend>{copy.helpTitle}</legend>
              <label><input type="radio" name="source-outcome" checked={sourceOutcome === 'on-hold'} onChange={() => setSourceOutcome('on-hold')}/><span><strong>{copy.returning}</strong><small>{copy.returningHint}</small></span></label>
              <label><input type="radio" name="source-outcome" checked={sourceOutcome === 'completed'} onChange={() => setSourceOutcome('completed')}/><span><strong>{copy.notReturning}</strong><small>{copy.notReturningHint}</small></span></label>
            </fieldset>
          </article> : null}
          <div className="uhcp-transfer-arrow"><span>{copy.transferTo}</span><i/><Icon name="chevron"/></div>
          {destination ? <article className="uhcp-transfer-card uhcp-transfer-destination"><h3>{copy.destinationTitle}</h3><EncounterCardBody encounter={{ ...destination, status: 'in-progress' }} identifierLabel={copy.encounterIdentifier}/></article> : null}
        </div>
        <details className="uhcp-transfer-help" open><summary id={helpId}>{copy.helpTitle}</summary><p>{copy.helpBody}</p></details>
        <div className="uhcp-transfer-controls"><button type="button" onClick={() => { setShowTechnical(true); setStatus(copy.reviewReady) }}>{copy.reviewChanges}</button><button className="uhcp-transfer-primary" type="button" onClick={applyTransfer}>{copy.applyTransfer}</button></div>
      </section>

      <section className="uhcp-transfer-review">
        <header><h2>{copy.resourceSummary}</h2>{demo ? <p>{copy.demoWarning}</p> : null}</header>
        <ol aria-label={copy.resourceSummary}>
          {[[copy.sourceUpdate, 'Encounter'], [copy.sourceHistory, 'EncounterHistory'], [copy.destinationUpdate, 'Encounter'], [copy.destinationHistory, 'EncounterHistory'], [copy.indexProjection, 'Communication']].map(([label, resource], index) => <li key={`${resource}-${index}`}><span>{index + 1}</span><strong>{label}</strong><details open={showTechnical}><summary>{copy.technicalDetails}</summary><code>{resource}</code></details></li>)}
        </ol>
      </section>
      {status ? <p className="uhcp-transfer-status" role="status">{status}</p> : null}
    </div>
  </section>
}

function EncounterCard({ encounter }: Readonly<{ encounter: EncounterTransferStage }>) {
  return <article className="uhcp-transfer-card"><EncounterCardBody encounter={encounter}/></article>
}

function EncounterCardBody({ encounter, identifierLabel }: Readonly<{ encounter: EncounterTransferStage; identifierLabel?: string }>) {
  return <div className="uhcp-transfer-card-body"><time>{encounter.arrivedAt}</time><strong>{encounter.serviceLabel}</strong>{encounter.locationLabel ? <span>{encounter.locationLabel}</span> : null}<small data-status={encounter.status}>{encounter.status}</small><code aria-label={identifierLabel}>{encounter.displayIdentifier ?? encounter.identifier}</code></div>
}
