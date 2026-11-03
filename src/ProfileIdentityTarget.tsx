import type { ProfileProtectionTargetV2 } from './contracts.js'

export function ProfileIdentityIcon() {
  return <svg data-testid="professional-identity-icon" className="uhcp-person-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4.5 21a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
}

/** Shared presentation for one host-resolved profile. It never selects or grants a role. */
export function ProfileIdentityTarget({ target }: Readonly<{ target: ProfileProtectionTargetV2 }>) {
  return <div className="uhcp-profile-target">
    {target.icon
      ? <img src={target.icon.src} alt={target.icon.alt} width={target.icon.width} height={target.icon.height} />
      : <span className="uhcp-profile-target-default-icon"><ProfileIdentityIcon /></span>}
    <div className="uhcp-profile-target-content">
      <div className="uhcp-profile-target-copy">
        <strong>{target.title}</strong>
        {target.subtitle && <span>{target.subtitle}</span>}
      </div>
      {target.badges?.length ? <ul className="uhcp-profile-target-badges uhcp-profile-target-badges-centered" aria-label={target.title}>
        {target.badges.map(badge => <li key={badge}>{badge}</li>)}
      </ul> : null}
      {target.details?.length ? <dl className="uhcp-profile-target-details">
        {target.details.map(detail => <div key={`${detail.label}:${detail.value}`}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}
      </dl> : null}
    </div>
  </div>
}
