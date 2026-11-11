import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { setLanguage } from '@/lib/storage'
import { locales } from './locales'
import './types' // Import types for TypeScript support

export const defaultNS = 'translation'
export const resources = {
    en: {
        translation: locales.en,
    },
    vi: {
        translation: locales.vi,
    },
} as const

i18n.use(LanguageDetector) // Tự động detect ngôn ngữ từ browser
    .use(initReactI18next) // Passes i18n down to react-i18next
    .init({
        resources,
        defaultNS,
        fallbackLng: 'vi',
        supportedLngs: ['vi', 'en'],
        interpolation: {
            escapeValue: false, // React already escapes
        },
        detection: {
            order: ['localStorage', 'querystring'],
            lookupQuerystring: 'lang',
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        },
    })

const API_LANGUAGE: Record<string, string> = { vi: 'vi-VN', en: 'en-US' }

const syncApiLanguage = (lng?: string) => {
    setLanguage(API_LANGUAGE[lng?.split('-')[0] ?? 'vi'] ?? API_LANGUAGE.vi)
}

syncApiLanguage(i18n.resolvedLanguage)
i18n.on('languageChanged', syncApiLanguage)

export default i18n
