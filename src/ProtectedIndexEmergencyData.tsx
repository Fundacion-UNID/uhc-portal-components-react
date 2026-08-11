export type ProtectedIndexEmergencyItem = Readonly<{
  identifier: string
  title: string
  categoryLabel: string
  sourceLabel?: string
  creatorLabel?: string
  /** True only after the backend confirms emergency-copy consent and policy. */
  emergencyAvailable: boolean
}>

export type ProtectedIndexEmergencyCopy = Readonly<{
  title: string
  body: string
  securePinTitle: string
  securePinBody: string
  emergencyPinTitle: string
  emergencyPinBody: string
  emergencyOnly: string
  protectedOnly: string
  empty: string
  sourcePrefix: string
  creatorPrefix: string
}>

/**
 * Presents backend-confirmed protected-index copies and their independent
 * emergency availability. The component never infers emergency consent from
 * individual authorship, storage, a selected card or browser state.
 */
export function ProtectedIndexEmergencyData({
  copy,
  items,
}: Readonly<{
  copy: ProtectedIndexEmergencyCopy
  items: readonly ProtectedIndexEmergencyItem[]
}>) {
  return (
    <section className="uhcp-emergency-copy" aria-labelledby="protected-index-emergency-title">
      <header>
        <div>
          <h2 id="protected-index-emergency-title">{copy.title}</h2>
          <p>{copy.body}</p>
        </div>
        <div className="uhcp-emergency-copy-legend" aria-label={copy.title}>
          <Pin kind="secure" label={copy.securePinTitle} help={copy.securePinBody} />
          <Pin kind="emergency" label={copy.emergencyPinTitle} help={copy.emergencyPinBody} />
        </div>
      </header>
      {items.length === 0 ? <p className="uhcp-emergency-copy-empty">{copy.empty}</p> : (
        <ul className="uhcp-emergency-copy-list">
          {items.map((item) => (
            <li key={item.identifier}>
              <div className="uhcp-emergency-copy-item-heading">
                <span className="uhcp-emergency-copy-category">{item.categoryLabel}</span>
                <span className="uhcp-emergency-copy-pins">
                  <Pin kind="secure" label={copy.securePinTitle} help={copy.securePinBody} compact />
                  {item.emergencyAvailable ? <Pin kind="emergency" label={copy.emergencyPinTitle} help={copy.emergencyPinBody} compact /> : null}
                </span>
              </div>
              <strong>{item.title}</strong>
              <small>{item.emergencyAvailable ? copy.emergencyOnly : copy.protectedOnly}</small>
              {item.sourceLabel ? <span>{copy.sourcePrefix}: {item.sourceLabel}</span> : null}
              {item.creatorLabel ? <span>{copy.creatorPrefix}: {item.creatorLabel}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Pin({
  kind,
  label,
  help,
  compact = false,
}: Readonly<{
  kind: 'secure' | 'emergency'
  label: string
  help: string
  compact?: boolean
}>) {
  return (
    <span className={`uhcp-emergency-copy-pin uhcp-emergency-copy-pin-${kind}`} role="img" aria-label={label} title={help}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17v5m-5-9 2-2V5L7 3h10l-2 2v6l2 2H7Z" /></svg>
      {compact ? null : <span>{label}</span>}
    </span>
  )
}
