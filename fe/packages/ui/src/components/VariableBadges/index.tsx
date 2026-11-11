import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Focusable } from 'react-aria'
import { Label } from '@workspace/ui/components/Field'
import { toast } from '@workspace/ui/components/Sonner'
import { Tooltip, TooltipTrigger } from '@workspace/ui/components/Tooltip'
import { cn } from '@workspace/ui/lib/utils'
import { copyTextToClipboard } from '@workspace/ui/lib/clipboard'

export interface VariableBadgeItem {
    token: string
    label?: string
}

export interface VariableBadgesProps {
    variables?: Array<string | VariableBadgeItem>
    label?: string
    hint?: string
    containerClassName?: string
    onCopySuccess?: (token: string) => void
}

const toBadgeItem = (variable: string | VariableBadgeItem): VariableBadgeItem =>
    typeof variable === 'string' ? { token: variable } : variable

export const VariableBadges = memo(
    ({ variables = [], label, hint, containerClassName, onCopySuccess }: VariableBadgesProps) => {
        const { t } = useTranslation()

        const displayLabel = label ?? t('emailTemplate.fields.variables')
        const displayHint = hint ?? t('emailTemplate.fields.variablesHint')
        const items = useMemo(() => variables.map(toBadgeItem), [variables])

        const handleCopyToken = async (token: string, anchor?: HTMLElement | null) => {
            if (await copyTextToClipboard(token, anchor)) {
                toast.success({
                    title: '',
                    description: t('emailTemplate.messages.copied', { token }),
                })
                onCopySuccess?.(token)
            } else {
                toast.error({
                    title: '',
                    description: t('emailTemplate.messages.copyFailed'),
                })
            }
        }

        return (
            <div className={cn('group/field', containerClassName)}>
                <Label className="mb-0! transition-colors relative flex items-center gap-1.5 w-fit max-w-full overflow-hidden">
                    {displayLabel}
                    {displayHint && <span className="text-xs font-normal text-muted-foreground">({displayHint})</span>}
                </Label>
                {items.length > 0 ? (
                    <div className="min-h-8 flex flex-wrap items-center gap-1.5">
                        {items.map(({ token, label: tokenLabel }) => (
                            <TooltipTrigger key={token} delay={300}>
                                <Focusable>
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-sm bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/20 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-500/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                        onClick={e => handleCopyToken(token, e.currentTarget)}
                                    >
                                        {token}
                                    </button>
                                </Focusable>
                                <Tooltip>{tokenLabel ?? t('emailTemplate.messages.clickToCopy')}</Tooltip>
                            </TooltipTrigger>
                        ))}
                    </div>
                ) : (
                    <span className="h-8 flex items-center text-sm text-muted-foreground">—</span>
                )}
            </div>
        )
    },
)

VariableBadges.displayName = 'VariableBadges'
