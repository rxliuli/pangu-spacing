import { describe, expect, it } from 'vitest'
import {
  SUPPORTED_APPLE_LOCALES,
  mapWebExtLocaleToApple,
  parseXcproj,
  patchSetupPageCssForRtl,
  patchViewControllerSwift,
  patchXcprojLocalizations,
  renderSetupPageHtml,
  renderSetupPageScript,
  resolveGuideLocale,
} from '@/lib/build/safari-i18n'

describe('safari host app i18n', () => {
  it('maps WebExtension locales to Apple .lproj identifiers', () => {
    expect(mapWebExtLocaleToApple('en')).toBe('en')
    expect(mapWebExtLocaleToApple('en_GB')).toBe('en')
    expect(mapWebExtLocaleToApple('zh_CN')).toBe('zh-Hans')
    expect(mapWebExtLocaleToApple('zh_TW')).toBe('zh-Hant')
    expect(mapWebExtLocaleToApple('zh_HK')).toBe('zh-Hant')
    expect(mapWebExtLocaleToApple('ja')).toBe('ja')
    expect(mapWebExtLocaleToApple('ko')).toBe('ko')
    expect(mapWebExtLocaleToApple('es')).toBe('es')
    expect(mapWebExtLocaleToApple('es_419')).toBe('es-419')
    expect(mapWebExtLocaleToApple('pt_BR')).toBe('pt-BR')
    expect(mapWebExtLocaleToApple('pt_PT')).toBe('pt-PT')
    expect(mapWebExtLocaleToApple('no')).toBe('nb')
    expect(mapWebExtLocaleToApple('iw')).toBe('he')
    expect(mapWebExtLocaleToApple('ar')).toBe('ar')
    expect(mapWebExtLocaleToApple('unknown')).toBeUndefined()
  })

  it('resolves Apple Locale.preferredLanguages lists to the best built-in guide locale', () => {
    expect(resolveGuideLocale(['zh-Hans-US', 'en-US'])).toBe('zh-Hans')
    expect(resolveGuideLocale(['zh-Hant-HK', 'en-US'])).toBe('zh-Hant')
    expect(resolveGuideLocale(['zh-TW'])).toBe('zh-Hant')
    expect(resolveGuideLocale(['zh-SG'])).toBe('zh-Hans')
    expect(resolveGuideLocale(['ja-JP', 'zh-Hans-CN'])).toBe('ja')
    expect(resolveGuideLocale(['es-ES'])).toBe('es')
    expect(resolveGuideLocale(['es-MX'])).toBe('es-419')
    expect(resolveGuideLocale(['es-US'])).toBe('es-419')
    expect(resolveGuideLocale(['es-419'])).toBe('es-419')
    expect(resolveGuideLocale(['pt-PT', 'en-US'])).toBe('pt-PT')
    expect(resolveGuideLocale(['pt-BR', 'en-US'])).toBe('pt-BR')
    expect(resolveGuideLocale(['pt'])).toBe('pt-BR')
    expect(resolveGuideLocale(['no-NO'])).toBe('nb')
    expect(resolveGuideLocale(['nn-NO'])).toBe('nb')
    expect(resolveGuideLocale(['he-IL'])).toBe('he')
    expect(resolveGuideLocale(['iw-IL'])).toBe('he')
    expect(resolveGuideLocale(['ar-SA'])).toBe('ar')
    expect(resolveGuideLocale(['is-IS', 'sv-SE'])).toBe('sv')
    expect(resolveGuideLocale(['is-IS'])).toBe('en')
  })

  it('renders valid localized Main.html for all 36 built-in Apple locales', () => {
    expect(SUPPORTED_APPLE_LOCALES).toHaveLength(36)

    for (const locale of SUPPORTED_APPLE_LOCALES) {
      const html = renderSetupPageHtml('Pangu Spacing', locale)
      expect(html, locale).toContain(`lang="${locale}"`)
      expect(html, locale).toContain('<h1>Pangu Spacing</h1>')
      expect(html, locale).toContain('class="settings-path" data-settings="')
      expect(html, locale).toContain('class="open-preferences" data-settings="')
      expect(html, locale).toContain('data-slot="mac-step-1"')
      expect(html, locale).toContain('data-slot="ios-step-4"')
      expect(html, locale).toContain('class="hint"')
      expect(html, locale).not.toContain('{name}')
      expect(html, locale).not.toContain('<b>')
    }
  })

  it('uses Apple official UI terms and RTL direction where required', () => {
    const zhHans = renderSetupPageHtml('Pangu Spacing', 'zh-Hans')
    expect(zhHans).toContain('data-settings="Safari 浏览器 → 设置 → 扩展"')
    expect(zhHans).toContain('App → Safari 浏览器 → 扩展')

    const es419 = renderSetupPageHtml('Pangu Spacing', 'es-419')
    expect(es419).toContain('data-settings="Safari → Configuración → Extensiones"')
    expect(es419).toContain('<strong>Configuración</strong>')

    const he = renderSetupPageHtml('Pangu Spacing', 'he')
    expect(he).toContain('<html lang="he" dir="rtl">')
    expect(he).toContain('יישומים ← Safari ← הרחבות')

    const hi = renderSetupPageHtml('Pangu Spacing', 'hi')
    expect(hi).toContain('ऐप्स → Safari → एक्सटेंशन')

    const fi = renderSetupPageHtml('Pangu Spacing', 'fi')
    expect(fi).toContain('Apit → Safari → Laajennukset')

    const ar = renderSetupPageHtml('Pangu Spacing', 'ar')
    expect(ar).toContain('<html lang="ar" dir="rtl">')
    expect(ar).toContain('التطبيقات ← سفاري ← الملحقات')

    const escaped = renderSetupPageHtml('A & <B>', 'en')
    expect(escaped).toContain('<h1>A &amp; &lt;B&gt;</h1>')
    expect(escaped).toContain('<strong>A &amp; &lt;B&gt;</strong>')
  })

  it('rewrites physical left rules in Style.css to logical properties for RTL', () => {
    const css = '.steps { text-align: left; } .steps ol { padding-left: 1.6em; }'
    expect(patchSetupPageCssForRtl(css)).toBe(
      '.steps { text-align: start; } .steps ol { padding-inline-start: 1.6em; }',
    )
  })

  it('injects WKUserScript for Locale.preferredLanguages into ViewController.swift idempotently', () => {
    const original = [
      '        self.webView.configuration.userContentController.add(self, name: "controller")',
      '        self.webView.loadFileURL(url, allowingReadAccessTo: root)',
    ].join('\n')

    const patched = patchViewControllerSwift(original)
    expect(patched).toContain('window.__PREFERRED_LANGUAGES__')
    expect(patched).toContain('Locale.preferredLanguages')
    expect(patched).toContain('injectionTime: .atDocumentStart')
    expect(patchViewControllerSwift(patched)).toBe(patched)
  })

  it('embeds all 36 built-in guide locales in Script.js without innerHTML', () => {
    const script = renderSetupPageScript()
    expect(script).toContain('window.__PREFERRED_LANGUAGES__')
    expect(script).toContain('applyGuideLocale')
    expect(script).toContain('dataset.settings')
    expect(script).not.toContain('innerHTML')
    for (const locale of SUPPORTED_APPLE_LOCALES) {
      expect(script, locale).toContain(`"${locale}":`)
    }
  })

  it('registers supported localizations and Main.html variants in project.xcproj', () => {
    const project = parseXcproj(`{
      "localizations": { "development": "en", "supported": ["Base",], },
      "files": [
        {
          "kind": "group",
          "path": "Shared (App)",
          "children": [
            {
              "kind": "variant-group",
              "name": "Main.html",
              "children": [{ "path": "Base.lproj/Main.html" }]
            }
          ]
        }
      ],
    }`)

    patchXcprojLocalizations(project, ['en', 'zh-Hans', 'zh-Hant'])
    expect(project.localizations).toEqual({
      development: 'en',
      supported: ['Base', 'en', 'zh-Hans', 'zh-Hant'],
    })
    const mainHtml = project.files?.[0]?.children?.[0]
    expect(mainHtml?.children).toEqual([
      { path: 'Base.lproj/Main.html' },
      { path: 'en.lproj/Main.html' },
      { path: 'zh-Hans.lproj/Main.html' },
      { path: 'zh-Hant.lproj/Main.html' },
    ])
  })
})
