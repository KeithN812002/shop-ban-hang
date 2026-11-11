import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveMenuOptional } from '@/providers/ActiveMenuProvider'
import { useMenuLocalizedTitle } from './useMenuLocalizedTitle'

export type DialogTitleMode = 'view' | 'edit' | 'create' | 'sync' | 'import' | 'assign'

/**
 * Builds a dialog title from the active menu name so it always matches the
 * sidebar entry and the page header: "Chi tiết|Cập nhật|Thêm mới" + menu name.
 * Falls back to the prefix alone when no menu is mounted.
 */
export function useDialogTitle() {
    const { t } = useTranslation()
    const menuTitle = useMenuLocalizedTitle(useActiveMenuOptional())

    return useCallback(
        (mode: DialogTitleMode) => {
            const prefix = t(`common.dialogTitle.${mode}`)
            return menuTitle ? `${prefix} ${menuTitle.toLowerCase()}` : prefix
        },
        [t, menuTitle],
    )
}
