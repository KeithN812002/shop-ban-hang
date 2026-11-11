import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMenuLocalizedTitle } from '@/hooks'
import type { ActiveStatus } from '../../constants'
import { usePagedFilters, toTableProps } from '../../hooks/usePagedFilters'
import type { VoucherFilterRequest } from '../../types'
import { useVoucherMutations } from './useVoucherMutations'
import { useVouchers } from './useVoucherQueries'

export interface VoucherFilterForm {
    keyword: string
    status: string | null
}

const DEFAULT_FILTERS: VoucherFilterRequest = { pageNumber: 1, pageSize: 20, keyword: '', status: undefined }
const DEFAULT_FORM: VoucherFilterForm = { keyword: '', status: null }
const toFilters = (form: VoucherFilterForm): Partial<VoucherFilterRequest> => ({
    keyword: form.keyword.trim(),
    status: (form.status as ActiveStatus | null) ?? undefined,
})

export const useVoucherPage = () => {
    const { t } = useTranslation()
    const paged = usePagedFilters<VoucherFilterForm, VoucherFilterRequest>({
        defaultFilters: DEFAULT_FILTERS,
        defaultForm: DEFAULT_FORM,
        toFilters,
    })
    const vouchersQuery = useVouchers(paged.filters)
    const mutations = useVoucherMutations()

    const title = useMenuLocalizedTitle()

    return {
        t,
        title,
        finalLoading: vouchersQuery.isFetching || mutations.isAnyMutationPending,
        handleAdd: mutations.handleAdd,
        filterProps: useMemo(
            () => ({ methods: paged.methods, onSearch: paged.onSearch, onReset: paged.onReset }),
            [paged.methods, paged.onSearch, paged.onReset],
        ),
        tableProps: {
            ...toTableProps(vouchersQuery, paged),
            onEdit: mutations.handleEdit,
            onDelete: mutations.handleDelete,
        },
        dialogProps: {
            isOpen: !!mutations.formTarget,
            voucher: mutations.formTarget?.mode === 'edit' ? mutations.formTarget.voucher : undefined,
            isPending: mutations.isSaving,
            onClose: mutations.handleClose,
            onSubmit: mutations.handleSubmit,
        },
    }
}
