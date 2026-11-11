import { Button } from '@workspace/ui/components/Button'
import { Menu, MenuItem } from '@workspace/ui/components/Menu'
import { Languages, Check } from 'lucide-react'
import { useLanguage } from '@/i18n'
import { HeaderDropdown } from './InlineDropdown'

export function LanguageSwitcher() {
    const { language, availableLocales, changeLanguage } = useLanguage()

    const options = availableLocales.slice().sort((a, b) => (a.code === 'vi' ? -1 : b.code === 'vi' ? 1 : 0))

    return (
        <HeaderDropdown
            trigger={
                <Button
                    variant="unstyled"
                    aria-label="Đổi ngôn ngữ"
                    className={
                        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ' +
                        'border-0 bg-transparent text-white shadow-none ' +
                        'hover:bg-transparent hover:opacity-100 active:bg-transparent active:opacity-100 ' +
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ' +
                        'focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(12,70,150)] ' +
                        '[&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:stroke-[2]'
                    }
                >
                    <Languages className="size-5" />
                </Button>
            }
            align="left"
            triggerClassName="cursor-pointer"
            menuClassName="min-w-[150px]"
        >
            <Menu>
                {options.map(item => (
                    <MenuItem key={item.code} onAction={() => changeLanguage(item.code)}>
                        {() => (
                            <>
                                <span className="text-base">{item.flag}</span>
                                <span className="flex-1">{item.code === 'vi' ? 'Việt Nam' : 'English'}</span>
                                {language === item.code && <Check className="size-4" />}
                            </>
                        )}
                    </MenuItem>
                ))}
            </Menu>
        </HeaderDropdown>
    )
}
