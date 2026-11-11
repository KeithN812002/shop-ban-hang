import { useState, useEffect, useCallback } from 'react'
import { getThemeById, applyTheme, themes, type Theme, defaultTheme } from '@/lib/themes'

const THEME_STORAGE_KEY = 'app-theme-id'

/**
 * Custom hook for theme management
 */
export function useTheme() {
    const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
        // Get saved theme from localStorage
        const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY)
        return savedThemeId ? getThemeById(savedThemeId) : defaultTheme
    })

    // Apply theme on mount and when theme changes
    useEffect(() => {
        applyTheme(currentTheme)
    }, [currentTheme])

    /**
     * Change theme by ID
     */
    const setTheme = useCallback((themeId: string) => {
        const theme = getThemeById(themeId)
        setCurrentTheme(theme)
        localStorage.setItem(THEME_STORAGE_KEY, theme.id)
    }, [])

    /**
     * Toggle between light and dark theme
     */
    const toggleDarkMode = useCallback(() => {
        const isDark = currentTheme.id === 'dark'
        setTheme(isDark ? 'default' : 'dark')
    }, [currentTheme.id, setTheme])

    return {
        currentTheme,
        themes,
        setTheme,
        toggleDarkMode,
        isDark: currentTheme.id === 'dark',
    }
}
