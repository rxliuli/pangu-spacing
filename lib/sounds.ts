import type { PublicPath } from 'wxt/browser'
import { getSettings } from './settings'

export type SoundName = 'Hadouken' | 'Shouryuuken' | 'YeahBaby' | 'WahWahWaaah'

const SOUND_FILES: Record<SoundName, PublicPath> = {
  Hadouken: '/sounds/StreetFighter-Hadouken.mp3',
  Shouryuuken: '/sounds/StreetFighter-Shouryuuken.mp3',
  YeahBaby: '/sounds/AustinPowers-YeahBaby.mp3',
  WahWahWaaah: '/sounds/ManciniPinkPanther-WahWahWaaah.mp3',
}

let currentAudio: HTMLAudioElement | null = null

export async function playSound(soundName: SoundName) {
  const settings = await getSettings()
  if (settings.is_sound_effects_muted) {
    return
  }
  stopSound()
  const audio = new Audio(browser.runtime.getURL(SOUND_FILES[soundName]))
  currentAudio = audio
  audio.addEventListener('ended', () => {
    currentAudio = null
  })
  audio.play().catch((error) => console.warn('Failed to play sound:', error))
}

export function stopSound() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
}
