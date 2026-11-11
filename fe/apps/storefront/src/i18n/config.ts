import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { setLanguage } from '@/lib/storage'

export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

type Dict = { [key: string]: string | Dict }

const isDict = (value: unknown): value is Dict => typeof value === 'object' && value !== null && !Array.isArray(value)

const deepMerge = (target: Dict, source: Dict): Dict => {
    for (const [key, value] of Object.entries(source)) {
        const existing = target[key]
        target[key] = isDict(value) && isDict(existing) ? deepMerge(existing, value) : value
    }
    return target
}

/**
 * Auto-registration: every JSON under ./locales (any depth) named `vi.json`, `en.json`,
 * `<name>.vi.json` or `<name>.en.json` is deep-merged into the single translation namespace.
 * Each file must carry its own top-level key (e.g. { "seller": { ... } }), so a new feature
 * area only has to drop `locales/seller/vi.json` + `locales/seller/en.json` - no code change.
 */
const localeModules = import.meta.glob<Dict>('./locales/**/*.json', { eager: true, import: 'default' })

const buildResources = (): Record<AppLanguage, Dict> => {
    const out: Record<AppLanguage, Dict> = { vi: {}, en: {} }
    for (const [path, content] of Object.entries(localeModules).sort(([a], [b]) => a.localeCompare(b))) {
        const match = /(?:^|[./])(vi|en)\.json$/.exec(path)
        if (!match || !isDict(content)) continue
        deepMerge(out[match[1] as AppLanguage], structuredClone(content))
    }
    return out
}

const resources = buildResources()

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: { vi: { translation: resources.vi }, en: { translation: resources.en } },
        fallbackLng: 'vi',
        supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
        nonExplicitSupportedLngs: true,
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'querystring'],
            lookupQuerystring: 'lang',
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        },
    })

const API_LANGUAGE: Record<AppLanguage, string> = { vi: 'vi-VN', en: 'en-US' }

// The backend localises error messages from the accept-language header: keep it in sync.
const syncApiLanguage = (lng?: string) => {
    const base = (lng?.split('-')[0] ?? 'vi') as AppLanguage
    setLanguage(API_LANGUAGE[base] ?? API_LANGUAGE.vi)
    document.documentElement.lang = base
}

syncApiLanguage(i18n.resolvedLanguage)
i18n.on('languageChanged', syncApiLanguage)

export default i18n
