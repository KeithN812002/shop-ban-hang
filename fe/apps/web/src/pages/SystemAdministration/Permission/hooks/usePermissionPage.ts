import { useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { type PermissionTreeNode, type PermissionFormData } from '../types'
import { PermissionTypeEnum } from '@/constants/options'
import { buildFormDataFromItem, buildEmptyFormData } from '../utils/buildFormData'
import {
    usePermissions,
    usePermissionTree,
    usePermissionById,
    usePermissionMutations,
    useExportPermissions,
    permissionKeys,
} from './index'
import { useMenuLocalizedTitle } from '@/hooks/useMenuLocalizedTitle'
import type { MenuItem } from '@/types/menu.types'
import { usePermissionTreeState } from './usePermissionTreeState'

export const usePermissionPage = (menuItem: MenuItem) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const menuTitle = useMenuLocalizedTitle(menuItem)

    // API Hooks
    const { isLoading: isTreeLoading } = usePermissions(refreshTrigger)
    const { tree } = usePermissionTree()

    // Page & Form State
    const [selectedFunction, setSelectedFunction] = useState<PermissionTreeNode | null>(null)
    const [activePermission, setActivePermission] = useState<PermissionTreeNode | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [formData, setFormData] = useState<PermissionFormData | null>(null)
    const [createChildTypeDialogOpen, setCreateChildTypeDialogOpen] = useState(false)

    const form = useForm<PermissionFormData>({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: undefined,
    })

    const VIEWABLE_TYPES: ReadonlyArray<PermissionTypeEnum> = [
        PermissionTypeEnum.MODULE,
        PermissionTypeEnum.GROUP,
        PermissionTypeEnum.MENU,
        PermissionTypeEnum.PAGE,
    ]
    const isViewableType = !!selectedFunction && VIEWABLE_TYPES.includes(selectedFunction.type)

    const {
        data: viewData,
        isLoading: isViewLoading,
        isFetching: isViewFetching,
    } = usePermissionById(selectedFunction?.id ?? '', isViewableType && !isCreating)

    // Mutation Logic
    const mutations = usePermissionMutations()

    // Import / Export Logic
    const [importDialogOpen, setImportDialogOpen] = useState(false)
    const exportMutation = useExportPermissions()

    const handleExport = useCallback(() => {
        exportMutation.mutate()
    }, [exportMutation])

    const handleOpenImport = useCallback(() => {
        setImportDialogOpen(true)
    }, [])

    // Tree Logic
    const treeState = usePermissionTreeState(tree)

    // Handlers
    const handleSelect = useCallback(
        (node: PermissionTreeNode) => {
            queryClient.removeQueries({ queryKey: permissionKeys.detail(node.id) })
            setSelectedFunction(node)
            setIsCreating(false)
        },
        [queryClient],
    )

    const handleOpenCreate = useCallback(() => {
        setCreateChildTypeDialogOpen(true)
    }, [])

    const startCreateWithChildType = useCallback(
        (childType: PermissionTypeEnum.GROUP | PermissionTypeEnum.MENU | PermissionTypeEnum.PAGE) => {
            const parentCode = selectedFunction?.code ?? null
            const parentType = selectedFunction?.type ?? null
            const emptyData = buildEmptyFormData(parentCode, parentType, childType)
            setFormData(emptyData)
            form.reset(emptyData)
            setIsCreating(true)
            setCreateChildTypeDialogOpen(false)
        },
        [selectedFunction, form],
    )

    const handleCancel = useCallback(() => {
        setIsCreating(false)
        setFormData(null)
        setSelectedFunction(null)
        setActivePermission(null)
        setCreateChildTypeDialogOpen(false)
        form.reset()
    }, [form])

    const handleSearch = useCallback(
        (keyword: string) => {
            treeState.setSearchKeyword(keyword)
            if (keyword.trim()) {
                setRefreshTrigger(prev => prev + 1)
            }
        },
        [treeState],
    )

    const onSave = useCallback(() => {
        void mutations.handleSave(form.handleSubmit, isCreating, selectedFunction, () => {
            handleCancel()
        })
    }, [mutations, form.handleSubmit, isCreating, selectedFunction, handleCancel])

    const onDelete = useCallback(() => {
        if (!selectedFunction) return
        mutations.handleDelete(selectedFunction, tree, () => {
            handleCancel()
        })
    }, [mutations, selectedFunction, tree, handleCancel])

    useEffect(() => {
        if (!selectedFunction || isCreating) return

        if (viewData && viewData.id === selectedFunction.id) {
            const nextData = buildFormDataFromItem(viewData)
            setFormData(nextData)
            form.reset(nextData)
            setActivePermission(selectedFunction)
        } else if (!viewData && !isViewLoading) {
            setFormData(null)
            form.reset()
            setActivePermission(null)
        }
    }, [selectedFunction, viewData, isCreating, isViewLoading, form])

    const { loadingMessage: mutationMessage, ...restMutations } = mutations
    const isPageLoading = isTreeLoading || isViewFetching || mutations.isAnyMutationPending || exportMutation.isPending
    const finalLoadingMessage = mutationMessage || t('common.loading')

    return {
        t,
        menuTitle,
        isTreeLoading,
        tree,
        selectedFunction,
        activePermission,
        isCreating,
        formData,
        form,
        createChildTypeDialogOpen,
        setCreateChildTypeDialogOpen,
        importDialogOpen,
        setImportDialogOpen,
        handleExport,
        handleOpenImport,
        handleSelect,
        handleOpenCreate,
        startCreateWithChildType,
        handleCancel,
        onSave,
        onDelete,
        isViewLoading,
        isPageLoading,
        loadingMessage: finalLoadingMessage,
        viewData,
        handleSearch,
        ...restMutations,
        ...treeState,
    }
}
