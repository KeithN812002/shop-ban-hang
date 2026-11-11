# Internationalization (i18n) Setup

This project uses **react-i18next** for multi-language support.

## 📁 Folder Structure

```
src/i18n/
├── config.ts              # i18n configuration
├── types.ts               # TypeScript types
├── index.ts               # Public exports
├── locales/
│   ├── index.ts          # Locales export
│   ├── en.json           # English translations
│   └── vi.json           # Vietnamese translations
└── hooks/
    └── useLanguage.ts    # Custom language hook
```

## 🚀 Usage

### Basic Translation

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
    const { t } = useTranslation()

    return (
        <div>
            <h1>{t('common.welcome')}</h1>
            <p>{t('home.subtitle')}</p>
        </div>
    )
}
```

### With Interpolation

```tsx
const { t } = useTranslation()

<p>{t('components.description', {
    count: 135,
    categories: 23
})}</p>
```

### Using Custom Hook

```tsx
import { useLanguage } from '@/i18n'

function LanguageSelector() {
    const { currentLanguage, changeLanguage, availableLocales } = useLanguage()

    return (
        <select value={currentLanguage.code} onChange={e => changeLanguage(e.target.value)}>
            {availableLocales.map(lang => (
                <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                </option>
            ))}
        </select>
    )
}
```

## 🌍 Adding New Language

1. **Create translation file:**

    ```bash
    touch src/i18n/locales/fr.json
    ```

2. **Add translations:**

    ```json
    {
        "common": {
            "welcome": "Bienvenue",
            ...
        }
    }
    ```

3. **Update `locales/index.ts`:**

    ```ts
    import fr from './fr.json'

    export const locales = {
        en,
        vi,
        fr, // Add new locale
    }

    export const availableLocales = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' }, // Add here
    ]
    ```

4. **Update `config.ts`:**
    ```ts
    export const resources = {
        en: { translation: locales.en },
        vi: { translation: locales.vi },
        fr: { translation: locales.fr }, // Add resource
    } as const
    ```

## 🔧 Configuration

- **Default Language:** English (`en`)
- **Fallback Language:** English (`en`)
- **Detection Order:** localStorage → Browser navigator
- **Storage:** localStorage with key `i18nextLng`

## 📝 Translation Keys Structure

```
common.*          - Common words (save, cancel, delete, etc.)
home.*            - Home page translations
components.*      - Components showcase translations
language.*        - Language switcher translations
```

## 🎯 Features

✅ Auto-detect browser language  
✅ Persist language selection in localStorage  
✅ Type-safe translations with TypeScript  
✅ Interpolation support  
✅ Namespace support  
✅ Custom hooks for easy access

## 📚 Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
