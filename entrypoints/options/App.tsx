import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Download, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Logo } from '@/components/logo'
import { RichMessage } from '@/components/rich-message'
import { SettingSwitch } from '@/components/setting-switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { useSettings } from '@/hooks/use-settings'
import { useUiLanguage } from '@/hooks/use-ui-language'
import {
  downloadModel,
  getModelAvailability,
  type AiModelAvailability,
} from '@/lib/ai-spacing/models'
import { t, type MessageKey, type UiLanguageSetting } from '@/lib/i18n'
import { updateSettings, type Settings } from '@/lib/settings'
import { playSound } from '@/lib/sounds'
import { isModelSupported, isTextAutospaceSupported } from '@/lib/support'
import {
  addToActiveList,
  editActiveList,
  removeFromActiveList,
  restoreActiveListDefaults,
} from '@/lib/url-list'
import { cn } from '@/lib/utils'

const MATCH_PATTERNS_URL =
  'https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns'
const TEXT_AUTOSPACE_URL =
  'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-autospace'
const PROMPT_API_URL = 'https://developer.chrome.com/docs/ai/prompt-api'

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:px-1">
        {title}
      </h2>
      {children}
    </section>
  )
}

// Phones get iOS Settings-style grouped rows: panels run edge to edge, so the panel's own padding is the only inset. Wider screens keep floating cards
function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 border-y bg-card p-4 text-card-foreground sm:rounded-xl sm:border sm:p-5 sm:shadow-xs">
      {children}
    </div>
  )
}

const OUTCOME_MESSAGES: Partial<Record<string, MessageKey>> = {
  invalid: 'error_invalid_match_pattern',
  duplicate: 'already_in_list',
}

/** Edits the list the current filter mode picks. One editor is open at a time. */
function UrlList({ settings }: { settings: Settings }) {
  const urls = settings[settings.filter_mode]
  // `index` is the row being edited, or 'new' for the add row
  const [editing, setEditing] = useState<{
    index: number | 'new'
    value: string
    error?: MessageKey
  }>()
  const inputRef = useRef<HTMLInputElement>(null)

  // Switching lists closes the editor, since its index points into the other list
  useEffect(() => setEditing(undefined), [settings.filter_mode])

  useEffect(() => {
    if (editing && !editing.error) {
      inputRef.current?.focus()
      if (editing.index !== 'new') inputRef.current?.select()
    }
  }, [editing?.index])

  const save = async () => {
    if (!editing) return
    const value = editing.value.trim()
    try {
      const outcome = !value
        ? 'invalid'
        : editing.index === 'new'
          ? await addToActiveList(value)
          : await editActiveList(editing.index, value)
      const error = OUTCOME_MESSAGES[outcome]
      if (error) {
        setEditing({ ...editing, error })
      } else {
        setEditing(undefined)
      }
    } catch (error) {
      console.error('Failed to save URL:', error)
    }
  }

  const editor = (
    <li className="space-y-1.5 px-3 py-2 max-sm:px-4">
      {/* On phones the input takes its own line, so the URL is not squeezed beside the buttons */}
      <div className="flex flex-wrap gap-2">
        <Input
          ref={inputRef}
          value={editing?.value ?? ''}
          placeholder={t('placeholder_enter_url')}
          aria-invalid={!!editing?.error}
          className="flex-1 font-mono text-[13px] max-sm:basis-full pointer-coarse:h-11 pointer-coarse:text-base"
          onChange={(e) =>
            setEditing((current) =>
              current && { index: current.index, value: e.target.value },
            )
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') void save()
            if (e.key === 'Escape') setEditing(undefined)
          }}
        />
        <Button className="pointer-coarse:h-11 max-sm:flex-1" onClick={() => void save()}>
          {t('button_save')}
        </Button>
        <Button
          variant="ghost"
          className="pointer-coarse:h-11 max-sm:flex-1"
          onClick={() => setEditing(undefined)}
        >
          {t('button_cancel')}
        </Button>
      </div>
      {editing?.error && (
        <p role="alert" className="text-[13px] text-destructive-foreground">
          {t(editing.error)}
        </p>
      )}
    </li>
  )

  return (
    <div className="space-y-3">
      {/* One list split by hairlines rather than a card per row. On phones it also bleeds to the panel edges, so patterns start at the same inset as everything else */}
      <ul
        className="divide-y overflow-hidden rounded-lg border max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0"
        data-testid="url-list"
      >
        {urls.length === 0 && editing?.index !== 'new' && (
          <li className="px-4 py-6 text-center text-[13px] text-muted-foreground">
            {t('empty_list')}
          </li>
        )}
        {urls.map((url, index) =>
          editing?.index === index ? (
            <Fragment key={url}>{editor}</Fragment>
          ) : (
            <li
              key={url}
              className="group flex items-center gap-1 pr-1 transition-colors hover:bg-accent/50 max-sm:pr-2"
            >
              <button
                type="button"
                // Phones wrap long patterns instead of cutting them off, since there is no hover to reveal the rest
                className="min-w-0 flex-1 truncate px-3 py-2 text-left font-mono text-[13px] max-sm:px-4 max-sm:break-all max-sm:whitespace-normal pointer-coarse:py-2.5"
                title={t('button_edit')}
                onClick={() => setEditing({ index, value: url })}
              >
                {url}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground pointer-coarse:size-10"
                aria-label={`${t('button_edit')} ${url}`}
                onClick={() => setEditing({ index, value: url })}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive-foreground pointer-coarse:size-10"
                aria-label={`${t('button_remove')} ${url}`}
                onClick={() =>
                  void removeFromActiveList(index).catch((error) =>
                    console.error('Failed to remove URL:', error),
                  )
                }
              >
                <Trash2 />
              </Button>
            </li>
          ),
        )}
        {editing?.index === 'new' && editor}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        {editing?.index !== 'new' && (
          <Button
            variant="outline"
            size="sm"
            className="pointer-coarse:h-10"
            onClick={() => setEditing({ index: 'new', value: '' })}
          >
            <Plus />
            {t('button_add_new_url')}
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="pointer-coarse:h-10">
              <RotateCcw />
              {t('button_restore_defaults')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent aria-describedby={undefined}>
            <AlertDialogTitle>{t('confirm_restore_defaults')}</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('button_cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  void restoreActiveListDefaults().catch((error) =>
                    console.error('Failed to restore defaults:', error),
                  )
                }
              >
                {t('button_restore_defaults')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <a
        href={MATCH_PATTERNS_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-block text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {t('link_learn_match_patterns')}
      </a>
    </div>
  )
}

// The quote fills a whole phone screen, so phones show three lines until it is tapped. Wider screens always show it all
function Quote() {
  const [expanded, setExpanded] = useState(false)
  return (
    <blockquote
      className={cn(
        'border-l-2 pl-4 text-[13px] leading-relaxed text-muted-foreground',
        !expanded && 'max-sm:line-clamp-3 max-sm:cursor-pointer',
      )}
      onClick={() => setExpanded(true)}
    >
      {t('quote')}
    </blockquote>
  )
}

/** The model is browser-wide and independent of the toggle: the setting can be on while the model is absent. */
function AiModelStatus() {
  const [availability, setAvailability] = useState<AiModelAvailability>()
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let timer: number | undefined
    let cancelled = false
    const poll = async () => {
      const next = await getModelAvailability()
      if (cancelled) return
      setAvailability(next)
      // A download the browser started itself ends without an event, so poll until the state moves
      if (next === 'downloading') {
        timer = window.setTimeout(() => void poll(), 5000)
      }
    }
    void poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [downloading])

  if (!availability) return null

  const onDownload = async () => {
    setDownloading(true)
    // downloadModel() resolves only after the whole download, so show the state now
    setAvailability('downloading')
    try {
      await downloadModel()
    } catch (error) {
      console.error('Failed to download the model:', error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/60 px-3 py-2">
      <span className="text-[13px] text-muted-foreground" data-testid="ai-model-status">
        {t(`ai_model_${availability}`)}
      </span>
      {/* Only an absent model can be fetched, and a multi-gigabyte download is the user's call */}
      {availability === 'downloadable' && (
        <Button
          size="sm"
          variant="outline"
          disabled={downloading}
          onClick={() => void onDownload()}
        >
          <Download />
          {t('button_download_ai_model')}
        </Button>
      )}
    </div>
  )
}

// Each language is named in itself, so a reader can find their own language whatever the page is showing
const UI_LANGUAGE_OPTIONS: { value: Exclude<UiLanguageSetting, 'auto'>; label: string; lang: string }[] = [
  { value: 'en', label: 'English', lang: 'en' },
  { value: 'zh_CN', label: '简体中文', lang: 'zh-CN' },
  { value: 'zh_TW', label: '繁體中文', lang: 'zh-TW' },
]

function UiLanguageSelect({
  value,
  disabled,
  onChange,
}: {
  value: UiLanguageSetting
  disabled: boolean
  onChange: (value: UiLanguageSetting) => void
}) {
  return (
    // The description spans the full width below the label row: beside the select it was squeezed into a narrow column on phones
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor="ui-language"
          className="text-sm leading-5 font-medium pointer-coarse:text-base"
        >
          {t('label_ui_language')}
        </label>
        {/* Native select for the platform picker on phones, drawn like shadcn's: the browser arrow sits flush against the edge, so it is hidden and replaced by an inset chevron */}
        <div className="relative shrink-0">
          <select
            id="ui-language"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value as UiLanguageSetting)}
            className="h-9 w-full appearance-none rounded-md border border-input bg-transparent py-1 pr-9 pl-3 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50 pointer-coarse:h-11 pointer-coarse:text-base"
          >
            <option value="auto">{t('ui_language_auto')}</option>
            {UI_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} lang={option.lang}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {t('ui_language_description')}
      </p>
    </div>
  )
}

export function App() {
  useUiLanguage()
  const { settings, reload } = useSettings()
  const [aiSupported, setAiSupported] = useState(false)
  const textAutospaceSupported = isTextAutospaceSupported()

  useEffect(() => {
    void isModelSupported().then(setAiSupported)
  }, [])

  const save = async (partial: Partial<Settings>) => {
    try {
      await updateSettings(partial)
      return true
    } catch (error) {
      console.error('Failed to save settings:', error)
      reload()
      return false
    }
  }

  const onSpacingMode = async (mode: Settings['spacing_mode']) => {
    if (await save({ spacing_mode: mode })) {
      await playSound(mode === 'spacing_when_load' ? 'Shouryuuken' : 'Hadouken')
    }
  }

  const onFilterMode = async (mode: Settings['filter_mode']) => {
    if (await save({ filter_mode: mode })) {
      await playSound(mode === 'blacklist' ? 'Shouryuuken' : 'Hadouken')
    }
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* No side padding on phones: panels run edge to edge, and the text outside them insets itself by the same 16px as panel content */}
      <main className="mx-auto max-w-2xl space-y-6 py-6 sm:space-y-8 sm:px-6 sm:py-10">
        <header className="space-y-4 px-4 sm:space-y-5 sm:px-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm sm:size-14">
              <Logo className="size-8 sm:size-10" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg leading-snug font-semibold tracking-tight sm:text-xl">
                {t('extension_title')}
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground sm:text-sm">
                {t('options_subtitle')}
              </p>
            </div>
          </div>
          <Quote />
        </header>

        <Section title={t('label_settings')}>
          <Panel>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('label_spacing_mode')}</h3>
              <Segmented
                aria-label={t('label_spacing_mode')}
                value={settings?.spacing_mode}
                onValueChange={(mode) => void onSpacingMode(mode)}
                // The two labels are full sentences, which wrap into three lines side by side on a phone
                className="max-sm:grid-flow-row"
                options={[
                  { value: 'spacing_when_load', label: t('spacing_when_load') },
                  { value: 'spacing_when_click', label: t('spacing_when_click') },
                ]}
              />
              {settings?.spacing_mode === 'spacing_when_click' && (
                <p className="text-[13px] text-muted-foreground">
                  {t('spacing_when_click_msg')}
                </p>
              )}
            </div>
          </Panel>

          {settings?.spacing_mode === 'spacing_when_load' && (
            <Panel>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t('label_filter_mode')}</h3>
                <Segmented
                  aria-label={t('label_filter_mode')}
                  value={settings.filter_mode}
                  onValueChange={(mode) => void onFilterMode(mode)}
                  options={[
                    { value: 'blacklist', label: t('label_blacklist') },
                    { value: 'whitelist', label: t('label_whitelist') },
                  ]}
                />
                <p className="text-[13px] text-muted-foreground">
                  {t(settings.filter_mode)}
                </p>
              </div>
              <UrlList settings={settings} />
            </Panel>
          )}
        </Section>

        <Section title={t('label_other_settings')}>
          <Panel>
            <UiLanguageSelect
              value={settings?.ui_language ?? 'auto'}
              disabled={!settings}
              onChange={(language) => void save({ ui_language: language })}
            />
          </Panel>
          <Panel>
            <SettingSwitch
              label={t('label_is_sound_effects_muted')}
              checked={settings?.is_sound_effects_muted ?? false}
              disabled={!settings}
              onCheckedChange={(checked) =>
                void save({ is_sound_effects_muted: checked })
              }
            />
          </Panel>
        </Section>

        <Section title={t('label_hidden_settings')}>
          <Panel>
            <SettingSwitch
              label={t('label_is_text_autospace_enabled')}
              checked={textAutospaceSupported && !!settings?.is_text_autospace_enabled}
              disabled={!settings || !textAutospaceSupported}
              onCheckedChange={(checked) =>
                void save({ is_text_autospace_enabled: checked })
              }
              description={
                <>
                  <p>
                    <RichMessage
                      id="text_autospace_description"
                      href={TEXT_AUTOSPACE_URL}
                    />
                  </p>
                  <p>{t('text_autospace_limitations')}</p>
                  {!textAutospaceSupported && (
                    <p className="text-destructive-foreground">
                      {t('text_autospace_not_supported')}
                    </p>
                  )}
                </>
              }
            />
          </Panel>
          <Panel>
            <SettingSwitch
              label={t('label_is_ai_spacing_enabled')}
              checked={aiSupported && !!settings?.is_ai_spacing_enabled}
              disabled={!settings || !aiSupported}
              onCheckedChange={(checked) =>
                void save({ is_ai_spacing_enabled: checked })
              }
              description={
                <>
                  <p>
                    <RichMessage id="ai_spacing_description" />
                  </p>
                  <p>
                    <RichMessage
                      id="ai_spacing_description_2"
                      href={PROMPT_API_URL}
                    />
                  </p>
                </>
              }
            />
            <AiModelStatus />
          </Panel>
          <p className="px-4 text-[13px] text-muted-foreground sm:px-1">
            {t('settings_refresh_required')}
          </p>
        </Section>

        <footer className="mx-4 border-t pt-6 text-center text-[13px] text-muted-foreground sm:mx-0">
          <p>
            <RichMessage id="credits" href="https://github.com/vinta/pangu.js" />
          </p>
        </footer>
      </main>
    </div>
  )
}
