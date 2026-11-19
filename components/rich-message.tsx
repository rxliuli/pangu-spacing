import { Fragment } from 'react'
import { parseRichMessage, t, type MessageKey } from '@/lib/i18n'

/** Renders a message whose <a> and <code> markers become a link to `href` and inline code. */
export function RichMessage({ id, href }: { id: MessageKey; href?: string }) {
  return parseRichMessage(t(id)).map((part, index) => {
    if (part.type === 'a') {
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline underline-offset-4"
        >
          {part.text}
        </a>
      )
    }
    if (part.type === 'code') {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]"
        >
          {part.text}
        </code>
      )
    }
    return <Fragment key={index}>{part.text}</Fragment>
  })
}
