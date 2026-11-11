import type { TFunction } from 'i18next'
import type { ActionDef, Identifiable } from '@workspace/ui/components/DataTable'
import { MODERATION_ACTION_IDS, MODERATION_ACTION_STATUSES, type EntityStatus } from '../constants'

type RowActionType = ActionDef<Identifiable>['type']

/** Row-menu icon/colour per action id; the id doubles as the function-permission code. */
const ROW_ACTION_TYPE = {
    view: 'view',
    edit: 'edit',
    delete: 'delete',
    approve: 'verify',
    reject: 'reject',
    suspend: 'suspend',
    reactivate: 'unlock',
    ban: 'lock',
    unban: 'unlock',
    cancel: 'close',
    confirmReturned: 'verify',
    resolveReturn: 'verify',
    markRefunded: 'verify',
    lock: 'lock',
    unlock: 'unlock',
} as const satisfies Record<string, RowActionType>

export type RowActionId = keyof typeof ROW_ACTION_TYPE

/** `edit` is guarded by the `update` function code, like the core screens. */
const PERMISSION_CODE: Partial<Record<RowActionId, string>> = { edit: 'update' }

export interface RowActionDef<TRow extends Identifiable> {
    id: RowActionId
    label: string
    onClick: (row: TRow) => void
    showWhen?: (row: TRow) => boolean
}

/** Drops the actions the user lacks permission for; `view` is always available. */
export const buildRowActions = <TRow extends Identifiable>(
    defs: RowActionDef<TRow>[],
    checkPermission: (actionCode: string) => boolean,
): ActionDef<TRow>[] =>
    defs
        .filter(def => def.id === 'view' || checkPermission(PERMISSION_CODE[def.id] ?? def.id))
        .map(def => ({
            id: def.id,
            type: ROW_ACTION_TYPE[def.id],
            label: def.label,
            onClick: def.onClick,
            showWhen: def.showWhen,
        }))

/** approve / reject / suspend / reactivate row actions, visible per `MODERATION_ACTION_STATUSES`. */
export const buildModerationRowDefs = <TRow extends Identifiable & { status: EntityStatus }>(
    t: TFunction,
    onAction: (actionId: string, row: TRow) => void,
): RowActionDef<TRow>[] =>
    MODERATION_ACTION_IDS.map(id => ({
        id,
        label: t(`shopAdmin.actions.${id}`),
        onClick: row => onAction(id, row),
        showWhen: row => (MODERATION_ACTION_STATUSES[id] as readonly EntityStatus[]).includes(row.status),
    }))
