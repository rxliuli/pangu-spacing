import { afterEach, describe, expect, it, vi } from 'vitest'
import en from '@/public/_locales/en/messages.json'
import zhCN from '@/public/_locales/zh_CN/messages.json'
import zhTW from '@/public/_locales/zh_TW/messages.json'
import {
  documentLanguage,
  getUiLanguage,
  parseRichMessage,
  setUiLanguage,
  subscribeUiLanguage,
  t,
} from '@/lib/i18n'

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

describe('ui language override', () => {
  afterEach(() => setUiLanguage('auto'))

  it('renders the chosen locale and notifies subscribers', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeUiLanguage(listener)
    setUiLanguage('zh_TW')
    expect(t('extension_title')).toBe(zhTW.extension_title.message)
    expect(documentLanguage()).toBe('zh-TW')
    expect(getUiLanguage()).toBe('zh_TW')
    setUiLanguage('zh_CN')
    expect(t('extension_title')).toBe(zhCN.extension_title.message)
    expect(listener).toHaveBeenCalledTimes(2)
    // Setting the same language again is not a change
    setUiLanguage('zh_CN')
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('defaults to following the browser', () => {
    expect(getUiLanguage()).toBe('auto')
  })
})
