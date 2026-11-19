import pangu from 'pangu/browser'
import { applyAiSpacing, warmUpAiSpacing } from '@/lib/ai-spacing/content-script'
import type {
  ContentScriptResponse,
  MessageToContentScript,
} from '@/lib/messages'
import { getSettings, type Settings } from '@/lib/settings'
import { shouldAutoSpace } from '@/lib/urls'

function startAutoSpacing(settings: Settings) {
  if (settings.is_ai_spacing_enabled) {
    warmUpAiSpacing()
  }
  pangu.autoSpacePage()
}

// Registration only applies at page load, so a same-document navigation checks the site lists again
function applyAutoSpacingUrlPolicy(settings: Settings) {
  if (shouldAutoSpace(settings, location.href)) {
    startAutoSpacing(settings)
  } else {
    pangu.stopAutoSpacePage()
  }
}

// Calls back when the url changes without a page load. Safari and older Firefox lack the Navigation API, so they fall back to history events plus a slow poll for pushState
function onUrlChange(callback: (fromUrl: string) => void) {
  if (typeof navigation !== 'undefined') {
    navigation.addEventListener('currententrychange', (event) => {
      if (event.from.url) {
        callback(event.from.url)
      }
    })
    return
  }
  let lastUrl = location.href
  const check = () => {
    if (location.href !== lastUrl) {
      const fromUrl = lastUrl
      lastUrl = location.href
      callback(fromUrl)
    }
  }
  addEventListener('popstate', check)
  addEventListener('hashchange', check)
  setInterval(check, 1000)
}

export default defineContentScript({
  // Registered by the background with scripting.registerContentScripts, or injected by the popup's manual button
  registration: 'runtime',

  main() {
    const initialization = (async () => {
      // Assigned before the sweep starts, so the initial pass is captured too
      const settings = await getSettings()
      if (settings.is_ai_spacing_enabled) {
        pangu.onTextNodesSettled = (settledTextNodes) => {
          void applyAiSpacing(settledTextNodes)
        }
      }
      onUrlChange((fromUrl) => {
        // Same-url history updates must not cancel manual activation
        if (fromUrl !== location.href) {
          applyAutoSpacingUrlPolicy(settings)
        }
      })
      return settings
    })()

    // Spacing when load: registration injected this script, so the site lists decide once at load
    void initialization
      .then((settings) => applyAutoSpacingUrlPolicy(settings))
      .catch((error) =>
        console.error('[pangu] Failed to initialize auto spacing', error),
      )

    // Spacing when click: the popup injected this script and sends MANUAL_SPACING. Spaces unconditionally until the url changes; never rejects
    async function startManualSpacing(): Promise<ContentScriptResponse> {
      const url = location.href
      try {
        const settings = await initialization
        if (location.href !== url) {
          return { success: false }
        }
        startAutoSpacing(settings)
        return { success: true }
      } catch (error) {
        console.error('[pangu] Failed to start auto spacing on %s:', url, error)
        return { success: false }
      }
    }

    browser.runtime.onMessage.addListener(
      (
        message: MessageToContentScript,
        _sender,
        sendResponse: (response: ContentScriptResponse) => void,
      ) => {
        if (message?.action === 'MANUAL_SPACING') {
          void startManualSpacing().then(sendResponse)
          return true
        }
        if (message?.action === 'PING') {
          // The popup pings to learn whether this script is already loaded
          sendResponse({ success: true })
        }
        return false
      },
    )
  },
})
