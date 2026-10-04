export type EmergencyTaskIcon = 'contact' | 'journey' | 'health' | 'scan'

export type EmergencyTaskItem = Readonly<{
  id: string
  icon: EmergencyTaskIcon
  title: string
  description: string
  actionLabel: string
  href?: string
  status?: string
}>

export type EmergencyTaskHubCopy = Readonly<{
  title: string
  description?: string
  unavailable: string
}>

/**
 * Brand-neutral, task-first entry to the three SOSChain emergency workflows.
 * Hosts resolve every href and status from server-authorized capabilities.
 * Rendering an action never grants subject, clinical or communication access.
 */
export function EmergencyTaskHub({ copy, tasks, layout = 'list', headingLevel = 2 }: Readonly<{
  copy: EmergencyTaskHubCopy
  tasks: readonly EmergencyTaskItem[]
  layout?: 'list' | 'grid'
  headingLevel?: 1 | 2
}>) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return <section className={`uhcp-emergency-task-hub${layout === 'grid' ? ' uhcp-emergency-task-hub-grid' : ''}`} aria-labelledby="emergency-task-hub-title">
    <header>
      <Heading id="emergency-task-hub-title">{copy.title}</Heading>
      {copy.description ? <p>{copy.description}</p> : null}
    </header>
    <div className="uhcp-emergency-task-list">
      {tasks.map((task) => <article data-emergency-task={task.id} key={task.id}>
        <span className={`uhcp-emergency-task-icon uhcp-emergency-task-icon-${task.icon}`} aria-hidden="true"><TaskIcon icon={task.icon}/></span>
        <div className="uhcp-emergency-task-copy">
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          {task.status ? <small>{task.status}</small> : null}
        </div>
        {task.href
          ? <a href={task.href}>{task.actionLabel}<ArrowIcon/></a>
          : <span className="uhcp-emergency-task-unavailable">{copy.unavailable}</span>}
      </article>)}
    </div>
  </section>
}

function TaskIcon({ icon }: Readonly<{ icon: EmergencyTaskIcon }>) {
  if (icon === 'contact') return <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1 2 2 3-4"/></svg>
  if (icon === 'journey') return <svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3"/></svg>
  if (icon === 'scan') return <svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3m13 5h3a2 2 0 0 0 2-2v-3M7 12h10"/></svg>
  return <svg viewBox="0 0 24 24"><path d="M9 3h6v3h3v15H6V6h3V3Zm0 8h6m-6 4h6"/></svg>
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
}
