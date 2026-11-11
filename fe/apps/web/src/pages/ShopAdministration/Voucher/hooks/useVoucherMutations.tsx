import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import type { VoucherRequest, VoucherResponse } from '../../types'
import { useCreateVoucher, useDeleteVoucher, useUpdateVoucher } from './useVoucherQueries'

type FormTarget = { mode: 'create' } | { mode: 'edit'; voucher: VoucherResponse }

/** Dialog state plus create / update / delete orchestration for the voucher screen. */
export const useVoucherMutations = () => {
    const { t } = useTranslation()
    const [formTarget, setFormTarget] = useState<FormTarget | null>(null)

    const createMutation = useCreateVoucher()
    const updateMutation = useUpdateVoucher()
    const deleteMutation = useDeleteVoucher()
    const { mutateAsync: createAsync } = createMutation
    const { mutateAsync: updateAsync } = updateMutation
    const { mutateAsync: deleteAsync } = deleteMutation

    const handleAdd = useCallback(() => setFormTarget({ mode: 'create' }), [])
    const handleEdit = useCallback((voucher: VoucherResponse) => setFormTarget({ mode: 'edit', voucher }), [])
    const handleClose = useCallback(() => setFormTarget(null), [])

    const handleSubmit = useCallback(
        async (data: VoucherRequest) => {
            try {
                if (data.id) await updateAsync(data)
                else await createAsync(data)
                setFormTarget(null)
            } catch {
                // The failure toast comes from the global mutation handler; keep the form open for a retry.
            }
        },
        [createAsync, updateAsync],
    )

    const handleDelete = useCallback(
        (voucher: VoucherResponse) => {
            confirm({
                title: t('common.confirmDeleteTitle'),
                description: t('shopAdmin.voucher.confirm.delete', { name: voucher.code }),
                variant: 'destructive',
                action: {
                    label: t('common.delete'),
                    icon: <Trash2 className="size-4" />,
                    onClick: async () => {
                        await deleteAsync(voucher.id)
                    },
                },
            })
        },
        [deleteAsync, t],
    )

    return {
        formTarget,
        isSaving: createMutation.isPending || updateMutation.isPending,
        isAnyMutationPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
        handleAdd,
        handleEdit,
        handleClose,
        handleSubmit,
        handleDelete,
    }
}
