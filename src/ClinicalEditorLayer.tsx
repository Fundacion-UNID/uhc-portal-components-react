'use client'

import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type ClinicalEditorLayerProps = Readonly<{
  children: ReactNode
  onDismiss: () => void
}>

/** Places clinical editors above the complete portal shell, including sticky headers and menus. */
export function ClinicalEditorLayer({ children, onDismiss }: ClinicalEditorLayerProps) {
  const layer = <div
    className="uhcp-clinical-editor-backdrop"
    onMouseDown={(event) => {
      if (event.currentTarget === event.target) onDismiss()
    }}
  >{children}</div>

  return typeof document === 'undefined' ? layer : createPortal(layer, document.body)
}
