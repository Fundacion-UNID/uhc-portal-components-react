'use client'

import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from 'react'

export const PERSONAL_SUBJECT_WORKSPACE_AREAS = [
  'profile',
  'health',
  'care',
  'communications',
  'access',
] as const

export type PersonalSubjectWorkspaceAreaId = typeof PERSONAL_SUBJECT_WORKSPACE_AREAS[number]
export type SubjectWorkspaceArea = Readonly<{
  id: string
  label: string
  content: ReactNode
  icon?: ReactNode
  disabled?: boolean
}>

export type SubjectWorkspaceProps = Readonly<{
  ariaLabel: string
  areas: readonly SubjectWorkspaceArea[]
  activeArea?: string
  initialArea?: string
  onAreaChange?: (area: string) => void
  className?: string
  tabListClassName?: string
  tabClassName?: string
  panelClassName?: string
}>

/**
 * Shared subject-screen shell for Personal portals.
 *
 * Hosts provide already-authorized content and product-specific additions.
 * Selecting a tab changes presentation only and never grants data access.
 */
export function SubjectWorkspace({
  ariaLabel,
  areas,
  activeArea,
  initialArea,
  onAreaChange,
  className,
  tabListClassName,
  tabClassName,
  panelClassName,
}: SubjectWorkspaceProps) {
  const firstEnabledArea = areas.find(({ disabled }) => !disabled)?.id ?? ''
  const [uncontrolledArea, setUncontrolledArea] = useState(initialArea ?? firstEnabledArea)
  const requestedArea = activeArea ?? uncontrolledArea
  const selectedArea = areas.some(({ id, disabled }) => id === requestedArea && !disabled)
    ? requestedArea
    : firstEnabledArea
  const instanceId = useId().replaceAll(':', '')

  useEffect(() => {
    if (activeArea === undefined && uncontrolledArea !== selectedArea) setUncontrolledArea(selectedArea)
  }, [activeArea, selectedArea, uncontrolledArea])

  function select(area: SubjectWorkspaceArea) {
    if (area.disabled) return
    if (activeArea === undefined) setUncontrolledArea(area.id)
    onAreaChange?.(area.id)
  }

  function moveWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, area: SubjectWorkspaceArea) {
    const enabledAreas = areas.filter(({ disabled }) => !disabled)
    const currentIndex = enabledAreas.findIndex(({ id }) => id === area.id)
    let nextIndex: number | undefined
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % enabledAreas.length
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + enabledAreas.length) % enabledAreas.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = enabledAreas.length - 1
    if (nextIndex === undefined || !enabledAreas[nextIndex]) return
    event.preventDefault()
    const nextArea = enabledAreas[nextIndex]
    select(nextArea)
    document.getElementById(`${instanceId}-tab-${nextArea.id}`)?.focus()
  }

  return <section className={className ?? 'uhcp-subject-workspace'}>
    <div className={tabListClassName ?? 'uhcp-subject-workspace-tabs'} role="tablist" aria-label={ariaLabel}>
      {areas.map((area) => <button
        key={area.id}
        id={`${instanceId}-tab-${area.id}`}
        type="button"
        role="tab"
        aria-selected={selectedArea === area.id}
        aria-controls={`${instanceId}-panel-${area.id}`}
        disabled={area.disabled}
        className={tabClassName}
        onClick={() => select(area)}
        onKeyDown={(event) => moveWithKeyboard(event, area)}
      >{area.icon}{area.label}</button>)}
    </div>
    {areas.map((area) => selectedArea === area.id ? <div
      key={area.id}
      id={`${instanceId}-panel-${area.id}`}
      role="tabpanel"
      aria-labelledby={`${instanceId}-tab-${area.id}`}
      className={panelClassName}
    >{area.content}</div> : null)}
  </section>
}
