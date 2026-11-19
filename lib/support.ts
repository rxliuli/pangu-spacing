import { isModelSupported } from './ai-spacing/models'

// Display-only off when unsupported: never write back, the synced setting still applies on other devices
export function isTextAutospaceSupported() {
  return CSS.supports('text-autospace', 'normal')
}

export { isModelSupported }
