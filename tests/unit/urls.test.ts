import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type Settings } from '@/lib/settings'
import {
  isValidMatchPattern,
  shouldAutoSpace,
  shouldShowActiveStatus,
  shouldShowOffIcon,
} from '@/lib/urls'

const settings = (partial: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  ...partial,
})

describe('match patterns', () => {
  it('accepts the Chrome match pattern subset', () => {
    expect(isValidMatchPattern('https://github.com/*/*/pull/*')).toBe(true)
    expect(isValidMatchPattern('*://*.example.com/*')).toBe(true)
    expect(isValidMatchPattern('github.com')).toBe(false)
    expect(isValidMatchPattern('ftp://example.com/*')).toBe(false)
  })
})

describe('url policy', () => {
  it('skips blacklisted pages', () => {
    expect(shouldAutoSpace(settings(), 'https://docs.google.com/document/d/1')).toBe(false)
    expect(shouldAutoSpace(settings(), 'https://vinta.ws/code/')).toBe(true)
  })

  it('spaces only whitelisted pages in whitelist mode', () => {
    const s = settings({ filter_mode: 'whitelist', whitelist: ['https://vinta.ws/*'] })
    expect(shouldAutoSpace(s, 'https://vinta.ws/code/')).toBe(true)
    expect(shouldAutoSpace(s, 'https://example.com/')).toBe(false)
  })

  it('never auto spaces in manual mode', () => {
    const s = settings({ spacing_mode: 'spacing_when_click' })
    expect(shouldAutoSpace(s, 'https://vinta.ws/')).toBe(false)
    expect(shouldShowActiveStatus(s, 'https://vinta.ws/')).toBe(false)
    expect(shouldShowOffIcon(s, undefined)).toBe(true)
  })

  it('reports pages the extension cannot run on as inactive but keeps their icon', () => {
    expect(shouldShowActiveStatus(settings(), 'chrome://extensions/')).toBe(false)
    expect(shouldShowOffIcon(settings(), undefined)).toBe(false)
  })
})
