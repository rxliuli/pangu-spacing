import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'
import {
  DEFAULT_SETTINGS,
  getSettings,
  reconcileSettings,
  updateSettings,
} from '@/lib/settings'
import {
  addSiteToBlacklist,
  addToActiveList,
  editActiveList,
  removeFromActiveList,
  restoreActiveListDefaults,
} from '@/lib/url-list'

beforeEach(() => {
  fakeBrowser.reset()
})

describe('settings', () => {
  it('falls back to the defaults', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('reconcile adds missing defaults and prunes unknown keys', async () => {
    await browser.storage.sync.set({ spacing_mode: 'spacing_when_click', obsolete: 1 })
    await reconcileSettings()
    const raw = await browser.storage.sync.get(null)
    expect(raw).toEqual({ ...DEFAULT_SETTINGS, spacing_mode: 'spacing_when_click' })
  })
})

describe('url list', () => {
  it('adds a valid pattern to the active list', async () => {
    await updateSettings({ filter_mode: 'whitelist' })
    expect(await addToActiveList('https://vinta.ws/*')).toBe('added')
    expect((await getSettings()).whitelist).toEqual(['https://vinta.ws/*'])
  })

  it('rejects invalid and duplicate patterns', async () => {
    expect(await addToActiveList('vinta.ws')).toBe('invalid')
    expect(await addToActiveList('https://docs.google.com/*')).toBe('duplicate')
  })

  it('edits, removes, and restores the active list', async () => {
    await updateSettings({ filter_mode: 'whitelist', whitelist: ['https://a.com/*', 'https://b.com/*'] })
    expect(await editActiveList(0, 'https://a.com/*')).toBe('unchanged')
    expect(await editActiveList(0, 'https://b.com/*')).toBe('duplicate')
    expect(await editActiveList(0, 'https://c.com/*')).toBe('saved')
    await removeFromActiveList(1)
    expect((await getSettings()).whitelist).toEqual(['https://c.com/*'])
    await restoreActiveListDefaults()
    expect((await getSettings()).whitelist).toEqual([])
  })

  it('adds the whole site of a tab to the blacklist once', async () => {
    expect(await addSiteToBlacklist('https://vinta.ws/code/post?id=1')).toBe('added')
    expect(await addSiteToBlacklist('https://vinta.ws/other')).toBe('duplicate')
    expect((await getSettings()).blacklist.at(-1)).toBe('https://vinta.ws/*')
  })
})
