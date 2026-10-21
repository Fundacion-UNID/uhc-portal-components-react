import type { ReactNode } from 'react'

/** Keeps the canonical physical-card aspect ratio inside a responsive preview shell. */
export function CardPreview({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="uhc-card-preview-shell" data-testid="card-preview">
    <div className="uhc-card-preview">{children}</div>
  </div>
}
