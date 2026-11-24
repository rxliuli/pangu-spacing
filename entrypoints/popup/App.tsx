import { useEffect, useRef, useState } from 'react'
import { Ban, ExternalLink, Settings2, Sparkles } from 'lucide-react'
import { Logo } from '@/components/logo'
import { SettingSwitch } from '@/components/setting-switch'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import {
  CONTENT_SCRIPT_FILE,
  type ContentScriptResponse,
  type MessageToContentScript,
} from '@/lib/messages'
import { updateSettings, type Settings } from '@/lib/settings'
import { playSound, stopSound } from '@/lib/sounds'
import { isModelSupported, isTextAutospaceSupported } from '@/lib/support'
import { addSiteToBlacklist } from '@/lib/url-list'
import { isValidUrl, shouldShowActiveStatus } from '@/lib/urls'
import { useSettings } from '@/hooks/use-settings'
import { useUiLanguage } from '@/hooks/use-ui-language'
import { cn } from '@/lib/utils'

type NoticeType = 'info' | 'success' | 'error'

interface Notice {
  text: string
  type: NoticeType
}

interface ActiveTab {
  id?: number
  url?: string
}

async function isContentScriptLoaded(tabId: number) {
  try {
    const message: MessageToContentScript = { action: 'PING' }
    await browser.tabs.sendMessage(tabId, message)
    return true
  } catch {
    return false
  }
}

export function App() {
  useUiLanguage()
  const { settings, reload } = useSettings()
  const [tab, setTab] = useState<ActiveTab>()
  const [aiSupported, setAiSupported] = useState(false)
  const [notice, setNotice] = useState<Notice>()
  const [isSpacing, setIsSpacing] = useState(false)
  const hideTimer = useRef<number>(undefined)
  const onHide = useRef<() => void>(undefined)

  useEffect(() => {
    void browser.tabs
      .query({ active: true, currentWindow: true })
      .then(([active]) => setTab({ id: active?.id, url: active?.url }))
    void isModelSupported().then(setAiSupported)
  }, [])

  const hideNotice = () => {
    setNotice(undefined)
    stopSound()
    clearTimeout(hideTimer.current)
    onHide.current?.()
    onHide.current = undefined
  }

  const showNotice = (
    text: string,
    type: NoticeType,
    delayMs: number,
    callback?: () => void,
  ) => {
    clearTimeout(hideTimer.current)
    onHide.current = callback
    setNotice({ text, type })
    hideTimer.current = window.setTimeout(hideNotice, delayMs)
  }

  // A failed write repaints from confirmed settings, since the control already flipped
  const save = async (partial: Partial<Settings>) => {
    try {
      await updateSettings(partial)
      return true
    } catch (error) {
      console.error('Failed to save settings:', error)
      reload()
      return false
    }
  }

  const onSpacingModeChange = async (checked: boolean) => {
    const spacingMode = checked ? 'spacing_when_load' : 'spacing_when_click'
    if (!(await save({ spacing_mode: spacingMode }))) return
    showNotice(t('refresh_required'), 'info', 3000)
    await playSound(spacingMode === 'spacing_when_load' ? 'Shouryuuken' : 'Hadouken')
  }

  const onToggleWithRefresh = async (partial: Partial<Settings>) => {
    if (await save(partial)) {
      showNotice(t('refresh_required'), 'info', 3000)
    }
  }

  const done = () => setIsSpacing(false)
  const fail = async () => {
    showNotice(t('spacing_fail'), 'error', 4000, done)
    await playSound('WahWahWaaah')
  }

  const onManualSpacing = async () => {
    setIsSpacing(true)
    if (!tab?.id || !tab.url || !isValidUrl(tab.url)) {
      await fail()
      return
    }
    try {
      if (!(await isContentScriptLoaded(tab.id))) {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: [CONTENT_SCRIPT_FILE],
        })
      }
      const message: MessageToContentScript = { action: 'MANUAL_SPACING' }
      const response = (await browser.tabs.sendMessage(
        tab.id,
        message,
      )) as ContentScriptResponse | undefined
      if (response?.success) {
        showNotice(t('spacing_success'), 'success', 3000, done)
        await playSound('YeahBaby')
      } else {
        await fail()
      }
    } catch (error) {
      console.error('Failed to run manual spacing:', error)
      await fail()
    }
  }

  const onAddToBlacklist = async () => {
    if (!tab?.url || !isValidUrl(tab.url)) return
    try {
      const outcome = await addSiteToBlacklist(tab.url)
      showNotice(
        t(outcome === 'duplicate' ? 'already_in_list' : 'refresh_required'),
        'info',
        3000,
      )
    } catch (error) {
      console.error('Failed to add to blacklist:', error)
    }
  }

  const textAutospaceSupported = isTextAutospaceSupported()
  const isActive = settings ? shouldShowActiveStatus(settings, tab?.url) : false
  const canBlacklist =
    settings?.filter_mode === 'blacklist' && !!tab?.url && isValidUrl(tab.url)

  // Sizes are tuned for a desktop popup. On a touch screen the popup is a
  // full-width sheet, where the same sizes read as too small.
  return (
    <div className="relative w-full min-w-80 sm:w-80 text-sm pointer-coarse:text-base">
      {notice && (
        <button
          type="button"
          role="status"
          onClick={hideNotice}
          className={cn(
            'absolute inset-x-3 top-3 z-10 rounded-lg border px-3 py-2.5 text-left text-[13px] leading-snug shadow-lg animate-in fade-in-0 slide-in-from-top-2',
            notice.type === 'success' &&
              'border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
            notice.type === 'error' &&
              'border-red-500/30 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
            notice.type === 'info' && 'bg-popover text-popover-foreground',
          )}
        >
          {notice.text}
        </button>
      )}

      <header className="flex items-center gap-3 border-b px-4 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Logo className="size-7" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] leading-tight font-semibold">
            {t('extension_title')}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('popup_subtitle')}
          </p>
        </div>
      </header>

      <main className="space-y-4 px-4 py-4">
        <div
          data-testid="status"
          data-active={isActive}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium',
            isActive
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'size-2 rounded-full',
              isActive ? 'bg-emerald-500 shadow-[0_0_0_3px] shadow-emerald-500/20' : 'bg-muted-foreground/50',
            )}
          />
          {t(isActive ? 'status_active' : 'status_inactive')}
        </div>

        <div className="space-y-3.5">
          <SettingSwitch
            label={t('spacing_when_load')}
            checked={settings?.spacing_mode === 'spacing_when_load'}
            disabled={!settings}
            onCheckedChange={(checked) => void onSpacingModeChange(checked)}
          />
          <SettingSwitch
            label={t('label_is_sound_effects_muted')}
            checked={settings?.is_sound_effects_muted ?? false}
            disabled={!settings}
            onCheckedChange={(checked) =>
              void save({ is_sound_effects_muted: checked })
            }
          />
          <SettingSwitch
            label={t('label_is_text_autospace_enabled')}
            title={t('text_autospace_tooltip')}
            checked={textAutospaceSupported && !!settings?.is_text_autospace_enabled}
            disabled={!settings || !textAutospaceSupported}
            onCheckedChange={(checked) =>
              void onToggleWithRefresh({ is_text_autospace_enabled: checked })
            }
          />
          <SettingSwitch
            label={t('label_is_ai_spacing_enabled')}
            title={t('ai_spacing_tooltip')}
            checked={aiSupported && !!settings?.is_ai_spacing_enabled}
            disabled={!settings || !aiSupported}
            onCheckedChange={(checked) =>
              void onToggleWithRefresh({ is_ai_spacing_enabled: checked })
            }
          />
        </div>

        <div className="grid gap-2 pt-1">
          <Button
            className="w-full pointer-coarse:h-11"
            disabled={isSpacing}
            onClick={() => void onManualSpacing()}
          >
            <Sparkles />
            {isSpacing ? t('spacing_processing') : t('manual_spacing')}
          </Button>
          {canBlacklist && (
            <Button
              variant="outline"
              className="w-full pointer-coarse:h-11"
              onClick={() => void onAddToBlacklist()}
            >
              <Ban />
              {t('add_to_blacklist')}
            </Button>
          )}
        </div>
      </main>

      <footer className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-foreground"
            onClick={() => void browser.runtime.openOptionsPage()}
          >
            <Settings2 className="size-3.5" />
            {t('settings')}
          </button>
          <a
            href="https://github.com/rxliuli/pangu-spacing"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
            GitHub
          </a>
        </div>
        <span>v{browser.runtime.getManifest().version}</span>
      </footer>
    </div>
  )
}
