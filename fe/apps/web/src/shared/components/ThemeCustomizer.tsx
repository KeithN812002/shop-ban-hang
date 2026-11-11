import { useTheme } from '@/hooks/useTheme'
import { Button } from '@workspace/ui/components/Button'
import { Menu, MenuItem, MenuTrigger, MenuSeparator } from '@workspace/ui/components/Menu'
import { Palette, Check } from 'lucide-react'

/**
 * Theme Customizer Component
 * Allows users to switch between predefined themes
 */
export function ThemeCustomizer() {
    const { currentTheme, themes, setTheme } = useTheme()

    return (
        <MenuTrigger>
            <Button variant="outline" size="icon">
                <Palette className="size-4" />
            </Button>
            <Menu>
                <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium">Theme</p>
                    <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
                </div>

                {themes.map((theme, index) => (
                    <div key={theme.id}>
                        {index > 0 && index % 4 === 0 && <MenuSeparator />}
                        <MenuItem onAction={() => setTheme(theme.id)} className="justify-between">
                            <span>{theme.name}</span>
                            {currentTheme.id === theme.id && <Check className="size-4 text-primary" />}
                        </MenuItem>
                    </div>
                ))}
            </Menu>
        </MenuTrigger>
    )
}

export default ThemeCustomizer
