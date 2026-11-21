import en from '@/public/_locales/en/messages.json'
import zhCN from '@/public/_locales/zh_CN/messages.json'
import zhTW from '@/public/_locales/zh_TW/messages.json'

export type MessageKey = keyof typeof en

export const UI_LANGUAGES = ['en', 'zh_CN', 'zh_TW'] as const
export type UiLanguage = (typeof UI_LANGUAGES)[number]
// 'auto' leaves the choice to browser.i18n, which follows the browser UI language and cannot be switched at runtime
export type UiLanguageSetting = 'auto' | UiLanguage

// Bundled copies of _locales, so extension pages can render a language other than the browser's. i18n.test.ts keeps their keys identical
const CATALOGS: Record<UiLanguage, Record<string, { message: string }>> = {
  en,
  zh_CN: zhCN,
  zh_TW: zhTW,
}

let override: UiLanguage | undefined
const listeners = new Set<() => void>()

export function t(key: MessageKey) {
  if (override) {
    const message = CATALOGS[override][key]?.message
    if (message !== undefined) return message
  }
  return browser.i18n.getMessage(key)
}

export function setUiLanguage(setting: UiLanguageSetting) {
  const next = setting === 'auto' ? undefined : setting
  if (next === override) return
  override = next
  for (const listener of listeners) listener()
}

export function getUiLanguage(): UiLanguageSetting {
  return override ?? 'auto'
}

export function subscribeUiLanguage(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// BCP 47 tag of the language t() renders, e.g. zh_TW -> zh-TW
export function documentLanguage() {
  return override ? override.replace('_', '-') : browser.i18n.getUILanguage()
}

// Gives extension pages the rendered language, so CJK text picks Traditional or Simplified glyphs and the browser hyphenates English correctly
export function applyDocumentLanguage(titleKey: MessageKey) {
  document.documentElement.lang = documentLanguage()
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
