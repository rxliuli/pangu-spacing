import { afterEach, describe, expect, it } from 'vitest'
import type { Page } from 'playwright'
import type { browser } from 'wxt/browser'
import { launch, SAMPLE_TEXT, SPACED_TEXT, type Harness } from './harness'

declare const chrome: typeof browser

let h: Harness | undefined

afterEach(async () => {
  await h?.close()
  h = undefined
})

/** Launches the browser and waits until the background has registered its content scripts. */
async function start(lang?: string) {
  h = await launch({ lang })
  await expect
    .poll(async () =>
      (await h!.worker()).evaluate(() =>
        chrome.scripting.getRegisteredContentScripts().then((s) => s.length),
      ),
    )
    .toBe(2)
  return h
}

async function openSite(name: string, pathname = '/') {
  const page = await h!.context.newPage()
  await page.goto(h!.site(name, pathname))
  return page
}

const text = (page: Page) => page.locator('#text').textContent()

/** pangu spaces in idle callbacks after document_idle, which can outlast expect.poll's 1s default. */
const poll = <T>(fn: () => Promise<T>) => expect.poll(fn, { timeout: 10_000 })

async function openOptions() {
  const options = await h!.openExtensionPage('options.html')
  await options.getByRole('heading', { level: 1 }).waitFor()
  return options
}

/** Adds a pattern to the active site list through the options page. */
async function addPattern(options: Page, pattern: string) {
  await options.getByRole('button', { name: 'Add URL' }).click()
  await options.getByPlaceholder('Enter a URL').fill(pattern)
  await options.getByRole('button', { name: 'Save' }).click()
}

describe('auto spacing', () => {
  it('spaces a page when it loads, and applies text-autospace', async () => {
    await start()
    const page = await openSite('a')
    await poll(() => text(page)).toBe(SPACED_TEXT)
    expect(
      await page.evaluate(
        () =>
          getComputedStyle(document.documentElement).getPropertyValue(
            'text-autospace',
          ),
      ),
    ).toBe('normal')
  })

  it('spaces text added after load', async () => {
    await start()
    const page = await openSite('a')
    await poll(() => text(page)).toBe(SPACED_TEXT)
    await page.evaluate((sample) => {
      const p = document.createElement('p')
      p.id = 'later'
      p.textContent = sample
      document.body.append(p)
    }, SAMPLE_TEXT)
    await poll(() => page.locator('#later').textContent()).toBe(SPACED_TEXT)
  })

  it('skips sites on the blacklist added from the options page', async () => {
    await start()
    const options = await openOptions()
    await addPattern(options, 'http://b.test/*')
    await options.getByText('http://b.test/*').waitFor()

    const blocked = await openSite('b')
    const allowed = await openSite('a')
    await poll(() => text(allowed)).toBe(SPACED_TEXT)
    expect(await text(blocked)).toBe(SAMPLE_TEXT)
  })

  it('only spaces whitelisted sites in whitelist mode', async () => {
    await start()
    const options = await openOptions()
    await options.getByRole('radio', { name: 'Allowlist' }).click()
    await options.getByText('This list is empty').waitFor()
    await addPattern(options, 'http://a.test/*')
    await options.getByText('http://a.test/*').waitFor()

    const allowed = await openSite('a')
    const other = await openSite('b')
    await poll(() => text(allowed)).toBe(SPACED_TEXT)
    expect(await text(other)).toBe(SAMPLE_TEXT)
  })

  it('stops when a same-document navigation reaches a blacklisted url', async () => {
    await start()
    const options = await openOptions()
    await addPattern(options, 'http://a.test/blocked*')
    await options.getByText('http://a.test/blocked*').waitFor()

    const page = await openSite('a')
    await poll(() => text(page)).toBe(SPACED_TEXT)
    await page.evaluate((sample) => {
      history.pushState(null, '', '/blocked')
      const p = document.createElement('p')
      p.id = 'later'
      p.textContent = sample
      document.body.append(p)
    }, SAMPLE_TEXT)
    await page.waitForTimeout(1500)
    expect(await page.locator('#later').textContent()).toBe(SAMPLE_TEXT)
  })
})

describe('manual spacing', () => {
  it('leaves pages alone in manual mode until summoned', async () => {
    await start()
    const options = await openOptions()
    await options
      .getByRole('radio', { name: "I'll summon the God of Spacing myself" })
      .click()
    await options.getByText('Tap the extension icon').waitFor()
    // Manual mode unregisters the spacing script and keeps text-autospace
    await expect
      .poll(async () =>
        (await h!.worker()).evaluate(() =>
          chrome.scripting
            .getRegisteredContentScripts()
            .then((s) => s.map((c) => c.id)),
        ),
      )
      .toEqual(['text-autospace'])

    const page = await openSite('a')
    await page.waitForTimeout(1000)
    expect(await text(page)).toBe(SAMPLE_TEXT)

    // What the popup's button does: inject the content script, then ask it to space
    const tabId = await h!.tabId(page)
    const response = await (await h!.worker()).evaluate(async (id) => {
      await chrome.scripting.executeScript({
        target: { tabId: id },
        files: ['/content-scripts/content.js'],
      })
      return chrome.tabs.sendMessage(id, { action: 'MANUAL_SPACING' })
    }, tabId)
    expect(response).toEqual({ success: true })
    await poll(() => text(page)).toBe(SPACED_TEXT)
  })
})

describe('options page', () => {
  it('rejects an invalid pattern and keeps the editor open', async () => {
    await start()
    const options = await openOptions()
    await addPattern(options, 'vinta.ws')
    await options.getByRole('alert').getByText("That URL isn't in the right format").waitFor()

    // The editor stays open, so the next attempt reuses it
    await options.getByPlaceholder('Enter a URL').fill('https://docs.google.com/*')
    await options.getByRole('button', { name: 'Save' }).click()
    await options.getByRole('alert').getByText('Already on the list').waitFor()
  })

  it('restores the default list after confirming', async () => {
    await start()
    const options = await openOptions()
    const list = options.getByTestId('url-list')
    await options
      .getByRole('button', { name: 'Remove https://docs.google.com/*' })
      .click()
    await expect.poll(() => list.getByText('https://docs.google.com/*').count()).toBe(0)

    await options.getByRole('button', { name: 'Restore defaults' }).click()
    await options
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Restore defaults' })
      .click()
    await expect.poll(() => list.getByText('https://docs.google.com/*').count()).toBe(1)
  })

  it('edits a pattern in place', async () => {
    await start()
    const options = await openOptions()
    await options.getByRole('button', { name: 'https://www.netflix.com/*', exact: true }).click()
    const input = options.getByTestId('url-list').getByRole('textbox')
    await input.fill('https://www.netflix.com/browse*')
    await input.press('Enter')
    await options.getByRole('button', { name: 'https://www.netflix.com/browse*', exact: true }).waitFor()
  })
})

describe('i18n', () => {
  const titles: Record<string, { title: string; manual: string }> = {
    'en-US': { title: "Why can't you just add a space?", manual: 'Summon the God of Spacing' },
    'zh-CN': { title: '为什么你们就是不能加个空格呢？', manual: '召唤空格之神' },
    'zh-TW': { title: '為什麼你們就是不能加個空格呢？', manual: '召喚空格之神' },
  }

  for (const [lang, expected] of Object.entries(titles)) {
    // macOS Chromium ignores --lang, so only English renders there; CI runs on Linux
    const unsupported = process.platform !== 'linux' && lang !== 'en-US'
    it.skipIf(unsupported)(`renders the ${lang} locale`, async () => {
      await start(lang)
      const options = await openOptions()
      expect(await options.getByRole('heading', { level: 1 }).textContent()).toBe(
        expected.title,
      )
      expect(await options.evaluate(() => document.documentElement.lang)).toBe(lang)

      const popup = await h!.openExtensionPage('popup.html')
      await popup.getByRole('button', { name: expected.manual }).waitFor()
    })
  }
})
