# Pangu Spacing

Automatically inserts whitespace between CJK characters and half-width letters, digits and symbols on web pages. A cross-browser port of the [pangu.js](https://github.com/vinta/pangu.js) Chrome extension, built with WXT, React and shadcn/ui, for Chrome, Edge, Firefox (desktop and Android) and Safari (macOS and iOS).

It keeps the original extension's features and settings keys:

- Spacing on page load, or only when summoned from the popup
- Blocklist or allowlist of URL match patterns, applied again on same-document navigation
- Zen spacing: the browser's native CSS `text-autospace`, where supported
- God of Spacing AI: Chrome's built-in Prompt API settles ambiguous `+` and `-`. It turns itself off in browsers without the API
- Sound effects, and an off icon on tabs where spacing is off

The UI is translated into English, Simplified Chinese and Traditional Chinese (`public/_locales`).

## Development

```sh
pnpm i
pnpm dev          # Chrome, output in .output/chrome-mv3-dev
pnpm compile      # type check
pnpm test:unit
pnpm test:e2e     # needs Playwright's Chromium: pnpm exec playwright install chromium
```

```
entrypoints/
  background.ts   registers content scripts, tab icons, AI classification
  content.ts      spaces the page with pangu/browser
  popup/          toolbar popup
  options/        settings page
lib/
  settings.ts     synced settings, same keys as the pangu.js extension
  urls.ts         match patterns and the url policy
  url-list.ts     edits to the blocklist and allowlist
  i18n.ts         message lookup and <a>/<code> markup in messages
  ai-spacing/     ambiguous-symbol classification (from pangu.js)
public/
  _locales/       en, zh_CN, zh_TW
  text-autospace.css
```

The end-to-end tests check the Chinese locales only on Linux, since macOS Chromium ignores `--lang`.

## Build

```sh
pnpm zip && pnpm zip:firefox
pnpm build:safari   # macOS with Xcode
```

## License

GPL-3.0, see `LICENSE`. Code and assets from pangu.js are MIT licensed, see `THIRD_PARTY_NOTICES`.
