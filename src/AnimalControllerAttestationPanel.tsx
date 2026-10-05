import { useState, type FormEvent } from 'react'

export type AnimalControllerAttestationRelationship = 'owner' | 'caregiver'
export type AnimalControllerAttestationInput = Readonly<{
  controllerName: string
  controllerEmail: string
  relationship: AnimalControllerAttestationRelationship
  professionalAttestation: true
}>
export type AnimalControllerAttestationState = Readonly<{
  status: 'draft' | 'pending' | 'accepted'
  controllerName?: string
  relationship?: AnimalControllerAttestationRelationship
  proofIdentifier?: string
  proofVerified?: boolean
}>
export type AnimalControllerAttestationCopy = Readonly<{
  title: string
  intro: string
  controllerName: string
  controllerEmail: string
  relationship: string
  owner: string
  caregiver: string
  attestation: string
  submit: string
  pending: string
  accepted: string
  verified: string
  rejected: string
  proofLabel: string
}>

/**
 * Shared presentation for proposing and verifying an animal-controller link.
 * The host must authenticate the professional, persist the pending proposal,
 * deliver and accept the invitation, and verify any proof. This component
 * never replaces a controller or grants access by itself.
 */
export function AnimalControllerAttestationPanel({ copy, state, canEdit, onSubmit }: Readonly<{
  copy: AnimalControllerAttestationCopy
  state: AnimalControllerAttestationState
  canEdit: boolean
  onSubmit?: (input: AnimalControllerAttestationInput) => Promise<void> | void
}>) {
  const [attested, setAttested] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!onSubmit || !attested) return
    const data = new FormData(event.currentTarget)
    setBusy(true)
    try {
      await onSubmit({
        controllerName: requiredText(data, 'controllerName'),
        controllerEmail: requiredText(data, 'controllerEmail').toLowerCase(),
        relationship: requiredText(data, 'relationship') as AnimalControllerAttestationRelationship,
        professionalAttestation: true,
      })
    } finally {
      setBusy(false)
    }
  }

  return <section className="uhcp-animal-controller-attestation" aria-labelledby="animal-controller-attestation-title">
    <header><h2 id="animal-controller-attestation-title">{copy.title}</h2><p>{copy.intro}</p></header>
    {state.status === 'accepted' ? <>
      <p role="status">{copy.accepted}</p>
      <dl>
        <div><dt>{copy.controllerName}</dt><dd>{state.controllerName}</dd></div>
        <div><dt>{copy.relationship}</dt><dd>{state.relationship === 'caregiver' ? copy.caregiver : copy.owner}</dd></div>
        {state.proofIdentifier ? <div><dt>{copy.proofLabel}</dt><dd>{state.proofIdentifier}</dd></div> : null}
      </dl>
      <p className={state.proofVerified ? 'uhcp-proof-verified' : 'uhcp-proof-rejected'}>{state.proofVerified ? copy.verified : copy.rejected}</p>
    </> : canEdit && onSubmit ? <form onSubmit={submit}>
      <label>{copy.controllerName}<input name="controllerName" required maxLength={160} defaultValue={state.controllerName}/></label>
      <label>{copy.controllerEmail}<input name="controllerEmail" type="email" required autoComplete="email"/></label>
      <label>{copy.relationship}<select name="relationship" defaultValue={state.relationship ?? 'owner'}>
        <option value="owner">{copy.owner}</option><option value="caregiver">{copy.caregiver}</option>
      </select></label>
      <label className="uhcp-attestation-check"><input type="checkbox" checked={attested} onChange={event => setAttested(event.currentTarget.checked)}/>{copy.attestation}</label>
      <button type="submit" disabled={!attested || busy}>{copy.submit}</button>
      {state.status === 'pending' ? <p role="status">{copy.pending}</p> : null}
    </form> : state.status === 'pending' ? <p role="status">{copy.pending}</p> : null}
  </section>
}

function requiredText(data: FormData, name: string): string {
  const value = data.get(name)
  if (typeof value !== 'string' || !value.trim()) throw new Error(`animal_controller_${name}_required`)
  return value.trim()
}
