import { useCallback, useEffect, useState } from 'react'
import { getSettings, onSettingsChanged, type Settings } from '@/lib/settings'

/**
 * The synced settings, re-read on every change. Writes go through
 * updateSettings() and come back here as the storage echo, so the UI shows
 * only confirmed values. `reload` repaints after a failed write.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>()
  const reload = useCallback(() => {
    getSettings().then(setSettings).catch(console.error)
  }, [])
  useEffect(() => {
    // Subscribe before the first read, so a change landing mid-read still repaints
    const unsubscribe = onSettingsChanged(reload)
    reload()
    return unsubscribe
  }, [reload])
  return { settings, reload }
}
