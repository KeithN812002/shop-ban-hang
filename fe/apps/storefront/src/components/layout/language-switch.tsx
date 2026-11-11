import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n/config'
import { usePopover } from '@/hooks/use-popover'
import { cn } from '@workspace/ui/lib/utils'

export function LanguageSwitch() {
    const { t, i18n } = useTranslation()
    const { open, toggle, close, ref } = usePopover()
    const current = (i18n.resolvedLanguage ?? 'vi').split('-')[0] as AppLanguage

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-label={t('header.language')}
                className="flex items-center gap-1 rounded px-2 py-1 hover:bg-white/15"
            >
                <Globe className="size-4" aria-hidden />
                <span className="uppercase">{current}</span>
            </button>
            {open && (
                <ul className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-md border bg-white py-1 text-gray-800 shadow-xl animate-fade-in">
                    {SUPPORTED_LANGUAGES.map(lng => (
                        <li key={lng}>
                            <button
                                type="button"
                                onClick={() => {
                                    void i18n.changeLanguage(lng)
                                    close()
                                }}
                                className={cn(
                                    'block w-full px-3 py-2 text-left text-sm hover:bg-gray-50',
                                    lng === current && 'font-semibold text-brand-600',
                                )}
                            >
                                {t(`header.languages.${lng}`)}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
