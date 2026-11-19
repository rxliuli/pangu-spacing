import type { Browser } from 'wxt/browser'
import type {
  ClassifyCandidatesResponse,
  MessageToServiceWorker,
} from '@/lib/ai-spacing/messages'
import { handleClassification } from '@/lib/ai-spacing/service-worker'
import { CONTENT_SCRIPT_FILE, TEXT_AUTOSPACE_CSS_FILE } from '@/lib/messages'
import {
  getSettings,
  onSettingsChanged,
  reconcileSettings,
  type Settings,
} from '@/lib/settings'
import { shouldShowOffIcon } from '@/lib/urls'

const SCRIPT_ID = 'paranoid-auto-spacing'
const TEXT_AUTOSPACE_SCRIPT_ID = 'text-autospace'
const PAGE_MATCHES = ['http://*/*', 'https://*/*']

// Must match action.default_icon in wxt.config.ts: a per-tab setIcon override needs an explicit restore; Safari templates toolbar icons by alpha channel, so it uses transparent silhouettes
const DEFAULT_ICON_PATHS = import.meta.env.SAFARI
  ? {
      16: 'icons/toolbar-icon-16.png',
      24: 'icons/toolbar-icon-24.png',
      32: 'icons/toolbar-icon-32.png',
    }
  : {
      16: 'icons/icon-16.png',
      24: 'icons/icon-24.png',
      32: 'icons/icon-32.png',
    }
const OFF_ICON_PATHS = import.meta.env.SAFARI
  ? {
      16: 'icons/toolbar-off-icon-16.png',
      24: 'icons/toolbar-off-icon-24.png',
      32: 'icons/toolbar-off-icon-32.png',
    }
  : {
      16: 'icons/off-icon-16.png',
      24: 'icons/off-icon-24.png',
      32: 'icons/off-icon-32.png',
    }

type RegisteredContentScript = Browser.scripting.RegisteredContentScript

// One call per script: registerContentScripts() is all-or-nothing across its array, so one failure must not take down the other
async function registerOneContentScript(script: RegisteredContentScript) {
  try {
    await browser.scripting.registerContentScripts([script])
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Duplicate script ID')
    ) {
      console.warn('Script already registered, skipping:', script.id)
    } else {
      console.error(`Failed to register content script ${script.id}:`, error)
    }
  }
}

async function registerContentScripts() {
  await browser.scripting
    .unregisterContentScripts()
    .catch((error) =>
      console.warn('Failed to unregister existing scripts:', error),
    )

  const settings = await getSettings()

  if (settings.is_text_autospace_enabled) {
    // Visual-only native autospacing, deliberately not gated by spacing mode or the site lists
    await registerOneContentScript({
      id: TEXT_AUTOSPACE_SCRIPT_ID,
      css: [TEXT_AUTOSPACE_CSS_FILE],
      matches: PAGE_MATCHES,
      allFrames: true,
    })
  }

  if (settings.spacing_mode === 'spacing_when_load') {
    // Registered on every page: the content script applies the site lists itself, so they follow same-document navigation
    await registerOneContentScript({
      id: SCRIPT_ID,
      js: [CONTENT_SCRIPT_FILE],
      matches: PAGE_MATCHES,
      runAt: 'document_idle',
    })
  }
}

// Each run unregisters everything and reads fresh settings, so queued runs converge on the latest state. The queue only keeps runs from interleaving
let registrationQueue = Promise.resolve()
function queueRegisterContentScripts() {
  registrationQueue = registrationQueue
    .then(() => registerContentScripts())
    .catch(console.error)
  return registrationQueue
}

// The off icon only marks spacing the user turned off: manual mode, or a tab whose url the site lists exclude
async function updateTabIcon(
  tabId: number,
  url: string | undefined,
  settings: Settings,
) {
  const path = shouldShowOffIcon(settings, url)
    ? OFF_ICON_PATHS
    : DEFAULT_ICON_PATHS
  try {
    await browser.action.setIcon({ tabId, path })
  } catch {
    // The tab can close between the event and this write
  }
}

async function updateAllTabIcons() {
  const settings = await getSettings()
  const tabs = await browser.tabs.query({})
  await Promise.all(
    tabs.flatMap((tab) =>
      tab.id === undefined ? [] : [updateTabIcon(tab.id, tab.url, settings)],
    ),
  )
}

const REGISTRATION_KEYS: (keyof Settings)[] = [
  'spacing_mode',
  'is_text_autospace_enabled',
]
const ICON_KEYS: (keyof Settings)[] = [
  'spacing_mode',
  'filter_mode',
  'blacklist',
  'whitelist',
]

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    await reconcileSettings()
    await queueRegisterContentScripts()
    await updateAllTabIcons()
  })

  browser.runtime.onStartup.addListener(async () => {
    await queueRegisterContentScripts()
    await updateAllTabIcons()
  })

  // The url is often unset on onCreated, so onUpdated refines it once navigation commits
  browser.tabs.onCreated.addListener(async (tab) => {
    if (tab.id !== undefined) {
      await updateTabIcon(
        tab.id,
        tab.url || tab.pendingUrl,
        await getSettings(),
      )
    }
  })

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' || changeInfo.url) {
      await updateTabIcon(tabId, tab.url, await getSettings())
    }
  })

  // The event payload says what changed, so a cold-started worker needs no cached state
  onSettingsChanged((changedKeys) => {
    if (changedKeys.some((key) => REGISTRATION_KEYS.includes(key))) {
      void queueRegisterContentScripts()
    }
    if (changedKeys.some((key) => ICON_KEYS.includes(key))) {
      updateAllTabIcons().catch(console.error)
    }
  })

  // AI spacing's only entry point. Returning true keeps the channel open for sendResponse; handleClassification() never rejects
  browser.runtime.onMessage.addListener(
    (
      message: MessageToServiceWorker,
      _sender,
      sendResponse: (response: ClassifyCandidatesResponse) => void,
    ) => {
      if (message?.type !== 'CLASSIFY_CANDIDATES') {
        return false
      }
      void handleClassification(message.kind, message.candidates).then(
        sendResponse,
      )
      return true
    },
  )
})
