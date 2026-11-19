import type en from '@/public/_locales/en/messages.json'

export type MessageKey = keyof typeof en

export function t(key: MessageKey) {
  return browser.i18n.getMessage(key)
}

// Gives extension pages the UI language, so CJK text picks Traditional or Simplified glyphs and the browser hyphenates English correctly
export function applyDocumentLanguage(titleKey: MessageKey) {
  document.documentElement.lang = browser.i18n.getUILanguage()
  document.title = t(titleKey)
}

export type RichPart =
  | { type: 'text'; text: string }
  | { type: 'a' | 'code'; text: string }

// Messages mark inline markup as <a>...</a> or <code>...</code>. Splitting them here keeps translations out of innerHTML
export function parseRichMessage(message: string): RichPart[] {
  const parts: RichPart[] = []
  const tag = /<(a|code)>(.*?)<\/\1>/g
  let last = 0
  for (const match of message.matchAll(tag)) {
    if (match.index > last) {
      parts.push({ type: 'text', text: message.slice(last, match.index) })
    }
    parts.push({ type: match[1] as 'a' | 'code', text: match[2]! })
    last = match.index + match[0].length
  }
  if (last < message.length) {
    parts.push({ type: 'text', text: message.slice(last) })
  }
  return parts
}
