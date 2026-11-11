/**
 * Design Token System
 * Centralized theme configuration for consistent UI
 */

export interface DesignTokens {
    // Colors
    colors: {
        primary: string
        primaryForeground: string
        secondary: string
        secondaryForeground: string
        accent: string
        accentForeground: string
        destructive: string
        destructiveForeground: string
        muted: string
        mutedForeground: string
        background: string
        foreground: string
        card: string
        cardForeground: string
        popover: string
        popoverForeground: string
        border: string
        input: string
        ring: string
    }
    // Border Radius
    radius: {
        sm: string
        md: string
        lg: string
        xl: string
        full: string
    }
    // Shadows
    shadows: {
        sm: string
        md: string
        lg: string
        xl: string
    }
    // Typography
    typography: {
        fontFamily: string
        fontSize: {
            xs: string
            sm: string
            base: string
            lg: string
            xl: string
            '2xl': string
        }
    }
}

export interface Theme {
    id: string
    name: string
    tokens: DesignTokens
}

/**
 * Default Theme - Base Design System
 * Using OKLCH color format (matches packages/ui)
 */
export const defaultTheme: Theme = {
    id: 'default',
    name: 'Default',
    tokens: {
        colors: {
            primary: 'oklch(48.8% 0.243 264.376)',
            primaryForeground: 'oklch(54.6% 0.245 262.881)',
            secondary: 'oklch(0.97 0 0)',
            secondaryForeground: 'oklch(26.9% 0 0)',
            accent: 'oklch(0.97 0 0)',
            accentForeground: 'oklch(0.205 0 0)',
            destructive: 'oklch(58.6% 0.253 17.585)',
            destructiveForeground: 'oklch(58.6% 0.253 17.585)',
            muted: 'oklch(0.97 0 0)',
            mutedForeground: 'oklch(0.55 0 0)',
            background: 'oklch(1 0 0)',
            foreground: 'oklch(20.5% 0 0)',
            card: 'oklch(1 0 0)',
            cardForeground: 'oklch(0.145 0 0)',
            popover: 'oklch(98.5% 0 0)',
            popoverForeground: 'oklch(0.145 0 0)',
            border: 'oklch(0.922 0 0)',
            input: 'oklch(0.922 0 0)',
            ring: 'oklch(0.708 0 0)',
        },
        radius: {
            sm: '0.25rem',
            md: '0.5rem',
            lg: '0.75rem',
            xl: '1rem',
            full: '9999px',
        },
        shadows: {
            sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
        typography: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem',
                '2xl': '1.5rem',
            },
        },
    },
}

/**
 * Blue Theme - Modern Blue Color Scheme
 */
export const blueTheme: Theme = {
    id: 'blue',
    name: 'Blue',
    tokens: {
        ...defaultTheme.tokens,
        colors: {
            ...defaultTheme.tokens.colors,
            primary: 'oklch(60% 0.24 252)',
            primaryForeground: 'oklch(98% 0 0)',
            secondary: 'oklch(0.97 0 0)',
            secondaryForeground: 'oklch(26.9% 0 0)',
            accent: 'oklch(0.95 0.05 252)',
            accentForeground: 'oklch(26.9% 0 0)',
            ring: 'oklch(60% 0.24 252)',
        },
    },
}

/**
 * Green Theme - Nature/Success Color Scheme
 */
export const greenTheme: Theme = {
    id: 'green',
    name: 'Green',
    tokens: {
        ...defaultTheme.tokens,
        colors: {
            ...defaultTheme.tokens.colors,
            primary: 'oklch(55% 0.20 145)',
            primaryForeground: 'oklch(98% 0 0)',
            secondary: 'oklch(0.97 0 0)',
            secondaryForeground: 'oklch(26.9% 0 0)',
            accent: 'oklch(0.95 0.05 145)',
            accentForeground: 'oklch(26.9% 0 0)',
            ring: 'oklch(55% 0.20 145)',
        },
    },
}

/**
 * Purple Theme - Creative/Premium Color Scheme
 */
export const purpleTheme: Theme = {
    id: 'purple',
    name: 'Purple',
    tokens: {
        ...defaultTheme.tokens,
        colors: {
            ...defaultTheme.tokens.colors,
            primary: 'oklch(62% 0.25 300)',
            primaryForeground: 'oklch(98% 0 0)',
            secondary: 'oklch(0.97 0 0)',
            secondaryForeground: 'oklch(26.9% 0 0)',
            accent: 'oklch(0.95 0.05 300)',
            accentForeground: 'oklch(26.9% 0 0)',
            ring: 'oklch(62% 0.25 300)',
        },
    },
}

/**
 * Dark Theme - Dark Mode (matches packages/ui .dark)
 */
export const darkTheme: Theme = {
    id: 'dark',
    name: 'Dark',
    tokens: {
        ...defaultTheme.tokens,
        colors: {
            primary: 'oklch(54.6% 0.245 262.881)',
            primaryForeground: 'oklch(62.3% 0.214 259.815)',
            secondary: 'oklch(0.269 0 0)',
            secondaryForeground: 'oklch(97% 0 0)',
            accent: 'oklch(0.269 0 0)',
            accentForeground: 'oklch(0.985 0 0)',
            destructive: 'oklch(58.6% 0.253 17.585)',
            destructiveForeground: 'oklch(64.5% 0.246 16.439)',
            muted: 'oklch(0.269 0 0)',
            mutedForeground: 'oklch(0.65 0 0)',
            background: 'oklch(20.5% 0 0)',
            foreground: 'oklch(92.2% 0 0)',
            card: 'oklch(0.145 0 0)',
            cardForeground: 'oklch(0.985 0 0)',
            popover: 'oklch(22.9% 0 0)',
            popoverForeground: 'oklch(0.985 0 0)',
            border: 'oklch(34% 0 0)',
            input: 'oklch(35.233% 0.00004 271.152)',
            ring: 'oklch(0.556 0 0)',
        },
    },
}

/**
 * Rounded Theme - More rounded borders
 */
export const roundedTheme: Theme = {
    id: 'rounded',
    name: 'Rounded',
    tokens: {
        ...defaultTheme.tokens,
        radius: {
            sm: '0.5rem',
            md: '0.75rem',
            lg: '1rem',
            xl: '1.5rem',
            full: '9999px',
        },
    },
}

/**
 * Sharp Theme - Minimal rounded borders
 */
export const sharpTheme: Theme = {
    id: 'sharp',
    name: 'Sharp',
    tokens: {
        ...defaultTheme.tokens,
        radius: {
            sm: '0rem',
            md: '0.125rem',
            lg: '0.25rem',
            xl: '0.375rem',
            full: '0.5rem',
        },
    },
}

/**
 * All available themes
 */
export const themes: Theme[] = [defaultTheme, blueTheme, greenTheme, purpleTheme, darkTheme, roundedTheme, sharpTheme]

/**
 * Get theme by ID
 */
export const getThemeById = (id: string): Theme => {
    return themes.find(theme => theme.id === id) || defaultTheme
}

/**
 * Apply theme to DOM
 */
export const applyTheme = (theme: Theme): void => {
    const root = document.documentElement

    // Apply color tokens
    Object.entries(theme.tokens.colors).forEach(([key, value]) => {
        const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        root.style.setProperty(`--${cssVar}`, value)
    })

    // Apply radius tokens
    Object.entries(theme.tokens.radius).forEach(([key, value]) => {
        root.style.setProperty(`--radius-${key}`, value)
    })

    // Apply shadow tokens
    Object.entries(theme.tokens.shadows).forEach(([key, value]) => {
        root.style.setProperty(`--shadow-${key}`, value)
    })

    // Apply typography tokens
    root.style.setProperty('--font-family', theme.tokens.typography.fontFamily)
    Object.entries(theme.tokens.typography.fontSize).forEach(([key, value]) => {
        root.style.setProperty(`--font-size-${key}`, value)
    })
}

/**
 * Merge custom tokens with theme
 */
export const mergeThemeTokens = (baseTheme: Theme, customTokens: Partial<DesignTokens>): Theme => {
    return {
        ...baseTheme,
        tokens: {
            colors: { ...baseTheme.tokens.colors, ...customTokens.colors },
            radius: { ...baseTheme.tokens.radius, ...customTokens.radius },
            shadows: { ...baseTheme.tokens.shadows, ...customTokens.shadows },
            typography: { ...baseTheme.tokens.typography, ...customTokens.typography },
        },
    }
}
