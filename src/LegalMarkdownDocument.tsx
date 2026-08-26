import { Fragment, type JSX, type ReactNode } from 'react'

function inlineMarkdown(value: string): ReactNode[] {
  const parts = value.split(/(`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*]+\*\*)/g).filter(Boolean)
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
    if (link) return <a key={index} href={link[2]} rel="noreferrer">{link[1]}</a>
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    return <Fragment key={index}>{part}</Fragment>
  })
}

/** Renders the deliberately small Markdown subset used by versioned legal notices. */
export function LegalMarkdownDocument({ source }: Readonly<{ source: string }>) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index].trim()
    if (!line) { index += 1; continue }
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      const level = Math.min(6, heading[1].length + 1)
      const Heading = `h${level}` as keyof JSX.IntrinsicElements
      blocks.push(<Heading key={`h-${index}`}>{inlineMarkdown(heading[2])}</Heading>)
      index += 1
      continue
    }
    if (/^-\s+/.test(line)) {
      const items: ReactNode[] = []
      while (index < lines.length && /^-\s+/.test(lines[index].trim())) {
        items.push(<li key={index}>{inlineMarkdown(lines[index].trim().replace(/^-\s+/, ''))}</li>)
        index += 1
      }
      blocks.push(<ul key={`ul-${index}`}>{items}</ul>)
      continue
    }
    const paragraph: string[] = [line]
    index += 1
    while (index < lines.length) {
      const next = lines[index].trim()
      if (!next || /^(#{1,6})\s+/.test(next) || /^-\s+/.test(next)) break
      paragraph.push(next)
      index += 1
    }
    blocks.push(<p key={`p-${index}`}>{inlineMarkdown(paragraph.join(' '))}</p>)
  }
  return <div className="uhcp-legal-document">{blocks}</div>
}
