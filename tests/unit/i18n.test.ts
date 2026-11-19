import { describe, expect, it } from 'vitest'
import en from '@/public/_locales/en/messages.json'
import zhCN from '@/public/_locales/zh_CN/messages.json'
import zhTW from '@/public/_locales/zh_TW/messages.json'
import { parseRichMessage } from '@/lib/i18n'

const locales = { en, zh_CN: zhCN, zh_TW: zhTW } as Record<
  string,
  Record<string, { message: string }>
>

const tags = (message: string) => message.match(/<\/?(a|code)>/g) ?? []

describe('locales', () => {
  it('every locale has the same keys', () => {
    const keys = Object.keys(en).sort()
    for (const [locale, messages] of Object.entries(locales)) {
      expect(Object.keys(messages).sort(), locale).toEqual(keys)
    }
  })

  it('no message is empty, and every translation keeps the same markup', () => {
    for (const [locale, messages] of Object.entries(locales)) {
      for (const [key, { message }] of Object.entries(messages)) {
        expect(message.trim(), `${locale}.${key}`).not.toBe('')
        expect(tags(message), `${locale}.${key}`).toEqual(tags(locales.en![key]!.message))
      }
    }
  })
})

describe('parseRichMessage', () => {
  it('splits link and code markers out of the text', () => {
    expect(parseRichMessage('A <code>+</code> or <a>link</a>.')).toEqual([
      { type: 'text', text: 'A ' },
      { type: 'code', text: '+' },
      { type: 'text', text: ' or ' },
      { type: 'a', text: 'link' },
      { type: 'text', text: '.' },
    ])
  })
})
