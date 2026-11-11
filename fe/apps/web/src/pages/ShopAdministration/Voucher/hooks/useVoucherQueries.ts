import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from '@workspace/ui/components/Sonner'
import { createVoucher, deleteVoucher, searchVouchers, updateVoucher } from '../../services/shopAdminService'
import type { VoucherFilterRequest, VoucherRequest } from '../../types'

export const voucherKeys = {
    all: ['shop-admin', 'voucher'] as const,
    lists: () => [...voucherKeys.all, 'list'] as const,
    list: (filters: VoucherFilterRequest) => [...voucherKeys.lists(), filters] as const,
}

export const useVouchers = (filters: VoucherFilterRequest) =>
    useQuery({
        queryKey: voucherKeys.list(filters),
        queryFn: () => searchVouchers(filters),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
    })

export const useCreateVoucher = () => {
    const { t } = useTranslation()
    return useMutation({
        mutationFn: (data: VoucherRequest) => createVoucher(data),
        onSuccess: () =>
            toast.success({ title: t('common.success'), description: t('shopAdmin.voucher.messages.createSuccess') }),
        meta: { invalidates: [voucherKeys.all] },
    })
}

export const useUpdateVoucher = () => {
    const { t } = useTranslation()
    return useMutation({
        mutationFn: (data: VoucherRequest) => updateVoucher(data),
        onSuccess: () =>
            toast.success({ title: t('common.success'), description: t('shopAdmin.voucher.messages.updateSuccess') }),
        meta: { invalidates: [voucherKeys.all] },
    })
}

export const useDeleteVoucher = () => {
    const { t } = useTranslation()
    return useMutation({
        mutationFn: (id: string) => deleteVoucher(id),
        onSuccess: () =>
            toast.success({ title: t('common.success'), description: t('shopAdmin.voucher.messages.deleteSuccess') }),
        meta: { invalidates: [voucherKeys.all] },
    })
}
