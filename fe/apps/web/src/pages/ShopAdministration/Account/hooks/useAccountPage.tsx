import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Unlock } from 'lucide-react'
import { useMenuLocalizedTitle, useMenuRoute } from '@/hooks'
import {
    activeExternalUser,
    inactiveExternalUser,
} from '@/pages/SystemAdministration/ExternalUser/services/externalUserService'
import { SHOP_ADMIN_FOLDERS, type ActiveStatus, type UserRole } from '../../constants'
import { usePagedFilters, toTableProps } from '../../hooks/usePagedFilters'
import { useWorkflowActions, type WorkflowAction } from '../../hooks/useWorkflowActions'
import type { AccountFilterRequest, AccountRow } from '../../types'
import { accountKeys, useAccounts } from './useAccountQueries'

export interface AccountFilterForm {
    keyword: string
    role: string | null
    status: string | null
}

const DEFAULT_FILTERS: AccountFilterRequest = {
    pageNumber: 1,
    pageSize: 20,
    keyword: '',
    role: undefined,
    status: undefined,
}
const DEFAULT_FORM: AccountFilterForm = { keyword: '', role: null, status: null }
const toFilters = (form: AccountFilterForm): Partial<AccountFilterRequest> => ({
    keyword: form.keyword.trim(),
    role: (form.role as UserRole | null) ?? undefined,
    status: (form.status as ActiveStatus | null) ?? undefined,
})

/** Lock / unlock reuse the core external-user endpoints (`sa/external-user/inactive|active`). */
const ACCOUNT_ACTIONS: WorkflowAction[] = [
    {
        id: 'lock',
        icon: Lock,
        variant: 'warning',
        execute: ({ id }) => inactiveExternalUser(id),
        confirmTitle: 'shopAdmin.account.confirm.lockTitle',
        confirmDescription: 'shopAdmin.account.confirm.lock',
        confirmLabel: 'shopAdmin.actions.lock',
        successMessage: 'shopAdmin.account.messages.lockSuccess',
    },
    {
        id: 'unlock',
        icon: Unlock,
        execute: ({ id }) => activeExternalUser(id),
        confirmTitle: 'shopAdmin.account.confirm.unlockTitle',
        confirmDescription: 'shopAdmin.account.confirm.unlock',
        confirmLabel: 'shopAdmin.actions.unlock',
        successMessage: 'shopAdmin.account.messages.unlockSuccess',
    },
]
const INVALIDATES = [accountKeys.all]
const getAccountName = (account: AccountRow) => account.fullName || account.username

export const useAccountPage = () => {
    const { t } = useTranslation()
    const { navigateByFolder } = useMenuRoute()

    const paged = usePagedFilters<AccountFilterForm, AccountFilterRequest>({
        defaultFilters: DEFAULT_FILTERS,
        defaultForm: DEFAULT_FORM,
        toFilters,
    })
    const accountsQuery = useAccounts(paged.filters)
    const workflow = useWorkflowActions<AccountRow>({
        actions: ACCOUNT_ACTIONS,
        getName: getAccountName,
        invalidates: INVALIDATES,
    })

    const title = useMenuLocalizedTitle()

    const handleOpenStore = useCallback(
        (account: AccountRow) => {
            if (!account.storeId) return
            navigateByFolder(SHOP_ADMIN_FOLDERS.store, { search: { id: account.storeId } })
        },
        [navigateByFolder],
    )
    const handleOpenShipper = useCallback(
        (account: AccountRow) =>
            navigateByFolder(SHOP_ADMIN_FOLDERS.shipper, { search: { keyword: account.username } }),
        [navigateByFolder],
    )

    return {
        t,
        title,
        finalLoading: accountsQuery.isFetching || workflow.isPending,
        filterProps: useMemo(
            () => ({ methods: paged.methods, onSearch: paged.onSearch, onReset: paged.onReset }),
            [paged.methods, paged.onSearch, paged.onReset],
        ),
        tableProps: {
            ...toTableProps(accountsQuery, paged),
            onAction: workflow.run,
            onOpenStore: handleOpenStore,
            onOpenShipper: handleOpenShipper,
        },
    }
}
