export interface PingMessage {
  action: 'PING'
}

export interface ManualSpacingMessage {
  action: 'MANUAL_SPACING'
}

// Messages sent to the content script through tabs.sendMessage
export type MessageToContentScript = PingMessage | ManualSpacingMessage

// The popup needs to know whether the content script is loaded and whether manual spacing worked
export interface ContentScriptResponse {
  success: boolean
}

// Where WXT emits entrypoints/content.ts
export const CONTENT_SCRIPT_FILE = '/content-scripts/content.js'
export const TEXT_AUTOSPACE_CSS_FILE = '/text-autospace.css'
