export type ClinicalActionKind = 'add' | 'edit' | 'delete'

/** Compact clinical action; authorization and callback behavior remain host-owned. */
export function ClinicalActionButton({ kind, label, disabled = false, onClick }: Readonly<{
  kind: ClinicalActionKind
  label: string
  disabled?: boolean
  onClick: () => void
}>) {
  return <button
    type="button"
    className={`uhcp-clinical-icon-action uhcp-clinical-icon-action-${kind}`}
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
  ><ActionIcon kind={kind}/></button>
}

function ActionIcon({ kind }: Readonly<{ kind: ClinicalActionKind }>) {
  if (kind === 'add') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
  if (kind === 'delete') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16m-10 4v6m4-6v6M9 7l1-3h4l1 3m3 0-1 14H7L6 7"/></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.2-1 10.9-10.9a2.1 2.1 0 0 0-3-3L5.2 16 4 20Zm10.7-13.5 3 3"/></svg>
}
