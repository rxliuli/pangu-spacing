import { DEFAULT_SETTINGS, getSettings, listPatch, updateSettings } from './settings'
import { isValidMatchPattern } from './urls'

// Edits to the list the current filter mode picks. Each reads fresh settings, so it never overwrites a change made elsewhere

export async function addToActiveList(pattern: string) {
  if (!isValidMatchPattern(pattern)) {
    return 'invalid' as const
  }
  const settings = await getSettings()
  const key = settings.filter_mode
  if (settings[key].includes(pattern)) {
    return 'duplicate' as const
  }
  await updateSettings(listPatch(key, [...settings[key], pattern]))
  return 'added' as const
}

export async function editActiveList(index: number, pattern: string) {
  if (!isValidMatchPattern(pattern)) {
    return 'invalid' as const
  }
  const settings = await getSettings()
  const key = settings.filter_mode
  if (index < 0 || index >= settings[key].length) {
    return 'invalid' as const
  }
  if (settings[key][index] === pattern) {
    return 'unchanged' as const
  }
  if (settings[key].includes(pattern)) {
    return 'duplicate' as const
  }
  const urls = [...settings[key]]
  urls[index] = pattern
  await updateSettings(listPatch(key, urls))
  return 'saved' as const
}

export async function removeFromActiveList(index: number) {
  const settings = await getSettings()
  const key = settings.filter_mode
  if (index < 0 || index >= settings[key].length) {
    return
  }
  const urls = [...settings[key]]
  urls.splice(index, 1)
  await updateSettings(listPatch(key, urls))
}

export async function restoreActiveListDefaults() {
  const settings = await getSettings()
  const key = settings.filter_mode
  await updateSettings(listPatch(key, [...DEFAULT_SETTINGS[key]]))
}

// The popup's button adds the whole site of an http(s) tab to the blacklist
export async function addSiteToBlacklist(tabUrl: string) {
  const url = new URL(tabUrl)
  const pattern = `${url.protocol}//${url.hostname}/*`
  const settings = await getSettings()
  if (settings.blacklist.includes(pattern)) {
    return 'duplicate' as const
  }
  await updateSettings({ blacklist: [...settings.blacklist, pattern] })
  return 'added' as const
}
