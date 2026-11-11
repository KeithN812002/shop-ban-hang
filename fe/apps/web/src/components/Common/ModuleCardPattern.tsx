import { memo } from 'react'

/** Module colour key -> decorative pattern file in `public/images/module-patterns`. Projects add their own. */
const PATTERN_BY_MODULE: Record<string, string> = {
    sa: 'sa',
}

const DEFAULT_PATTERN = 'default'

interface ModuleCardPatternProps {
    colorKey: string
}

export const ModuleCardPattern = memo(({ colorKey }: ModuleCardPatternProps) => {
    const pattern = PATTERN_BY_MODULE[colorKey] ?? DEFAULT_PATTERN

    return (
        <img
            src={`${import.meta.env.BASE_URL}images/module-patterns/${pattern}.svg`}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
    )
})

ModuleCardPattern.displayName = 'ModuleCardPattern'
