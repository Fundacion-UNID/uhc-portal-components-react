import type { SubjectCardProviderDescriptor } from 'sos-data-utils-ts/subject-card-directory'

export type CardProviderChoice = SubjectCardProviderDescriptor & Readonly<{
  available?: boolean
}>

export type CardProviderSelectorCopy = Readonly<{
  legend: string
  description: string
  unavailable: string
}>

export type CardProviderSelectorProps = Readonly<{
  providers: readonly CardProviderChoice[]
  value: string
  onChange: (providerId: string) => void
  copy: CardProviderSelectorCopy
  disabled?: boolean
}>

/** Shared presentational selector; the host BFF remains provider authority. */
export function CardProviderSelector({
  providers,
  value,
  onChange,
  copy,
  disabled = false,
}: CardProviderSelectorProps) {
  return <fieldset className="uhcp-card-provider-selector" disabled={disabled}>
    <legend>{copy.legend}</legend>
    <p>{copy.description}</p>
    <div className="uhcp-card-provider-options">
      {providers.map(provider => {
        const unavailable = provider.available === false
        return <label key={provider.providerId} className="uhcp-card-provider-option">
          <input
            type="radio"
            name="card-provider"
            value={provider.providerId}
            checked={value === provider.providerId}
            disabled={unavailable}
            onChange={() => onChange(provider.providerId)}
          />
          <span>
            <strong>{provider.displayName}</strong>
            {unavailable ? <> <small>{copy.unavailable}</small></> : null}
          </span>
        </label>
      })}
    </div>
  </fieldset>
}
