'use client'

import React from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Tooltip, TooltipTrigger } from '@workspace/ui/components/Tooltip'
import { Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'

export interface AdvancedFilterTriggerProps {
    onPress: () => void
    count?: number
    className?: string
    isDisabled?: boolean
    ariaLabel?: string
}

export const AdvancedFilterTrigger = ({
    onPress,
    count = 0,
    className,
    isDisabled,
    ariaLabel,
}: AdvancedFilterTriggerProps) => {
    const { t } = useTranslation()

    return (
        <TooltipTrigger delay={300}>
            <Button
                variant="outline"
                size="icon"
                className={cn('relative h-8 w-8 shrink-0 shadow-sm', className)}
                onPress={onPress}
                isDisabled={isDisabled}
                aria-label={ariaLabel}
            >
                <Filter className="size-3.5 text-primary" />
                {count > 0 && (
                    <Badge className="absolute -top-1 -right-1 rounded-full h-4 min-w-4 px-1 flex items-center justify-center bg-primary text-white text-[9px] border border-white shadow-sm font-bold animate-in fade-in zoom-in duration-200">
                        {count}
                    </Badge>
                )}
            </Button>
            <Tooltip>
                <div>{t('common.advancedFilter' as any)}</div>
                {count > 0 && <div className="opacity-80">{t('common.advancedFilterActive' as any, { count })}</div>}
            </Tooltip>
        </TooltipTrigger>
    )
}
