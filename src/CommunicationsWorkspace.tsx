'use client'

import { useId, useState, type ReactNode } from 'react'

export type CommunicationsWorkspaceTopic = Readonly<{
  id: string
  label: string
  disabled?: boolean
  content?: ReactNode
}>

/** Shared personal-portal navigation; hosts provide channel and topic data through their own BFF adapters. */
export function CommunicationsWorkspace(input: Readonly<{
  copy: Readonly<{ communicationsLabel: string; channels: string; infoAndAlerts: string }>
  channels: ReactNode
  alertTopics: readonly CommunicationsWorkspaceTopic[]
}>) {
  const id = useId()
  const [section, setSection] = useState<'channels' | 'alerts'>('channels')
  const firstEnabledTopic = input.alertTopics.find((topic) => !topic.disabled)
  const [topicId, setTopicId] = useState(firstEnabledTopic?.id ?? '')
  const activeTopic = input.alertTopics.find((topic) => topic.id === topicId && !topic.disabled)

  return <section className="uhcp-communications-workspace">
    <div role="tablist" aria-label={input.copy.communicationsLabel} className="uhcp-communications-tabs">
      <button type="button" role="tab" aria-selected={section === 'channels'} aria-controls={`${id}-channels`} onClick={() => setSection('channels')}>{input.copy.channels}</button>
      <button type="button" role="tab" aria-selected={section === 'alerts'} aria-controls={`${id}-alerts`} onClick={() => setSection('alerts')}>{input.copy.infoAndAlerts}</button>
    </div>
    {section === 'channels' ? <div id={`${id}-channels`} role="tabpanel">{input.channels}</div> : <div id={`${id}-alerts`} role="tabpanel">
      <div role="tablist" aria-label={input.copy.infoAndAlerts} className="uhcp-communications-topic-tabs">
        {input.alertTopics.map((topic) => <button key={topic.id} type="button" role="tab" disabled={topic.disabled} aria-selected={activeTopic?.id === topic.id} onClick={() => setTopicId(topic.id)}>{topic.label}</button>)}
      </div>
      {activeTopic?.content ? <div role="tabpanel">{activeTopic.content}</div> : null}
    </div>}
  </section>
}
