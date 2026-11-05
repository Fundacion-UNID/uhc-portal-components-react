import type { SubjectCardProviderDescriptor } from 'sos-data-utils-ts/subject-card-directory'

export type CardProviderChoice = Pick<SubjectCardProviderDescriptor, 'providerId' | 'displayName'> & Readonly<{
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
    <select
      className="uhcp-card-provider-select"
      aria-label={copy.legend}
      value={value}
      onChange={event => onChange(event.target.value)}
    >
      <option value="" disabled>—</option>
      {providers.map(provider => {
        const unavailable = provider.available === false
        return <option key={provider.providerId} value={provider.providerId} disabled={unavailable}>
          {provider.displayName}{unavailable ? ` — ${copy.unavailable}` : ''}
        </option>
      })}
    </select>
  </fieldset>
}
