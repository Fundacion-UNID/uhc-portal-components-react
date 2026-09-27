import type { FormEvent } from 'react'

export type SubjectLocatorKind =
  | 'qr'
  | 'numeric-code'
  | 'did-web'
  | 'microchip'
  | 'tattoo'
  | 'email-address'
  | 'phone-number'
export type SubjectAccessRequestStatus =
  | 'idle'
  | 'resolving'
  | 'resolved'
  | 'requesting'
  | 'requested'
  | 'granted'
  | 'error'

export type SubjectAccessSectionOption = Readonly<{
  code: string
  label: string
  selected: boolean
}>

export type ResolvedSubjectAccessTarget = Readonly<{
  subjectId: string
  display: string
  /** Server-returned evidence for presentation only; it grants no access. */
  identifiers?: readonly Readonly<{
    kind: SubjectLocatorKind
    system: string
    value: string
    attested: boolean
  }>[]
}>

export type SubjectAccessRequestPanelCopy = Readonly<{
  title: string
  description: string
  locatorKindLabel: string
  /** Only entries authorized and supported by the owning product are shown. */
  locatorKinds: Partial<Record<SubjectLocatorKind, string>>
  locatorLabel: string
  resolve: string
  resolving: string
  sectionsLabel: string
  request: string
  requesting: string
  requested: string
  granted: string
}>

export type SubjectAccessRequestPanelProps = Readonly<{
  copy: SubjectAccessRequestPanelCopy
  locatorKind: SubjectLocatorKind
  locator: string
  status: SubjectAccessRequestStatus
  target?: ResolvedSubjectAccessTarget
  sections: readonly SubjectAccessSectionOption[]
  error?: string
  onLocatorKindChange: (kind: SubjectLocatorKind) => void
  onLocatorChange: (locator: string) => void
  onResolve: () => void | Promise<void>
  onToggleSection: (code: string) => void
  onRequest: () => void | Promise<void>
}>

/**
 * Controlled scanner/manual-locator and access-request surface.
 *
 * “Who scans” is intentionally absent from this contract. An individual
 * member, professional or another later actor facade can reuse the same
 * component; the authenticated BFF and GW decide identity and authorization.
 */
export function SubjectAccessRequestPanel({
  copy,
  locatorKind,
  locator,
  status,
  target,
  sections,
  error,
  onLocatorKindChange,
  onLocatorChange,
  onResolve,
  onToggleSection,
  onRequest,
}: SubjectAccessRequestPanelProps) {
  const locatorInput = locatorInputAttributes(locatorKind)
  function resolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onResolve()
  }

  function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onRequest()
  }

  return (
    <section className="uhcp-access-panel" aria-labelledby="uhcp-access-request-title">
      <h2 id="uhcp-access-request-title">{copy.title}</h2>
      <p>{copy.description}</p>
      <form onSubmit={resolve}>
        <label>
          <span>{copy.locatorKindLabel}</span>
          <select
            value={locatorKind}
            onChange={(event) => onLocatorKindChange(event.currentTarget.value as SubjectLocatorKind)}
            disabled={status === 'resolving'}
          >
            {Object.entries(copy.locatorKinds).map(([kind, label]) =>
              <option key={kind} value={kind}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>{copy.locatorLabel}</span>
          <input
            value={locator}
            onChange={(event) => onLocatorChange(event.currentTarget.value)}
            type={locatorInput.type}
            inputMode={locatorInput.inputMode}
            pattern={locatorInput.pattern}
            required
            disabled={status === 'resolving'}
          />
        </label>
        <button type="submit" disabled={status === 'resolving' || !locator.trim()}>
          {status === 'resolving' ? copy.resolving : copy.resolve}
        </button>
      </form>

      {target && (
        <form onSubmit={request}>
          <p><bdi>{target.display}</bdi></p>
          <fieldset>
            <legend>{copy.sectionsLabel}</legend>
            {sections.map((section) => (
              <label key={section.code} data-section-code={section.code}>
                <input
                  type="checkbox"
                  checked={section.selected}
                  onChange={() => onToggleSection(section.code)}
                  disabled={status === 'requesting' || status === 'granted'}
                />
                <span>{section.label}</span>
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            disabled={
              status === 'requesting'
              || status === 'granted'
              || !sections.some((section) => section.selected)
            }
          >
            {status === 'requesting' ? copy.requesting : copy.request}
          </button>
        </form>
      )}

      {status === 'requested' && <p role="status">{copy.requested}</p>}
      {status === 'granted' && <p role="status">{copy.granted}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}

function locatorInputAttributes(kind: SubjectLocatorKind): Readonly<{
  type?: 'email' | 'tel'
  inputMode?: 'numeric' | 'email' | 'tel'
  pattern?: string
}> {
  if (kind === 'microchip') return { inputMode: 'numeric', pattern: '[0-9 -]{15,21}' }
  if (kind === 'numeric-code') return { inputMode: 'numeric' }
  if (kind === 'email-address') return { type: 'email', inputMode: 'email' }
  if (kind === 'phone-number') return { type: 'tel', inputMode: 'tel' }
  return {}
}
