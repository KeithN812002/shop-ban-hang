import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, Check, Pause, Unlock, type LucideIcon } from 'lucide-react'
import type { ButtonProps } from '@workspace/ui/components/Button'
import { ActionButton } from '@/components/Common/ActionButton'
import {
    MODERATION_ACTION_IDS,
    MODERATION_ACTION_STATUSES,
    type EntityStatus,
    type ModerationActionId,
} from '../constants'

const ACTION_STYLE: Record<ModerationActionId, { icon: LucideIcon; variant?: ButtonProps['variant'] }> = {
    approve: { icon: Check },
    reject: { icon: Ban, variant: 'destructive' },
    suspend: { icon: Pause, variant: 'warning' },
    reactivate: { icon: Unlock },
}

interface ModerationFooterProps<TRow extends { status: EntityStatus }> {
    row: TRow
    onAction: (actionId: string, row: TRow) => void
}

/** Dialog footer buttons for the moderation actions available in the row's current status. */
const ModerationFooterInner = <TRow extends { status: EntityStatus }>({
    row,
    onAction,
}: ModerationFooterProps<TRow>) => {
    const { t } = useTranslation()
    return (
        <>
            {MODERATION_ACTION_IDS.filter(id =>
                (MODERATION_ACTION_STATUSES[id] as readonly EntityStatus[]).includes(row.status),
            ).map(id => (
                <ActionButton
                    key={id}
                    actionCode={id}
                    icon={ACTION_STYLE[id].icon}
                    variant={ACTION_STYLE[id].variant}
                    label={t(`shopAdmin.actions.${id}`)}
                    onPress={() => onAction(id, row)}
                />
            ))}
        </>
    )
}

export const ModerationFooter = memo(ModerationFooterInner) as typeof ModerationFooterInner
