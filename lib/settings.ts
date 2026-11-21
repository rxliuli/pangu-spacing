import type { UiLanguageSetting } from '@/lib/i18n'

// Same keys and defaults as the pangu.js Chrome extension, so the two read each other's synced settings. ui_language is the only addition
export interface Settings {
  spacing_mode: 'spacing_when_load' | 'spacing_when_click'
  filter_mode: 'blacklist' | 'whitelist'
  blacklist: string[]
  whitelist: string[]
  is_sound_effects_muted: boolean
  is_text_autospace_enabled: boolean
  is_ai_spacing_enabled: boolean
  ui_language: UiLanguageSetting
}

export const DEFAULT_SETTINGS: Settings = {
  spacing_mode: 'spacing_when_load',
  filter_mode: 'blacklist',
  blacklist: [
    'https://docs.google.com/*',
    'https://gist.github.com/*',
    'https://github.com/*/*/blob/*',
    'https://github.com/*/*/commit/*',
    'https://github.com/*/*/compare/*',
    'https://github.com/*/*/pull/*',
    'https://github.com/vinta/pangu.js/issues*',
    'https://www.netflix.com/*',
  ],
  whitelist: [],
  is_sound_effects_muted: false,
  is_text_autospace_enabled: true,
  is_ai_spacing_enabled: true,
  ui_language: 'auto',
}

const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]

// storage.sync reads from a local database, so reading fresh on every call is cheap and there is no cache. Passing the defaults fills missing keys
export async function getSettings(): Promise<Settings> {
  return (await browser.storage.sync.get(
    DEFAULT_SETTINGS as unknown as Record<string, unknown>,
  )) as unknown as Settings
}

export async function updateSettings(partial: Partial<Settings>) {
  await browser.storage.sync.set(partial)
}

// The onChanged echo of this context's own writes is the render path: UI handlers only write, and every repaint is driven from here
export function onSettingsChanged(
  callback: (changedKeys: (keyof Settings)[]) => void,
) {
  const listener = (
    changes: Record<string, unknown>,
    areaName: string,
  ) => {
    if (areaName !== 'sync') {
      return
    }
    const changedKeys = SETTINGS_KEYS.filter((key) => key in changes)
    if (changedKeys.length > 0) {
      callback(changedKeys)
    }
  }
  browser.storage.onChanged.addListener(listener)
  return () => browser.storage.onChanged.removeListener(listener)
}

// Brings synced storage in line with the current schema on install/update: adds missing defaults, prunes keys no version of Settings knows
export async function reconcileSettings() {
  const raw = await browser.storage.sync.get(null)

  const missing: Partial<Settings> = {}
  for (const key of SETTINGS_KEYS) {
    if (!(key in raw)) {
      Object.assign(missing, { [key]: DEFAULT_SETTINGS[key] })
    }
  }
  if (Object.keys(missing).length > 0) {
    await browser.storage.sync.set(missing)
  }

  const unknownKeys = Object.keys(raw).filter(
    (key) => !(key in DEFAULT_SETTINGS),
  )
  if (unknownKeys.length > 0) {
    await browser.storage.sync.remove(unknownKeys)
  }
}

// Builds a Partial<Settings> for the list picked by filter mode without a computed-key cast
export function listPatch(key: 'blacklist' | 'whitelist', urls: string[]) {
  return key === 'blacklist' ? { blacklist: urls } : { whitelist: urls }
}
