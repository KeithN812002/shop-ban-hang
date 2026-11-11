import { useTranslation } from 'react-i18next'
import { availableLocales, LocaleKey } from '../locales'

export function useLanguage() {
    const { i18n } = useTranslation()

    const currentLanguage = availableLocales.find(lang => lang.code === i18n.language) || availableLocales[0]

    const changeLanguage = (languageCode: LocaleKey) => {
        i18n.changeLanguage(languageCode)
    }

    const getLanguageName = (code: string) => {
        return availableLocales.find(lang => lang.code === code)?.name || code
    }

    return {
        currentLanguage,
        availableLocales,
        changeLanguage,
        getLanguageName,
        language: i18n.language as LocaleKey,
    }
}
