import en from './en.json'
import vi from './vi.json'
import enPermission from './permission/en.json'
import viPermission from './permission/vi.json'
import enDynamicRoute from './dynamicRoute/en.json'
import viDynamicRoute from './dynamicRoute/vi.json'
import enDynamicRouteModulePage from './dynamicRoute/modulePage/en.json'
import viDynamicRouteModulePage from './dynamicRoute/modulePage/vi.json'
import enDynamicRouteSsoCallback from './dynamicRoute/ssoCallback/en.json'
import viDynamicRouteSsoCallback from './dynamicRoute/ssoCallback/vi.json'
import enRole from './role/en.json'
import viRole from './role/vi.json'
import enUser from './user/en.json'
import viUser from './user/vi.json'
import enEmailOutbox from './email-outbox/en.json'
import viEmailOutbox from './email-outbox/vi.json'
import enEmailTemplate from './email-template/en.json'
import viEmailTemplate from './email-template/vi.json'
import enShopAdmin from './shopAdmin/en.json'
import viShopAdmin from './shopAdmin/vi.json'

// One folder per domain namespace ({domain}/en.json + {domain}/vi.json). To add a namespace,
// import both files above and add one key under each language below.
export const locales = {
    en: {
        ...en,
        permission: enPermission,
        dynamicRoute: {
            ...enDynamicRoute,
            modulePage: enDynamicRouteModulePage,
            ssoCallback: enDynamicRouteSsoCallback,
        },
        role: enRole,
        user: enUser,
        emailOutbox: enEmailOutbox,
        emailTemplate: enEmailTemplate,
        shopAdmin: enShopAdmin,
    },
    vi: {
        ...vi,
        permission: viPermission,
        dynamicRoute: {
            ...viDynamicRoute,
            modulePage: viDynamicRouteModulePage,
            ssoCallback: viDynamicRouteSsoCallback,
        },
        role: viRole,
        user: viUser,
        emailOutbox: viEmailOutbox,
        emailTemplate: viEmailTemplate,
        shopAdmin: viShopAdmin,
    },
}

export type LocaleKey = keyof typeof locales
export type TranslationKeys = typeof locales.en

export const availableLocales: Array<{ code: LocaleKey; name: string; flag: string }> = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
]
