import { defineConfig, type UserManifest } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@extport/wxt'],
  extport: {
    extension: 'ext_z5VBuVCJAlTLke5sn82j',
    analytics: true,
    safari: {
      appCategory: 'public.app-category.productivity',
      bundleIdentifier: 'com.rxliuli.pangu-spacing',
      developmentTeam: 'N2X78TUUFG',
      issuerId: '48f39427-c063-4e33-98d2-31de80aad0be',
      keyId: '8N27UWG9RG',
      openProject: true,
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      tsconfigPaths: true,
    },
  }),
  manifestVersion: 3,
  manifest: (env) => {
    const manifest: UserManifest = {
      name: '__MSG_extension_name__',
      description: '__MSG_extension_description__',
      default_locale: 'en',
      // Spacing runs on every page as it loads, so the content script is registered for all http(s) sites. That needs host
      // permissions, unlike the template's activeTab default
      permissions: ['scripting', 'storage'],
      host_permissions: ['http://*/*', 'https://*/*'],
      author: {
        email: 'rxliuli@gmail.com',
      },
      icons: {
        '16': 'icons/icon-16.png',
        '32': 'icons/icon-32.png',
        '48': 'icons/icon-48.png',
        '128': 'icons/icon-128.png',
        '512': 'icons/icon-512.png',
      },
      action: {
        // Keep in sync with DEFAULT_ICON_PATHS in entrypoints/background.ts
        default_icon: {
          '16': 'icons/icon-16.png',
          '24': 'icons/icon-24.png',
          '32': 'icons/icon-32.png',
        },
        default_title: '__MSG_extension_name__',
      },
      homepage_url: 'https://github.com/rxliuli/pangu-spacing',
    }
    if (env.browser === 'firefox') {
      manifest.browser_specific_settings = {
        gecko: {
          id: 'pangu-spacing@rxliuli.com',
          data_collection_permissions: {
            required: ['none'],
          },
        },
        // Empty = compatible with Firefox for Android at AMO's default
        // minimum — compatibility is a property of the build, not a
        // submission-time checkbox.
        gecko_android: {},
      }
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/author
      // @ts-expect-error
      manifest.author = 'rxliuli'
    }
    if (env.browser === 'safari') {
      // The name becomes the generated app's name and bundle paths. Keep it
      // plain (no dashes or subtitles, no __MSG__ lookup): under a long name
      // Safari loaded none of the extension's resources.
      manifest.name = 'Pangu Spacing'
      // Safari templates monochrome toolbar icons by alpha channel, so an opaque rounded-rect icon would render as a solid block; keep transparent silhouettes for Safari's action.
      manifest.action = {
        ...manifest.action,
        default_icon: {
          '16': 'icons/toolbar-icon-16.png',
          '24': 'icons/toolbar-icon-24.png',
          '32': 'icons/toolbar-icon-32.png',
        },
      }
    }
    return manifest
  },
  webExt: {
    disabled: true,
  },
})
