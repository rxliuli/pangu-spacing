import { useSyncExternalStore } from 'react'
import {
  applyDocumentLanguage,
  getUiLanguage,
  setUiLanguage,
  subscribeUiLanguage,
  type MessageKey,
} from '@/lib/i18n'
import { getSettings, onSettingsChanged } from '@/lib/settings'

/** Applies the ui_language setting before the first render and follows later changes from any extension page. */
export async function startUiLanguage(titleKey: MessageKey) {
  const apply = async () => {
    setUiLanguage((await getSettings()).ui_language)
    applyDocumentLanguage(titleKey)
  }
  onSettingsChanged((changedKeys) => {
    if (changedKeys.includes('ui_language')) apply().catch(console.error)
  })
  await apply()
}

/** Re-renders the calling component, and so its subtree, when the rendered language changes. */
export function useUiLanguage() {
  return useSyncExternalStore(subscribeUiLanguage, getUiLanguage)
}
