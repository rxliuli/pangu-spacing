import fs from 'node:fs/promises'
import path from 'node:path'

// Full parity with Apple's macOS & iOS Safari localization set (35 languages + es-419)
export const SUPPORTED_APPLE_LOCALES = [
  'en',
  'zh-Hans',
  'zh-Hant',
  'ja',
  'ko',
  'de',
  'fr',
  'es',
  'es-419',
  'pt-BR',
  'pt-PT',
  'it',
  'ru',
  'nl',
  'tr',
  'pl',
  'uk',
  'vi',
  'th',
  'id',
  'ar',
  'he',
  'hi',
  'ms',
  'sv',
  'da',
  'nb',
  'fi',
  'cs',
  'hu',
  'el',
  'ro',
  'ca',
  'sk',
  'hr',
  'sl',
] as const

export type AppleLocale = (typeof SUPPORTED_APPLE_LOCALES)[number]

// Maps WebExtension _locales directory names (and common regional variants) to Apple .lproj identifiers
const WEBEXT_TO_APPLE_LOCALE: Record<string, AppleLocale> = {
  en: 'en',
  en_US: 'en',
  en_GB: 'en',
  en_AU: 'en',
  en_CA: 'en',
  zh_CN: 'zh-Hans',
  zh_Hans: 'zh-Hans',
  zh_SG: 'zh-Hans',
  zh_TW: 'zh-Hant',
  zh_Hant: 'zh-Hant',
  zh_HK: 'zh-Hant',
  ja: 'ja',
  ko: 'ko',
  de: 'de',
  fr: 'fr',
  fr_CA: 'fr',
  es: 'es',
  es_ES: 'es',
  es_419: 'es-419',
  es_MX: 'es-419',
  es_US: 'es-419',
  pt: 'pt-BR',
  pt_BR: 'pt-BR',
  pt_PT: 'pt-PT',
  it: 'it',
  ru: 'ru',
  nl: 'nl',
  tr: 'tr',
  pl: 'pl',
  uk: 'uk',
  vi: 'vi',
  th: 'th',
  id: 'id',
  ar: 'ar',
  he: 'he',
  iw: 'he',
  hi: 'hi',
  ms: 'ms',
  sv: 'sv',
  da: 'da',
  nb: 'nb',
  no: 'nb',
  nn: 'nb',
  fi: 'fi',
  cs: 'cs',
  hu: 'hu',
  el: 'el',
  ro: 'ro',
  ca: 'ca',
  sk: 'sk',
  hr: 'hr',
  sl: 'sl',
}

// Inline <b>...</b> markers render as <strong> without innerHTML; {name} is replaced with the extension name.
interface SetupGuideCopy {
  lang: AppleLocale
  dir?: 'rtl'
  iconAlt: string
  statusEnabled: string
  statusDisabled: string
  heading: string
  macStepOpenSafari: string
  macStepSettingsPathPrefix: string
  macStepSettingsPathSuffix: string
  macPreferencesPath: string
  macSettingsPath: string
  macStepEnable: string
  macStepAllow: string
  macOpenPreferences: string
  macOpenSettings: string
  iosStepOpenSettings: string
  iosStepNavigate: string
  iosStepEnable: string
  iosStepAllow: string
  iosHint: string
}

// System menu terms (Settings, Apps, Safari, Extensions, Permissions, Allow) follow Apple's official macOS & iOS localizations
const SETUP_GUIDE_COPY: Record<AppleLocale, SetupGuideCopy> = {
  en: {
    lang: 'en',
    iconAlt: '{name} icon',
    statusEnabled: 'Extension is enabled',
    statusDisabled: 'Extension is disabled',
    heading: 'How to enable in Safari',
    macStepOpenSafari: 'Open <b>Safari</b>',
    macStepSettingsPathPrefix: 'Go to ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Preferences → Extensions',
    macSettingsPath: 'Safari → Settings → Extensions',
    macStepEnable: 'Check the box next to <b>{name}</b>',
    macStepAllow: 'If prompted, click <b>Allow</b> to grant permissions',
    macOpenPreferences: 'Open Safari Preferences…',
    macOpenSettings: 'Open Safari Settings…',
    iosStepOpenSettings: 'Open the <b>Settings</b> app',
    iosStepNavigate: 'Tap <b>Apps → Safari → Extensions</b>',
    iosStepEnable: 'Tap <b>{name}</b> and turn it on',
    iosStepAllow: 'Under Permissions, set the listed websites to <b>Allow</b>',
    iosHint:
      'Then open Safari and tap the extensions button in the address bar to use {name}.',
  },
  'zh-Hans': {
    lang: 'zh-Hans',
    iconAlt: '{name} 图标',
    statusEnabled: '扩展已启用',
    statusDisabled: '扩展未启用',
    heading: '如何在 Safari 浏览器中启用',
    macStepOpenSafari: '打开 <b>Safari 浏览器</b>',
    macStepSettingsPathPrefix: '前往 ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari 浏览器 → 偏好设置 → 扩展',
    macSettingsPath: 'Safari 浏览器 → 设置 → 扩展',
    macStepEnable: '勾选 <b>{name}</b> 旁的复选框',
    macStepAllow: '如果系统提示权限请求，请点击<b>允许</b>',
    macOpenPreferences: '打开 Safari 浏览器偏好设置…',
    macOpenSettings: '打开 Safari 浏览器设置…',
    iosStepOpenSettings: '打开<b>设置</b> App',
    iosStepNavigate: '轻点 <b>App → Safari 浏览器 → 扩展</b>',
    iosStepEnable: '轻点 <b>{name}</b> 并开启开关',
    iosStepAllow: '在“权限”下，将所列网站设为<b>允许</b>',
    iosHint:
      '然后打开 Safari 浏览器，轻点地址栏中的扩展按钮即可使用 {name}。',
  },
  'zh-Hant': {
    lang: 'zh-Hant',
    iconAlt: '{name} 圖示',
    statusEnabled: '延伸功能已啟用',
    statusDisabled: '延伸功能未啟用',
    heading: '如何在 Safari 中啟用',
    macStepOpenSafari: '打開 <b>Safari</b>',
    macStepSettingsPathPrefix: '前往 ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → 偏好設定 → 延伸功能',
    macSettingsPath: 'Safari → 設定 → 延伸功能',
    macStepEnable: '勾選 <b>{name}</b> 旁的核取方塊',
    macStepAllow: '如果系統提示權限要求，請按一下<b>允許</b>',
    macOpenPreferences: '打開 Safari 偏好設定…',
    macOpenSettings: '打開 Safari 設定…',
    iosStepOpenSettings: '打開<b>設定</b> App',
    iosStepNavigate: '點一下 <b>App → Safari → 延伸功能</b>',
    iosStepEnable: '點一下 <b>{name}</b> 並開啟開關',
    iosStepAllow: '在「權限」下，將所列網站設為<b>允許</b>',
    iosHint:
      '接著打開 Safari，點一下網址列中的延伸功能按鈕即可使用 {name}。',
  },
  ja: {
    lang: 'ja',
    iconAlt: '{name} アイコン',
    statusEnabled: '機能拡張は有効です',
    statusDisabled: '機能拡張は無効です',
    heading: 'Safari で有効にする方法',
    macStepOpenSafari: '<b>Safari</b> を開く',
    macStepSettingsPathPrefix: '',
    macStepSettingsPathSuffix: ' に移動',
    macPreferencesPath: 'Safari → 環境設定 → 機能拡張',
    macSettingsPath: 'Safari → 設定 → 機能拡張',
    macStepEnable: '<b>{name}</b> の横のチェックボックスをオンにする',
    macStepAllow: '確認画面が表示されたら<b>許可</b>をクリックしてアクセス権を付与',
    macOpenPreferences: 'Safari の環境設定を開く…',
    macOpenSettings: 'Safari の設定を開く…',
    iosStepOpenSettings: '<b>設定</b> App を開く',
    iosStepNavigate: '<b>アプリ → Safari → 機能拡張</b> をタップ',
    iosStepEnable: '<b>{name}</b> をタップしてオンにする',
    iosStepAllow: '「アクセス権」で、表示されている Web サイトを<b>許可</b>に設定',
    iosHint:
      'その後 Safari を開き、アドレスバーの機能拡張ボタンをタップして {name} を使用します。',
  },
  ko: {
    lang: 'ko',
    iconAlt: '{name} 아이콘',
    statusEnabled: '확장 프로그램이 활성화됨',
    statusDisabled: '확장 프로그램이 비활성화됨',
    heading: 'Safari에서 활성화하는 방법',
    macStepOpenSafari: '<b>Safari</b> 열기',
    macStepSettingsPathPrefix: '',
    macStepSettingsPathSuffix: '으로 이동',
    macPreferencesPath: 'Safari → 환경설정 → 확장 프로그램',
    macSettingsPath: 'Safari → 설정 → 확장 프로그램',
    macStepEnable: '<b>{name}</b> 옆의 체크상자 선택',
    macStepAllow: '권한 요청 메시지가 표시되면 <b>허용</b> 클릭',
    macOpenPreferences: 'Safari 환경설정 열기…',
    macOpenSettings: 'Safari 설정 열기…',
    iosStepOpenSettings: '<b>설정</b> 앱 열기',
    iosStepNavigate: '<b>앱 → Safari → 확장 프로그램</b> 탭하기',
    iosStepEnable: '<b>{name}</b>을(를) 탭하고 켜기',
    iosStepAllow: '‘권한’에서 표시된 웹사이트를 <b>허용</b>으로 설정',
    iosHint:
      '그런 다음 Safari를 열고 주소 막대의 확장 프로그램 버튼을 탭하여 {name}을(를) 사용하세요.',
  },
  de: {
    lang: 'de',
    iconAlt: '{name}-Symbol',
    statusEnabled: 'Erweiterung ist aktiviert',
    statusDisabled: 'Erweiterung ist deaktiviert',
    heading: 'In Safari aktivieren',
    macStepOpenSafari: '<b>Safari</b> öffnen',
    macStepSettingsPathPrefix: 'Zu ',
    macStepSettingsPathSuffix: ' gehen',
    macPreferencesPath: 'Safari → Einstellungen → Erweiterungen',
    macSettingsPath: 'Safari → Einstellungen → Erweiterungen',
    macStepEnable: 'Das Markierungsfeld neben <b>{name}</b> aktivieren',
    macStepAllow: 'Falls gefragt, auf <b>Erlauben</b> klicken, um Zugriffsrechte zu erteilen',
    macOpenPreferences: 'Safari-Einstellungen öffnen…',
    macOpenSettings: 'Safari-Einstellungen öffnen…',
    iosStepOpenSettings: 'Die App <b>Einstellungen</b> öffnen',
    iosStepNavigate: 'Auf <b>Apps → Safari → Erweiterungen</b> tippen',
    iosStepEnable: 'Auf <b>{name}</b> tippen und aktivieren',
    iosStepAllow: 'Unter „Zugriffsrechte“ die aufgeführten Websites auf <b>Erlauben</b> stellen',
    iosHint:
      'Öffne anschließend Safari und tippe in der Adressleiste auf die Erweiterungen-Taste, um {name} zu verwenden.',
  },
  fr: {
    lang: 'fr',
    iconAlt: 'Icône {name}',
    statusEnabled: 'L’extension est activée',
    statusDisabled: 'L’extension est désactivée',
    heading: 'Comment l’activer dans Safari',
    macStepOpenSafari: 'Ouvrez <b>Safari</b>',
    macStepSettingsPathPrefix: 'Accédez à ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Préférences → Extensions',
    macSettingsPath: 'Safari → Réglages → Extensions',
    macStepEnable: 'Cochez la case à côté de <b>{name}</b>',
    macStepAllow: 'Si demandé, cliquez sur <b>Autoriser</b> pour accorder les autorisations',
    macOpenPreferences: 'Ouvrir les préférences de Safari…',
    macOpenSettings: 'Ouvrir les réglages de Safari…',
    iosStepOpenSettings: 'Ouvrez l’app <b>Réglages</b>',
    iosStepNavigate: 'Touchez <b>Apps → Safari → Extensions</b>',
    iosStepEnable: 'Touchez <b>{name}</b> et activez-la',
    iosStepAllow: 'Sous Autorisations, réglez les sites web listés sur <b>Autoriser</b>',
    iosHint:
      'Ouvrez ensuite Safari et touchez le bouton des extensions dans la barre d’adresse pour utiliser {name}.',
  },
  es: {
    lang: 'es',
    iconAlt: 'Icono de {name}',
    statusEnabled: 'La extensión está activada',
    statusDisabled: 'La extensión está desactivada',
    heading: 'Cómo activarla en Safari',
    macStepOpenSafari: 'Abre <b>Safari</b>',
    macStepSettingsPathPrefix: 'Ve a ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Preferencias → Extensiones',
    macSettingsPath: 'Safari → Ajustes → Extensiones',
    macStepEnable: 'Marca la casilla junto a <b>{name}</b>',
    macStepAllow: 'Si se solicita, haz clic en <b>Permitir</b> para conceder permisos',
    macOpenPreferences: 'Abrir Preferencias de Safari…',
    macOpenSettings: 'Abrir Ajustes de Safari…',
    iosStepOpenSettings: 'Abre la app <b>Ajustes</b>',
    iosStepNavigate: 'Toca <b>Apps → Safari → Extensiones</b>',
    iosStepEnable: 'Toca <b>{name}</b> y actívala',
    iosStepAllow: 'En Permisos, configura los sitios web mostrados en <b>Permitir</b>',
    iosHint:
      'Luego abre Safari y toca el botón de extensiones en la barra de direcciones para usar {name}.',
  },
  'es-419': {
    lang: 'es-419',
    iconAlt: 'Ícono de {name}',
    statusEnabled: 'La extensión está activada',
    statusDisabled: 'La extensión está desactivada',
    heading: 'Cómo activarla en Safari',
    macStepOpenSafari: 'Abre <b>Safari</b>',
    macStepSettingsPathPrefix: 'Ve a ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Preferencias → Extensiones',
    macSettingsPath: 'Safari → Configuración → Extensiones',
    macStepEnable: 'Marca la casilla junto a <b>{name}</b>',
    macStepAllow: 'Si se solicita, haz clic en <b>Permitir</b> para otorgar permisos',
    macOpenPreferences: 'Abrir Preferencias de Safari…',
    macOpenSettings: 'Abrir Configuración de Safari…',
    iosStepOpenSettings: 'Abre la app <b>Configuración</b>',
    iosStepNavigate: 'Toca <b>Apps → Safari → Extensiones</b>',
    iosStepEnable: 'Toca <b>{name}</b> y actívala',
    iosStepAllow: 'En Permisos, establece los sitios web mostrados en <b>Permitir</b>',
    iosHint:
      'Luego abre Safari y toca el botón de extensiones en la barra de direcciones para usar {name}.',
  },
  'pt-BR': {
    lang: 'pt-BR',
    iconAlt: 'Ícone de {name}',
    statusEnabled: 'A extensão está ativada',
    statusDisabled: 'A extensão está desativada',
    heading: 'Como ativar no Safari',
    macStepOpenSafari: 'Abra o <b>Safari</b>',
    macStepSettingsPathPrefix: 'Vá em ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Preferências → Extensões',
    macSettingsPath: 'Safari → Ajustes → Extensões',
    macStepEnable: 'Marque a caixa ao lado de <b>{name}</b>',
    macStepAllow: 'Se solicitado, clique em <b>Permitir</b> para conceder permissões',
    macOpenPreferences: 'Abrir Preferências do Safari…',
    macOpenSettings: 'Abrir Ajustes do Safari…',
    iosStepOpenSettings: 'Abra o app <b>Ajustes</b>',
    iosStepNavigate: 'Toque em <b>Apps → Safari → Extensões</b>',
    iosStepEnable: 'Toque em <b>{name}</b> e ative-a',
    iosStepAllow: 'Em Permissões, defina os sites listados como <b>Permitir</b>',
    iosHint:
      'Depois abra o Safari e toque no botão de extensões na barra de endereços para usar {name}.',
  },
  'pt-PT': {
    lang: 'pt-PT',
    iconAlt: 'Ícone de {name}',
    statusEnabled: 'A extensão está ativa',
    statusDisabled: 'A extensão está desativada',
    heading: 'Como ativar no Safari',
    macStepOpenSafari: 'Abra o <b>Safari</b>',
    macStepSettingsPathPrefix: 'Aceda a ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Preferências → Extensões',
    macSettingsPath: 'Safari → Definições → Extensões',
    macStepEnable: 'Assinale a caixa junto a <b>{name}</b>',
    macStepAllow: 'Se solicitado, clique em <b>Permitir</b> para conceder permissões',
    macOpenPreferences: 'Abrir Preferências do Safari…',
    macOpenSettings: 'Abrir Definições do Safari…',
    iosStepOpenSettings: 'Abra a aplicação <b>Definições</b>',
    iosStepNavigate: 'Toque em <b>Aplicações → Safari → Extensões</b>',
    iosStepEnable: 'Toque em <b>{name}</b> e ative-a',
    iosStepAllow: 'Em Permissões, defina os sites listados como <b>Permitir</b>',
    iosHint:
      'Em seguida, abra o Safari e toque no botão de extensões na barra de endereços para utilizar {name}.',
  },
  it: {
    lang: 'it',
    iconAlt: 'Icona di {name}',
    statusEnabled: 'L’estensione è attiva',
    statusDisabled: 'L’estensione è disattivata',
    heading: 'Come attivarla in Safari',
    macStepOpenSafari: 'Apri <b>Safari</b>',
    macStepSettingsPathPrefix: 'Vai in ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Preferenze → Estensioni',
    macSettingsPath: 'Safari → Impostazioni → Estensioni',
    macStepEnable: 'Seleziona la casella accanto a <b>{name}</b>',
    macStepAllow: 'Se richiesto, fai clic su <b>Consenti</b> per concedere i permessi',
    macOpenPreferences: 'Apri Preferenze di Safari…',
    macOpenSettings: 'Apri Impostazioni di Safari…',
    iosStepOpenSettings: 'Apri l’app <b>Impostazioni</b>',
    iosStepNavigate: 'Tocca <b>App → Safari → Estensioni</b>',
    iosStepEnable: 'Tocca <b>{name}</b> e attivala',
    iosStepAllow: 'In Permessi, imposta i siti web elencati su <b>Consenti</b>',
    iosHint:
      'Poi apri Safari e tocca il pulsante delle estensioni nella barra degli indirizzi per usare {name}.',
  },
  ru: {
    lang: 'ru',
    iconAlt: 'Значок {name}',
    statusEnabled: 'Расширение включено',
    statusDisabled: 'Расширение выключено',
    heading: 'Как включить в Safari',
    macStepOpenSafari: 'Откройте <b>Safari</b>',
    macStepSettingsPathPrefix: 'Перейдите в ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Настройки → Расширения',
    macSettingsPath: 'Safari → Настройки → Расширения',
    macStepEnable: 'Установите флажок рядом с <b>{name}</b>',
    macStepAllow: 'При запросе нажмите <b>Разрешить</b>, чтобы выдать права доступа',
    macOpenPreferences: 'Открыть настройки Safari…',
    macOpenSettings: 'Открыть настройки Safari…',
    iosStepOpenSettings: 'Откройте приложение <b>Настройки</b>',
    iosStepNavigate: 'Нажмите <b>Приложения → Safari → Расширения</b>',
    iosStepEnable: 'Нажмите <b>{name}</b> и включите его',
    iosStepAllow: 'В разделе «Права доступа» выберите <b>Разрешить</b> для указанных веб-сайтов',
    iosHint:
      'Затем откройте Safari и нажмите кнопку расширений в адресной строке, чтобы использовать {name}.',
  },
  nl: {
    lang: 'nl',
    iconAlt: '{name}-symbool',
    statusEnabled: 'Extensie is ingeschakeld',
    statusDisabled: 'Extensie is uitgeschakeld',
    heading: 'Inschakelen in Safari',
    macStepOpenSafari: 'Open <b>Safari</b>',
    macStepSettingsPathPrefix: 'Ga naar ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Voorkeuren → Extensies',
    macSettingsPath: 'Safari → Instellingen → Extensies',
    macStepEnable: 'Vink het vakje naast <b>{name}</b> aan',
    macStepAllow: 'Klik indien gevraagd op <b>Sta toe</b> om bevoegdheden te verlenen',
    macOpenPreferences: 'Open Safari-voorkeuren…',
    macOpenSettings: 'Open Safari-instellingen…',
    iosStepOpenSettings: 'Open de app <b>Instellingen</b>',
    iosStepNavigate: 'Tik op <b>Apps → Safari → Extensies</b>',
    iosStepEnable: 'Tik op <b>{name}</b> en schakel deze in',
    iosStepAllow: 'Stel onder Bevoegdheden de vermelde websites in op <b>Sta toe</b>',
    iosHint:
      'Open daarna Safari en tik op de extensiesknop in de adresbalk om {name} te gebruiken.',
  },
  tr: {
    lang: 'tr',
    iconAlt: '{name} simgesi',
    statusEnabled: 'Genişletme etkin',
    statusDisabled: 'Genişletme etkin değil',
    heading: 'Safari’de nasıl etkinleştirilir',
    macStepOpenSafari: '<b>Safari</b>’yi açın',
    macStepSettingsPathPrefix: '',
    macStepSettingsPathSuffix: ' bölümüne gidin',
    macPreferencesPath: 'Safari → Tercihler → Genişletmeler',
    macSettingsPath: 'Safari → Ayarlar → Genişletmeler',
    macStepEnable: '<b>{name}</b> yanındaki onay kutusunu işaretleyin',
    macStepAllow: 'İstenirse izinleri vermek için <b>İzin Ver</b>’i tıklayın',
    macOpenPreferences: 'Safari Tercihlerini Aç…',
    macOpenSettings: 'Safari Ayarlarını Aç…',
    iosStepOpenSettings: '<b>Ayarlar</b> uygulamasını açın',
    iosStepNavigate: '<b>Uygulamalar → Safari → Genişletmeler</b>’e dokunun',
    iosStepEnable: '<b>{name}</b> seçeneğine dokunup açın',
    iosStepAllow: 'İzinler altında listelenen web sitelerini <b>İzin Ver</b> olarak ayarlayın',
    iosHint:
      'Ardından Safari’yi açın ve {name} genişletmesini kullanmak için adres çubuğundaki genişletmeler düğmesine dokunun.',
  },
  pl: {
    lang: 'pl',
    iconAlt: 'Ikona {name}',
    statusEnabled: 'Rozszerzenie jest włączone',
    statusDisabled: 'Rozszerzenie jest wyłączone',
    heading: 'Jak włączyć w Safari',
    macStepOpenSafari: 'Otwórz <b>Safari</b>',
    macStepSettingsPathPrefix: 'Przejdź do ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Preferencje → Rozszerzenia',
    macSettingsPath: 'Safari → Ustawienia → Rozszerzenia',
    macStepEnable: 'Zaznacz pole wyboru obok <b>{name}</b>',
    macStepAllow: 'Jeśli pojawi się monit, kliknij <b>Pozwól</b>, aby przyznać uprawnienia',
    macOpenPreferences: 'Otwórz preferencje Safari…',
    macOpenSettings: 'Otwórz ustawienia Safari…',
    iosStepOpenSettings: 'Otwórz aplikację <b>Ustawienia</b>',
    iosStepNavigate: 'Stuknij <b>Aplikacje → Safari → Rozszerzenia</b>',
    iosStepEnable: 'Stuknij <b>{name}</b> i włącz je',
    iosStepAllow: 'W sekcji Uprawnienia ustaw wymienione witryny na <b>Pozwól</b>',
    iosHint:
      'Następnie otwórz Safari i stuknij przycisk rozszerzeń na pasku adresu, aby używać {name}.',
  },
  uk: {
    lang: 'uk',
    iconAlt: 'Іконка {name}',
    statusEnabled: 'Розширення ввімкнено',
    statusDisabled: 'Розширення вимкнено',
    heading: 'Як увімкнути в Safari',
    macStepOpenSafari: 'Відкрийте <b>Safari</b>',
    macStepSettingsPathPrefix: 'Перейдіть до ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Параметри → Розширення',
    macSettingsPath: 'Safari → Параметри → Розширення',
    macStepEnable: 'Поставте прапорець біля <b>{name}</b>',
    macStepAllow: 'За запитом натисніть <b>Дозволити</b>, щоб надати дозволи',
    macOpenPreferences: 'Відкрити параметри Safari…',
    macOpenSettings: 'Відкрити параметри Safari…',
    iosStepOpenSettings: 'Відкрийте програму <b>Параметри</b>',
    iosStepNavigate: 'Торкніть <b>Програми → Safari → Розширення</b>',
    iosStepEnable: 'Торкніть <b>{name}</b> і ввімкніть його',
    iosStepAllow: 'У розділі «Дозволи» виберіть <b>Дозволити</b> для вказаних вебсайтів',
    iosHint:
      'Потім відкрийте Safari й торкніть кнопку розширень в адресному рядку, щоб користуватися {name}.',
  },
  vi: {
    lang: 'vi',
    iconAlt: 'Biểu tượng {name}',
    statusEnabled: 'Phần mở rộng đã bật',
    statusDisabled: 'Phần mở rộng đã tắt',
    heading: 'Cách bật trong Safari',
    macStepOpenSafari: 'Mở <b>Safari</b>',
    macStepSettingsPathPrefix: 'Đi tới ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Tùy chọn → Phần mở rộng',
    macSettingsPath: 'Safari → Cài đặt → Phần mở rộng',
    macStepEnable: 'Đánh dấu vào hộp bên cạnh <b>{name}</b>',
    macStepAllow: 'Nếu được hỏi, hãy bấm <b>Cho phép</b> để cấp quyền',
    macOpenPreferences: 'Mở Tùy chọn Safari…',
    macOpenSettings: 'Mở Cài đặt Safari…',
    iosStepOpenSettings: 'Mở ứng dụng <b>Cài đặt</b>',
    iosStepNavigate: 'Chạm vào <b>Ứng dụng → Safari → Phần mở rộng</b>',
    iosStepEnable: 'Chạm vào <b>{name}</b> và bật lên',
    iosStepAllow: 'Trong mục Quyền, đặt các trang web được liệt kê thành <b>Cho phép</b>',
    iosHint:
      'Sau đó mở Safari và chạm vào nút phần mở rộng trên thanh địa chỉ để sử dụng {name}.',
  },
  th: {
    lang: 'th',
    iconAlt: 'ไอคอน {name}',
    statusEnabled: 'เปิดใช้งานส่วนขยายแล้ว',
    statusDisabled: 'ปิดใช้งานส่วนขยายอยู่',
    heading: 'วิธีเปิดใช้งานใน Safari',
    macStepOpenSafari: 'เปิด <b>Safari</b>',
    macStepSettingsPathPrefix: 'ไปที่ ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → การตั้งค่า → ส่วนขยาย',
    macSettingsPath: 'Safari → การตั้งค่า → ส่วนขยาย',
    macStepEnable: 'เลือกช่องทำเครื่องหมายข้าง <b>{name}</b>',
    macStepAllow: 'หากระบบแจ้งเตือน ให้คลิก<b>อนุญาต</b>เพื่อให้สิทธิ์',
    macOpenPreferences: 'เปิดการตั้งค่า Safari…',
    macOpenSettings: 'เปิดการตั้งค่า Safari…',
    iosStepOpenSettings: 'เปิดแอป<b>การตั้งค่า</b>',
    iosStepNavigate: 'แตะ <b>แอป → Safari → ส่วนขยาย</b>',
    iosStepEnable: 'แตะ <b>{name}</b> แล้วเปิดสวิตช์',
    iosStepAllow: 'ภายใต้ “สิทธิ์” ให้ตั้งค่าเว็บไซต์ที่แสดงเป็น<b>อนุญาต</b>',
    iosHint:
      'จากนั้นเปิด Safari แล้วแตะปุ่มส่วนขยายในแถบที่อยู่เพื่อใช้งาน {name}',
  },
  id: {
    lang: 'id',
    iconAlt: 'Ikon {name}',
    statusEnabled: 'Ekstensi diaktifkan',
    statusDisabled: 'Ekstensi dinonaktifkan',
    heading: 'Cara mengaktifkan di Safari',
    macStepOpenSafari: 'Buka <b>Safari</b>',
    macStepSettingsPathPrefix: 'Buka ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Preferensi → Ekstensi',
    macSettingsPath: 'Safari → Pengaturan → Ekstensi',
    macStepEnable: 'Centang kotak di samping <b>{name}</b>',
    macStepAllow: 'Jika diminta, klik <b>Izinkan</b> untuk memberikan izin',
    macOpenPreferences: 'Buka Preferensi Safari…',
    macOpenSettings: 'Buka Pengaturan Safari…',
    iosStepOpenSettings: 'Buka app <b>Pengaturan</b>',
    iosStepNavigate: 'Ketuk <b>App → Safari → Ekstensi</b>',
    iosStepEnable: 'Ketuk <b>{name}</b> lalu aktifkan',
    iosStepAllow: 'Di bawah Izin, atur situs web yang tercantum ke <b>Izinkan</b>',
    iosHint:
      'Lalu buka Safari dan ketuk tombol ekstensi di bar alamat untuk menggunakan {name}.',
  },
  ar: {
    lang: 'ar',
    dir: 'rtl',
    iconAlt: 'أيقونة {name}',
    statusEnabled: 'الملحق مفعّل',
    statusDisabled: 'الملحق غير مفعّل',
    heading: 'كيفية التفعيل في سفاري',
    macStepOpenSafari: 'افتح <b>سفاري</b>',
    macStepSettingsPathPrefix: 'انتقل إلى ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'سفاري ← التفضيلات ← الملحقات',
    macSettingsPath: 'سفاري ← الإعدادات ← الملحقات',
    macStepEnable: 'حدّد المربع بجوار <b>{name}</b>',
    macStepAllow: 'إذا طُلب منك، انقر على <b>السماح</b> لمنح الأذونات',
    macOpenPreferences: 'فتح تفضيلات سفاري…',
    macOpenSettings: 'فتح إعدادات سفاري…',
    iosStepOpenSettings: 'افتح تطبيق <b>الإعدادات</b>',
    iosStepNavigate: 'اضغط على <b>التطبيقات ← سفاري ← الملحقات</b>',
    iosStepEnable: 'اضغط على <b>{name}</b> وقم بتفعيله',
    iosStepAllow: 'ضمن «الأذونات»، اضبط مواقع الويب المدرجة على <b>السماح</b>',
    iosHint:
      'ثم افتح سفاري واضغط على زر الملحقات في شريط العنوان لاستخدام {name}.',
  },
  he: {
    lang: 'he',
    dir: 'rtl',
    iconAlt: 'סמל {name}',
    statusEnabled: 'ההרחבה פעילה',
    statusDisabled: 'ההרחבה כבויה',
    heading: 'כיצד להפעיל ב-Safari',
    macStepOpenSafari: 'פתח/י את <b>Safari</b>',
    macStepSettingsPathPrefix: 'עבור/י אל ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari ← העדפות ← הרחבות',
    macSettingsPath: 'Safari ← הגדרות ← הרחבות',
    macStepEnable: 'סמן/י את התיבה שלצד <b>{name}</b>',
    macStepAllow: 'אם תתבקש/י, לחץ/י על <b>אישור</b> כדי להעניק הרשאות',
    macOpenPreferences: 'פתיחת העדפות Safari…',
    macOpenSettings: 'פתיחת הגדרות Safari…',
    iosStepOpenSettings: 'פתח/י את יישום <b>הגדרות</b>',
    iosStepNavigate: 'הקש/י על <b>יישומים ← Safari ← הרחבות</b>',
    iosStepEnable: 'הקש/י על <b>{name}</b> והפעל/י את המתג',
    iosStepAllow: 'תחת «הרשאות», הגדר/י את האתרים המפורטים כ-<b>אישור</b>',
    iosHint:
      'לאחר מכן פתח/י את Safari והקש/י על כפתור ההרחבות בשורת הכתובת כדי להשתמש ב-{name}.',
  },
  hi: {
    lang: 'hi',
    iconAlt: '{name} आइकन',
    statusEnabled: 'एक्सटेंशन सक्षम है',
    statusDisabled: 'एक्सटेंशन अक्षम है',
    heading: 'Safari में सक्षम करने का तरीक़ा',
    macStepOpenSafari: '<b>Safari</b> खोलें',
    macStepSettingsPathPrefix: '',
    macStepSettingsPathSuffix: ' पर जाएँ',
    macPreferencesPath: 'Safari → प्राथमिकताएँ → एक्सटेंशन',
    macSettingsPath: 'Safari → सेटिंग → एक्सटेंशन',
    macStepEnable: '<b>{name}</b> के बग़ल वाले चेकबॉक्स को चुनें',
    macStepAllow: 'यदि पूछा जाए, तो अनुमतियाँ देने के लिए <b>अनुमति दें</b> पर क्लिक करें',
    macOpenPreferences: 'Safari प्राथमिकताएँ खोलें…',
    macOpenSettings: 'Safari सेटिंग खोलें…',
    iosStepOpenSettings: '<b>सेटिंग</b> ऐप खोलें',
    iosStepNavigate: '<b>ऐप्स → Safari → एक्सटेंशन</b> पर टैप करें',
    iosStepEnable: '<b>{name}</b> पर टैप करें और इसे चालू करें',
    iosStepAllow: 'अनुमतियाँ के अंतर्गत, सूचीबद्ध वेबसाइटों को <b>अनुमति दें</b> पर सेट करें',
    iosHint:
      'फिर Safari खोलें और {name} का उपयोग करने के लिए पता बार में एक्सटेंशन बटन पर टैप करें।',
  },
  ms: {
    lang: 'ms',
    iconAlt: 'Ikon {name}',
    statusEnabled: 'Sambungan didayakan',
    statusDisabled: 'Sambungan dinyahdayakan',
    heading: 'Cara mendayakan dalam Safari',
    macStepOpenSafari: 'Buka <b>Safari</b>',
    macStepSettingsPathPrefix: 'Pergi ke ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Keutamaan → Sambungan',
    macSettingsPath: 'Safari → Seting → Sambungan',
    macStepEnable: 'Tandakan kotak di sebelah <b>{name}</b>',
    macStepAllow: 'Jika digesa, klik <b>Benarkan</b> untuk memberikan keizinan',
    macOpenPreferences: 'Buka Keutamaan Safari…',
    macOpenSettings: 'Buka Seting Safari…',
    iosStepOpenSettings: 'Buka app <b>Seting</b>',
    iosStepNavigate: 'Ketik <b>App → Safari → Sambungan</b>',
    iosStepEnable: 'Ketik <b>{name}</b> dan aktifkannya',
    iosStepAllow: 'Di bawah Keizinan, tetapkan tapak web yang disenaraikan kepada <b>Benarkan</b>',
    iosHint:
      'Kemudian buka Safari dan ketik butang sambungan dalam bar alamat untuk menggunakan {name}.',
  },
  sv: {
    lang: 'sv',
    iconAlt: '{name}-symbol',
    statusEnabled: 'Tillägget är aktiverat',
    statusDisabled: 'Tillägget är inaktiverat',
    heading: 'Så här aktiverar du i Safari',
    macStepOpenSafari: 'Öppna <b>Safari</b>',
    macStepSettingsPathPrefix: 'Gå till ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Inställningar → Tillägg',
    macSettingsPath: 'Safari → Inställningar → Tillägg',
    macStepEnable: 'Kryssa i rutan bredvid <b>{name}</b>',
    macStepAllow: 'Om du blir tillfrågad, klicka på <b>Tillåt</b> för att ge behörigheter',
    macOpenPreferences: 'Öppna Safari-inställningar…',
    macOpenSettings: 'Öppna Safari-inställningar…',
    iosStepOpenSettings: 'Öppna appen <b>Inställningar</b>',
    iosStepNavigate: 'Tryck på <b>Appar → Safari → Tillägg</b>',
    iosStepEnable: 'Tryck på <b>{name}</b> och slå på det',
    iosStepAllow: 'Under Behörigheter ställer du in de listade webbplatserna på <b>Tillåt</b>',
    iosHint:
      'Öppna sedan Safari och tryck på tilläggsknappen i adressfältet för att använda {name}.',
  },
  da: {
    lang: 'da',
    iconAlt: '{name}-symbol',
    statusEnabled: 'Udvidelsen er slået til',
    statusDisabled: 'Udvidelsen er slået fra',
    heading: 'Sådan slår du til i Safari',
    macStepOpenSafari: 'Åbn <b>Safari</b>',
    macStepSettingsPathPrefix: 'Gå til ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Indstillinger → Udvidelser',
    macSettingsPath: 'Safari → Indstillinger → Udvidelser',
    macStepEnable: 'Sæt hak ved siden af <b>{name}</b>',
    macStepAllow: 'Hvis du bliver bedt om det, klik på <b>Tillad</b> for at give tilladelser',
    macOpenPreferences: 'Åbn Safari-indstillinger…',
    macOpenSettings: 'Åbn Safari-indstillinger…',
    iosStepOpenSettings: 'Åbn appen <b>Indstillinger</b>',
    iosStepNavigate: 'Tryk på <b>Apps → Safari → Udvidelser</b>',
    iosStepEnable: 'Tryk på <b>{name}</b>, og slå den til',
    iosStepAllow: 'Under Tilladelser skal du indstille de viste websteder til <b>Tillad</b>',
    iosHint:
      'Åbn derefter Safari, og tryk på udvidelsesknappen i adresselinjen for at bruge {name}.',
  },
  nb: {
    lang: 'nb',
    iconAlt: '{name}-symbol',
    statusEnabled: 'Utvidelsen er slått på',
    statusDisabled: 'Utvidelsen er slått av',
    heading: 'Slik slår du på i Safari',
    macStepOpenSafari: 'Åpne <b>Safari</b>',
    macStepSettingsPathPrefix: 'Gå til ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Valg → Utvidelser',
    macSettingsPath: 'Safari → Innstillinger → Utvidelser',
    macStepEnable: 'Kryss av i boksen ved siden av <b>{name}</b>',
    macStepAllow: 'Hvis du blir spurt, klikk på <b>Tillat</b> for å gi tilgang',
    macOpenPreferences: 'Åpne Safari-valg…',
    macOpenSettings: 'Åpne Safari-innstillinger…',
    iosStepOpenSettings: 'Åpne <b>Innstillinger</b>-appen',
    iosStepNavigate: 'Trykk på <b>Apper → Safari → Utvidelser</b>',
    iosStepEnable: 'Trykk på <b>{name}</b> og slå den på',
    iosStepAllow: 'Under Tilgang setter du de oppførte nettstedene til <b>Tillat</b>',
    iosHint:
      'Åpne deretter Safari og trykk på utvidelsesknappen i adressefeltet for å bruke {name}.',
  },
  fi: {
    lang: 'fi',
    iconAlt: '{name}-kuvake',
    statusEnabled: 'Laajennus on käytössä',
    statusDisabled: 'Laajennus ei ole käytössä',
    heading: 'Käyttöönotto Safarissa',
    macStepOpenSafari: 'Avaa <b>Safari</b>',
    macStepSettingsPathPrefix: 'Valitse ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Asetukset → Laajennukset',
    macSettingsPath: 'Safari → Asetukset → Laajennukset',
    macStepEnable: 'Valitse valintaneliö kohteen <b>{name}</b> vierestä',
    macStepAllow: 'Jos sitä pyydetään, myönnä oikeudet klikkaamalla <b>Salli</b>',
    macOpenPreferences: 'Avaa Safarin asetukset…',
    macOpenSettings: 'Avaa Safarin asetukset…',
    iosStepOpenSettings: 'Avaa <b>Asetukset</b>-appi',
    iosStepNavigate: 'Napauta <b>Apit → Safari → Laajennukset</b>',
    iosStepEnable: 'Napauta <b>{name}</b> ja laita se päälle',
    iosStepAllow: 'Aseta Oikeudet-kohdassa luetellut verkkosivustot tilaan <b>Salli</b>',
    iosHint:
      'Avaa sitten Safari ja käytä laajennusta {name} napauttamalla osoitepalkin laajennuspainiketta.',
  },
  cs: {
    lang: 'cs',
    iconAlt: 'Ikona {name}',
    statusEnabled: 'Rozšíření je zapnuté',
    statusDisabled: 'Rozšíření je vypnuté',
    heading: 'Jak zapnout v Safari',
    macStepOpenSafari: 'Otevřete <b>Safari</b>',
    macStepSettingsPathPrefix: 'Přejděte na ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Předvolby → Rozšíření',
    macSettingsPath: 'Safari → Nastavení → Rozšíření',
    macStepEnable: 'Zaškrtněte políčko vedle <b>{name}</b>',
    macStepAllow: 'Po zobrazení výzvy klikněte na <b>Povolit</b> pro udělení oprávnění',
    macOpenPreferences: 'Otevřít předvolby Safari…',
    macOpenSettings: 'Otevřít nastavení Safari…',
    iosStepOpenSettings: 'Otevřete aplikaci <b>Nastavení</b>',
    iosStepNavigate: 'Klepněte na <b>Aplikace → Safari → Rozšíření</b>',
    iosStepEnable: 'Klepněte na <b>{name}</b> a zapněte jej',
    iosStepAllow: 'V části Oprávnění nastavte uvedené webové stránky na <b>Povolit</b>',
    iosHint:
      'Poté otevřete Safari a klepnutím na tlačítko rozšíření v adresním řádku začněte používat {name}.',
  },
  hu: {
    lang: 'hu',
    iconAlt: '{name} ikon',
    statusEnabled: 'A bővítmény engedélyezve van',
    statusDisabled: 'A bővítmény le van tiltva',
    heading: 'Engedélyezés a Safariban',
    macStepOpenSafari: 'Nyissa meg a <b>Safari</b> alkalmazást',
    macStepSettingsPathPrefix: 'Nyissa meg a ',
    macStepSettingsPathSuffix: ' menüpontot',
    macPreferencesPath: 'Safari → Beállítások → Bővítmények',
    macSettingsPath: 'Safari → Beállítások → Bővítmények',
    macStepEnable: 'Jelölje be a jelölőnégyzetet a(z) <b>{name}</b> mellett',
    macStepAllow: 'Ha a rendszer kéri, kattintson az <b>Engedélyezés</b> gombra',
    macOpenPreferences: 'Safari beállítások megnyitása…',
    macOpenSettings: 'Safari beállítások megnyitása…',
    iosStepOpenSettings: 'Nyissa meg a <b>Beállítások</b> appot',
    iosStepNavigate: 'Koppintson az <b>Appok → Safari → Bővítmények</b> elemre',
    iosStepEnable: 'Koppintson a(z) <b>{name}</b> elemre, és kapcsolja be',
    iosStepAllow: 'Az Engedélyek alatt állítsa a felsorolt webhelyeket <b>Engedélyezés</b> értékre',
    iosHint:
      'Ezután nyissa meg a Safarit, és a(z) {name} használatához koppintson a címsorban lévő bővítmények gombra.',
  },
  el: {
    lang: 'el',
    iconAlt: 'Εικονίδιο {name}',
    statusEnabled: 'Η επέκταση είναι ενεργοποιημένη',
    statusDisabled: 'Η επέκταση είναι απενεργοποιημένη',
    heading: 'Πώς να την ενεργοποιήσετε στο Safari',
    macStepOpenSafari: 'Ανοίξτε το <b>Safari</b>',
    macStepSettingsPathPrefix: 'Μεταβείτε σε ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Προτιμήσεις → Επεκτάσεις',
    macSettingsPath: 'Safari → Ρυθμίσεις → Επεκτάσεις',
    macStepEnable: 'Επιλέξτε το πλαίσιο δίπλα στο <b>{name}</b>',
    macStepAllow: 'Εάν σας ζητηθεί, κάντε κλικ στο <b>Να επιτρέπεται</b> για να παραχωρήσετε δικαιώματα',
    macOpenPreferences: 'Άνοιγμα Προτιμήσεων Safari…',
    macOpenSettings: 'Άνοιγμα Ρυθμίσεων Safari…',
    iosStepOpenSettings: 'Ανοίξτε την εφαρμογή <b>Ρυθμίσεις</b>',
    iosStepNavigate: 'Αγγίξτε <b>Εφαρμογές → Safari → Επεκτάσεις</b>',
    iosStepEnable: 'Αγγίξτε το <b>{name}</b> και ενεργοποιήστε το',
    iosStepAllow: 'Στην ενότητα Δικαιώματα, ορίστε τους ιστότοπους της λίστας σε <b>Να επιτρέπεται</b>',
    iosHint:
      'Έπειτα ανοίξτε το Safari και αγγίξτε το κουμπί επεκτάσεων στη γραμμή διευθύνσεων για να χρησιμοποιήσετε το {name}.',
  },
  ro: {
    lang: 'ro',
    iconAlt: 'Pictogramă {name}',
    statusEnabled: 'Extensia este activată',
    statusDisabled: 'Extensia este dezactivată',
    heading: 'Cum să o activați în Safari',
    macStepOpenSafari: 'Deschideți <b>Safari</b>',
    macStepSettingsPathPrefix: 'Accesați ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Preferințe → Extensii',
    macSettingsPath: 'Safari → Configurări → Extensii',
    macStepEnable: 'Bifați caseta de lângă <b>{name}</b>',
    macStepAllow: 'Dacă vi se solicită, faceți clic pe <b>Permiteți</b> pentru a acorda permisiuni',
    macOpenPreferences: 'Deschideți Preferințe Safari…',
    macOpenSettings: 'Deschideți Configurări Safari…',
    iosStepOpenSettings: 'Deschideți aplicația <b>Configurări</b>',
    iosStepNavigate: 'Apăsați pe <b>Aplicații → Safari → Extensii</b>',
    iosStepEnable: 'Apăsați pe <b>{name}</b> și activați-o',
    iosStepAllow: 'Sub Permisiuni, setați site-urile web afișate la <b>Permiteți</b>',
    iosHint:
      'Apoi deschideți Safari și apăsați butonul pentru extensii din bara de adrese pentru a utiliza {name}.',
  },
  ca: {
    lang: 'ca',
    iconAlt: 'Icona de {name}',
    statusEnabled: 'L’extensió està activada',
    statusDisabled: 'L’extensió està desactivada',
    heading: 'Com activar-la al Safari',
    macStepOpenSafari: 'Obre el <b>Safari</b>',
    macStepSettingsPathPrefix: 'Ves a ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Preferències → Extensions',
    macSettingsPath: 'Safari → Configuració → Extensions',
    macStepEnable: 'Marca la casella al costat de <b>{name}</b>',
    macStepAllow: 'Si se’t demana, fes clic a <b>Permet</b> per concedir permisos',
    macOpenPreferences: 'Obre les preferències del Safari…',
    macOpenSettings: 'Obre la configuració del Safari…',
    iosStepOpenSettings: 'Obre l’app <b>Configuració</b>',
    iosStepNavigate: 'Toca <b>Apps → Safari → Extensions</b>',
    iosStepEnable: 'Toca <b>{name}</b> i activa-la',
    iosStepAllow: 'A Permisos, configura els llocs web indicats com a <b>Permet</b>',
    iosHint:
      'Després obre el Safari i toca el botó d’extensions a la barra d’adreces per utilitzar {name}.',
  },
  sk: {
    lang: 'sk',
    iconAlt: 'Ikona {name}',
    statusEnabled: 'Rozšírenie je zapnuté',
    statusDisabled: 'Rozšírenie je vypnuté',
    heading: 'Ako zapnúť v Safari',
    macStepOpenSafari: 'Otvorte <b>Safari</b>',
    macStepSettingsPathPrefix: 'Prejdite na ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Nastavenia → Rozšírenia',
    macSettingsPath: 'Safari → Nastavenia → Rozšírenia',
    macStepEnable: 'Zaškrtnite políčko vedľa <b>{name}</b>',
    macStepAllow: 'Ak sa zobrazí výzva, kliknite na <b>Povoliť</b> na udelenie oprávnení',
    macOpenPreferences: 'Otvoriť nastavenia Safari…',
    macOpenSettings: 'Otvoriť nastavenia Safari…',
    iosStepOpenSettings: 'Otvorte apku <b>Nastavenia</b>',
    iosStepNavigate: 'Klepnite na <b>Apky → Safari → Rozšírenia</b>',
    iosStepEnable: 'Klepnite na <b>{name}</b> a zapnite ho',
    iosStepAllow: 'V časti Oprávnenia nastavte uvedené webové stránky na <b>Povoliť</b>',
    iosHint:
      'Potom otvorte Safari a klepnutím na tlačidlo rozšírení v paneli s adresou začnite používať {name}.',
  },
  hr: {
    lang: 'hr',
    iconAlt: 'Ikona {name}',
    statusEnabled: 'Ekstenzija je uključena',
    statusDisabled: 'Ekstenzija je isključena',
    heading: 'Kako uključiti u Safariju',
    macStepOpenSafari: 'Otvorite <b>Safari</b>',
    macStepSettingsPathPrefix: 'Idite na ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Postavke → Ekstenzije',
    macSettingsPath: 'Safari → Postavke → Ekstenzije',
    macStepEnable: 'Označite kućicu pokraj <b>{name}</b>',
    macStepAllow: 'Ako se zatraži, kliknite <b>Dozvoli</b> kako biste odobrili dopuštenja',
    macOpenPreferences: 'Otvori postavke Safarija…',
    macOpenSettings: 'Otvori postavke Safarija…',
    iosStepOpenSettings: 'Otvorite aplikaciju <b>Postavke</b>',
    iosStepNavigate: 'Dodirnite <b>Aplikacije → Safari → Ekstenzije</b>',
    iosStepEnable: 'Dodirnite <b>{name}</b> i uključite ga',
    iosStepAllow: 'U odjeljku Dopuštenja postavite navedene web stranice na <b>Dozvoli</b>',
    iosHint:
      'Zatim otvorite Safari i dodirnite tipku za ekstenzije u adresnoj traci kako biste koristili {name}.',
  },
  sl: {
    lang: 'sl',
    iconAlt: 'Ikona {name}',
    statusEnabled: 'Razširitev je omogočena',
    statusDisabled: 'Razširitev je onemogočena',
    heading: 'Kako omogočiti v Safariju',
    macStepOpenSafari: 'Odprite <b>Safari</b>',
    macStepSettingsPathPrefix: 'Pojdite v ',
    macStepSettingsPathSuffix: '',
    macPreferencesPath: 'Safari → Nastavitve → Razširitve',
    macSettingsPath: 'Safari → Nastavitve → Razširitve',
    macStepEnable: 'Potrdite polje poleg <b>{name}</b>',
    macStepAllow: 'Če se prikaže poziv, kliknite <b>Dovoli</b> za dodelitev dovoljenj',
    macOpenPreferences: 'Odpri nastavitve Safarija…',
    macOpenSettings: 'Odpri nastavitve Safarija…',
    iosStepOpenSettings: 'Odprite aplikacijo <b>Nastavitve</b>',
    iosStepNavigate: 'Tapnite <b>Aplikacije → Safari → Razširitve</b>',
    iosStepEnable: 'Tapnite <b>{name}</b> in jo vklopite',
    iosStepAllow: 'V razdelku Dovoljenja nastavite navedena spletna mesta na <b>Dovoli</b>',
    iosHint:
      'Nato odprite Safari in tapnite gumb za razširitve v naslovni vrstici za uporabo {name}.',
  },
}

const ES_419_REGIONS = new Set([
  '419',
  'ar',
  'bo',
  'cl',
  'co',
  'cr',
  'cu',
  'do',
  'ec',
  'gt',
  'hn',
  'mx',
  'ni',
  'pa',
  'pe',
  'pr',
  'py',
  'sv',
  'us',
  'uy',
  've',
])

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]!)
}

function renderRichTemplateToHtml(template: string, projectName: string): string {
  return template
    .split(/(<b>.*?<\/b>)/g)
    .map((part) => {
      if (part.startsWith('<b>') && part.endsWith('</b>')) {
        return `<strong>${escapeHtml(part.slice(3, -4).replaceAll('{name}', projectName))}</strong>`
      }
      return escapeHtml(part.replaceAll('{name}', projectName))
    })
    .join('')
}

export function mapWebExtLocaleToApple(locale: string): AppleLocale | undefined {
  return WEBEXT_TO_APPLE_LOCALE[locale]
}

/** Resolves an ordered BCP 47 preferred-language list (such as Apple's Locale.preferredLanguages) to a built-in guide locale. */
export function resolveGuideLocale(
  preferredLanguages: readonly string[],
): AppleLocale {
  for (const raw of preferredLanguages) {
    if (!raw) continue
    const normalized = raw.replaceAll('_', '-')
    const lower = normalized.toLowerCase()
    const exact = SUPPORTED_APPLE_LOCALES.find((l) => l.toLowerCase() === lower)
    if (exact) return exact

    const parts = lower.split('-')
    const lang = parts[0]
    if (lang === 'zh') {
      if (
        parts.includes('hant') ||
        parts.includes('tw') ||
        parts.includes('hk') ||
        parts.includes('mo')
      ) {
        return 'zh-Hant'
      }
      return 'zh-Hans'
    }
    if (lang === 'es') {
      return parts[1] && ES_419_REGIONS.has(parts[1]) ? 'es-419' : 'es'
    }
    if (lang === 'pt') {
      return parts[1] === 'pt' ? 'pt-PT' : 'pt-BR'
    }
    if (lang === 'no' || lang === 'nn') return 'nb'
    if (lang === 'iw') return 'he'
    if (lang === 'in') return 'id'
    const baseMatch = SUPPORTED_APPLE_LOCALES.find((l) => l === lang)
    if (baseMatch) return baseMatch
  }
  return 'en'
}

export function renderSetupPageHtml(
  projectName: string,
  locale: AppleLocale,
): string {
  const copy = SETUP_GUIDE_COPY[locale]
  const name = escapeHtml(projectName)
  const dirAttr = copy.dir ? ` dir="${copy.dir}"` : ''

  return `<!DOCTYPE html>
<html lang="${copy.lang}"${dirAttr}>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <meta name="color-scheme" content="light dark">
    <link rel="stylesheet" href="../Style.css">
    <script src="../Script.js" defer></script>
</head>
<body>
    <header>
        <img src="../Icon.png" width="96" height="96" alt="${escapeHtml(copy.iconAlt.replaceAll('{name}', projectName))}">
        <h1>${name}</h1>
    </header>

    <section class="status platform-mac">
        <p class="state-on badge on">${escapeHtml(copy.statusEnabled)}</p>
        <p class="state-off badge off">${escapeHtml(copy.statusDisabled)}</p>
    </section>

    <section class="steps platform-mac">
        <h2>${escapeHtml(copy.heading)}</h2>
        <ol>
            <li data-slot="mac-step-1">${renderRichTemplateToHtml(copy.macStepOpenSafari, projectName)}</li>
            <li data-slot="mac-step-2">${escapeHtml(copy.macStepSettingsPathPrefix)}<strong class="settings-path" data-settings="${escapeHtml(copy.macSettingsPath)}">${escapeHtml(copy.macPreferencesPath)}</strong>${escapeHtml(copy.macStepSettingsPathSuffix)}</li>
            <li data-slot="mac-step-3">${renderRichTemplateToHtml(copy.macStepEnable, projectName)}</li>
            <li data-slot="mac-step-4">${renderRichTemplateToHtml(copy.macStepAllow, projectName)}</li>
        </ol>
        <button class="open-preferences" data-settings="${escapeHtml(copy.macOpenSettings)}">${escapeHtml(copy.macOpenPreferences)}</button>
    </section>

    <section class="steps platform-ios">
        <h2>${escapeHtml(copy.heading)}</h2>
        <ol>
            <li data-slot="ios-step-1">${renderRichTemplateToHtml(copy.iosStepOpenSettings, projectName)}</li>
            <li data-slot="ios-step-2">${renderRichTemplateToHtml(copy.iosStepNavigate, projectName)}</li>
            <li data-slot="ios-step-3">${renderRichTemplateToHtml(copy.iosStepEnable, projectName)}</li>
            <li data-slot="ios-step-4">${renderRichTemplateToHtml(copy.iosStepAllow, projectName)}</li>
        </ol>
        <p class="hint">${escapeHtml(copy.iosHint.replaceAll('{name}', projectName))}</p>
    </section>
</body>
</html>
`
}

/** Rewrites physical left alignment/padding in Style.css to logical properties so RTL guides (e.g. Arabic, Hebrew) render right-aligned. */
export function patchSetupPageCssForRtl(css: string): string {
  return css
    .replaceAll('text-align: left;', 'text-align: start;')
    .replaceAll('padding-left: 1.6em;', 'padding-inline-start: 1.6em;')
}

/**
 * Injects Locale.preferredLanguages into the WKWebView at document start so the
 * setup guide can follow the device's system language across all built-in
 * translations even when the app bundle only declares the extension's _locales
 * (keeping App Store language metadata and iOS Per-App Language settings honest).
 */
export function patchViewControllerSwift(source: string): string {
  if (source.includes('__PREFERRED_LANGUAGES__')) return source
  const anchor = 'self.webView.configuration.userContentController.add(self, name: "controller")'
  if (!source.includes(anchor)) return source
  const injection = [
    anchor,
    '',
    '        if let preferredLanguagesJSON = try? JSONSerialization.data(withJSONObject: Locale.preferredLanguages),',
    '           let preferredLanguages = String(data: preferredLanguagesJSON, encoding: .utf8) {',
    '            let script = WKUserScript(source: "window.__PREFERRED_LANGUAGES__ = \\(preferredLanguages);", injectionTime: .atDocumentStart, forMainFrameOnly: true)',
    '            self.webView.configuration.userContentController.addUserScript(script)',
    '        }',
  ].join('\n')
  return source.replace(anchor, injection)
}

export function renderSetupPageScript(): string {
  const catalogJson = JSON.stringify(SETUP_GUIDE_COPY)
  const es419Json = JSON.stringify([...ES_419_REGIONS])
  return `var GUIDE_COPY = ${catalogJson};
var SUPPORTED_LOCALES = Object.keys(GUIDE_COPY);
var ES_419_REGIONS = ${es419Json};

function resolveGuideLocale(preferredLanguages) {
    for (var i = 0; i < preferredLanguages.length; i++) {
        var raw = preferredLanguages[i];
        if (!raw) continue;
        var lower = String(raw).replace(/_/g, '-').toLowerCase();
        for (var j = 0; j < SUPPORTED_LOCALES.length; j++) {
            if (SUPPORTED_LOCALES[j].toLowerCase() === lower) return SUPPORTED_LOCALES[j];
        }
        var parts = lower.split('-');
        var lang = parts[0];
        if (lang === 'zh') {
            if (parts.indexOf('hant') !== -1 || parts.indexOf('tw') !== -1 || parts.indexOf('hk') !== -1 || parts.indexOf('mo') !== -1) {
                return 'zh-Hant';
            }
            return 'zh-Hans';
        }
        if (lang === 'es') {
            return parts[1] && ES_419_REGIONS.indexOf(parts[1]) !== -1 ? 'es-419' : 'es';
        }
        if (lang === 'pt') {
            return parts[1] === 'pt' ? 'pt-PT' : 'pt-BR';
        }
        if (lang === 'no' || lang === 'nn') return 'nb';
        if (lang === 'iw') return 'he';
        if (lang === 'in') return 'id';
        if (GUIDE_COPY[lang]) return lang;
    }
    return 'en';
}

function setRichText(el, template, name) {
    if (!el) return;
    el.textContent = '';
    var parts = template.split(/(<b>.*?<\\/b>)/g);
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (!part) continue;
        if (part.indexOf('<b>') === 0 && part.slice(-4) === '</b>') {
            var strong = document.createElement('strong');
            strong.textContent = part.slice(3, -4).split('{name}').join(name);
            el.appendChild(strong);
        } else {
            el.appendChild(document.createTextNode(part.split('{name}').join(name)));
        }
    }
}

function applyGuideLocale(locale) {
    var copy = GUIDE_COPY[locale];
    if (!copy) return;
    document.documentElement.lang = copy.lang;
    if (copy.dir) document.documentElement.dir = copy.dir;
    else document.documentElement.removeAttribute('dir');

    var h1 = document.querySelector('header h1');
    var name = h1 ? h1.textContent : '';
    var img = document.querySelector('header img');
    if (img) img.alt = copy.iconAlt.split('{name}').join(name);

    var stateOn = document.querySelector('.status .state-on');
    if (stateOn) stateOn.textContent = copy.statusEnabled;
    var stateOff = document.querySelector('.status .state-off');
    if (stateOff) stateOff.textContent = copy.statusDisabled;

    var headings = document.querySelectorAll('.steps h2');
    for (var i = 0; i < headings.length; i++) headings[i].textContent = copy.heading;

    setRichText(document.querySelector('[data-slot="mac-step-1"]'), copy.macStepOpenSafari, name);
    var macStep2 = document.querySelector('[data-slot="mac-step-2"]');
    if (macStep2) {
        macStep2.textContent = '';
        if (copy.macStepSettingsPathPrefix) macStep2.appendChild(document.createTextNode(copy.macStepSettingsPathPrefix));
        var strongPath = document.createElement('strong');
        strongPath.className = 'settings-path';
        strongPath.dataset.settings = copy.macSettingsPath;
        strongPath.textContent = copy.macPreferencesPath;
        macStep2.appendChild(strongPath);
        if (copy.macStepSettingsPathSuffix) macStep2.appendChild(document.createTextNode(copy.macStepSettingsPathSuffix));
    }
    setRichText(document.querySelector('[data-slot="mac-step-3"]'), copy.macStepEnable, name);
    setRichText(document.querySelector('[data-slot="mac-step-4"]'), copy.macStepAllow, name);

    var button = document.querySelector('button.open-preferences');
    if (button) {
        button.dataset.settings = copy.macOpenSettings;
        button.textContent = copy.macOpenPreferences;
    }

    setRichText(document.querySelector('[data-slot="ios-step-1"]'), copy.iosStepOpenSettings, name);
    setRichText(document.querySelector('[data-slot="ios-step-2"]'), copy.iosStepNavigate, name);
    setRichText(document.querySelector('[data-slot="ios-step-3"]'), copy.iosStepEnable, name);
    setRichText(document.querySelector('[data-slot="ios-step-4"]'), copy.iosStepAllow, name);

    var hint = document.querySelector('.steps .hint');
    if (hint) hint.textContent = copy.iosHint.split('{name}').join(name);
}

// Prefer Locale.preferredLanguages injected by ViewController.swift (which reflects
// both the device language and any iOS Per-App Language override). When the matched
// built-in guide differs from the static .lproj HTML loaded by NSBundle, rewrite the
// guide before show() reveals it.
var preferredLanguages = Array.isArray(window.__PREFERRED_LANGUAGES__) && window.__PREFERRED_LANGUAGES__.length > 0
    ? window.__PREFERRED_LANGUAGES__
    : (Array.isArray(navigator.languages) && navigator.languages.length > 0 ? navigator.languages : [navigator.language]);
var matchedLocale = resolveGuideLocale(preferredLanguages);
if (matchedLocale !== document.documentElement.lang) {
    applyGuideLocale(matchedLocale);
}

// The generated ViewController calls show() with a different signature
// depending on how the project was converted: a macOS/iOS project passes the
// platform first, a single-platform project omits it. Sniff rather than
// require a matching ViewController, so this file works with any layout the
// converter produces.
function show(a, b, c) {
    var hasPlatform = typeof a === 'string';
    var platform = hasPlatform ? a : 'mac';
    var enabled = hasPlatform ? b : a;
    var useSettingsInsteadOfPreferences = hasPlatform ? c : b;

    document.body.classList.toggle('platform-mac', platform === 'mac');
    document.body.classList.toggle('platform-ios', platform === 'ios');

    // "Preferences" was renamed to "Settings" in macOS 13. Each localized
    // Main.html (or applyGuideLocale) carries its macOS 13+ wording in
    // data-settings so this stays locale-agnostic.
    if (useSettingsInsteadOfPreferences) {
        var paths = document.querySelectorAll('.settings-path');
        for (var i = 0; i < paths.length; i++) {
            if (paths[i].dataset.settings) paths[i].textContent = paths[i].dataset.settings;
        }
        var button = document.querySelector('button.open-preferences');
        if (button && button.dataset.settings) button.textContent = button.dataset.settings;
    }

    if (typeof enabled === 'boolean') {
        document.body.classList.toggle('state-on', enabled);
        document.body.classList.toggle('state-off', !enabled);
    } else {
        document.body.classList.remove('state-on');
        document.body.classList.remove('state-off');
    }
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage('open-preferences');
}

var openButton = document.querySelector('button.open-preferences');
if (openButton) openButton.addEventListener('click', openPreferences);

// A single-platform project's generated ViewController only calls show() if
// the extension-state lookup succeeds — it bails out on error without telling
// the page anything. Since the instructions are hidden until a platform is
// known, that left the window showing nothing but the icon. Seed the platform
// here so content always renders; a later show() from native still refines it.
if (!/platform-(mac|ios)/.test(document.body.className)) {
    var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    show(isIOS ? 'ios' : 'mac');
}
`
}

interface XcprojNode {
  kind?: string
  name?: string
  path?: string
  children?: XcprojNode[]
  [key: string]: unknown
}

export interface XcprojDocument {
  localizations?: {
    development?: string
    supported?: string[]
  }
  files?: XcprojNode[]
  [key: string]: unknown
}

/** Strips trailing commas Xcode 27.2 writes into project.xcproj before JSON.parse. */
export function parseXcproj(text: string): XcprojDocument {
  let out = ''
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    if (inString) {
      out += char
      if (char === '\\') out += text[++i] ?? ''
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      inString = true
      out += char
      continue
    }
    if (char === ',') {
      let next = i + 1
      while (next < text.length && /\s/.test(text[next]!)) next++
      if (text[next] === '}' || text[next] === ']') continue
    }
    out += char
  }
  return JSON.parse(out) as XcprojDocument
}

function findVariantGroup(
  nodes: XcprojNode[] | undefined,
  name: string,
): XcprojNode | undefined {
  if (!nodes) return undefined
  for (const node of nodes) {
    if (node.kind === 'variant-group' && node.name === name) {
      return node
    }
    const found = findVariantGroup(node.children, name)
    if (found) return found
  }
  return undefined
}

export function patchXcprojLocalizations(
  project: XcprojDocument,
  locales: readonly AppleLocale[],
): XcprojDocument {
  const existing = project.localizations?.supported ?? ['Base']
  const supported = Array.from(new Set(['Base', ...existing, ...locales]))
  project.localizations = {
    development: project.localizations?.development ?? 'en',
    supported,
  }

  const mainHtmlGroup = findVariantGroup(project.files, 'Main.html')
  if (mainHtmlGroup) {
    mainHtmlGroup.children = [
      { path: 'Base.lproj/Main.html' },
      ...locales.map((locale) => ({ path: `${locale}.lproj/Main.html` })),
    ]
  }
  return project
}

async function exists(target: string): Promise<boolean> {
  return fs.access(target).then(
    () => true,
    () => false,
  )
}

async function resolveAppDir(
  projectRoot: string,
  projectName: string,
): Promise<{ appDir: string; resourcesDir: string } | undefined> {
  const candidates = [
    path.join(projectRoot, 'Shared (App)'),
    path.join(projectRoot, projectName),
  ]
  for (const appDir of candidates) {
    const resourcesDir = path.join(appDir, 'Resources')
    if (await exists(resourcesDir)) return { appDir, resourcesDir }
  }
  return undefined
}

async function resolveExtensionLocales(rootPath: string): Promise<AppleLocale[]> {
  const localesDir = path.join(rootPath, 'public', '_locales')
  let entries
  try {
    entries = await fs.readdir(localesDir, { withFileTypes: true })
  } catch {
    return ['en']
  }
  const mapped: AppleLocale[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const appleLocale = mapWebExtLocaleToApple(entry.name)
    if (appleLocale && !mapped.includes(appleLocale)) {
      mapped.push(appleLocale)
    }
  }
  // Keep deterministic order with English first
  return mapped.sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)))
}

export async function localizeSafariProject(options: {
  rootPath: string
  projectName: string
  /** Controls which .lproj bundles are declared in Xcode (App Store & iOS Settings). Defaults to 'extension' (matching public/_locales); the setup guide still renders all 36 built-in languages at runtime from Locale.preferredLanguages. */
  locales?: readonly AppleLocale[] | 'all' | 'extension'
}): Promise<boolean> {
  const projectRoot = path.resolve(options.rootPath, '.output', options.projectName)
  const resolved = await resolveAppDir(projectRoot, options.projectName)
  if (!resolved) return false
  const { appDir, resourcesDir } = resolved

  const locales: AppleLocale[] =
    options.locales === 'all'
      ? [...SUPPORTED_APPLE_LOCALES]
      : Array.isArray(options.locales)
        ? [...options.locales]
        : await resolveExtensionLocales(options.rootPath)
  if (locales.length === 0) return false

  // Keep Base.lproj in English as the fallback for unsupported system languages
  const baseDir = path.join(resourcesDir, 'Base.lproj')
  await fs.mkdir(baseDir, { recursive: true })
  await fs.writeFile(
    path.join(baseDir, 'Main.html'),
    renderSetupPageHtml(options.projectName, 'en'),
  )

  for (const locale of locales) {
    const dir = path.join(resourcesDir, `${locale}.lproj`)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(
      path.join(dir, 'Main.html'),
      renderSetupPageHtml(options.projectName, locale),
    )
  }

  const stylePath = path.join(resourcesDir, 'Style.css')
  if (await exists(stylePath)) {
    const css = await fs.readFile(stylePath, 'utf-8')
    await fs.writeFile(stylePath, patchSetupPageCssForRtl(css))
  }

  await fs.writeFile(path.join(resourcesDir, 'Script.js'), renderSetupPageScript())

  const viewControllerPath = path.join(appDir, 'ViewController.swift')
  if (await exists(viewControllerPath)) {
    const swift = await fs.readFile(viewControllerPath, 'utf-8')
    await fs.writeFile(viewControllerPath, patchViewControllerSwift(swift))
  }

  const xcprojPath = path.join(
    projectRoot,
    `${options.projectName}.xcodeproj`,
    'project.xcproj',
  )
  if (await exists(xcprojPath)) {
    const project = parseXcproj(await fs.readFile(xcprojPath, 'utf-8'))
    patchXcprojLocalizations(project, locales)
    await fs.writeFile(xcprojPath, `${JSON.stringify(project, null, 2)}\n`)
  }

  return true
}
