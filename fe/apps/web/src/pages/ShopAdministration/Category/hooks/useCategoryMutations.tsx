import { useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import { toast } from '@workspace/ui/components/Sonner'
import { categoryKeys } from '../../hooks/useCatalogQueries'
import { createCategory, deleteCategory, updateCategory } from '../../services/shopAdminService'
import type { CategoryRequest, CategoryRow } from '../../types'

type FormTarget = { mode: 'create' } | { mode: 'edit'; category: CategoryRow }

const INVALIDATES = [categoryKeys.all]

/** Dialog state plus create / update / delete orchestration for the category screen. */
export const useCategoryMutations = () => {
    const { t } = useTranslation()
    const [formTarget, setFormTarget] = useState<FormTarget | null>(null)

    const saveMutation = useMutation({
        mutationFn: (data: CategoryRequest) => (data.id ? updateCategory(data) : createCategory(data)),
        onSuccess: (_result, data) =>
            toast.success({
                title: t('common.success'),
                description: t(
                    data.id ? 'shopAdmin.category.messages.updateSuccess' : 'shopAdmin.category.messages.createSuccess',
                ),
            }),
        meta: { invalidates: INVALIDATES },
    })
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteCategory(id),
        onSuccess: () =>
            toast.success({ title: t('common.success'), description: t('shopAdmin.category.messages.deleteSuccess') }),
        meta: { invalidates: INVALIDATES },
    })
    const { mutateAsync: saveAsync } = saveMutation
    const { mutateAsync: deleteAsync } = deleteMutation

    const handleAdd = useCallback(() => setFormTarget({ mode: 'create' }), [])
    const handleEdit = useCallback((category: CategoryRow) => setFormTarget({ mode: 'edit', category }), [])
    const handleClose = useCallback(() => setFormTarget(null), [])

    const handleSubmit = useCallback(
        async (data: CategoryRequest) => {
            try {
                await saveAsync(data)
                setFormTarget(null)
            } catch {
                // The failure toast comes from the global mutation handler; keep the form open for a retry.
            }
        },
        [saveAsync],
    )

    const handleDelete = useCallback(
        (category: CategoryRow) => {
            confirm({
                title: t('common.confirmDeleteTitle'),
                description: t('shopAdmin.category.confirm.delete', { name: category.name }),
                variant: 'destructive',
                action: {
                    label: t('common.delete'),
                    icon: <Trash2 className="size-4" />,
                    onClick: async () => {
                        await deleteAsync(category.id)
                    },
                },
            })
        },
        [deleteAsync, t],
    )

    return {
        formTarget,
        isSaving: saveMutation.isPending,
        isAnyMutationPending: saveMutation.isPending || deleteMutation.isPending,
        handleAdd,
        handleEdit,
        handleClose,
        handleSubmit,
        handleDelete,
    }
}
