// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EmergencyTaskHub, type EmergencyTaskHubCopy, type EmergencyTaskItem } from '../src/EmergencyTaskHub.js'

const TASK_HUB_COPY = Object.freeze({
  title: 'What do you need to do?',
  description: 'Choose one action.',
  unavailable: 'Select an authorized subject first.',
}) satisfies EmergencyTaskHubCopy

const TASKS = Object.freeze([
  { id: 'contact', icon: 'contact', title: 'Contact family', description: 'Start an authorized communication.', actionLabel: 'Open contact actions', href: '#contact' },
  { id: 'journey', icon: 'journey', title: 'Care journey', description: 'Review recorded care stages.', actionLabel: 'Open care journey', href: '#journey' },
  { id: 'health', icon: 'health', title: 'Emergency health data', description: 'Review the authorized health summary.', actionLabel: 'Open health data', href: '#health' },
]) satisfies readonly EmergencyTaskItem[]

describe('EmergencyTaskHub', () => {
  it('presents exactly three primary emergency workflows without technical chrome', () => {
    const html = renderToStaticMarkup(<EmergencyTaskHub copy={TASK_HUB_COPY} tasks={TASKS}/>)
    expect((html.match(/data-emergency-task=/g) ?? [])).toHaveLength(3)
    for (const task of TASKS) {
      expect(html).toContain(task.title)
      expect(html).toContain(`href="${task.href}"`)
    }
    expect(html).not.toMatch(/BFF|FHIR|DID|token/)
  })

  it('keeps unavailable actions visible but non-navigable', () => {
    const unavailableTasks = TASKS.map((task) => ({ ...task, href: undefined }))
    const html = renderToStaticMarkup(<EmergencyTaskHub copy={TASK_HUB_COPY} tasks={unavailableTasks}/>)
    expect(html).not.toContain('href=')
    expect((html.match(/Select an authorized subject first\./g) ?? [])).toHaveLength(TASKS.length)
  })

  it('supports the spacious three-card entry layout used by personal portals', () => {
    const html = renderToStaticMarkup(<EmergencyTaskHub copy={TASK_HUB_COPY} tasks={TASKS} layout="grid" headingLevel={1}/>)
    expect(html).toContain('uhcp-emergency-task-hub-grid')
    expect(html).toContain('<h1 id="emergency-task-hub-title">')
  })
})
