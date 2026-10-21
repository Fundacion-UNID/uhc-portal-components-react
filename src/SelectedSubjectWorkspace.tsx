'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'

export const SELECTED_SUBJECT_AREAS = ['identity', 'health', 'insurance', 'appointments-tasks', 'communications', 'contacts-permissions'] as const
export type SelectedSubjectArea = (typeof SELECTED_SUBJECT_AREAS)[number]
export type SelectedSubjectAction = 'search' | 'read' | 'create' | 'update' | 'delete'
export type SelectedSubjectAreaCapability = Readonly<{ area: SelectedSubjectArea; actions: readonly SelectedSubjectAction[]; recordCount?: number }>
export type SelectedSubjectWorkspaceCopy = Readonly<{ card: string; summary: string; identity: string; health: string; insurance: string; appointmentsTasks: string; communications: string; contactsPermissions: string; records: string }>

const copyKey: Readonly<Record<SelectedSubjectArea, keyof SelectedSubjectWorkspaceCopy>> = { identity: 'identity', health: 'health', insurance: 'insurance', 'appointments-tasks': 'appointmentsTasks', communications: 'communications', 'contacts-permissions': 'contactsPermissions' }

function mergeCapabilities(capabilities: readonly SelectedSubjectAreaCapability[]) {
  const merged = new Map<SelectedSubjectArea, SelectedSubjectAreaCapability>()
  for (const capability of capabilities) {
    if (!capability.actions.length) continue
    const previous = merged.get(capability.area)
    merged.set(capability.area, { area: capability.area, actions: [...new Set([...(previous?.actions ?? []), ...capability.actions])], recordCount: capability.actions.includes('search') ? capability.recordCount ?? previous?.recordCount : previous?.recordCount })
  }
  return merged
}

/** Capability-driven professional subject shell; selection never grants an action. */
export function SelectedSubjectWorkspace({ subject, capabilities, copy, content = {}, initialArea = 'card' }: Readonly<{
  subject: Readonly<{ id: string; display: string }>
  capabilities: readonly SelectedSubjectAreaCapability[]
  copy: SelectedSubjectWorkspaceCopy
  content?: Partial<Record<SelectedSubjectArea, ReactNode>>
  initialArea?: 'card' | SelectedSubjectArea
}>) {
  const capabilityByArea = useMemo(() => mergeCapabilities(capabilities), [capabilities])
  const visibleAreas = SELECTED_SUBJECT_AREAS.filter((area) => capabilityByArea.has(area))
  const [selectedArea, setSelectedArea] = useState<'card' | SelectedSubjectArea>(initialArea)
  useEffect(() => { if (selectedArea !== 'card' && !capabilityByArea.has(selectedArea)) setSelectedArea('card') }, [capabilityByArea, selectedArea])
  const labelFor = (area: SelectedSubjectArea) => {
    const label = copy[copyKey[area]]
    const capability = capabilityByArea.get(area)
    return capability?.actions.includes('search') && capability.recordCount !== undefined ? `${label}, ${capability.recordCount} ${copy.records}` : label
  }
  const selectedCapability = selectedArea === 'card' ? undefined : capabilityByArea.get(selectedArea)
  return <section className="uhcp-selected-subject-workspace" aria-labelledby="uhcp-selected-subject-title">
    <header><div><span>{copy.summary}</span><h2 id="uhcp-selected-subject-title">{subject.display}</h2></div><code>{subject.id}</code></header>
    <div className="uhcp-selected-subject-tabs" role="tablist" aria-label={subject.display}>
      <button type="button" role="tab" aria-selected={selectedArea === 'card'} onClick={() => setSelectedArea('card')}>{copy.card}</button>
      {visibleAreas.map((area) => <button type="button" role="tab" key={area} aria-selected={selectedArea === area} onClick={() => setSelectedArea(area)}>{labelFor(area)}</button>)}
    </div>
    <div role="tabpanel">{selectedArea === 'card' ? <div><h3>{copy.summary}</h3><ul>{visibleAreas.map((area) => <li key={area}>{labelFor(area)}</li>)}</ul></div> : selectedCapability?.actions.includes('read') ? content[selectedArea] : null}</div>
  </section>
}
