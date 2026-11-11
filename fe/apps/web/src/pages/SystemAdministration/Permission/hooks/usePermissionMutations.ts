import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormHandleSubmit } from 'react-hook-form'
import { toast } from '@workspace/ui/components/Sonner'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import type { PermissionFormData, PermissionTreeNode } from '../types'
import { buildCreatePayload, buildPayload } from '../utils/buildFormData'
import { useCreatePermission, useUpdatePermission, useDeletePermission } from './index'

export const usePermissionMutations = () => {
    const { t } = useTranslation()
    const createMutation = useCreatePermission()
    const updateMutation = useUpdatePermission()
    const deleteMutation = useDeletePermission()

    const isAnyMutationPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

    const loadingMessage = useMemo(() => {
        if (createMutation.isPending || updateMutation.isPending) return t('common.saving')
        if (deleteMutation.isPending) return t('common.deleting')
        if (isAnyMutationPending) return t('common.processing')
        return ''
    }, [createMutation.isPending, updateMutation.isPending, deleteMutation.isPending, isAnyMutationPending, t])

    const handleSave = useCallback(
        async (
            handleSubmit: UseFormHandleSubmit<PermissionFormData>,
            isCreating: boolean,
            selectedFunction: PermissionTreeNode | null,
            onSuccess: () => void,
        ) => {
            return handleSubmit(
                async values => {
                    // Validate functions and apis
                    const invalidFunctions = (values.functions || []).filter(
                        f => !f._deleted && (!f.name?.trim() || !f.status),
                    )
                    const invalidApis = (values.apis || []).filter(a => !a._deleted && (!a.name?.trim() || !a.status))

                    if (invalidFunctions.length > 0 || invalidApis.length > 0) {
                        toast.warning({
                            title: t('common.warning'),
                            description: t('permission.messages.childRequired'),
                        })
                        return
                    }

                    const negativeSortRows = [...(values.functions || []), ...(values.apis || [])].filter(
                        row => !row._deleted && typeof row.sortOrder === 'number' && row.sortOrder < 0,
                    )

                    if (negativeSortRows.length > 0) {
                        toast.warning({
                            title: t('common.warning'),
                            description: t('permission.messages.childSortOrderInvalid'),
                        })
                        return
                    }

                    try {
                        if (isCreating) {
                            await createMutation.mutateAsync(buildCreatePayload(values))
                        } else if (selectedFunction) {
                            await updateMutation.mutateAsync(
                                buildPayload({ ...values, id: values.id ?? selectedFunction.id }),
                            )
                        }
                        onSuccess()
                    } catch {
                        // Error handled by mutation meta
                    }
                },
                () => {
                    toast.warning({
                        title: t('common.warning'),
                        description: t('permission.messages.formInvalid'),
                    })
                },
            )()
        },
        [createMutation, updateMutation, t],
    )

    const handleDelete = useCallback(
        (selectedFunction: PermissionTreeNode, tree: PermissionTreeNode[], onSuccess: () => void) => {
            const countDescendants = (nodes: PermissionTreeNode[], targetCode: string): number => {
                let count = 0
                for (const node of nodes) {
                    if (node.code === targetCode && node.children) {
                        count += countAllNodes(node.children)
                    }
                    if (node.children) {
                        count += countDescendants(node.children, targetCode)
                    }
                }
                return count
            }

            const countAllNodes = (nodes: PermissionTreeNode[]): number => {
                let count = nodes.length
                for (const node of nodes) {
                    if (node.children) {
                        count += countAllNodes(node.children)
                    }
                }
                return count
            }

            const descendantCount = countDescendants(tree, selectedFunction.code)
            const message =
                descendantCount > 0
                    ? t('permission.messages.confirmDeleteWithChildren', {
                          name: selectedFunction.name,
                          count: descendantCount,
                      })
                    : t('permission.messages.confirmDelete', { name: selectedFunction.name })

            confirm({
                title: t('common.confirmDeleteTitle'),
                description: message,
                variant: 'destructive',
                action: {
                    label: t('common.delete'),
                    onClick: async () => {
                        await deleteMutation.mutateAsync(selectedFunction.id)
                        onSuccess()
                    },
                },
            })
        },
        [deleteMutation, t],
    )

    return {
        handleSave,
        handleDelete,
        isAnyMutationPending,
        loadingMessage,
        createMutation,
        updateMutation,
        deleteMutation,
    }
}
