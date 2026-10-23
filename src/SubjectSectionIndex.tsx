'use client'

import { useId, type KeyboardEvent, type ReactNode } from 'react'

export type SubjectSectionIndexItem = Readonly<{
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
}>

export type SubjectSectionIndexProps = Readonly<{
  ariaLabel: string
  title: string
  sections: readonly SubjectSectionIndexItem[]
  activeSection: string
  onSectionChange: (section: string) => void
  className?: string
}>

/**
 * One concise, brand-neutral navigation index for a selected Personal subject.
 * The host supplies only server-authorized destinations; selecting one changes
 * presentation and never grants access to the underlying data.
 */
export function SubjectSectionIndex({
  ariaLabel,
  title,
  sections,
  activeSection,
  onSectionChange,
  className,
}: SubjectSectionIndexProps) {
  const visibleSections = sections.filter(({ disabled }) => !disabled)
  const instanceId = useId().replaceAll(':', '')

  function moveWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, sectionId: string) {
    const currentIndex = visibleSections.findIndex(({ id }) => id === sectionId)
    let nextIndex: number | undefined
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % visibleSections.length
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + visibleSections.length) % visibleSections.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = visibleSections.length - 1
    if (nextIndex === undefined || !visibleSections[nextIndex]) return
    event.preventDefault()
    const nextSection = visibleSections[nextIndex]
    onSectionChange(nextSection.id)
    document.getElementById(`${instanceId}-section-${nextSection.id}`)?.focus()
  }

  return <nav className={className ?? 'uhcp-subject-section-index'} aria-label={ariaLabel}>
    <h2>{title}</h2>
    <div role="tablist" aria-label={ariaLabel}>
      {visibleSections.map((section) => <button
        key={section.id}
        id={`${instanceId}-section-${section.id}`}
        type="button"
        role="tab"
        aria-selected={section.id === activeSection}
        onClick={() => onSectionChange(section.id)}
        onKeyDown={(event) => moveWithKeyboard(event, section.id)}
      >
        {section.icon}
        <span>{section.label}</span>
      </button>)}
    </div>
  </nav>
}
